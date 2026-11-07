'use client';

export const dynamic = 'force-dynamic';

import React, { useState, useCallback, useEffect, useRef } from 'react';
import { useHotel, useOrders, Order } from '@/lib/useHotel';
import { formatPrice } from '@/lib/menu';

/* ─── Helpers ────────────────────────────────────────────────────────── */

const normalise = (status: string) => (status || '').trim().toLowerCase();

const STATUS_LABEL: Record<string, string> = {
  pending:   'Order Placed',
  placed:    'Order Placed',
  accepted:  'Accepted',
  preparing: 'Preparing',
  ready:     'Ready',
  completed: 'Completed',
  cancelled: 'Cancelled',
};

const STATUS_CLASS: Record<string, string> = {
  placed:    'd3-status-placed',
  pending:   'd3-status-placed',
  accepted:  'd3-status-accepted',
  preparing: 'd3-status-preparing',
  ready:     'd3-status-ready',
  completed: 'd3-status-completed',
  cancelled: 'd3-status-cancelled',
};

const CANCEL_REASONS = [
  'Item unavailable',
  'Kitchen closed',
  'Unable to prepare',
  'Restaurant too busy',
  'Customer requested cancellation',
  'Other',
] as const;
type CancelReason = (typeof CANCEL_REASONS)[number];

function getMinutesAgo(dateStr: string) {
  return Math.max(1, Math.floor((Date.now() - new Date(dateStr).getTime()) / 60000));
}

function formatOrderDateIST(dateStr?: string | null): string {
  if (!dateStr) return '';
  const d = new Date(dateStr);
  if (Number.isNaN(d.getTime())) return '';
  return new Intl.DateTimeFormat('en-GB', {
    timeZone: 'Asia/Kolkata',
    day: 'numeric',
    month: 'short',
    year: 'numeric',
  }).format(d); // e.g. "1 Jun 2026"
}

const TZ = 'Asia/Kolkata';
function kolkataYMD(d: Date) {
  const p = new Intl.DateTimeFormat('en-CA', { timeZone: TZ, year: 'numeric', month: '2-digit', day: '2-digit' }).formatToParts(d);
  const g = (t: string) => p.find((x) => x.type === t)?.value || '';
  return { y: +g('year'), m: +g('month'), d: +g('day') };
}
function diffDaysIST(a: Date, b: Date) {
  const A = kolkataYMD(a), B = kolkataYMD(b);
  const da = Date.UTC(A.y, A.m - 1, A.d);
  const db = Date.UTC(B.y, B.m - 1, B.d);
  return Math.round((da - db) / 86400000);
}
function formatOrderTimeIST(dateStr?: string | null, now?: Date): string {
  if (!dateStr) return '';
  const d = new Date(dateStr);
  if (Number.isNaN(d.getTime())) return '';
  const ref = now || new Date();
  const mins = Math.floor((ref.getTime() - d.getTime()) / 60000);
  if (mins < 1) return 'Just now';
  if (mins < 60) return `${mins} min ago`;
  const hours = Math.floor(mins / 60);
  if (hours < 24) return `${hours} hour${hours === 1 ? '' : 's'} ago`;
  const dayDiff = diffDaysIST(ref, d);
  const time = new Intl.DateTimeFormat('en-US', { timeZone: TZ, hour: 'numeric', minute: '2-digit', hour12: true }).format(d);
  if (dayDiff === 1) return `Yesterday, ${time}`;
  if (dayDiff >= 2 && dayDiff <= 6) {
    const wd = new Intl.DateTimeFormat('en-US', { timeZone: TZ, weekday: 'short' }).format(d);
    return `${wd}, ${time}`;
  }
  return formatOrderDateIST(dateStr);
}

const TABS = ['all', 'pending', 'accepted', 'preparing', 'ready', 'completed', 'cancelled'];
const PAYMENT_FILTERS = ['all', 'paid', 'unpaid'];
const PAYMENT_LABEL: Record<string, string> = { all: 'All', paid: 'Paid', unpaid: 'Unpaid' };

/* ─── Types ──────────────────────────────────────────────────────────── */

interface NormalisedItem {
  id: string;
  name: string;
  quantity: number;
  price: number;
  notes?: string | null;
  status?: string | null;
}

interface ModalState {
  order: Order;
  item: NormalisedItem;
  orderItems: NormalisedItem[];
  forceCancel?: boolean;
}

/* ─── Sub-components ─────────────────────────────────────────────────── */

function StatusBadge({ status, order }: { status: string; order?: any }) {
  const key = normalise(status);
  const isCancelled = key === 'cancelled';
  const source = (
    order?.cancellation_source ||
    order?.cancelled_by_source ||
    ''
  ).toLowerCase().trim();

  return (
    <span style={{ display: 'inline-flex', alignItems: 'center', gap: 6, flexWrap: 'wrap' }}>
      <span className={`d3-badge ${STATUS_CLASS[key] || STATUS_CLASS.cancelled}`}>
        {STATUS_LABEL[key] || key || 'unknown'}
      </span>
      {isCancelled && (source === 'hotel' || source === 'restaurant') && (
        <span style={{ fontSize: '0.5625rem', fontWeight: 600, letterSpacing: '0.06em', color: '#D9A79E', textTransform: 'uppercase' }}>HOTEL</span>
      )}
      {isCancelled && source === 'customer' && (
        <span style={{ fontSize: '0.5625rem', fontWeight: 600, letterSpacing: '0.06em', color: '#C46658', textTransform: 'uppercase' }}>CUSTOMER</span>
      )}
    </span>
  );
}

/* ─── Item-Action Modal ──────────────────────────────────────────────── */

interface ItemModalProps {
  modal: ModalState;
  currency: string | undefined;
  updatingOrderIds: Set<string>;
  onClose: () => void;
  onStatusUpdate: (orderId: string, status: string, cancellationReason?: string) => Promise<void>;
  onError: (msg: string) => void;
}

function ItemModal({ modal, currency, updatingOrderIds, onClose, onStatusUpdate, onError }: ItemModalProps) {
  const { order, item } = modal;
  const status = normalise(order.status);
  const isUpdating = updatingOrderIds.has(order.id);
  const itemIsCancelled = ((item as any).status || '').toLowerCase() === 'cancelled';

  const [cancelStep, setCancelStep] = useState<'none' | 'reason' | 'confirm'>(modal.forceCancel ? 'reason' : 'none');
  const [cancelReason, setCancelReason] = useState<CancelReason | ''>('');
  const [cancelOther, setCancelOther] = useState('');
  const [cancelLoading, setCancelLoading] = useState(false);

  const overlayRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const handler = (e: KeyboardEvent) => { if (e.key === 'Escape') onClose(); };
    document.addEventListener('keydown', handler);
    return () => document.removeEventListener('keydown', handler);
  }, [onClose]);

  useEffect(() => {
    document.body.style.overflow = 'hidden';
    return () => { document.body.style.overflow = ''; };
  }, []);

  const handleAction = async (newStatus: string) => {
    const current = String(order.status || '').trim().toLowerCase();
    const next = String(newStatus || '').trim().toLowerCase();
    if (updatingOrderIds.has(order.id) || (current && current === next)) return; // in-flight or no-op
    try {
      await onStatusUpdate(order.id, next);
      onClose();
    } catch (err: any) {
      onError(err.message || 'Failed to update order status');
    }
  };

  const handleCancelConfirm = async () => {
    if (!cancelReason) return;
    const reason = cancelReason === 'Other' ? (cancelOther.trim() || 'Other') : cancelReason;
    setCancelLoading(true);
    try {
      await onStatusUpdate(order.id, 'cancelled', reason);
      onClose();
    } catch (err: any) {
      onError(err.message || 'Failed to cancel order');
      setCancelLoading(false);
    }
  };

  const isCancellable = !['completed', 'cancelled'].includes(status);

  const actionButtons: Array<{ label: string; newStatus: string; primary: boolean; condition: boolean }> = [
    { label: 'Accept Order',    newStatus: 'accepted',  primary: true,  condition: status === 'pending' },
    { label: 'Start Preparing', newStatus: 'preparing', primary: status === 'accepted', condition: status === 'accepted' || status === 'pending' },
    { label: 'Mark as Ready',   newStatus: 'ready',     primary: false, condition: status === 'preparing' },
    { label: 'Complete Order',  newStatus: 'completed', primary: false, condition: status === 'ready' },
  ];

  return (
    <div
      ref={overlayRef}
      onClick={(e) => { if (e.target === overlayRef.current) onClose(); }}
      style={{
        position: 'fixed', inset: 0, zIndex: 9999,
        background: 'rgba(0,0,0,0.65)',
        backdropFilter: 'blur(4px)',
        display: 'flex', alignItems: 'center', justifyContent: 'center',
        padding: '1rem',
      }}
    >
      <div
        role="dialog"
        aria-modal="true"
        aria-label="Order item actions"
        style={{
          position: 'relative',
          width: '100%', maxWidth: 420,
          background: 'var(--bg-surface, #1a1a1a)',
          border: '1px solid var(--border-warm, rgba(201,169,110,0.18))',
          borderRadius: 14,
          padding: '1.5rem',
          boxShadow: '0 24px 80px rgba(0,0,0,0.6)',
          display: 'flex', flexDirection: 'column', gap: '1rem',
          maxHeight: '90vh', overflowY: 'auto',
        }}
      >
        <button
          type="button"
          onClick={onClose}
          aria-label="Close"
          style={{
            position: 'absolute', top: 14, right: 14,
            background: 'rgba(255,255,255,0.06)', border: '1px solid rgba(255,255,255,0.1)',
            borderRadius: 6, width: 28, height: 28,
            display: 'flex', alignItems: 'center', justifyContent: 'center',
            cursor: 'pointer', color: 'var(--text-muted)',
            fontSize: '0.75rem', lineHeight: 1,
          }}
        >
          &#x2715;
        </button>

        {/* Order context */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: 4 }}>
          <div style={{ fontSize: '0.5625rem', fontWeight: 600, letterSpacing: '0.14em', textTransform: 'uppercase', color: 'var(--text-dimmed)' }}>
            TABLE {order.table_number || '\u2014'} &middot; <span style={{ fontFamily: 'ui-monospace, monospace' }}>{order.id.slice(0, 8).toUpperCase()}</span>
          </div>
          {formatOrderDateIST(order.created_at) && (
            <div style={{ fontSize: '12px', color: 'var(--text-dimmed)', marginTop: 2, lineHeight: 1.3 }}>{formatOrderDateIST(order.created_at)}</div>
          )}
          <StatusBadge status={order.status} order={order} />
        </div>

        {/* Selected item highlight */}
        <div style={{ padding: '0.875rem 1rem', borderRadius: 8, background: 'rgba(201,169,110,0.08)', border: '1px solid rgba(201,169,110,0.22)' }}>
          <div style={{ fontSize: '0.5625rem', fontWeight: 600, letterSpacing: '0.12em', textTransform: 'uppercase', color: 'var(--text-dimmed)', marginBottom: 6 }}>
            SELECTED ITEM
          </div>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'baseline', gap: 8 }}>
            <span style={{ fontSize: '0.9375rem', fontWeight: 600, color: itemIsCancelled ? '#C46658' : 'var(--text-primary)' }}>{item.name} {itemIsCancelled ? '(CANCELLED)' : ''}</span>
            <span style={{ fontSize: '0.8125rem', color: 'var(--gold)', fontWeight: 600, whiteSpace: 'nowrap' }}>
              {formatPrice(item.price * item.quantity, currency)}
            </span>
          </div>
          <div style={{ marginTop: 4, display: 'flex', gap: 16, fontSize: '0.75rem', color: 'var(--text-muted)' }}>
            <span>Qty: <strong style={{ color: 'var(--text-primary)' }}>{item.quantity}</strong></span>
            <span>Unit: <strong style={{ color: 'var(--text-primary)' }}>{formatPrice(item.price, currency)}</strong></span>
          </div>
          {item.notes && (
            <div style={{ marginTop: 6, fontSize: '0.75rem', color: 'var(--text-muted)', fontStyle: 'italic' }}>
              Note: {item.notes}
            </div>
          )}
        </div>

        <hr style={{ border: 'none', borderTop: '1px solid var(--border-warm, rgba(255,255,255,0.08))', margin: 0 }} />

        {/* Actions */}
        {cancelStep === 'none' && (
          <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
            <div style={{ fontSize: '0.5625rem', fontWeight: 600, letterSpacing: '0.12em', textTransform: 'uppercase', color: 'var(--text-dimmed)', marginBottom: 2 }}>
              ORDER ACTIONS
            </div>
            {status === 'completed' && (
              <p style={{ fontSize: '0.8125rem', color: 'var(--text-muted)', textAlign: 'center', padding: '0.5rem 0' }}>This order is already completed.</p>
            )}
            {status === 'cancelled' && (
              <p style={{ fontSize: '0.8125rem', color: 'var(--text-muted)', textAlign: 'center', padding: '0.5rem 0' }}>This order has been cancelled.</p>
            )}
            {!modal.forceCancel && actionButtons.filter(b => b.condition).map(btn => (
              <button
                key={btn.newStatus}
                type="button"
                disabled={isUpdating}
                onClick={() => handleAction(btn.newStatus)}
                className={btn.primary ? 'd3-btn-primary' : 'd3-btn-quiet'}
                style={{ opacity: isUpdating ? 0.55 : 1 }}
              >
                {isUpdating ? 'Updating…' : btn.label}
              </button>
            ))}
            {!itemIsCancelled && status !== 'cancelled' && !modal.forceCancel && (
              <button
                type="button"
                disabled={isUpdating || cancelLoading}
                onClick={async () => {
                  try {
                    setCancelLoading(true);
                    onError?.('');
                    const body: any = { order_id: order.id, order_item_id: item.id };
                    const res = await fetch('/api/orders/cancel-item', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(body) });
                    const json = await res.json();
                    if (!res.ok || !json.success) throw new Error(json.error || 'Failed to cancel item');
                    onClose();
                    // rely on query invalidation/refetch
                  } catch (e: any) {
                    onError?.(e?.message || 'Failed to cancel item');
                    setCancelLoading(false);
                  }
                }}
                className="d3-btn-inline"
                style={{ marginTop: 4, opacity: (isUpdating || cancelLoading) ? 0.55 : 1, borderColor: '#C46658', color: '#C46658' }}
              >
                {cancelLoading ? 'Cancelling...' : 'CANCEL ITEM'}
              </button>
            )}
            {isCancellable && modal.forceCancel && (
              <button
                type="button"
                disabled={isUpdating}
                onClick={async () => {
                  try {
                    onError?.('');
                    await onStatusUpdate(order.id, 'cancelled', undefined);
                    onClose();
                    // rely on query invalidation/refetch
                  } catch (err: any) {
                    onError?.(err?.message || 'Failed to cancel order');
                  }
                }}
                className="d3-btn-inline d3-btn-danger"
                style={{ marginTop: 4, opacity: isUpdating ? 0.55 : 1 }}
              >
                Cancel Order
              </button>
            )}
          </div>
        )}

        {/* Step 1: choose reason */}
        {cancelStep === 'reason' && (
          <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
            <div style={{ fontSize: '0.5625rem', fontWeight: 600, letterSpacing: '0.12em', textTransform: 'uppercase', color: '#C46658', marginBottom: 2 }}>
              CANCELLATION REASON
            </div>
            {CANCEL_REASONS.map(r => (
              <label key={r} style={{ display: 'flex', alignItems: 'center', gap: 10, cursor: 'pointer', fontSize: '0.8125rem', color: cancelReason === r ? 'var(--text-primary)' : 'var(--text-muted)' }}>
                <input
                  type="radio"
                  name="cancel_reason"
                  value={r}
                  checked={cancelReason === r}
                  onChange={() => setCancelReason(r)}
                  style={{ accentColor: 'var(--gold)', width: 14, height: 14 }}
                />
                {r}
              </label>
            ))}
            {cancelReason === 'Other' && (
              <textarea
                placeholder="Describe the reason..."
                value={cancelOther}
                onChange={e => setCancelOther(e.target.value)}
                rows={2}
                style={{
                  marginTop: 4, width: '100%', boxSizing: 'border-box',
                  background: 'var(--bg-secondary, rgba(255,255,255,0.04))',
                  border: '1px solid var(--border-warm, rgba(255,255,255,0.12))',
                  borderRadius: 6, padding: '0.5rem 0.75rem',
                  color: 'var(--text-primary)', fontSize: '0.8125rem',
                  resize: 'vertical', outline: 'none',
                }}
              />
            )}
            <div style={{ display: 'flex', gap: 8, marginTop: 4 }}>
              <button type="button" onClick={() => { setCancelStep('none'); setCancelReason(''); setCancelOther(''); }} className="d3-btn-quiet" style={{ flex: 1 }}>Back</button>
              <button type="button" disabled={!cancelReason} onClick={() => setCancelStep('confirm')} className="d3-btn-inline d3-btn-danger" style={{ flex: 1, opacity: cancelReason ? 1 : 0.45 }}>Next</button>
            </div>
          </div>
        )}

        {/* Step 2: confirm */}
        {cancelStep === 'confirm' && (
          <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
            <div style={{ padding: '0.875rem', borderRadius: 8, background: 'rgba(196,102,88,0.07)', border: '1px solid rgba(196,102,88,0.22)', fontSize: '0.8125rem', color: 'var(--text-secondary)', lineHeight: 1.55 }}>
              <strong style={{ color: '#C46658', display: 'block', marginBottom: 4, fontSize: '0.6875rem', textTransform: 'uppercase', letterSpacing: '0.08em' }}>Confirm Cancellation</strong>
              Reason: <strong style={{ color: 'var(--text-primary)' }}>{cancelReason === 'Other' ? (cancelOther.trim() || 'Other') : cancelReason}</strong>
              <br />This will cancel the entire order and cannot be undone.
            </div>
            <div style={{ display: 'flex', gap: 8 }}>
              <button type="button" onClick={() => setCancelStep('reason')} className="d3-btn-quiet" style={{ flex: 1 }} disabled={cancelLoading}>Back</button>
              <button type="button" onClick={handleCancelConfirm} className="d3-btn-inline d3-btn-danger" style={{ flex: 1, opacity: cancelLoading ? 0.6 : 1 }} disabled={cancelLoading}>
                {cancelLoading ? 'Cancelling\u2026' : 'Confirm Cancel'}
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}

/* ─── Page ───────────────────────────────────────────────────────────── */

export default function LiveOrdersPage() {
  const { hotel, loading: hotelLoading } = useHotel();
  const { orders, updateOrderStatus, updatePaymentStatus, updatingOrderIds } = useOrders(hotel?.id || null);
  const [now, setNow] = useState(() => new Date());
  useEffect(() => {
    const t = setInterval(() => setNow(new Date()), 30000);
    return () => clearInterval(t);
  }, []);

  const hotelSlug = hotel?.slug || '';
  const menuHref = hotelSlug ? `/menu/${hotelSlug}` : '/dashboard/settings';

  const [activeTab, setActiveTab] = useState('all');
  const [activePaymentFilter, setActivePaymentFilter] = useState('all');
  const [updateError, setUpdateError] = useState<string | null>(null);
  const [paymentError, setPaymentError] = useState<string | null>(null);
  const [paymentSuccess, setPaymentSuccess] = useState<string | null>(null);
  const [updateSuccess, setUpdateSuccess] = useState<string | null>(null);
  const [modal, setModal] = useState<ModalState | null>(null);
  const successTimer = useRef<ReturnType<typeof setTimeout> | null>(null);

  const showSuccess = useCallback((msg: string) => {
    if (successTimer.current) clearTimeout(successTimer.current);
    setUpdateSuccess(msg);
    successTimer.current = setTimeout(() => setUpdateSuccess(null), 3000);
  }, []);

  const handleUpdateStatus = useCallback(
    async (id: string, status: string, cancellationReason?: string) => {
      if (updatingOrderIds.has(id)) return;
      const current = orders.find((o) => o.id === id)?.status;
      const next = (status || '').trim().toLowerCase();
      if (!cancellationReason && current && normalise(current) === next) return; // no-op, no error/DB call
      setUpdateError(null);
      try {
        if (next === 'cancelled' && cancellationReason) {
          const resp = await fetch('/api/orders/update-status', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ order_id: id, status: 'cancelled', cancellation_reason: cancellationReason }),
          });
          const json = await resp.json();
          if (!json.success) throw new Error(json.error || 'Failed to cancel order');
        } else {
          await updateOrderStatus(id, next);
        }
        showSuccess('Order status updated.');
      } catch (err: any) {
        setUpdateError(err.message || 'Failed to update order status');
        throw err;
      }
    },
    [updateOrderStatus, updatingOrderIds, orders]
  );

  const handleUpdatePaymentStatus = useCallback(
    async (id: string, paymentStatus: 'paid' | 'unpaid') => {
      const order = orders.find((o) => o.id === id);
      if (order && normalise(order.status) === 'cancelled') {
        setPaymentError('Cannot change payment status of a cancelled order.');
        return;
      }
      setPaymentError(null);
      try {
        await updatePaymentStatus(id, paymentStatus);
        setPaymentSuccess(`Order marked as ${paymentStatus}.`);
        setTimeout(() => setPaymentSuccess(null), 3000);
      } catch (err: any) {
        setPaymentError(err.message || 'Failed to update payment status');
      }
    },
    [updatePaymentStatus, orders]
  );

  const getOrderItems = (order: Order): NormalisedItem[] => {
    if (!order.order_items || !Array.isArray(order.order_items)) return [];
    return order.order_items
      .map((item: any) => {
        const price =
          item.price_at_time != null ? item.price_at_time
          : item.price != null ? item.price
          : item.menu_item?.price ?? 0;
        return {
          id: item.id,
          name: item.name || item.menu_item?.name || 'Unknown',
          quantity: item.quantity || 1,
          price,
          notes: item.notes,
          status: item.status || (item.is_cancelled ? 'cancelled' : 'active'),
        } as NormalisedItem;
      });
  };

  const filtered = orders.filter((o: Order) => {
    const statusMatch = activeTab === 'all' || normalise(o.status) === activeTab;
    const isCancelled = normalise(o.status) === 'cancelled';
    const paymentMatch =
      activePaymentFilter === 'all'
        ? true
        : isCancelled
          ? true
          : normalise(o.payment_status) === activePaymentFilter;
    return statusMatch && paymentMatch;
  });

  if (hotelLoading) {
    return (
      <div className="flex flex-col items-center justify-center py-24 gap-4">
        <div style={{ width: 40, height: 40, borderRadius: '50%', border: '2px solid rgba(201,169,110,0.2)', borderTop: '2px solid var(--gold)', animation: 'spin 1s linear infinite' }} />
        <p style={{ color: 'var(--text-dimmed)', fontSize: '0.875rem' }}>Loading orders...</p>
      </div>
    );
  }

  return (
    <>
      {modal && (
        <ItemModal
          modal={modal}
          currency={hotel?.currency}
          updatingOrderIds={updatingOrderIds}
          onClose={() => setModal(null)}
          onStatusUpdate={handleUpdateStatus}
          onError={setUpdateError}
        />
      )}

      <div className="flex flex-col gap-8" style={{ maxWidth: 1180 }}>

        {/* Header */}
        <header className="flex flex-col sm:flex-row items-start sm:items-end justify-between gap-5">
          <div>
            <span className="d3-eyebrow" style={{ fontSize: '0.5625rem' }}>Service</span>
            <h1 style={{ fontFamily: 'var(--font-display)', fontSize: 'clamp(2rem, 4vw, 2.75rem)', fontWeight: 500, color: 'var(--text-primary)', letterSpacing: '-0.025em', lineHeight: 1.1, margin: '0.5rem 0 0' }}>
              Live Orders
            </h1>
            <p style={{ margin: '0.5rem 0 0', fontSize: '0.875rem', lineHeight: 1.6, color: 'var(--text-muted)', maxWidth: '54ch' }}>
              The real-time order stream for your kitchen and floor staff.
            </p>
          </div>
          <div style={{ display: 'flex', alignItems: 'center', gap: 28 }}>
            {[
              { label: 'New',        count: orders.filter((o: Order) => normalise(o.status) === 'pending').length },
              { label: 'In Kitchen', count: orders.filter((o: Order) => normalise(o.status) === 'preparing').length },
              { label: 'Ready',      count: orders.filter((o: Order) => normalise(o.status) === 'ready').length },
            ].map((stat) => (
              <div key={stat.label}>
                <span className="d3-figure" style={{ display: 'block', fontSize: '1.5rem' }}>{stat.count}</span>
                <span style={{ display: 'block', marginTop: 5, fontSize: '0.5625rem', fontWeight: 600, letterSpacing: '0.18em', textTransform: 'uppercase', color: 'var(--text-dimmed)' }}>{stat.label}</span>
              </div>
            ))}
          </div>
        </header>

        {/* Banners */}
        {updateError && (
          <div style={{ padding: '0.875rem 1.25rem', background: 'rgba(196,102,88,0.06)', border: '1px solid rgba(196,102,88,0.25)', borderRadius: 10, color: '#C46658', fontSize: '0.8125rem', display: 'flex', alignItems: 'center', gap: 10 }}>
            <span>{updateError}</span>
            <button type="button" onClick={() => setUpdateError(null)} style={{ marginLeft: 'auto', background: 'none', border: 'none', color: '#C46658', cursor: 'pointer', padding: 0 }}>&#x2715;</button>
          </div>
        )}
        {paymentError && (
          <div style={{ padding: '0.875rem 1.25rem', background: 'rgba(196,102,88,0.06)', border: '1px solid rgba(196,102,88,0.25)', borderRadius: 10, color: '#C46658', fontSize: '0.8125rem', display: 'flex', alignItems: 'center', gap: 10 }}>
            <span>{paymentError}</span>
            <button type="button" onClick={() => setPaymentError(null)} style={{ marginLeft: 'auto', background: 'none', border: 'none', color: '#C46658', cursor: 'pointer', padding: 0 }}>&#x2715;</button>
          </div>
        )}
        {paymentSuccess && (
          <div style={{ padding: '0.875rem 1.25rem', background: 'rgba(16,185,129,0.08)', border: '1px solid rgba(16,185,129,0.25)', borderRadius: 10, color: '#10b981', fontSize: '0.8125rem', display: 'flex', alignItems: 'center', gap: 10 }}>
            <span>{paymentSuccess}</span>
            <button type="button" onClick={() => setPaymentSuccess(null)} style={{ marginLeft: 'auto', background: 'none', border: 'none', color: '#10b981', cursor: 'pointer', padding: 0 }}>&#x2715;</button>
          </div>
        )}
        {updateSuccess && (
          <div style={{ padding: '0.875rem 1.25rem', background: 'rgba(16,185,129,0.08)', border: '1px solid rgba(16,185,129,0.25)', borderRadius: 10, color: '#10b981', fontSize: '0.8125rem', display: 'flex', alignItems: 'center', gap: 10 }}>
            <span>{updateSuccess}</span>
            <button type="button" onClick={() => setUpdateSuccess(null)} style={{ marginLeft: 'auto', background: 'none', border: 'none', color: '#10b981', cursor: 'pointer', padding: 0 }}>&#x2715;</button>
          </div>
        )}

        {/* Tab filter */}
        <div className="d3-segment" role="group" aria-label="Filter orders by status">
          {TABS.map((tab) => {
            const count = orders.filter((o: Order) => tab === 'all' ? true : normalise(o.status) === tab).length;
            return (
              <button key={tab} type="button" className="d3-segment-item" data-active={activeTab === tab} onClick={() => setActiveTab(tab)}>
                {tab} ({count})
              </button>
            );
          })}
        </div>

        {/* Payment filter */}
        <div className="d3-segment" role="group" aria-label="Filter orders by payment status">
          {PAYMENT_FILTERS.map((pf) => {
            const count = orders.filter((o: Order) => pf === 'all' || normalise(o.payment_status) === pf).length;
            return (
              <button key={pf} type="button" className="d3-segment-item" data-active={activePaymentFilter === pf} onClick={() => setActivePaymentFilter(pf)}>
                {PAYMENT_LABEL[pf]} ({count})
              </button>
            );
          })}
        </div>

        {/* Orders grid */}
        {filtered.length === 0 ? (
          <div className="d3-empty">
            <svg width="38" height="38" viewBox="0 0 40 40" fill="none" style={{ opacity: 0.45 }} aria-hidden="true">
              <rect x="6" y="9" width="28" height="22" rx="3" stroke="currentColor" strokeWidth="1.1" />
              <path d="M13 17H27M13 22H21" stroke="currentColor" strokeWidth="1.1" strokeLinecap="round" />
            </svg>
            <h3 className="d3-empty-title">{activeTab === 'all' ? 'No orders yet' : `No ${activeTab} orders`}</h3>
            <p className="d3-empty-body">
              {orders.length === 0 ? 'Orders placed from your guest menu land here instantly.' : 'Nothing is in this state right now.'}
              {hotelSlug && <> Open <a href={menuHref} target="_blank" style={{ color: 'var(--gold)' }}>/menu/{hotelSlug}</a> to place one.</>}
            </p>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-5">
            {filtered.map((order: Order) => {
              const minsAgo    = getMinutesAgo(order.created_at);
              const isNew      = normalise(order.status) === 'pending';
              const orderItems = getOrderItems(order);

              return (
                <article
                  key={order.id}
                  className="d3-panel p-4"
                  style={{
                    height: 340,
                    display: 'flex',
                    flexDirection: 'column',
                    gap: 0,
                    ...(isNew ? { borderColor: 'rgba(184,164,122,0.28)', background: 'var(--bg-surface-2)' } : {}),
                  }}
                >
                  {/* Card header */}
                  <div style={{ flexShrink: 0, marginBottom: 10 }}>
                    <div style={{ fontSize: '1rem', fontWeight: 600, color: 'var(--text-primary)' }}>
                      Table {order.table_number || '\u2014'}
                    </div>
                    <div style={{ fontFamily: 'ui-monospace, SFMono-Regular, Menlo, monospace', fontSize: '0.625rem', color: 'var(--text-dimmed)', marginTop: 2 }}>
                      {order.id.slice(0, 8).toUpperCase()}
                    </div>
                    {formatOrderDateIST(order.created_at) && (
                      <div style={{ fontSize: '12px', color: 'var(--text-dimmed)', marginTop: 2, lineHeight: 1.3 }}>{formatOrderDateIST(order.created_at)}</div>
                    )}
                    <div style={{ marginTop: 4 }}>
                      <span className={`d3-badge ${STATUS_CLASS[normalise(order.status)] || STATUS_CLASS.cancelled}`} style={{ fontSize: '0.625rem' }}>
                        {STATUS_LABEL[normalise(order.status)] || order.status}
                      </span>
                      <span
                        className="d3-badge d3-badge-payment"
                        style={{
                          fontSize: '0.625rem',
                          marginLeft: 6,
                          background: normalise(order.payment_status) === 'paid' ? 'rgba(16,185,129,0.12)' : 'rgba(196,102,88,0.12)',
                          borderColor: normalise(order.payment_status) === 'paid' ? 'rgba(16,185,129,0.35)' : 'rgba(196,102,88,0.35)',
                          color: normalise(order.payment_status) === 'paid' ? '#10b981' : '#C46658',
                        }}
                      >
                        {normalise(order.payment_status) === 'paid' ? 'PAID' : 'UNPAID'}
                      </span>
                    </div>
                    <p style={{ margin: '0.25rem 0 0', fontSize: '12px', color: 'var(--text-muted)', display: 'flex', alignItems: 'center', gap: 6, flexWrap: 'wrap' }}>
                      <span style={{ color: 'var(--text-primary)', fontWeight: 500 }}>{order.customer_name || 'Guest'}</span>
                      {formatOrderTimeIST(order.created_at, now) && (
                        <>
                          <span style={{ color: 'var(--text-dimmed)', opacity: 0.6 }} aria-hidden="true">·</span>
                          <span style={{ fontSize: '12px', color: 'var(--text-dimmed)' }}>{formatOrderTimeIST(order.created_at, now)}</span>
                        </>
                      )}
                    </p>
                  </div>

                  {/* Items label */}
                  <div style={{ flexShrink: 0, fontSize: '0.6875rem', letterSpacing: '0.08em', textTransform: 'uppercase', color: 'var(--text-dimmed)', marginBottom: 5 }}>
                    ORDER ITEMS
                    <span style={{ marginLeft: 6, fontSize: '0.5625rem', color: 'var(--text-dimmed)', textTransform: 'none', letterSpacing: 0, fontWeight: 400, opacity: 0.7 }}>
                      (tap to manage)
                    </span>
                  </div>

                  {/* Scrollable items list */}
                  <div
                    style={{
                      flex: 1,
                      overflowY: 'auto',
                      overflowX: 'hidden',
                      display: 'flex',
                      flexDirection: 'column',
                      gap: 3,
                      scrollbarWidth: 'thin',
                      scrollbarColor: 'rgba(201,169,110,0.2) transparent',
                      paddingRight: 2,
                      marginRight: -2,
                      minHeight: 0,
                    }}
                  >
                    {orderItems.length === 0 ? (
                      <span style={{ fontSize: '0.75rem', color: 'var(--text-dimmed)', fontStyle: 'italic' }}>No items</span>
                    ) : orderItems.map((item) => {
                      const itemIsCancelled = normalise((item as any).status || '') === 'cancelled';
                      return (
                      <button
                        key={item.id}
                        type="button"
                        onClick={() => setModal({ order, item, orderItems })}
                        style={{
                          display: 'flex', alignItems: 'baseline', justifyContent: 'space-between',
                          gap: 8, width: '100%', background: 'transparent', border: 'none',
                          borderRadius: 5, padding: '0.3125rem 0.375rem',
                          cursor: 'pointer', textAlign: 'left',
                          transition: 'background 0.15s',
                        }}
                        onMouseEnter={e => (e.currentTarget.style.background = 'rgba(201,169,110,0.07)')}
                        onMouseLeave={e => (e.currentTarget.style.background = 'transparent')}
                      >
                        <span style={{ fontSize: '0.8125rem', color: itemIsCancelled ? '#C46658' : 'var(--text-primary)' }}>
                          {item.quantity} &times; {item.name}{itemIsCancelled ? ' [C]' : ''}
                        </span>
                        <span style={{ fontSize: '0.8125rem', color: 'var(--text-primary)', fontWeight: 500, flexShrink: 0 }}>
                          {formatPrice((item.price * item.quantity) || 0, hotel?.currency)}
                        </span>
                      </button>
                    )})}
                  </div>

                  {/* Chef note (compact, fixed) */}
                  {order.notes && (
                    <div style={{
                      flexShrink: 0, marginTop: 8,
                      padding: '0.4375rem 0.625rem', borderRadius: 5,
                      background: 'var(--bg-secondary)', border: '1px solid var(--border-warm)',
                      fontSize: '0.6875rem', lineHeight: 1.5, color: 'var(--text-secondary)',
                      overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap',
                    }}>
                      <strong style={{ color: 'var(--text-primary)', fontWeight: 500 }}>Note:</strong> {order.notes}
                    </div>
                  )}

                  {/* Total — pinned */}
                  {/* Process & Payment actions */}
                  {normalise(order.status) === 'completed' ? (
                    <div style={{ display: 'flex', gap: 6, alignItems: 'center', marginTop: 8, flexShrink: 0 }}>
                      {normalise(order.payment_status) !== 'paid' && (
                        <button
                          type="button"
                          disabled={updatingOrderIds.has(order.id)}
                          onClick={async (e) => {
                            e.stopPropagation();
                            try {
                              await updatePaymentStatus(order.id, 'paid');
                            } catch (err: any) {
                              setPaymentError(err?.message || 'Failed to mark as paid');
                            }
                          }}
                          className="d3-btn-primary"
                          style={{
                            flex: 1,
                            fontSize: '0.72rem',
                            padding: '0.375rem 0.5rem',
                            whiteSpace: 'nowrap',
                            opacity: updatingOrderIds.has(order.id) ? 0.6 : 1,
                            background: 'var(--gold)',
                            color: '#0b0b0a',
                          }}
                        >
                          {updatingOrderIds.has(order.id) ? 'Updating...' : 'MARK AS PAID'}
                        </button>
                      )}
                    </div>
                  ) : (
                    <div style={{ display: 'flex', gap: 6, alignItems: 'center', marginTop: 8, flexShrink: 0 }}>
                      {normalise(order.status) !== 'cancelled' && (
                        <>
                           {(() => {
                             const s = normalise(order.status);
                             let nextStatus = '';
                             let label = '';
                             if (s === 'pending' || s === 'placed') { nextStatus = 'accepted'; label = 'ACCEPT ORDER'; }
                             else if (s === 'accepted') { nextStatus = 'preparing'; label = 'START PREPARING'; }
                             else if (s === 'preparing') { nextStatus = 'ready'; label = 'MARK AS READY'; }
                             else if (s === 'ready') { nextStatus = 'completed'; label = 'COMPLETE ORDER'; }
                             else { return null; }
                             const isUpdating = updatingOrderIds.has(order.id);
                             return (
                               <button
                                 type="button"
                                 disabled={isUpdating}
                                  onClick={async (e) => {
                                    e.stopPropagation();
                                    if (isUpdating || normalise(order.status) === nextStatus) return;
                                    try {
                                      await updateOrderStatus(order.id, nextStatus);
                                      showSuccess('Order status updated.');
                                    } catch (err: any) {
                                      setUpdateError(err?.message || 'Failed to update order');
                                    }
                                  }}
                                 className="d3-btn-primary"
                                 style={{ flex: 1, fontSize: '0.72rem', padding: '0.375rem 0.5rem', whiteSpace: 'nowrap', opacity: isUpdating ? 0.6 : 1 }}
                               >
                                 {isUpdating ? 'Updating...' : 'QUICK PROCESS'}
                               </button>
                             );
                           })()}
                          <button
                            type="button"
                            disabled={updatingOrderIds.has(order.id)}
                            onClick={(e) => {
                              e.stopPropagation();
                              setModal({ order, item: orderItems[0] || { id: order.id, name: orderItems.length > 0 ? orderItems.length + ' items' : 'Order', quantity: 1, price: 0, notes: null }, orderItems, forceCancel: true });
                            }}
                            className="d3-btn-inline d3-btn-danger"
                            style={{ fontSize: '0.72rem', padding: '0.375rem 0.5rem', whiteSpace: 'nowrap', opacity: updatingOrderIds.has(order.id) ? 0.6 : 1 }}
                          >
                            CANCEL ORDER
                          </button>
                        </>
                      )}
                    </div>
                  )}

                  <div style={{
                    flexShrink: 0,
                    display: 'flex', alignItems: 'center', justifyContent: 'space-between',
                    borderTop: '1px solid var(--border-warm)', paddingTop: '0.75rem', marginTop: 8,
                  }}>
                    <span style={{ fontSize: '0.6875rem', letterSpacing: '0.08em', textTransform: 'uppercase', color: 'var(--text-muted)' }}>ACTIVE ORDER TOTAL</span>
                    <span className="d3-figure" style={{ fontSize: '1.25rem', color: 'var(--gold)' }}>
                      {(() => {
                        const activeTotal = orderItems.reduce((sum, item) => {
                          const itemIsCancelled = normalise((item as any).status || '') === 'cancelled';
                          if (itemIsCancelled) return sum;
                          return sum + ((item.price || 0) * (item.quantity || 0));
                        }, 0);
                        return formatPrice(activeTotal, hotel?.currency);
                      })()}
                    </span>
                  </div>

                  {/* Cancellation reason inline (cancelled orders) */}
                  {normalise(order.status) === 'cancelled' && order.cancellation_reason && (
                    <div style={{
                      flexShrink: 0, marginTop: 6,
                      padding: '0.4375rem 0.625rem', borderRadius: 5,
                      background: 'rgba(196,102,88,0.06)', border: '1px solid rgba(196,102,88,0.18)',
                      fontSize: '0.6875rem', lineHeight: 1.45,
                      overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap',
                    }}>
                      <strong style={{ color: '#C46658', fontWeight: 500 }}>Reason:</strong>{' '}
                      <span style={{ color: 'var(--text-secondary)' }}>{order.cancellation_reason}</span>
                    </div>
                  )}
                </article>
              );
            })}
          </div>
        )}
      </div>
    </>
  );
}
