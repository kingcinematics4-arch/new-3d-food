'use client';

import React, { useState, useEffect, useCallback, Suspense } from 'react';
import Link from 'next/link';
import { useSearchParams } from 'next/navigation';

/* ============================================================
   ORDER STATUS
   Everything on this page comes from the order row that the
   guest just created. Nothing advances on a timer and no wait
   time is estimated: a step is only reached when the kitchen
   has actually moved the order into that status.
   ============================================================ */

interface LiveOrderItem {
  id: string;
  name: string | null;
  quantity: number;
  price_at_time: number;
  notes: string | null;
}

interface LiveOrder {
  id: string;
  status: string;
  payment_status: string;
  payment_method: string;
  table_number: string | null;
  customer_name: string | null;
  total_amount: number;
  created_at: string;
  items: LiveOrderItem[];
}

// The only statuses the dashboard can set (see app/api/orders/update-status).
const FLOW = [
  { key: 'pending', title: 'Order Placed', desc: 'Sent to the restaurant' },
  { key: 'preparing', title: 'Preparing', desc: 'The kitchen is working on it' },
  { key: 'ready', title: 'Ready', desc: 'Your order is ready' },
  { key: 'completed', title: 'Completed', desc: 'Order closed' },
];

export default function OrderStatusPage({ params }: { params: { orderId: string } }) {
  return (
    <Suspense fallback={
      <div
        className="min-h-screen flex items-center justify-center"
        style={{ background: 'var(--bg-primary)' }}
      >
        <div style={{ width: 40, height: 40, borderRadius: '50%', border: '2px solid rgba(201,169,110,0.2)', borderTop: '2px solid var(--gold)', animation: 'spin 1s linear infinite' }} />
      </div>
    }>
      <OrderStatusView orderId={params.orderId} />
    </Suspense>
  );
}

function OrderStatusView({ orderId }: { orderId: string }) {
  const searchParams = useSearchParams();
  const hotelSlug = searchParams?.get('slug') || '';
  const backHref = hotelSlug ? `/menu/${hotelSlug}` : '/';

  const [order, setOrder] = useState<LiveOrder | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const loadOrder = useCallback(async () => {
    try {
      const res = await fetch(`/api/public/orders/${encodeURIComponent(orderId)}`);
      const json = await res.json();

      if (!res.ok || !json.success) {
        setOrder(null);
        setError(json.error || 'We could not find that order.');
        return;
      }

      setOrder(json.order as LiveOrder);
      setError(null);
    } catch {
      setOrder(null);
      setError('We could not load this order. Please refresh to try again.');
    } finally {
      setLoading(false);
    }
  }, [orderId]);

  useEffect(() => {
    loadOrder();
  }, [loadOrder]);

  // Refresh while the order is still in flight.
  useEffect(() => {
    if (!order) return;
    const current = (order.status || '').trim().toLowerCase();
    if (current === 'completed' || current === 'cancelled') return;

    const timer = setInterval(loadOrder, 15000);
    return () => clearInterval(timer);
  }, [order, loadOrder]);

  const placedAt = order?.created_at ? new Date(order.created_at) : null;
  const status = (order?.status || '').trim().toLowerCase();

  return (
    <div
      className="min-h-screen flex flex-col justify-between max-w-lg mx-auto p-4"
      style={{ background: 'var(--bg-primary)', color: 'var(--text-primary)', fontFamily: 'var(--font-body)' }}
    >
      <div className="space-y-6 pt-6">
        {/* Header */}
        <div className="text-center space-y-2">
          <div
            className="inline-flex items-center justify-center w-14 h-14 rounded-2xl"
            style={{
              background: 'rgba(201,169,110,0.1)',
              border: '1px solid rgba(201,169,110,0.2)',
              color: 'var(--gold)',
            }}
          >
            {loading ? (
              <svg width="24" height="24" viewBox="0 0 24 24" fill="none">
                <circle cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="2" strokeOpacity="0.3" />
                <path d="M12 2A10 10 0 0 1 22 12" stroke="currentColor" strokeWidth="2" strokeLinecap="round" />
              </svg>
            ) : (
              <svg width="24" height="24" viewBox="0 0 24 24" fill="none">
                <path d="M4 7h16M4 7l1.4 12.2A2 2 0 0 0 7.4 21h9.2a2 2 0 0 0 2-1.8L20 7M9 7V5a3 3 0 0 1 6 0v2" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round" />
              </svg>
            )}
          </div>
          <h1
            style={{
              fontFamily: 'var(--font-display)',
              fontSize: '1.75rem',
              fontWeight: 500,
              color: 'var(--text-primary)',
              letterSpacing: '-0.02em',
              lineHeight: 1.2,
            }}
          >
            Your Order
          </h1>
          {order ? (
            <p style={{ color: 'var(--text-muted)', fontSize: '0.875rem' }}>
              Ref{' '}
              <span
                style={{
                  fontFamily: 'ui-monospace, SFMono-Regular, Menlo, monospace',
                  fontWeight: 600,
                  color: 'var(--gold)',
                }}
              >
                #{order.id.slice(0, 8).toUpperCase()}
              </span>
              {placedAt ? ` · ${placedAt.toLocaleString()}` : ''}
            </p>
          ) : null}
        </div>

        {loading ? null : error ? (
          <div
            className="d3-card"
            style={{
              padding: '2.5rem 1.5rem',
              textAlign: 'center',
              border: '1px solid var(--border-subtle)',
              borderRadius: 16,
            }}
          >
            <p style={{ margin: 0, fontSize: '0.9375rem', color: 'var(--text-muted)', lineHeight: 1.7 }}>
              {error}
            </p>
          </div>
        ) : order ? (
          <>
            {status === 'cancelled' ? (
              <div
                className="d3-card"
                style={{
                  padding: '1.25rem 1.5rem',
                  textAlign: 'center',
                  border: '1px solid var(--border-warm)',
                  borderRadius: 16,
                }}
              >
                <p style={{ margin: 0, fontSize: '0.875rem', color: 'var(--text-secondary)', letterSpacing: '0.06em', textTransform: 'uppercase' }}>
                  This order was cancelled
                </p>
              </div>
            ) : null}

            {/* Live status — driven by the stored status only */}
            <div
              className="d3-card"
              style={{
                padding: '1.5rem',
                border: '1px solid var(--border-subtle)',
                borderRadius: 16,
                boxShadow: '0 8px 32px rgba(0,0,0,0.4)',
              }}
            >
              <div className="space-y-6 relative" style={{ paddingLeft: '1.25rem' }}>
                <div style={{ position: 'absolute', left: 5, top: 3, bottom: 3, width: 1, background: 'var(--border-subtle)' }} />
                {FLOW.map((step, idx) => {
                  const currentIndex = FLOW.findIndex((s) => s.key === status);
                  const reached = currentIndex >= 0 && idx <= currentIndex;
                  const isCurrent = idx === currentIndex;

                  return (
                    <div key={step.key} className="flex items-start gap-4 relative">
                      <div
                        style={{
                          width: 40, height: 40, borderRadius: 8, flexShrink: 0,
                          display: 'flex', alignItems: 'center', justifyContent: 'center',
                          background: 'var(--bg-surface-2)',
                          border: reached ? '1px solid var(--border-medium)' : '1px solid var(--border-warm)',
                          color: reached ? 'var(--gold)' : 'var(--text-dimmed)',
                          transition: 'all 300ms',
                          zIndex: 10,
                        }}
                      >
                        <svg width="14" height="14" viewBox="0 0 14 14" fill="none">
                          {reached ? (
                            <path d="M3 7.5L5.8 10.2L11 4.5" stroke="currentColor" strokeWidth="1.4" strokeLinecap="round" strokeLinejoin="round" />
                          ) : (
                            <circle cx="7" cy="7" r="2" fill="currentColor" />
                          )}
                        </svg>
                      </div>
                      <div>
                        <h3
                          style={{
                            fontFamily: 'var(--font-display)',
                            fontSize: '1rem',
                            fontWeight: 500,
                            color: isCurrent ? 'var(--gold)' : reached ? 'var(--text-primary)' : 'var(--text-dimmed)',
                            letterSpacing: '-0.01em',
                            marginBottom: 4,
                          }}
                        >
                          {step.title}
                          {isCurrent && (
                            <span className="d3-badge d3-badge-gold" style={{ marginLeft: 8 }}>
                              Current
                            </span>
                          )}
                        </h3>
                        <p className="d3-body-sm" style={{ color: 'var(--text-muted)' }}>
                          {step.desc}
                        </p>
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>

            {/* Order summary */}
            <div
              className="d3-card"
              style={{
                padding: '1.5rem',
                border: '1px solid var(--border-subtle)',
                borderRadius: 16,
              }}
            >
              <p className="d3-eyebrow" style={{ color: 'var(--gold)' }}>
                Items
              </p>
              <div className="flex flex-col gap-2 mt-3">
                {order.items.length === 0 ? (
                  <p style={{ margin: 0, fontSize: '0.8125rem', color: 'var(--text-dimmed)' }}>
                    No items recorded
                  </p>
                ) : (
                  order.items.map((item) => (
                    <div
                      key={item.id}
                      className="flex items-baseline justify-between gap-4"
                      style={{ fontSize: '0.8125rem', color: 'var(--text-secondary)' }}
                    >
                      <span>
                        {item.quantity} × {item.name || 'Item'}
                      </span>
                      <span style={{ color: 'var(--text-dimmed)' }}>
                        {(Number(item.price_at_time) || 0) * item.quantity}
                      </span>
                    </div>
                  ))
                )}
              </div>
              <div className="d3-divider" style={{ margin: '1rem 0' }} />
              <div className="flex items-baseline justify-between gap-4">
                <span style={{ fontSize: '0.75rem', letterSpacing: '0.14em', textTransform: 'uppercase', color: 'var(--text-dimmed)' }}>
                  Total
                </span>
                <span style={{ fontFamily: 'var(--font-display)', fontSize: '1.25rem', color: 'var(--gold)' }}>
                  {Number(order.total_amount) || 0}
                </span>
              </div>
              <p style={{ margin: '0.75rem 0 0', fontSize: '0.6875rem', color: 'var(--text-dimmed)' }}>
                {order.payment_status === 'paid' ? 'Paid' : 'Pay at table'}
              </p>
            </div>
          </>
        ) : null}
      </div>

      {/* Back to Menu Link */}
      <div className="pb-6 pt-4 text-center">
        <Link
          href={backHref}
          className="d3-btn-text"
          style={{ fontSize: '0.8125rem', fontWeight: 500 }}
        >
          <svg width="12" height="12" viewBox="0 0 12 12" fill="none" style={{ marginRight: 4 }}>
            <path d="M10 2L2 6L10 10" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
          </svg>
          Back to Menu
        </Link>
      </div>
    </div>
  );
}