'use client';

import React, { useState, useEffect, useCallback, useRef, Suspense } from 'react';
import Link from 'next/link';
import Dine3DLogo from '@/components/Dine3DLogo';
import { menuThemeClass } from '@/lib/menuThemes';
import { formatPrice } from '@/lib/menu';
import { supabaseClient, isSupabaseConfigured } from '@/lib/supabaseBrowser';
import { customThemeToCssVars } from '@/components/menu/MenuThemeProvider';
import { cloneCustomThemeConfig, type CustomThemeConfig } from '@/lib/customTheme';
import { CustomThemeFontLoader } from '@/components/menu/CustomThemeFontLoader';
import SplitBillModal from '@/components/order/SplitBillModal';
import ServiceRequestModal from '@/components/menu/ServiceRequestModal';
import { isWaterOrder, isWaterItem, cleanWaterNotes } from '@/lib/waterOrderHelper';

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------

interface LiveOrderItem {
  id: string;
  name: string | null;
  quantity: number;
  price_at_time: number;
  notes: string | null;
  status?: string | null;
  item_kind?: string | null;
}

interface LiveOrder {
  id: string;
  order_number: string;
  status: string;
  payment_status: string;
  payment_method: string;
  table_number: string | null;
  customer_name: string | null;
  customer_phone: string | null;
  notes: string | null;
  total_amount: number;
  created_at: string;
  updated_at?: string | null;
  items: LiveOrderItem[];
  hotel_theme: string | null;
  menu_theme?: string | null;
  hotel_custom_theme_config?: CustomThemeConfig | null;
  hotel_slug: string | null;
  hotel_id?: string | null;
  amount_paid?: number | null;
  remaining_balance?: number | null;
  currency?: string | null;
  cancellation_reason?: string | null;
  cancelled_by?: string | null;
  linked_order_id?: string | null;
  linked_orders?: any[];
  combined_items?: LiveOrderItem[];
  combined_bill_total?: number;
  /** Total of paid water charges included in the bill (linked water orders). */
  water_charges?: number;
  /** The hotel's Google Review URL, present once payment is marked PAID. */
  google_review_url?: string | null;
}

// ---------------------------------------------------------------------------
// Status â†’ stage mapping
//
// Stored statuses (written by the hotel dashboard API):
//   pending   â†’ Order Placed          (just received)
//   accepted  â†’ Accepted by Restaurant (restaurant confirmed)
//   preparing â†’ Preparing              (kitchen working on it)
//   ready     â†’ Ready                  (food ready)
//   completed â†’ Completed              (order closed)
//   delivered â†’ treated as completed
//   cancelled â†’ terminal error state
//
// The STAGES array drives the visual progress bar. Five stages are shown so
// the 'accepted' step is always visible and never silently skipped.
// ---------------------------------------------------------------------------

// Stage definitions for the progress bar (UI-only grouping). `delivered` is
// terminal and maps to the completed stage for regular food orders.
const STAGES_FOOD = [
  { key: 'placed',    title: 'Order Placed',           desc: 'Your order has been received by the restaurant' },
  { key: 'accepted',  title: 'Accepted by Restaurant', desc: 'The restaurant has confirmed your order' },
  { key: 'preparing', title: 'Preparing',              desc: 'The kitchen is working on your food' },
  { key: 'ready',     title: 'Ready',                  desc: 'Your order is ready for service' },
  { key: 'completed', title: 'Completed',              desc: 'Order complete — enjoy your meal!' },
];

// Water orders skip preparation/acceptance stages.
const STAGES_WATER = [
  { key: 'placed',    title: 'Order Placed', desc: 'Your water request has been received' },
  { key: 'delivered', title: 'Delivered',    desc: 'Your water has been delivered to the table' },
];

function WaterDropletIcon({ size = 13 }: { size?: number }) {
  return (
    <svg
      width={size}
      height={size}
      viewBox="0 0 24 24"
      fill="none"
      stroke="#67D4F0"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
      aria-hidden="true"
      style={{ flexShrink: 0, display: 'inline-block', verticalAlign: 'text-bottom', marginRight: 5, opacity: 0.9 }}
    >
      <path d="M12 2.69l5.66 5.66a8 8 0 1 1-11.31 0z" />
    </svg>
  );
}

function isWaterOrderLive(order: LiveOrder | null | undefined): boolean {
  return isWaterOrder(order as any);
}

function stagesForOrder(order: LiveOrder | null | undefined) {
  return isWaterOrderLive(order) ? STAGES_WATER : STAGES_FOOD;
}

function statusToStageIndex(status: string, water = false): number {
  const s = (status || '').trim().toLowerCase();
  if (water) {
    if (s === 'delivered' || s === 'completed') return 1;
    return 0; // placed/pending
  }
  switch (s) {
    case 'pending':
    case 'placed':
      return 0;
    case 'accepted':
      return 1;
    case 'preparing':
      return 2;
    case 'ready':
      return 3;
    case 'delivered':
    case 'completed':
      return 4;
    default:
      return 0;
  }
}

function isTerminal(status: string): boolean {
    const s = (status || '').trim().toLowerCase();
    return s === 'delivered' || s === 'completed' || s === 'cancelled';
  }

  /**
   * Whether the guest still needs to watch for a payment update.
   *
   * A completed order is normally terminal, but the payment-to-review
   * redirect is gated on payment_status becoming 'paid', which the
   * hotel sets AFTER completion. If polling/realtime stopped the moment
   * the order hit 'completed', a guest who refreshed between completion
   * and payment would never see the paid transition â€” and never be
   * redirected. So the tracking page stays live until the order is
   * both terminal AND paid (or cancelled).
   */
  function needsPaymentWatch(order: LiveOrder | null): boolean {
    if (!order) return false;
    const s = (order.status || '').trim().toLowerCase();
    const paid = (order.payment_status || '').trim().toLowerCase() === 'paid';
    if (s === 'cancelled') return false;
    if (paid) return false;
    return true; // pending/accepted/preparing/ready/completed/delivered
  }

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

function formatDateTime(iso: string): string {
  try {
    return new Date(iso).toLocaleString('en-IN', {
      day: 'numeric', month: 'short', year: 'numeric',
      hour: 'numeric', minute: '2-digit',
    });
  } catch { return ''; }
}

// ---------------------------------------------------------------------------
// Main inner component
// ---------------------------------------------------------------------------

function OrderTrackingInner({ orderId, hotelSlug }: { orderId: string; hotelSlug?: string }) {
  const [order, setOrder]           = useState<LiveOrder | null>(null);
  const [loading, setLoading]       = useState(true);
  const [error, setError]           = useState<string | null>(null);
  const [realtimeOk, setRealtimeOk] = useState(false);

  const [cancelling, setCancelling] = useState(false);
  const [showCancelDialog, setShowCancelDialog] = useState(false);
  const [cancellationReason, setCancellationReason] = useState<string | null>(null);
  const [otherReason, setOtherReason] = useState('');
  const [cancelError, setCancelError] = useState<string | null>(null);
  const [cancelSuccess, setCancelSuccess] = useState<string | null>(null);
  const [itemCancelling, setItemCancelling] = useState<string | null>(null);
  const [showItemCancelDialog, setShowItemCancelDialog] = useState<string | null>(null);
  const [itemQtyUpdating, setItemQtyUpdating] = useState<string | null>(null);
  const [itemQtyError, setItemQtyError] = useState<string | null>(null);
  const [paymentReviewMessage, setPaymentReviewMessage] = useState<string | null>(null);
  const [showSplitBill, setShowSplitBill] = useState(false);
  const [showCallWaiter, setShowCallWaiter] = useState(false);

  const CANCELLATION_REASONS = [
    'Dish not needed anymore',
    'Taking too much time',
    'Ordered by mistake',
    'Ordered the wrong item',
    'Found another option',
    'Other',
  ];

  const PANEL: React.CSSProperties = {
    border: '1px solid var(--border-light)',
    borderRadius: 'var(--d3-card-radius)',
    background: 'var(--bg-surface)',
    boxShadow: 'var(--d3-shadow-card)',
    marginBottom: '1rem',
    overflow: 'hidden',
  };
  const SECTION_TITLE: React.CSSProperties = {
    margin: 0,
    fontSize: '0.6875rem',
    fontWeight: 600,
    letterSpacing: '0.14em',
    textTransform: 'uppercase',
    color: 'var(--gold)',
    lineHeight: 1.3,
  };

  const orderRef = useRef<LiveOrder | null>(null);
  orderRef.current = order;

  const paymentRedirectTriggeredRef = useRef(false);

  const backHref = hotelSlug || order?.hotel_slug
    ? `/menu/${hotelSlug || order?.hotel_slug}`
    : '/';

  // -----------------------------------------------------------------------
  // Fetch the authoritative order record from our public API route.
  // `silent=true` skips showing a loading spinner (used for background polls).
  // -----------------------------------------------------------------------
  const loadOrder = useCallback(async (silent = false) => {
    try {
      if (!silent) setLoading(true);
      const res  = await fetch(`/api/public/orders/${encodeURIComponent(orderId)}`, { cache: 'no-store' });
      const json = await res.json();

      if (!res.ok || !json.success) {
        if (!silent) { setOrder(null); setError(json.error || 'We could not find that order.'); }
        return;
      }

      setOrder(json.order as LiveOrder);
      setError(null);
    } catch {
      if (!silent) { setOrder(null); setError('We could not load this order. Please refresh to try again.'); }
    } finally {
      if (!silent) setLoading(false);
    }
  }, [orderId]);

  // -----------------------------------------------------------------------
  // Customer-initiated order cancellation
  // -----------------------------------------------------------------------
  const handleCancelOrder = useCallback(
    async (reason: string) => {
      setCancelling(true);
      setCancelError(null);
      try {
        const res = await fetch('/api/orders/cancel', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ order_id: orderId, cancellation_reason: reason }),
        });
        const json = await res.json();
        if (!json.success) {
          throw new Error(json.error || 'Failed to cancel order');
        }
        setCancelling(false);
        setShowCancelDialog(false);
        setCancellationReason(null);
        setOtherReason('');
        setCancelSuccess('Your order has been cancelled successfully.');
      } catch (err: any) {
        setCancelling(false);
        setCancelError(err.message || 'Failed to cancel order');
      }
    },
    [orderId]
  );

  const handleCancelItem = useCallback(async (itemId: string) => {
    if (isWaterOrderLive(orderRef.current)) return; // water orders use whole-order delivery/cancel only
    setItemCancelling(itemId);
    setCancelError(null);
    try {
      const res = await fetch('/api/orders/cancel-item-customer', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ order_id: orderId, order_item_id: itemId, reason: 'Cancelled by customer' }),
      });
      const json = await res.json();
      if (!json.success) throw new Error(json.error || 'Failed to cancel item');
      setShowItemCancelDialog(null);
      await loadOrder(true);
    } catch (err: any) {
      setCancelError(err.message || 'Failed to cancel item');
    } finally {
      setItemCancelling(null);
    }
  }, [orderId, loadOrder]);


  const handleUpdateItemQuantity = useCallback(async (itemId: string, quantity: number) => {
    if (quantity < 1) return;
    setItemQtyUpdating(itemId);
    setItemQtyError(null);
    const prevOrder = orderRef.current;
    try {
      const res = await fetch('/api/orders/update-item-quantity', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ order_id: orderId, order_item_id: itemId, quantity }),
      });
      const json = await res.json();
      if (!json.success) throw new Error(json.error || 'Failed to update quantity');
      const updatedOrder = json.order as LiveOrder;
      if (prevOrder) {
        updatedOrder.hotel_theme = updatedOrder.hotel_theme || prevOrder.hotel_theme;
        updatedOrder.hotel_custom_theme_config =
          updatedOrder.hotel_custom_theme_config || prevOrder.hotel_custom_theme_config;
        updatedOrder.hotel_slug = updatedOrder.hotel_slug || prevOrder.hotel_slug;
      }
      setOrder(updatedOrder);
      setError(null);
    } catch (err: any) {
      setItemQtyError(err.message || 'Failed to update quantity');
    } finally {
      setItemQtyUpdating(null);
    }
  }, [orderId]);
  // Initial load â€” fires once on mount. Without this the page stays on
  // `loading=true` forever because every other effect below guards on
  // `order` being non-null first.
  // -----------------------------------------------------------------------
  useEffect(() => {
    loadOrder(false);
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [orderId]);

  // -----------------------------------------------------------------------
  // Supabase Realtime subscription
  //
  // We subscribe to postgres_changes on the specific order row so the page
  // updates the moment the hotel writes a new status â€” no poll needed for the
  // happy path.
  //
  // Security: uses the public anon key (supabaseClient). The filter limits
  // events to this order id. The service-role key is never exposed here.
  //
  // Fallback: if the subscription fails or Realtime isn't enabled, the
  // polling effect below takes over automatically.
  // -----------------------------------------------------------------------
  useEffect(() => {
    // Wait for the first successful load before subscribing.
    if (!order) return;
    // Keep watching until payment is confirmed (or the order is cancelled),
    // because the review redirect is gated on payment_status = 'paid',
    // which the hotel sets AFTER the order reaches 'completed'.
    if (!needsPaymentWatch(order)) return;
    // Supabase env vars might not be present in local dev without .env.local.
    if (!isSupabaseConfigured()) return;

    const ordersOrderId = order.id; // stable for this effect instance
    let dead = false;

    let channel: ReturnType<typeof supabaseClient.channel> | null = null;
    try {
      channel = supabaseClient
        .channel(`order-rt-${ordersOrderId}`)
        .on(
          // eslint-disable-next-line @typescript-eslint/no-explicit-any
          'postgres_changes' as any,
          {
            event:  'UPDATE',
            schema: 'public',
            table:  'orders',
            filter: `id=eq.${ordersOrderId}`,
          },
          () => {
            if (!dead) loadOrder(true);
          }
        )
        .subscribe((status: string) => {
          if (!dead) setRealtimeOk(status === 'SUBSCRIBED');
        });
    } catch {
      // Realtime not available â€” polling fallback handles it.
    }

    return () => {
      dead = true;
      if (channel) supabaseClient.removeChannel(channel).catch(() => {});
      setRealtimeOk(false);
    };
  // Re-subscribe only when the tracked order id or terminal status changes.
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [order?.id, order?.status]);

  // -----------------------------------------------------------------------
  // Polling fallback (and safety-net when Realtime is active)
  //
  // â€¢ Every poll fetches the current order status every 5 s
  // â€¢ Uses recursive setTimeout (not setInterval) so a previous in-flight
  //   fetch always completes before the next poll starts â€” no overlapping
  //   API requests.
  // â€¢ Terminal order â†’ stop polling
  // -----------------------------------------------------------------------
  useEffect(() => {
    if (!order) return;
    if (!needsPaymentWatch(order)) return;

    const POLL_MS = 5_000;
    let dead = false;

    const tick = async () => {
      if (dead) return;
      await loadOrder(true);
      if (!dead && needsPaymentWatch(orderRef.current)) {
        setTimeout(tick, POLL_MS);
      }
    };

    const timer = setTimeout(tick, POLL_MS);
    return () => {
      dead = true;
      clearTimeout(timer);
    };
  }, [order?.status, order?.payment_status, loadOrder]);

  // -----------------------------------------------------------------------
  // Auto-redirect to Google Review URL once payment is marked PAID
  //
  // â€¢ Triggered ONLY when payment_status becomes 'paid' (staff marks it).
  // â€¢ Only once per order (sessionStorage guard survives refresh)
  // â€¢ If paid but URL is missing from current payload (stale initial data),
  //   force one authoritative refresh from /api/public/orders/[id] before
  //   showing NOT CONFIGURED. Never fabricate a URL.
  // â€¢ Redirect happens on the guest's device via real-time / polling
  // -----------------------------------------------------------------------
  useEffect(() => {
    if (!order) return;
    const paymentStatus = (order.payment_status || '').trim().toLowerCase();
    if (paymentStatus !== 'paid') return;
    if (paymentRedirectTriggeredRef.current) return;

    let cancelled = false;
    const reviewUrl = (order as any).google_review_url as string | null | undefined;

    const doRedirect = (url: string) => {
      if (cancelled || paymentRedirectTriggeredRef.current) return;
      const sessionKey = `dpx_payment_review_redirect_${order.id}`;
      if (typeof sessionStorage !== 'undefined' && sessionStorage.getItem(sessionKey)) return;
      paymentRedirectTriggeredRef.current = true;
      if (typeof sessionStorage !== 'undefined') sessionStorage.setItem(sessionKey, '1');
      setPaymentReviewMessage(null);
      setTimeout(() => {
        try { window.location.href = url; } catch {}
      }, 1500);
    };

    if (typeof reviewUrl === 'string' && reviewUrl.trim()) {
      doRedirect(reviewUrl);
      return () => { cancelled = true; };
    }

    // Paid but URL missing: refresh once from authoritative public API.
    (async () => {
      try {
        const res = await fetch(`/api/public/orders/${encodeURIComponent(orderId)}`, { cache: 'no-store' });
        const json = await res.json().catch(() => ({}));
        if (cancelled) return;
        if (res.ok && json?.success && json?.order) {
          setOrder(json.order as LiveOrder);
          const fresh = (json.order as any).google_review_url;
          if (typeof fresh === 'string' && fresh.trim()) {
            doRedirect(fresh);
            return;
          }
        }
      } catch {}
      if (!cancelled) {
        setPaymentReviewMessage('Payment confirmed. A Google Review link has not been configured for this hotel.');
      }
    })();

    return () => { cancelled = true; };
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [order?.id, order?.payment_status, order?.google_review_url, orderId]);

   // -----------------------------------------------------------------------
  // Derived display values
  // -----------------------------------------------------------------------
  const placedAt = order?.created_at ?? null;
  const status = (order?.status || '').trim().toLowerCase();
  const water = isWaterOrderLive(order);
  const stages = stagesForOrder(order);
  const stageIndex = statusToStageIndex(status, water);
  const isCancelled = status === 'cancelled';

  // Combined bill total across this order and any linked orders (e.g. water)
  const combinedBillTotal = order?.combined_bill_total ?? order?.total_amount ?? 0;
  const waterCharges = order?.water_charges ?? 0;

  // Food items only — water products are displayed in the separate Water Order card
  const foodItems = order?.items || [];

  function statusBadgeKey(status: string): string {
    switch ((status || '').trim().toLowerCase()) {
      case 'pending':
      case 'placed':
        return 'placed';
      case 'accepted':
        return 'accepted';
      case 'preparing':
        return 'preparing';
      case 'ready':
        return 'ready';
      case 'completed':
      case 'delivered':
        return 'completed';
      case 'cancelled':
        return 'cancelled';
      default:
        return 'placed';
    }
  }

  const statusBadge = statusBadgeKey(status);

  // Monospace numeric stack reused from the hotel dashboard so figures line up.
  const NUMBER_FONT = 'ui-monospace, SFMono-Regular, Menlo, monospace';

  const addDishHref = order && !loading
    ? `/menu/${order.hotel_slug || hotelSlug}?addToOrder=${encodeURIComponent(order.id)}&orderNumber=${encodeURIComponent(order.order_number)}${order.table_number ? `&table=${encodeURIComponent(order.table_number)}` : ''}`
    : '#';

  return (
    <div
      className={`min-h-screen ${menuThemeClass(order?.hotel_theme || order?.menu_theme || undefined)}`}
      style={{
        background: 'var(--bg-primary)',
        color: 'var(--text-primary)',
        fontFamily: 'var(--font-body)',
        ...(((order?.hotel_theme === 'custom' || order?.menu_theme === 'custom') && order?.hotel_custom_theme_config)
          ? (customThemeToCssVars(cloneCustomThemeConfig(order.hotel_custom_theme_config) as CustomThemeConfig) as React.CSSProperties)
          : {}),
      }}
    >
      {((order?.hotel_theme === 'custom' || order?.menu_theme === 'custom') && order?.hotel_custom_theme_config) ? (
        <CustomThemeFontLoader fonts={[
          cloneCustomThemeConfig(order.hotel_custom_theme_config).headingFont,
          cloneCustomThemeConfig(order.hotel_custom_theme_config).bodyFont,
          cloneCustomThemeConfig(order.hotel_custom_theme_config).priceFont,
        ]} />
      ) : null}
      <header
        className="sticky top-0 z-30"
        style={{
          background: 'var(--bg-surface)',
          borderBottom: '1px solid var(--border-subtle)',
          backdropFilter: 'blur(16px)',
          WebkitBackdropFilter: 'blur(16px)',
        }}
      >
        <div
          className="mx-auto px-4 flex items-center justify-between gap-3"
          style={{ maxWidth: 'var(--d3-container-max)', height: '3.5rem' }}
        >
          <div className="flex items-center gap-3 min-w-0">
            {backHref !== '/' ? (
              <Link
                href={backHref}
                aria-label="Back to menu"
                style={{
                  width: 32,
                  height: 32,
                  borderRadius: 'var(--d3-btn-radius)',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  background: 'var(--bg-surface-2)',
                  border: '1px solid var(--border-subtle)',
                  color: 'var(--text-muted)',
                  flexShrink: 0,
                }}
              >
                <svg width="14" height="14" viewBox="0 0 14 14" fill="none">
                  <path d="M9 2L4 7L9 12" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
                </svg>
              </Link>
            ) : null}
            <Dine3DLogo size="xs" href="/" priority />
            <div className="min-w-0">
              <h1
                style={{
                  fontFamily: 'var(--font-display)',
                  fontSize: '1rem',
                  fontWeight: 500,
                  color: 'var(--text-primary)',
                  letterSpacing: '-0.01em',
                  lineHeight: 1.2,
                  overflow: 'hidden',
                  textOverflow: 'ellipsis',
                  whiteSpace: 'nowrap',
                  margin: 0,
                }}
              >
                Your Order
              </h1>
              <p style={{ fontSize: '0.625rem', color: 'var(--text-dimmed)', margin: 0 }}>
                {order?.order_number ? `Ref #${order.order_number}` : 'Order status'}
                {order?.table_number ? ` Â· Table ${order.table_number}` : ''}
              </p>
            </div>
          </div>

          {!loading && order ? (
            <div className="flex items-center gap-2 flex-shrink-0">
              <button
                type="button"
                onClick={() => setShowCallWaiter(true)}
                className="d3-btn-secondary"
                style={{
                  padding: '0.4375rem 0.625rem',
                  fontSize: '0.6875rem',
                  display: 'inline-flex',
                  alignItems: 'center',
                  gap: 4,
                  borderRadius: 'var(--d3-btn-radius)',
                  background: 'var(--bg-surface-2)',
                  border: '1px solid var(--border-warm)',
                  color: 'var(--gold)',
                  cursor: 'pointer',
                }}
              >
                <span>🔔</span>
                <span className="hidden sm:inline">Call Waiter</span>
              </button>
              <Link
                href={addDishHref}
                className="d3-btn-primary"
                style={{ padding: '0.4375rem 0.75rem', fontSize: '0.6875rem', flexShrink: 0 }}
              >
                Add Dish
              </Link>
            </div>
          ) : (
            <span style={{ width: 72, height: 32 }} />
          )}
        </div>
      </header>

      <main
        className="mx-auto px-4 py-4 pb-10"
        style={{ maxWidth: 'var(--d3-container-max)' }}
      >
        {loading ? (
          <div
            style={{
              ...PANEL,
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              gap: 10,
              padding: '2rem 1rem',
            }}
          >
            <svg width="20" height="20" viewBox="0 0 24 24" fill="none" style={{ animation: 'spin 1s linear infinite' }}>
              <circle cx="12" cy="12" r="10" stroke="var(--gold)" strokeOpacity="0.2" strokeWidth="1.5" />
              <path d="M12 2A10 10 0 0 1 22 12" stroke="var(--gold)" strokeWidth="1.5" strokeLinecap="round" />
            </svg>
            <p style={{ margin: 0, fontSize: '0.8125rem', color: 'var(--text-muted)' }}>Loading your orderâ€¦</p>
          </div>
        ) : order ? (
          <div style={PANEL}>
            <div style={{ padding: '1rem 1rem 0.875rem', display: 'flex', flexDirection: 'column', gap: '0.625rem' }}>
              <div style={{ display: 'flex', alignItems: 'baseline', gap: 8, flexWrap: 'wrap' }}>
                <p style={{ margin: 0, color: 'var(--text-muted)', fontSize: '0.75rem', letterSpacing: '0.02em' }}>
                  Ref{' '}
                  <span style={{ fontFamily: NUMBER_FONT, fontWeight: 600, color: 'var(--gold)', fontVariantNumeric: 'tabular-nums' }}>
                    #{order.order_number}
                  </span>
                </p>
                {placedAt && (
                  <p style={{ margin: 0, color: 'var(--text-dimmed)', fontSize: '0.6875rem', fontFamily: NUMBER_FONT, fontVariantNumeric: 'tabular-nums' }}>
                    {formatDateTime(placedAt)}
                  </p>
                )}
              </div>

              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 8, flexWrap: 'wrap' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: 6, flexWrap: 'wrap' }}>
                  <span
                    className={`d3-chip d3-status-${statusBadge}`}
                    style={{ borderColor: 'var(--border-light)' }}
                  >
                    {status.charAt(0).toUpperCase() + status.slice(1)}
                  </span>

                  {!isCancelled && !isTerminal(status) && (
                    <span className="d3-chip" style={{ color: 'var(--text-muted)' }}>
                      <span className="d3-live-dot" style={{ width: 4, height: 4 }} />
                      {realtimeOk ? 'Live updates' : 'Auto-refresh'}
                    </span>
                  )}
                </div>

                {!isCancelled && (status === 'pending' || status === 'accepted') && (
                  <button
                    type="button"
                    onClick={() => setShowCancelDialog(true)}
                    disabled={cancelling}
                    className="d3-btn-inline d3-btn-danger"
                    style={{ opacity: cancelling ? 0.6 : 1, minHeight: 32 }}
                  >
                    {cancelling ? 'Cancellingâ€¦' : 'Cancel Order'}
                  </button>
                )}
              </div>

              <Link
                href={addDishHref}
                className="d3-btn-primary"
                style={{
                  display: 'inline-flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  gap: '0.5rem',
                  padding: '0.625rem 1rem',
                  fontSize: '0.8125rem',
                  width: '100%',
                }}
              >
                <svg width="16" height="16" viewBox="0 0 16 16" fill="none">
                  <path d="M8 3v10M3 8h10" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
                </svg>
                Add Another Dish
              </Link>
            </div>
          </div>
        ) : null}

        {error ? (
          <div style={{ ...PANEL, padding: '1.5rem', textAlign: 'center' }}>
            <p style={{ margin: 0, fontSize: '0.875rem', color: 'var(--text-muted)', lineHeight: 1.7 }}>{error}</p>
          </div>
        ) : order ? (
          <>
            {isCancelled && (
              <div style={{ ...PANEL, padding: '1rem', textAlign: 'center', borderColor: 'var(--border-light)' }}>
                <p style={{ margin: 0, fontSize: '0.75rem', color: 'var(--text-secondary)', letterSpacing: '0.08em', textTransform: 'uppercase', fontWeight: 600 }}>
                  This order was cancelled
                </p>
                {order.cancellation_reason && (
                  <p style={{ margin: '0.5rem 0 0', fontSize: '0.75rem', color: 'var(--text-muted)', lineHeight: 1.5 }}>
                    Reason: {order.cancellation_reason}
                  </p>
                )}
                {order.cancelled_by === 'customer' && !(order as any).cancellation_source && (
                  <p style={{ margin: '0.25rem 0 0', fontSize: '0.6875rem', color: 'var(--text-dimmed)', lineHeight: 1.5, textTransform: 'uppercase', letterSpacing: '0.08em' }}>
                    Cancelled by you
                  </p>
                )}
              </div>
            )}

            {!isCancelled && (
              <div style={PANEL}>
                <div style={{ padding: '0.875rem 0.875rem 0.5rem' }}>
                  <p style={SECTION_TITLE}>Order Progress</p>
                </div>
                <div style={{ padding: '0.25rem 0.875rem 0.875rem', display: 'flex', flexDirection: 'column', gap: '0.55rem' }}>
                  {stages.map((stage, idx) => {
                    const reached = idx <= stageIndex;
                    const isCurrent = idx === stageIndex;
                    const isLast = idx === stages.length - 1;
                    return (
                      <div key={stage.key} style={{ display: 'flex', alignItems: 'flex-start', gap: 10 }}>
                        <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', flexShrink: 0, paddingTop: 2 }}>
                          <div
                            style={{
                              width: 28,
                              height: 28,
                              borderRadius: 'var(--d3-input-radius)',
                              flexShrink: 0,
                              display: 'flex',
                              alignItems: 'center',
                              justifyContent: 'center',
                              background: reached ? 'var(--bg-surface-2)' : 'var(--bg-surface)',
                              border: reached ? '1px solid var(--border-light)' : '1px solid var(--border-warm)',
                              color: reached ? 'var(--gold)' : 'var(--text-dimmed)',
                              transition: 'all 250ms ease',
                            }}
                          >
                            {reached ? (
                              <svg width="14" height="14" viewBox="0 0 16 16" fill="none">
                                <path d="M3 8.5L6.5 12L13 4.5" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
                              </svg>
                            ) : (
                              <svg width="8" height="8" viewBox="0 0 10 10" fill="none">
                                <circle cx="5" cy="5" r="2" fill="currentColor" />
                              </svg>
                            )}
                          </div>
                          {!isLast && (
                            <div style={{ width: 1, height: 9, marginTop: 2, background: idx < stageIndex ? 'var(--border-light)' : 'var(--border-warm)', borderRadius: 2, flexShrink: 0 }} />
                          )}
                        </div>
                        <div style={{ flex: 1, minWidth: 0 }}>
                          <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
                            <h3 style={{ fontFamily: 'var(--font-display)', fontSize: '0.875rem', fontWeight: 500, color: isCurrent ? 'var(--gold)' : reached ? 'var(--text-primary)' : 'var(--text-dimmed)', letterSpacing: '-0.01em', lineHeight: 1.25, margin: 0 }}>
                              {stage.title}
                            </h3>
                            {isCurrent && <span className="d3-chip" style={{ fontSize: '0.5rem', padding: '0.125rem 0.4rem' }}>Current</span>}
                          </div>
                          <p style={{ fontSize: '0.7rem', color: reached ? 'var(--text-muted)' : 'var(--text-dimmed)', margin: '2px 0 0', lineHeight: 1.4 }}>
                            {stage.desc}
                          </p>
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>
            )}

            <div style={PANEL}>
              <div style={{ padding: '0.875rem 0.875rem 0.5rem', display: 'flex', alignItems: 'baseline', gap: 8, justifyContent: 'space-between' }}>
                <p style={SECTION_TITLE}>Items</p>
              </div>
              <div style={{ padding: '0 0.875rem 0.5rem', display: 'flex', flexDirection: 'column', gap: 0 }}>
                {foodItems.length === 0 ? (
                  <p style={{ margin: 0, padding: '0.875rem 0', fontSize: '0.75rem', color: 'var(--text-dimmed)' }}>No items recorded</p>
                ) : (
                  foodItems.map((item, i) => {
                    const cancelled = (item.status || '').toLowerCase() === 'cancelled';
                    const canCancel = !cancelled && !isTerminal(status) && (status === 'pending' || status === 'accepted');
                    const canEditQty = !cancelled && !isTerminal(status) && (status === 'pending' || status === 'accepted');
                    const unitPrice = Number(item.price_at_time);
                    const lineTotal = unitPrice * item.quantity;
                    const last = i === foodItems.length - 1;
                    return (
                      <div key={item.id} style={{ padding: '0.625rem 0', borderBottom: last ? 'none' : '1px solid var(--border-subtle)' }}>
                        <div style={{ display: 'grid', gridTemplateColumns: 'minmax(0,1fr) auto', gap: '0.5rem', alignItems: 'start' }}>
                          <div style={{ minWidth: 0, display: 'flex', flexDirection: 'column', gap: 2 }}>
                            <span style={{ fontSize: '0.8125rem', color: cancelled ? 'var(--text-dimmed)' : 'var(--text-primary)', lineHeight: 1.3, textDecoration: cancelled ? 'line-through' : 'none', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis', maxWidth: '100%', display: 'inline-flex', alignItems: 'center' }}>
                              <span style={{ overflow: 'hidden', textOverflow: 'ellipsis' }}>{item.name || 'Item'}</span>
                            </span>
                            <span style={{ fontSize: '0.6875rem', color: 'var(--text-dimmed)', fontFamily: NUMBER_FONT, fontVariantNumeric: 'tabular-nums', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis', maxWidth: '100%', lineHeight: 1.4 }}>
                              Unit price: {formatPrice(unitPrice, order?.currency)} each
                            </span>
                            {cancelled && <span className="d3-chip d3-btn-danger" style={{ width: 'fit-content', marginTop: 2 }}>Cancelled</span>}
                          </div>
                          <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'flex-end', gap: 6, flexShrink: 0, whiteSpace: 'nowrap' }}>
                            <span className="d3-price" style={{ fontSize: '0.875rem', color: 'var(--gold)', fontWeight: 600, fontFamily: NUMBER_FONT, fontVariantNumeric: 'tabular-nums', whiteSpace: 'nowrap', textAlign: 'right' }}>
                              {formatPrice(lineTotal, order?.currency)}
                            </span>
                            <div style={{ display: 'flex', alignItems: 'center', gap: 6, flexShrink: 0, flexWrap: 'wrap', justifyContent: 'flex-end' }}>
                              {canEditQty ? (
                                <div style={{ display: 'flex', alignItems: 'center', gap: 4 }}>
                                  <button
                                    type="button"
                                    onClick={() => handleUpdateItemQuantity(item.id, Math.max(1, (item.quantity || 1) - 1))}
                                    disabled={itemQtyUpdating === item.id}
                                    className="d3-btn-subtle"
                                    style={{ width: 32, height: 32, padding: 0, borderRadius: 'var(--d3-input-radius)' }}
                                  >
                                    âˆ’
                                  </button>
                                  <span style={{ fontSize: '0.8125rem', minWidth: 18, textAlign: 'center', fontFamily: NUMBER_FONT, fontVariantNumeric: 'tabular-nums' }}>{item.quantity}</span>
                                  <button
                                    type="button"
                                    onClick={() => handleUpdateItemQuantity(item.id, (item.quantity || 1) + 1)}
                                    disabled={itemQtyUpdating === item.id}
                                    className="d3-btn-subtle"
                                    style={{ width: 32, height: 32, padding: 0, borderRadius: 'var(--d3-input-radius)' }}
                                  >
                                    +
                                  </button>
                                </div>
                              ) : null}
                              {canCancel && (
                                <button
                                  type="button"
                                  onClick={() => setShowItemCancelDialog(item.id)}
                                  disabled={itemCancelling === item.id}
                                  className="d3-btn-inline d3-btn-danger"
                                  style={{ minHeight: 32 }}
                                >
                                  {itemCancelling === item.id ? 'â€¦' : 'Cancel Item'}
                                </button>
                              )}
                            </div>
                          </div>
                        </div>
                        {showItemCancelDialog === item.id && (
                          <div style={{ position: 'fixed', inset: 0, zIndex: 50, display: 'flex', alignItems: 'center', justifyContent: 'center', background: 'rgba(0,0,0,0.55)', padding: '1rem' }}>
                            <div style={{ background: 'var(--bg-surface)', border: '1px solid var(--border-warm)', borderRadius: 'var(--d3-modal-radius)', padding: '1.25rem', maxWidth: 320, width: '100%', boxShadow: 'var(--d3-shadow-elevated)' }}>
                              <p style={{ margin: '0 0 1rem', fontSize: '0.9rem', color: 'var(--text-primary)' }}>Cancel this dish?</p>
                              <div style={{ display: 'flex', gap: 8 }}>
                                <button onClick={() => setShowItemCancelDialog(null)} className="d3-btn-subtle" style={{ flex: 1 }}>No</button>
                                <button onClick={() => handleCancelItem(item.id)} className="d3-btn-primary d3-btn-danger" style={{ flex: 1 }}>Yes, cancel</button>
                              </div>
                            </div>
                          </div>
                        )}
                      </div>
                    );
                  })
                )}
              </div>
            </div>

            <div style={PANEL}>
              <div style={{ padding: '0.875rem 0.875rem 0.5rem' }}>
                <p style={SECTION_TITLE}>Order Summary</p>
              </div>
              <div style={{ padding: '0 0.875rem 0.875rem', display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
                <div style={{ display: 'flex', alignItems: 'baseline', justifyContent: 'space-between', gap: 8 }}>
                  <span style={{ fontSize: '0.6875rem', letterSpacing: '0.12em', textTransform: 'uppercase', color: 'var(--text-dimmed)', fontWeight: 500 }}>Order Total</span>
                  <span className="d3-price" style={{ fontFamily: NUMBER_FONT, fontVariantNumeric: 'tabular-nums', fontSize: '1.375rem', color: 'var(--gold)', fontWeight: 600 }}>
                    {formatPrice(combinedBillTotal, order?.currency)}
                  </span>
                </div>
                {waterCharges > 0 && (
                  <div style={{ display: 'flex', alignItems: 'baseline', justifyContent: 'space-between', gap: 8, fontSize: '0.75rem' }}>
                    <span style={{ color: 'var(--text-dimmed)' }}>Water Charges Included</span>
                    <span style={{ color: 'var(--gold)', fontWeight: 600 }}>{formatPrice(waterCharges, order?.currency)}</span>
                  </div>
                )}
                <div style={{ display: 'flex', flexDirection: 'column', gap: '0.375rem' }}>
                  {order.payment_method && order.payment_method !== 'pay_at_table' && (
                    <div style={{ display: 'flex', alignItems: 'baseline', justifyContent: 'space-between', gap: 8, fontSize: '0.75rem' }}>
                      <span style={{ color: 'var(--text-dimmed)' }}>Payment</span>
                      <span style={{ color: 'var(--text-secondary)', textTransform: 'capitalize' }}>{order.payment_method}</span>
                    </div>
                  )}
                  <div style={{ display: 'flex', alignItems: 'baseline', justifyContent: 'space-between', gap: 8, fontSize: '0.75rem' }}>
                    <span style={{ color: 'var(--text-dimmed)' }}>Payment Status</span>
                    <span style={{
                      color: (order.payment_status === 'paid' || (order.remaining_balance !== undefined && order.remaining_balance !== null && order.remaining_balance <= 0))
                        ? '#34D399'
                        : ((order.amount_paid || 0) > 0 || order.payment_status === 'partially_paid')
                        ? '#F59E0B'
                        : 'var(--text-secondary)',
                      fontWeight: 600,
                      textTransform: 'capitalize',
                    }}>
                      {(order.payment_status === 'paid' || (order.remaining_balance !== undefined && order.remaining_balance !== null && order.remaining_balance <= 0))
                        ? 'Paid ✓'
                        : ((order.amount_paid || 0) > 0 || order.payment_status === 'partially_paid')
                        ? `Partially Paid (${formatPrice(order.amount_paid || 0, order?.currency)} paid)`
                        : 'Unpaid'}
                    </span>
                  </div>
                  {((order.amount_paid || 0) > 0 && order.payment_status !== 'paid') && (
                    <div style={{ display: 'flex', alignItems: 'baseline', justifyContent: 'space-between', gap: 8, fontSize: '0.75rem' }}>
                      <span style={{ color: 'var(--text-dimmed)' }}>Remaining Balance</span>
                      <span style={{ color: 'var(--gold)', fontWeight: 600 }}>
                        {formatPrice(order.remaining_balance ?? Math.max(0, combinedBillTotal - (order.amount_paid || 0)), order?.currency)}
                      </span>
                    </div>
                  )}
                  {order.table_number && (
                    <div style={{ display: 'flex', alignItems: 'baseline', justifyContent: 'space-between', gap: 8, fontSize: '0.75rem' }}>
                      <span style={{ color: 'var(--text-dimmed)' }}>Table</span>
                      <span style={{ color: 'var(--text-secondary)', fontFamily: NUMBER_FONT, fontVariantNumeric: 'tabular-nums' }}>{order.table_number}</span>
                    </div>
                  )}
                  {order.customer_name && (
                    <div style={{ display: 'flex', alignItems: 'baseline', justifyContent: 'space-between', gap: 8, fontSize: '0.75rem' }}>
                      <span style={{ color: 'var(--text-dimmed)' }}>Customer</span>
                      <span style={{ color: 'var(--text-secondary)' }}>{order.customer_name}</span>
                    </div>
                  )}
                  {(() => {
                    const note = cleanWaterNotes(order.notes);
                    if (!note || water) return null;
                    return (
                      <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)', lineHeight: 1.5, marginTop: 2 }}>
                        <span style={{ color: 'var(--text-dimmed)' }}>Note: </span>{note}
                      </div>
                    );
                  })()}
                </div>
                <div style={{ marginTop: '0.75rem', paddingTop: '0.75rem', borderTop: '1px solid var(--border-subtle)', display: 'flex', gap: '0.5rem' }}>
                  <button
                    type="button"
                    onClick={() => setShowSplitBill(true)}
                    className="d3-btn-primary"
                    style={{
                      flex: 1,
                      justifyContent: 'center',
                      padding: '0.625rem 0.875rem',
                      fontSize: '0.8125rem',
                      borderRadius: 'var(--d3-btn-radius)',
                      display: 'flex',
                      alignItems: 'center',
                      gap: 6,
                    }}
                  >
                    <span>💳</span>
                    <span>{order.payment_status === 'paid' ? 'View Bill & Receipts' : 'Split Bill & Pay'}</span>
                  </button>
                  <button
                    type="button"
                    onClick={() => setShowCallWaiter(true)}
                    className="d3-btn-secondary"
                    style={{
                      padding: '0.625rem 0.875rem',
                      fontSize: '0.8125rem',
                      borderRadius: 'var(--d3-btn-radius)',
                      background: 'var(--bg-surface-2)',
                      border: '1px solid var(--border-light)',
                      color: 'var(--text-primary)',
                      cursor: 'pointer',
                      display: 'flex',
                      alignItems: 'center',
                      gap: 6,
                    }}
                  >
                    <span>🔔</span>
                    <span>Call Waiter</span>
                  </button>
                </div>
              </div>
            </div>

            {itemQtyError && <div className="d3-note d3-note-danger" style={{ marginBottom: '1rem' }}>{itemQtyError}</div>}
            {paymentReviewMessage && <div className="d3-note d3-note-accent" style={{ marginBottom: '1rem' }}>{paymentReviewMessage}</div>}
            {cancelError && <div className="d3-note d3-note-danger" style={{ marginBottom: '1rem' }}>{cancelError}</div>}
            {cancelSuccess && <div className="d3-note d3-note-accent" style={{ marginBottom: '1rem' }}>{cancelSuccess}</div>}

            {showCancelDialog && (
              <div
                style={{
                  position: 'fixed',
                  inset: 0,
                  zIndex: 50,
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  background: 'rgba(0,0,0,0.55)',
                  overflowX: 'hidden',
                  overflowY: 'auto',
                  padding: '1rem',
                }}
              >
                <div
                  style={{
                    boxSizing: 'border-box',
                    background: 'var(--bg-surface)',
                    border: '1px solid var(--border-warm)',
                    borderRadius: 'var(--d3-modal-radius)',
                    padding: '1.25rem',
                    maxWidth: 340,
                    width: '100%',
                    color: 'var(--text-primary)',
                    maxHeight: 'min(90vh, 520px)',
                    overflowY: 'auto',
                    overflowX: 'hidden',
                    boxShadow: 'var(--d3-shadow-elevated)',
                  }}
                >
                  <h3 style={{ margin: '0 0 0.5rem', fontFamily: 'var(--font-display)', fontSize: '1.25rem', fontWeight: 500, color: 'var(--text-primary)' }}>
                    Why cancel this order?
                  </h3>
                  <p style={{ margin: '0 0 1rem', fontSize: '0.8125rem', color: 'var(--text-muted)', lineHeight: 1.6 }}>
                    Select one reason. Your choice helps the restaurant improve.
                  </p>
                  <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
                    {CANCELLATION_REASONS.map((reason) => (
                      <button
                        key={reason}
                        type="button"
                        onClick={() => {
                          setCancellationReason(reason);
                          if (reason !== 'Other') setOtherReason('');
                        }}
                        disabled={cancelling}
                        style={{
                          boxSizing: 'border-box',
                          width: '100%',
                          display: 'flex',
                          alignItems: 'center',
                          justifyContent: 'space-between',
                          padding: '0.75rem 1rem',
                          borderRadius: 'var(--d3-input-radius)',
                          fontSize: '0.875rem',
                          border: `1px solid ${cancellationReason === reason ? 'var(--border-medium)' : 'var(--border-warm)'}`,
                          background: cancellationReason === reason ? 'var(--bg-surface-2)' : 'var(--bg-surface)',
                          color: 'var(--text-primary)',
                          cursor: cancelling ? 'not-allowed' : 'pointer',
                        }}
                      >
                        <span>{reason}</span>
                        {cancellationReason === reason && <span style={{ color: 'var(--gold)' }}>â—</span>}
                      </button>
                    ))}
                    {cancellationReason === 'Other' && (
                      <div style={{ marginTop: '0.25rem' }}>
                        <label className="d3-label">Please tell us more</label>
                        <textarea
                          value={otherReason}
                          onChange={(e) => setOtherReason(e.target.value)}
                          placeholder="e.g. I found a better option nearby"
                          rows={3}
                          className="d3-input"
                          style={{ resize: 'vertical' }}
                        />
                      </div>
                    )}
                  </div>
                  <div style={{ marginTop: '1rem', display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
                    <button type="button" onClick={() => setShowCancelDialog(false)} className="d3-btn-subtle" style={{ width: '100%' }}>
                      Keep Order
                    </button>
                    <button
                      type="button"
                      onClick={() => {
                        const reason = cancellationReason === 'Other' ? (otherReason.trim() || 'Other') : (cancellationReason || '');
                        if (!reason) {
                          setCancelError('Please select a reason.');
                          return;
                        }
                        handleCancelOrder(reason);
                      }}
                      disabled={cancelling || !cancellationReason}
                      className="d3-btn-primary d3-btn-danger"
                      style={{ width: '100%', opacity: !cancellationReason || cancelling ? 0.6 : 1 }}
                    >
                      {cancelling ? 'Cancellingâ€¦' : 'Confirm Cancellation'}
                    </button>
                  </div>
                </div>
              </div>
            )}

            {showSplitBill && (
              <SplitBillModal
                orderId={order.id}
                orderNumber={order.order_number}
                totalAmount={combinedBillTotal}
                currency={order?.currency}
                items={foodItems}
                isOpen={showSplitBill}
                onClose={() => setShowSplitBill(false)}
                onPaymentSuccess={async () => {
                  await loadOrder(true);
                }}
              />
            )}

            {showCallWaiter && (
              <ServiceRequestModal
                hotelId={order.hotel_id || (order as any).hotels?.id || ''}
                tableNumber={order.table_number || 'Takeaway'}
                isOpen={showCallWaiter}
                onClose={() => setShowCallWaiter(false)}
              />
            )}

            <div style={{ padding: '0.25rem 0 0.5rem', textAlign: 'center' }}>
              <Link href={backHref} className="d3-btn-text" style={{ fontSize: '0.8125rem', fontWeight: 500 }}>
                <svg width="12" height="12" viewBox="0 0 12 12" fill="none" style={{ marginRight: 4 }}>
                  <path d="M10 2L2 6L10 10" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
                </svg>
                Back to Menu
              </Link>
            </div>
          </>
        ) : null}
      </main>

      <style>{`
        @keyframes ot-pulse { 0%,100%{opacity:1} 50%{opacity:0.4} }
      `}</style>
    </div>
  );
}

export default function OrderTracking({ orderId, hotelSlug }: { orderId: string; hotelSlug?: string }) {
  return (
    <Suspense
      fallback={
        <div className="min-h-screen flex items-center justify-center" style={{ background: 'var(--bg-primary)' }}>
          <div style={{ width: 40, height: 40, borderRadius: '50%', border: '2px solid var(--border-light)', borderTop: '2px solid var(--gold)', animation: 'spin 1s linear infinite' }} />
        </div>
      }
    >
      <OrderTrackingInner orderId={orderId} hotelSlug={hotelSlug} />
    </Suspense>
  );
}

