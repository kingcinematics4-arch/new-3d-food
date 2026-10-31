'use client';

export const dynamic = 'force-dynamic';

import React, { useState, useCallback } from 'react';
import { useHotel, useOrders, Order } from '@/lib/useHotel';
import { formatPrice } from '@/lib/menu';

/* The statuses the app actually stores (see app/api/orders/update-status).
   They are written lowercase, so every comparison here normalises case rather
   than assuming one. */

const normalise = (status: string) => (status || '').trim().toLowerCase();

/* Customer-facing labels that match the 5-stage tracker shown to diners. */
const STATUS_LABEL: Record<string, string> = {
  pending:   'Order Placed',
  placed:    'Order Placed',
  accepted:  'Accepted',
  preparing: 'Preparing',
  ready:     'Ready',
  completed: 'Completed',
  cancelled: 'Cancelled',
};

/* Statuses read as one monochrome family — only the newest
   order carries the champagne accent. */
const STATUS_CLASS: Record<string, string> = {
  placed:    'd3-status-placed',
  pending:   'd3-status-placed',
  accepted:  'd3-status-accepted',
  preparing: 'd3-status-preparing',
  ready:     'd3-status-ready',
  completed: 'd3-status-completed',
  cancelled: 'd3-status-cancelled',
};

function CancellationSourceLabel({ cancellationSource, cancelledBy, order }: { cancellationSource?: string | null; cancelledBy?: string | null; order?: any }) {
  const source = (
    cancellationSource || 
    cancelledBy || 
    order?.cancellation_source || 
    order?.cancellationSource || 
    order?.cancelled_by_source ||
    order?.canceled_by ||
    ''
  ).toString().toLowerCase().trim();
  if (source === 'hotel' || source === 'restaurant') {
    return (
      <span
        title="Hotel/Restaurant"
        style={{
          display: 'inline-flex',
          alignItems: 'center',
          padding: '0.125rem 0.375rem',
          borderRadius: 4,
          background: 'rgba(196,102,88,0.08)',
          border: '1px solid rgba(196,102,88,0.25)',
          color: '#D9A79E',
          fontSize: '0.5625rem',
          fontWeight: 600,
          letterSpacing: '0.08em',
          textTransform: 'uppercase',
          whiteSpace: 'nowrap',
        }}
      >
        HOTEL
      </span>
    );
  } else if (source === 'customer') {
    return (
      <span
        title="Customer"
        style={{
          display: 'inline-flex',
          alignItems: 'center',
          padding: '0.125rem 0.375rem',
          borderRadius: 4,
          background: 'rgba(196,102,88,0.06)',
          border: '1px solid rgba(196,102,88,0.2)',
          color: '#C46658',
          fontSize: '0.5625rem',
          fontWeight: 600,
          letterSpacing: '0.08em',
          textTransform: 'uppercase',
          whiteSpace: 'nowrap',
        }}
      >
        CUSTOMER
      </span>
    );
  }
  return null;
}

function StatusBadge({ status, cancellationSource, cancelledBy, order }: { status: string; cancellationSource?: string | null; cancelledBy?: string | null; order?: any }) {
  const key = normalise(status);
  const isCancelled = key === 'cancelled';
  const source = (
    cancellationSource || 
    cancelledBy || 
    order?.cancellationSource || 
    order?.cancelled_by_source ||
    ''
  ).toLowerCase().trim();
  
  return (
    <span style={{ display: 'inline-flex', alignItems: 'center', gap: 6, flexWrap: 'wrap' }}>
      <span className={`d3-badge ${STATUS_CLASS[key] || STATUS_CLASS.cancelled}`}>
        {STATUS_LABEL[key] || key || 'unknown'}
      </span>
      {isCancelled && (
        source === 'hotel' || source === 'restaurant' ? (
          <span
            title="Cancelled by Hotel"
            aria-label="Cancelled by Hotel"
            style={{
              display: 'inline-flex',
              alignItems: 'center',
              justifyContent: 'center',
              width: 16,
              height: 16,
              color: '#C46658',
              flexShrink: 0,
            }}
          >
            <svg width="12" height="12" viewBox="0 0 12 12" fill="none" aria-hidden="true">
              <path d="M6 2L6 10M6 2L3 5M6 2L9 5" stroke="currentColor" strokeWidth="1.2" strokeLinecap="round" strokeLinejoin="round" transform="rotate(180 6 6)" />
            </svg>
          </span>
        ) : source === 'customer' ? (
          <span
            title="Cancelled by Customer"
            aria-label="Cancelled by Customer"
            style={{
              display: 'inline-flex',
              alignItems: 'center',
              justifyContent: 'center',
              width: 16,
              height: 16,
              color: '#C46658',
              flexShrink: 0,
            }}
          >
            <svg width="12" height="12" viewBox="0 0 12 12" fill="none" aria-hidden="true">
              <path d="M6 2L6 10M6 2L3 5M6 2L9 5" stroke="currentColor" strokeWidth="1.2" strokeLinecap="round" strokeLinejoin="round" />
            </svg>
          </span>
        ) : null
      )}
    </span>
  );
}

function PaymentBadge({ status }: { status: string }) {
  const key = normalise(status);
  const paid = key === 'paid';
  return (
    <span
      className="d3-badge px-2 py-0.5 rounded text-[0.65rem] font-bold tracking-tighter uppercase"
      style={{
        backgroundColor: paid ? 'rgba(16,185,129,0.12)' : 'rgba(239,68,68,0.12)',
        borderColor: paid ? 'rgba(16,185,129,0.45)' : 'rgba(239,68,68,0.45)',
        color: paid ? '#10b981' : '#ef4444',
      }}
    >
      {paid ? '🟢 PAID' : '🔴 UNPAID'}
    </span>
  );
}

function getMinutesAgo(dateStr: string) {
  return Math.max(1, Math.floor((Date.now() - new Date(dateStr).getTime()) / 60000));
}

const TABS = ['all', 'pending', 'accepted', 'preparing', 'ready', 'completed', 'cancelled'];

const PAYMENT_FILTERS = ['all', 'paid', 'unpaid'];

const PAYMENT_LABEL: Record<string, string> = {
  all: 'All',
  paid: 'Paid',
  unpaid: 'Unpaid',
};

export default function LiveOrdersPage() {
  const { hotel, loading: hotelLoading } = useHotel();
  const { orders, refetch: refetchOrders, updateOrderStatus, updatePaymentStatus, updatingOrderIds, error: ordersError } = useOrders(hotel?.id || null);
  const hotelSlug = hotel?.slug || '';
  const menuHref = hotelSlug ? `/menu/${hotelSlug}` : '/dashboard/settings';
  const [activeTab, setActiveTab] = useState('all');
  const [activePaymentFilter, setActivePaymentFilter] = useState('all');
  const [updateError, setUpdateError] = useState<string | null>(null);

  const handleUpdateStatus = useCallback(
    async (id: string, status: string) => {
      setUpdateError(null);
      try {
        await updateOrderStatus(id, status);
      } catch (err: any) {
        setUpdateError(err.message || 'Failed to update order status');
      }
    },
    [updateOrderStatus]
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
    [updatePaymentStatus]
  );

  const [paymentError, setPaymentError] = useState<string | null>(null);
  const [paymentSuccess, setPaymentSuccess] = useState<string | null>(null);

  const filtered = orders.filter((o: Order) => {
    const statusMatch = activeTab === 'all' || normalise(o.status) === activeTab;
    const isCancelled = normalise(o.status) === 'cancelled';
    const paymentMatch =
      activePaymentFilter === 'all'
        ? true
        : !isCancelled && normalise(o.payment_status) === activePaymentFilter;
    return statusMatch && paymentMatch;
  });

  const getOrderItems = (order: Order) => {
    if (order.order_items && Array.isArray(order.order_items)) {
      return order.order_items.map((item: any) => {
        const price = item.price_at_time !== undefined && item.price_at_time !== null ? item.price_at_time : (item.price !== undefined && item.price !== null ? item.price : (item.menu_item?.price !== undefined && item.menu_item?.price !== null ? item.menu_item.price : 0));
        return {
          id: item.id,
          name: item.name || item.menu_item?.name || 'Unknown',
          quantity: item.quantity || 1,
          price: price,
          notes: item.notes,
        };
      });
    }
    return [];
  };

  if (hotelLoading) {
    return (
      <div className="flex flex-col items-center justify-center py-24 gap-4">
        <div
          style={{
            width: 40, height: 40, borderRadius: '50%',
            border: '2px solid rgba(201,169,110,0.2)',
            borderTop: '2px solid var(--gold)',
            animation: 'spin 1s linear infinite',
          }}
        />
        <p style={{ color: 'var(--text-dimmed)', fontSize: '0.875rem' }}>Loading orders...</p>
      </div>
    );
  }

  return (
    <div className="flex flex-col gap-8" style={{ maxWidth: 1180 }}>

      {/* Header */}
      <header
        className="flex flex-col sm:flex-row items-start sm:items-end justify-between gap-5"
      >
        <div>
          <span className="d3-eyebrow" style={{ fontSize: '0.5625rem' }}>
            Service
          </span>
          <h1
            style={{
              fontFamily: 'var(--font-display)',
              fontSize: 'clamp(2rem, 4vw, 2.75rem)',
              fontWeight: 500,
              color: 'var(--text-primary)',
              letterSpacing: '-0.025em',
              lineHeight: 1.1,
              margin: '0.5rem 0 0',
            }}
          >
            Live Orders
          </h1>
          <p
            style={{
              margin: '0.5rem 0 0',
              fontSize: '0.875rem',
              lineHeight: 1.6,
              color: 'var(--text-muted)',
              maxWidth: '54ch',
            }}
          >
            The real-time order stream for your kitchen and floor staff.
          </p>
        </div>

        {/* Service counters */}
        <div style={{ display: 'flex', alignItems: 'center', gap: 28 }}>
          {[
            { label: 'New', count: orders.filter((o: Order) => normalise(o.status) === 'pending').length },
            { label: 'In Kitchen', count: orders.filter((o: Order) => normalise(o.status) === 'preparing').length },
            { label: 'Ready', count: orders.filter((o: Order) => normalise(o.status) === 'ready').length },
          ].map((stat) => (
            <div key={stat.label}>
              <span className="d3-figure" style={{ display: 'block', fontSize: '1.5rem' }}>
                {stat.count}
              </span>
              <span
                style={{
                  display: 'block',
                  marginTop: 5,
                  fontSize: '0.5625rem',
                  fontWeight: 600,
                  letterSpacing: '0.18em',
                  textTransform: 'uppercase',
                  color: 'var(--text-dimmed)',
                }}
              >
                {stat.label}
              </span>
            </div>
          ))}
        </div>
      </header>

      {/* Update error notification */}
      {updateError && (
        <div
          style={{
            padding: '0.875rem 1.25rem',
            marginBottom: 1,
            background: 'rgba(196,102,88,0.06)',
            border: '1px solid rgba(196,102,88,0.25)',
            borderRadius: 10,
            color: '#C46658',
            fontSize: '0.8125rem',
            display: 'flex', alignItems: 'center', gap: 10,
          }}
        >
          <span style={{ width: 14, height: 14, flexShrink: 0 }}>
            <svg viewBox="0 0 14 14" fill="none" stroke="currentColor" strokeWidth="1.4" strokeLinecap="round" strokeLinejoin="round">
              <circle cx="7" cy="7" r="5.5" />
              <line x1="7" y1="3" x2="7" y2="7" />
            </svg>
          </span>
          <span>{updateError}</span>
          <button
            type="button"
            onClick={() => setUpdateError(null)}
            style={{ marginLeft: 'auto', background: 'none', border: 'none', color: '#C46658', cursor: 'pointer', fontSize: '0.8125rem', padding: 0 }}
          >
            ✕
          </button>
        </div>
      )}

      {/* Payment error notification */}
      {paymentError && (
        <div
          style={{
            padding: '0.875rem 1.25rem',
            marginBottom: 1,
            background: 'rgba(196,102,88,0.06)',
            border: '1px solid rgba(196,102,88,0.25)',
            borderRadius: 10,
            color: '#C46658',
            fontSize: '0.8125rem',
            display: 'flex', alignItems: 'center', gap: 10,
          }}
        >
          <span style={{ width: 14, height: 14, flexShrink: 0 }}>
            <svg viewBox="0 0 14 14" fill="none" stroke="currentColor" strokeWidth="1.4" strokeLinecap="round" strokeLinejoin="round">
              <circle cx="7" cy="7" r="5.5" />
              <line x1="7" y1="3" x2="7" y2="7" />
            </svg>
          </span>
          <span>{paymentError}</span>
          <button
            type="button"
            onClick={() => setPaymentError(null)}
            style={{ marginLeft: 'auto', background: 'none', border: 'none', color: '#C46658', cursor: 'pointer', fontSize: '0.8125rem', padding: 0 }}
          >
            ✕
          </button>
        </div>
      )}

      {/* Payment success notification */}
      {paymentSuccess && (
        <div
          style={{
            padding: '0.875rem 1.25rem',
            marginBottom: 1,
            background: 'rgba(16,185,129,0.08)',
            border: '1px solid rgba(16,185,129,0.25)',
            borderRadius: 10,
            color: '#10b981',
            fontSize: '0.8125rem',
            display: 'flex', alignItems: 'center', gap: 10,
          }}
        >
          <span style={{ width: 14, height: 14, flexShrink: 0 }}>
            <svg viewBox="0 0 14 14" fill="none" stroke="currentColor" strokeWidth="1.4" strokeLinecap="round" strokeLinejoin="round">
              <polyline points="1 6 4 9 9 2" />
            </svg>
          </span>
          <span>{paymentSuccess}</span>
          <button
            type="button"
            onClick={() => setPaymentSuccess(null)}
            style={{ marginLeft: 'auto', background: 'none', border: 'none', color: '#10b981', cursor: 'pointer', fontSize: '0.8125rem', padding: 0 }}
          >
            ✕
          </button>
        </div>
      )}

      {/* Tab filter */}
      <div className="d3-segment" role="group" aria-label="Filter orders by status">
        {TABS.map((tab) => {
          const count = orders.filter((o: Order) => tab === 'all' ? true : normalise(o.status) === tab).length;
          const isActive = activeTab === tab;
          return (
            <button
              key={tab}
              type="button"
              className="d3-segment-item"
              data-active={isActive}
              onClick={() => setActiveTab(tab)}
            >
              {tab} ({count})
            </button>
          );
        })}
      </div>

      {/* Payment filter */}
      <div className="d3-segment" role="group" aria-label="Filter orders by payment status">
        {PAYMENT_FILTERS.map((pf) => {
          const count = orders.filter((o: Order) => pf === 'all' || normalise(o.payment_status) === pf).length;
          const isActive = activePaymentFilter === pf;
          return (
            <button
              key={pf}
              type="button"
              className="d3-segment-item"
              data-active={isActive}
              onClick={() => setActivePaymentFilter(pf)}
            >
              {PAYMENT_LABEL[pf]} ({count})
            </button>
          );
        })}
      </div>

      {/* Orders Grid */}
      {filtered.length === 0 ? (
        <div className="d3-empty">
          <svg width="38" height="38" viewBox="0 0 40 40" fill="none" style={{ opacity: 0.45 }} aria-hidden="true">
            <rect x="6" y="9" width="28" height="22" rx="3" stroke="currentColor" strokeWidth="1.1" />
            <path d="M13 17H27M13 22H21" stroke="currentColor" strokeWidth="1.1" strokeLinecap="round" />
          </svg>
          <h3 className="d3-empty-title">
            {activeTab === 'all' ? 'No orders yet' : `No ${activeTab} orders`}
          </h3>
          <p className="d3-empty-body">
            {orders.length === 0
              ? 'Orders placed from your guest menu land here instantly.'
              : 'Nothing is in this state right now.'}
            {hotelSlug ? (
              <>
                {' '}
                Open{' '}
                <a href={menuHref} target="_blank" style={{ color: 'var(--gold)' }}>
                  /menu/{hotelSlug}
                </a>{' '}
                to place one.
              </>
            ) : null}
          </p>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-5">
          {filtered.map((order: Order) => {
            const minsAgo = getMinutesAgo(order.created_at);
            const isNew = normalise(order.status) === 'pending';
            const orderItems = getOrderItems(order);
            return (
              <article
                key={order.id}
                className="d3-panel p-5 flex flex-col gap-4"
                style={
                  isNew
                    ? {
                        borderColor: 'rgba(184,164,122,0.28)',
                        background: 'var(--bg-surface-2)',
                      }
                    : undefined
                }
              >
                {/* Order Header */}
                <div className="flex items-start justify-between gap-3">
                  <div>
                    <span
                      className="d3-figure"
                      style={{ display: 'block', fontSize: '1.125rem' }}
                    >
                      Table {order.table_number || '—'}
                    </span>
                    <span
                      style={{
                        display: 'block',
                        marginTop: 4,
                        fontFamily: 'ui-monospace, SFMono-Regular, Menlo, monospace',
                        fontSize: '0.625rem',
                        letterSpacing: '0.06em',
                        color: 'var(--text-dimmed)',
                      }}
                    >
                      #{order.id.slice(0, 8).toUpperCase()}
                    </span>
                    <p style={{ margin: '0.375rem 0 0', fontSize: '0.75rem', color: 'var(--text-muted)' }}>
                      {order.customer_name || 'Guest'}
                    </p>
                  </div>
                  <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'flex-end', gap: 6, flexShrink: 0 }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: 6, flexWrap: 'wrap', justifyContent: 'flex-end' }}>
                      <StatusBadge status={order.status} cancellationSource={(order as any).cancellation_source} cancelledBy={(order as any).cancelled_by} order={order} />
                      {normalise(order.status) === 'cancelled' && (
                        <CancellationSourceLabel cancellationSource={(order as any).cancellation_source} cancelledBy={(order as any).cancelled_by} order={order} />
                      )}
                    </div>
                    {normalise(order.status) !== 'cancelled' && <PaymentBadge status={order.payment_status} />}
                    <span style={{ fontSize: '0.625rem', color: 'var(--text-dimmed)' }}>{minsAgo} min ago</span>
                  </div>
                </div>

                {/* Items */}
                <div
                  className="flex flex-col gap-1.5"
                  style={{ borderTop: '1px solid var(--border-subtle)', paddingTop: '0.875rem' }}
                >
                  {orderItems.length === 0 ? (
                    <p style={{ fontSize: '0.75rem', color: 'var(--text-dimmed)' }}>No item details available</p>
                  ) : (
                    orderItems.map((item: any) => (
                      <div
                        key={item.id}
                        className="flex items-start justify-between"
                        style={{
                          padding: '0.5rem 0.75rem',
                          borderRadius: 6,
                          background: 'var(--bg-surface-2)',
                          border: '1px solid var(--border-subtle)',
                        }}
                      >
                        <div className="min-w-0">
                            <span style={{ fontWeight: 600, fontSize: '0.8125rem', color: 'var(--text-primary)', display: 'block' }}>
                              {item.quantity} × {item.name}
                            </span>
                            <span style={{ fontSize: '0.6875rem', color: 'var(--text-dimmed)', display: 'block', marginTop: 2 }}>
                              {formatPrice(item.price || 0, hotel?.currency)} per item
                            </span>
                          {item.notes && (
                            <span style={{ fontSize: '0.6875rem', color: 'var(--gold)', display: 'block', marginTop: 2 }}>
                              Note: {item.notes}
                            </span>
                          )}
                        </div>
                        <span style={{ fontSize: '0.8125rem', color: 'var(--text-muted)', fontWeight: 500, marginLeft: 8, flexShrink: 0 }}>
                          {formatPrice((item.price * item.quantity) || 0, hotel?.currency)}
                        </span>
                      </div>
                    ))
                  )}
                </div>

                {/* Order total */}
                {order.notes && (
                  <div
                    style={{
                      padding: '0.625rem 0.75rem',
                      borderRadius: 5,
                      background: 'var(--bg-secondary)',
                      border: '1px solid var(--border-warm)',
                      fontSize: '0.75rem',
                      lineHeight: 1.6,
                      color: 'var(--text-secondary)',
                    }}
                  >
                    <strong style={{ color: 'var(--text-primary)', fontWeight: 500 }}>Chef note:</strong>{' '}
                    {order.notes}
                  </div>
                )}

                <div
                  className="flex items-center justify-between"
                  style={{ borderTop: '1px solid var(--border-warm)', paddingTop: '0.875rem' }}
                >
                  {normalise(order.status) === 'cancelled' ? null : (
                    <>
                      <span style={{ fontSize: '0.6875rem', color: 'var(--text-dimmed)' }}>
                        {order.payment_method} · {order.payment_status}
                      </span>
                      <span className="d3-figure" style={{ fontSize: '1.125rem', color: 'var(--gold)' }}>
                        {formatPrice(Number(order.total_amount) || 0, hotel?.currency)}
                      </span>
                    </>
                  )}
                </div>

                {/* Cancellation reason shown only for cancelled orders */}
                {normalise(order.status) === 'cancelled' && order.cancellation_reason && (
                  <div
                    style={{
                      marginTop: '0.875rem',
                      padding: '0.625rem 0.75rem',
                      borderRadius: 5,
                      background: 'rgba(196,102,88,0.06)',
                      border: '1px solid rgba(196,102,88,0.18)',
                      fontSize: '0.75rem',
                      lineHeight: 1.5,
                    }}
                  >
                    <strong style={{ color: '#C46658', fontWeight: 500, textTransform: 'uppercase', letterSpacing: '0.08em', fontSize: '0.625rem', display: 'block', marginBottom: 2 }}>
                      Cancellation reason
                    </strong>
                    <span style={{ color: 'var(--text-secondary)' }}>{order.cancellation_reason}</span>
                    {order.cancelled_by === 'customer' && (
                      <span style={{ color: 'var(--text-dimmed)', fontSize: '0.6875rem', marginLeft: 8 }}>
                        · Cancelled by customer
                      </span>
                    )}
                    {order.cancelled_by === 'restaurant' && (
                      <span style={{ color: 'var(--text-dimmed)', fontSize: '0.6875rem', marginLeft: 8 }}>
                        · Cancelled by restaurant
                      </span>
                    )}
                  </div>
                )}

                {/* Actions */}
                {normalise(order.status) !== 'cancelled' && (
                  <div className="flex flex-col" style={{ gap: 8 }}>
                    {normalise(order.status) === 'pending' && (
                      <button
                        type="button"
                        disabled={updatingOrderIds.has(order.id)}
                        onClick={() => handleUpdateStatus(order.id, 'accepted')}
                        className="d3-btn-primary"
                        style={{ flex: 1, opacity: updatingOrderIds.has(order.id) ? 0.6 : 1 }}
                      >
                        Accept Order
                      </button>
                    )}
                    {(normalise(order.status) === 'accepted' || normalise(order.status) === 'pending') && (
                      <button
                        type="button"
                        disabled={updatingOrderIds.has(order.id)}
                        onClick={() => handleUpdateStatus(order.id, 'preparing')}
                        className={normalise(order.status) === 'accepted' ? 'd3-btn-primary' : 'd3-btn-quiet'}
                        style={{ flex: 1, opacity: updatingOrderIds.has(order.id) ? 0.6 : 1 }}
                      >
                        Start Preparing
                      </button>
                    )}
                    {normalise(order.status) === 'preparing' && (
                      <button
                        type="button"
                        disabled={updatingOrderIds.has(order.id)}
                        onClick={() => handleUpdateStatus(order.id, 'ready')}
                        className="d3-btn-quiet"
                        style={{ flex: 1, opacity: updatingOrderIds.has(order.id) ? 0.6 : 1 }}
                      >
                        Mark Ready
                      </button>
                    )}
                    {normalise(order.status) === 'ready' && (
                      <button
                        type="button"
                        disabled={updatingOrderIds.has(order.id)}
                        onClick={() => handleUpdateStatus(order.id, 'completed')}
                        className="d3-btn-quiet"
                        style={{ flex: 1, opacity: updatingOrderIds.has(order.id) ? 0.6 : 1 }}
                      >
                        Complete Order
                      </button>
                    )}
                    {!['completed', 'cancelled'].includes(normalise(order.status)) && (
                      <button
                        type="button"
                        disabled={updatingOrderIds.has(order.id)}
                        onClick={() => handleUpdateStatus(order.id, 'cancelled')}
                        className="d3-btn-inline d3-btn-danger"
                        style={{ opacity: updatingOrderIds.has(order.id) ? 0.6 : 1 }}
                      >
                        Cancel
                      </button>
                    )}
                    {/* Payment action hidden for cancelled orders. */}
                    {normalise(order.status) !== 'cancelled' && (
                      <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
                      {normalise(order.payment_status) === 'unpaid' ? (
                        <button
                          type="button"
                          disabled={updatingOrderIds.has(order.id)}
                          onClick={() => handleUpdatePaymentStatus(order.id, 'paid')}
                          className="d3-btn-primary"
                          style={{ flex: 1, opacity: updatingOrderIds.has(order.id) ? 0.6 : 1 }}
                        >
                          Mark as Paid
                        </button>
                      ) : (
                        <button
                          type="button"
                          disabled={updatingOrderIds.has(order.id)}
                          onClick={() => handleUpdatePaymentStatus(order.id, 'unpaid')}
                          className="d3-btn-quiet"
                          style={{ flex: 1, opacity: updatingOrderIds.has(order.id) ? 0.6 : 1 }}
                        >
                          Mark as Unpaid
                        </button>
                      )}
                    </div>
                    )}
                  </div>
                )}
                    {normalise(order.status) === 'pending' && (
                      <button
                        type="button"
                        disabled={updatingOrderIds.has(order.id)}
                        onClick={() => handleUpdateStatus(order.id, 'accepted')}
                        className="d3-btn-primary"
                        style={{ flex: 1, opacity: updatingOrderIds.has(order.id) ? 0.6 : 1 }}
                      >
                        Accept Order
                      </button>
                    )}
                    {(normalise(order.status) === 'accepted' || normalise(order.status) === 'pending') && (
                      <button
                        type="button"
                        disabled={updatingOrderIds.has(order.id)}
                        onClick={() => handleUpdateStatus(order.id, 'preparing')}
                        className={normalise(order.status) === 'accepted' ? 'd3-btn-primary' : 'd3-btn-quiet'}
                        style={{ flex: 1, opacity: updatingOrderIds.has(order.id) ? 0.6 : 1 }}
                      >
                        Start Preparing
                      </button>
                    )}
                    {normalise(order.status) === 'preparing' && (
                      <button
                        type="button"
                        disabled={updatingOrderIds.has(order.id)}
                        onClick={() => handleUpdateStatus(order.id, 'ready')}
                        className="d3-btn-quiet"
                        style={{ flex: 1, opacity: updatingOrderIds.has(order.id) ? 0.6 : 1 }}
                      >
                        Mark Ready
                      </button>
                    )}
                    {normalise(order.status) === 'ready' && (
                      <button
                        type="button"
                        disabled={updatingOrderIds.has(order.id)}
                        onClick={() => handleUpdateStatus(order.id, 'completed')}
                        className="d3-btn-quiet"
                        style={{ flex: 1, opacity: updatingOrderIds.has(order.id) ? 0.6 : 1 }}
                      >
                        Complete Order
                      </button>
                    )}
                    {!['completed', 'cancelled'].includes(normalise(order.status)) && (
                      <button
                        type="button"
                        disabled={updatingOrderIds.has(order.id)}
                        onClick={() => handleUpdateStatus(order.id, 'cancelled')}
                        className="d3-btn-inline d3-btn-danger"
                        style={{ opacity: updatingOrderIds.has(order.id) ? 0.6 : 1 }}
                      >
                        Cancel
                      </button>
                )}
              </article>
            );
          })}
        </div>
      )}
    </div>
  );
}
