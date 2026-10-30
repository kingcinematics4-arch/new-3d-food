'use client';

import React, { useState, useEffect, useCallback, useRef, Suspense } from 'react';
import Link from 'next/link';
import { menuThemeClass } from '@/lib/menuThemes';
import { supabaseClient, isSupabaseConfigured } from '@/lib/supabaseBrowser';

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------

interface LiveOrderItem {
  id: string;
  name: string | null;
  quantity: number;
  price_at_time: number;
  notes: string | null;
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
  hotel_slug: string | null;
}

// ---------------------------------------------------------------------------
// Status → stage mapping
//
// Stored statuses (written by the hotel dashboard API):
//   pending   → Order Placed          (just received)
//   accepted  → Accepted by Restaurant (restaurant confirmed)
//   preparing → Preparing              (kitchen working on it)
//   ready     → Ready                  (food ready)
//   completed → Completed              (order closed)
//   delivered → treated as completed
//   cancelled → terminal error state
//
// The STAGES array drives the visual progress bar. Five stages are shown so
// the 'accepted' step is always visible and never silently skipped.
// ---------------------------------------------------------------------------

const STAGES = [
  { key: 'placed',    title: 'Order Placed',           desc: 'Your order has been received by the restaurant' },
  { key: 'accepted',  title: 'Accepted by Restaurant', desc: 'The restaurant has confirmed your order' },
  { key: 'preparing', title: 'Preparing',              desc: 'The kitchen is working on your food' },
  { key: 'ready',     title: 'Ready',                  desc: 'Your order is ready for service' },
  { key: 'completed', title: 'Completed',              desc: 'Order complete — enjoy your meal!' },
];

function statusToStageIndex(status: string): number {
  switch ((status || '').trim().toLowerCase()) {
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

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

function formatINR(amount: number): string {
  const value = Number(amount || 0);
  if (value === 0) return '₹0';
  return `₹${value.toLocaleString('en-IN', { minimumFractionDigits: 0, maximumFractionDigits: 2 })}`;
}

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

  // Stable ref so effect closures can read the latest order id / status
  // without being recreated on every render.
  const orderRef = useRef<LiveOrder | null>(null);
  orderRef.current = order;

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

  // Initial load
  useEffect(() => { loadOrder(false); }, [loadOrder]);

  // -----------------------------------------------------------------------
  // Supabase Realtime subscription
  //
  // We subscribe to postgres_changes on the specific order row so the page
  // updates the moment the hotel writes a new status — no poll needed for the
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
    // No point subscribing for a terminal order.
    if (isTerminal(order.status)) return;
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
      // Realtime not available — polling fallback handles it.
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
  // • Every poll fetches the current order status every 5 s
  // • Uses recursive setTimeout (not setInterval) so a previous in-flight
  //   fetch always completes before the next poll starts — no overlapping
  //   API requests.
  // • Terminal order → stop polling
  // -----------------------------------------------------------------------
  useEffect(() => {
    if (!order) return;
    if (isTerminal(order.status)) return;

    const POLL_MS = 5_000;
    let dead = false;

    const tick = async () => {
      if (dead) return;
      await loadOrder(true);
      if (!dead && !isTerminal(orderRef.current?.status ?? '')) {
        setTimeout(tick, POLL_MS);
      }
    };

    const timer = setTimeout(tick, POLL_MS);
    return () => {
      dead = true;
      clearTimeout(timer);
    };
  }, [order?.status, loadOrder]);

  // -----------------------------------------------------------------------
  // Derived display values
  // -----------------------------------------------------------------------
  const placedAt   = order?.created_at ?? null;
  const updatedAt  = order?.updated_at  ?? null;
  const status     = (order?.status || '').trim().toLowerCase();
  const stageIndex = statusToStageIndex(status);
  const isCancelled = status === 'cancelled';

  return (
    <div
      className={`min-h-screen flex flex-col ${menuThemeClass(order?.hotel_theme || undefined)}`}
      style={{ background: 'var(--bg-primary)', color: 'var(--text-primary)', fontFamily: 'var(--font-body)' }}
    >
      <div className="w-full max-w-md mx-auto px-5 pt-10 pb-8">

        {/* ── Header ── */}
        <div className="text-center space-y-3 mb-10">
          <div
            className="inline-flex items-center justify-center w-14 h-14 rounded-2xl"
            style={{ background: 'rgba(184,164,122,0.08)', border: '1px solid rgba(184,164,122,0.15)', color: 'var(--gold)' }}
          >
            {loading ? (
              <svg width="24" height="24" viewBox="0 0 24 24" fill="none" style={{ animation: 'spin 1s linear infinite' }}>
                <circle cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="1.5" strokeOpacity="0.25" />
                <path d="M12 2A10 10 0 0 1 22 12" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" />
              </svg>
            ) : (
              <svg width="24" height="24" viewBox="0 0 24 24" fill="none">
                <path d="M6 2L3 6v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2V6l-3-4z" stroke="currentColor" strokeWidth="1.4" strokeLinecap="round" strokeLinejoin="round" />
                <line x1="3" y1="6" x2="21" y2="6" stroke="currentColor" strokeWidth="1.4" strokeLinecap="round" />
                <path d="M16 10a4 4 0 0 1-8 0" stroke="currentColor" strokeWidth="1.4" strokeLinecap="round" strokeLinejoin="round" />
              </svg>
            )}
          </div>

          <h1
            style={{ fontFamily: 'var(--font-display)', fontSize: '2rem', fontWeight: 500, color: 'var(--text-primary)', letterSpacing: '-0.02em', lineHeight: 1.2 }}
          >
            Your Order
          </h1>

          {order && !loading && (
            <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 4 }}>
              <p style={{ color: 'var(--text-muted)', fontSize: '0.8125rem', letterSpacing: '0.02em' }}>
                Ref{' '}
                <span style={{ fontFamily: 'ui-monospace, SFMono-Regular, Menlo, monospace', fontWeight: 600, color: 'var(--gold)' }}>
                  #{order.order_number}
                </span>
                {placedAt && <>{' · '}{formatDateTime(placedAt)}</>}
              </p>

              {/* Live / auto-refresh indicator */}
              {!isCancelled && !isTerminal(status) && (
                <div
                  style={{
                    display: 'inline-flex', alignItems: 'center', gap: 6,
                    padding: '0.2rem 0.625rem', borderRadius: 100,
                    background: realtimeOk ? 'rgba(91,165,111,0.10)' : 'rgba(184,164,122,0.08)',
                    border: realtimeOk ? '1px solid rgba(91,165,111,0.22)' : '1px solid rgba(184,164,122,0.18)',
                    fontSize: '0.5625rem', fontWeight: 600, letterSpacing: '0.12em', textTransform: 'uppercase' as const,
                    color: realtimeOk ? '#6bba85' : 'var(--text-dimmed)',
                  }}
                >
                  <span
                    style={{
                      width: 5, height: 5, borderRadius: '50%',
                      background: realtimeOk ? '#6bba85' : 'var(--gold)',
                      animation: 'ot-pulse 2s infinite',
                    }}
                  />
                  {realtimeOk ? 'Live updates' : 'Auto-refresh'}
                </div>
              )}
            </div>
          )}
        </div>

        {/* ── Body ── */}
        {loading ? null : error ? (
          <div style={{ padding: '2.5rem 1.5rem', textAlign: 'center', border: '1px solid var(--border-subtle)', borderRadius: 16, background: 'var(--bg-surface)' }}>
            <p style={{ margin: 0, fontSize: '0.9375rem', color: 'var(--text-muted)', lineHeight: 1.7 }}>{error}</p>
          </div>
        ) : order ? (
          <>
            {/* Cancelled banner */}
            {isCancelled && (
              <div style={{ padding: '1.25rem 1.5rem', textAlign: 'center', border: '1px solid rgba(196,102,88,0.2)', borderRadius: 16, background: 'rgba(196,102,88,0.04)', marginBottom: '1.5rem' }}>
                <p style={{ margin: 0, fontSize: '0.8125rem', color: '#D9A79E', letterSpacing: '0.06em', textTransform: 'uppercase', fontWeight: 500 }}>
                  This order was cancelled
                </p>
              </div>
            )}

            {/* Progress Timeline */}
            {!isCancelled && (
              <div
                style={{ padding: '1.75rem 1.5rem', border: '1px solid var(--border-subtle)', borderRadius: 16, background: 'var(--bg-surface)', boxShadow: '0 8px 32px rgba(0,0,0,0.25)', marginBottom: '1.5rem' }}
              >
                {STAGES.map((stage, idx) => {
                  const reached   = idx <= stageIndex;
                  const isCurrent = idx === stageIndex;
                  const isLast    = idx === STAGES.length - 1;

                  return (
                    <div key={stage.key} className="flex gap-4">
                      <div className="flex flex-col items-center">
                        {/* Node */}
                        <div
                          style={{
                            width: 36, height: 36, borderRadius: 10, flexShrink: 0,
                            display: 'flex', alignItems: 'center', justifyContent: 'center',
                            background: reached ? 'rgba(184,164,122,0.10)' : 'var(--bg-surface-2)',
                            border:     reached ? '1px solid rgba(184,164,122,0.28)' : '1px solid var(--border-warm)',
                            color:      reached ? 'var(--gold)' : 'var(--text-dimmed)',
                            boxShadow:  isCurrent ? '0 0 0 3px rgba(184,164,122,0.10)' : 'none',
                            transition: 'all 350ms ease',
                          }}
                        >
                          {reached ? (
                            <svg width="16" height="16" viewBox="0 0 16 16" fill="none">
                              <path d="M3 8.5L6.5 12L13 4.5" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
                            </svg>
                          ) : (
                            <svg width="10" height="10" viewBox="0 0 10 10" fill="none">
                              <circle cx="5" cy="5" r="2" fill="currentColor" />
                            </svg>
                          )}
                        </div>
                        {/* Connector */}
                        {!isLast && (
                          <div style={{ width: 1, flex: 1, minHeight: 24, background: idx < stageIndex ? 'rgba(184,164,122,0.28)' : 'var(--border-warm)', marginTop: 4, transition: 'background 350ms ease' }} />
                        )}
                      </div>

                      {/* Label */}
                      <div className="pb-6" style={{ marginTop: -2 }}>
                        <div className="flex items-center gap-2 flex-wrap">
                          <h3
                            style={{
                              fontFamily: 'var(--font-display)', fontSize: '1.0625rem', fontWeight: 500,
                              color:     isCurrent ? 'var(--gold)' : reached ? 'var(--text-primary)' : 'var(--text-dimmed)',
                              letterSpacing: '-0.01em', lineHeight: 1.3, transition: 'color 350ms ease',
                            }}
                          >
                            {stage.title}
                          </h3>
                          {isCurrent && (
                            <span className="d3-badge d3-badge-gold" style={{ fontSize: '0.5625rem', padding: '0.2rem 0.5rem', letterSpacing: '0.1em' }}>
                              CURRENT
                            </span>
                          )}
                        </div>
                        <p style={{ fontSize: '0.8125rem', color: reached ? 'var(--text-muted)' : 'var(--text-dimmed)', marginTop: 2, lineHeight: 1.5, transition: 'color 350ms ease' }}>
                          {stage.desc}
                        </p>
                      </div>
                    </div>
                  );
                })}

                {/* Last updated timestamp */}
                {updatedAt && (
                  <p style={{ marginTop: '0.5rem', fontSize: '0.6875rem', color: 'var(--text-dimmed)', textAlign: 'right', letterSpacing: '0.02em' }}>
                    Last updated {formatDateTime(updatedAt)}
                  </p>
                )}
              </div>
            )}

            {/* Items Card */}
            <div style={{ padding: '1.5rem', border: '1px solid var(--border-subtle)', borderRadius: 16, background: 'var(--bg-surface)' }}>
              <p className="d3-eyebrow" style={{ marginBottom: '1rem' }}>Items</p>
              <div className="flex flex-col gap-3">
                {order.items.length === 0 ? (
                  <p style={{ margin: 0, fontSize: '0.8125rem', color: 'var(--text-dimmed)' }}>No items recorded</p>
                ) : (
                  order.items.map((item) => (
                    <div key={item.id} className="flex items-baseline justify-between gap-4">
                      <span style={{ fontSize: '0.875rem', color: 'var(--text-secondary)', lineHeight: 1.4 }}>
                        {item.quantity} × {item.name || 'Item'}
                      </span>
                      <span style={{ fontSize: '0.875rem', color: 'var(--text-muted)', fontWeight: 500 }}>
                        {formatINR(Number(item.price_at_time) * item.quantity)}
                      </span>
                    </div>
                  ))
                )}
              </div>

              <div className="d3-divider" style={{ margin: '1.25rem 0' }} />

              <div className="flex items-baseline justify-between gap-4">
                <span style={{ fontSize: '0.6875rem', letterSpacing: '0.16em', textTransform: 'uppercase', color: 'var(--text-dimmed)', fontWeight: 500 }}>Total</span>
                <span style={{ fontFamily: 'var(--font-display)', fontSize: '1.375rem', color: 'var(--gold)', fontWeight: 500 }}>
                  {formatINR(order.total_amount)}
                </span>
              </div>

              <div className="mt-4 flex flex-col gap-2">
                {order.payment_method && order.payment_method !== 'pay_at_table' && (
                  <div className="flex justify-between" style={{ fontSize: '0.75rem' }}>
                    <span style={{ color: 'var(--text-dimmed)' }}>Payment</span>
                    <span style={{ color: 'var(--text-secondary)', textTransform: 'capitalize' }}>{order.payment_method}</span>
                  </div>
                )}
                {order.payment_status === 'paid' && (
                  <div className="flex justify-between" style={{ fontSize: '0.75rem' }}>
                    <span style={{ color: 'var(--text-dimmed)' }}>Payment Status</span>
                    <span style={{ color: 'var(--gold)' }}>Paid</span>
                  </div>
                )}
                {order.table_number && (
                  <div className="flex justify-between" style={{ fontSize: '0.75rem' }}>
                    <span style={{ color: 'var(--text-dimmed)' }}>Table</span>
                    <span style={{ color: 'var(--text-secondary)' }}>{order.table_number}</span>
                  </div>
                )}
                {order.customer_name && (
                  <div className="flex justify-between" style={{ fontSize: '0.75rem' }}>
                    <span style={{ color: 'var(--text-dimmed)' }}>Customer</span>
                    <span style={{ color: 'var(--text-secondary)' }}>{order.customer_name}</span>
                  </div>
                )}
                {order.notes && (
                  <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)', lineHeight: 1.5, marginTop: 2 }}>
                    <span style={{ color: 'var(--text-dimmed)' }}>Note: </span>{order.notes}
                  </div>
                )}
              </div>
            </div>
          </>
        ) : null}
      </div>

      {/* Back link */}
      <div className="pb-8 pt-4 text-center">
        <Link href={backHref} className="d3-btn-text" style={{ fontSize: '0.8125rem', fontWeight: 500 }}>
          <svg width="12" height="12" viewBox="0 0 12 12" fill="none" style={{ marginRight: 4 }}>
            <path d="M10 2L2 6L10 10" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
          </svg>
          Back to Menu
        </Link>
      </div>

      {/* Inline keyframes for the live-indicator pulse */}
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
          <div style={{ width: 40, height: 40, borderRadius: '50%', border: '2px solid rgba(201,169,110,0.2)', borderTop: '2px solid var(--gold)', animation: 'spin 1s linear infinite' }} />
        </div>
      }
    >
      <OrderTrackingInner orderId={orderId} hotelSlug={hotelSlug} />
    </Suspense>
  );
}
