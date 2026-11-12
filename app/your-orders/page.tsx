'use client';

import React, { useState, useEffect, useCallback, useRef, Suspense } from 'react';
import Link from 'next/link';
import { useRouter, useSearchParams } from 'next/navigation';
import Dine3DLogo from '@/components/Dine3DLogo';
import { menuThemeClass } from '@/lib/menuThemes';
import { formatPrice } from '@/lib/menu';
import { supabaseClient, isSupabaseConfigured } from '@/lib/supabaseBrowser';
import { customThemeToCssVars } from '@/components/menu/MenuThemeProvider';
import { cloneCustomThemeConfig, type CustomThemeConfig } from '@/lib/customTheme';
import { CustomThemeFontLoader } from '@/components/menu/CustomThemeFontLoader';
import { isWaterOrder, isWaterItem, cleanWaterNotes } from '@/lib/waterOrderHelper';
import BottomNav from '@/components/nav/BottomNav';

const GOLD = '#B8A47A';

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------

interface OrderItem {
  id: string;
  name: string | null;
  quantity: number;
  price_at_time: number;
  notes: string | null;
  status?: string | null;
  item_kind?: string | null;
}

interface Order {
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
  items: OrderItem[];
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
  combined_items?: OrderItem[];
  combined_bill_total?: number;
  water_charges?: number;
  google_review_url?: string | null;
}

// ---------------------------------------------------------------------------
// Status mapping
// ---------------------------------------------------------------------------

const STAGES_FOOD = [
  { key: 'placed',    title: 'Order Placed',           desc: 'Your order has been received by the restaurant' },
  { key: 'accepted',  title: 'Accepted by Restaurant', desc: 'The restaurant has confirmed your order' },
  { key: 'preparing', title: 'Preparing',              desc: 'The kitchen is working on your food' },
  { key: 'ready',     title: 'Ready',                  desc: 'Your order is ready for service' },
  { key: 'completed', title: 'Completed',              desc: 'Order complete — enjoy your meal!' },
];

const STAGES_WATER = [
  { key: 'placed',    title: 'Order Placed', desc: 'Your water request has been received' },
  { key: 'delivered', title: 'Delivered',    desc: 'Your water has been delivered to the table' },
];

function isWaterOrderLive(order: Order | null | undefined): boolean {
  return isWaterOrder(order as any);
}

function stagesForOrder(order: Order | null | undefined) {
  return isWaterOrderLive(order) ? STAGES_WATER : STAGES_FOOD;
}

function statusToStageIndex(status: string, water = false): number {
  const s = (status || '').trim().toLowerCase();
  if (water) {
    if (s === 'delivered' || s === 'completed') return 1;
    return 0;
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

function needsPaymentWatch(order: Order | null): boolean {
  if (!order) return false;
  const s = (order.status || '').trim().toLowerCase();
  const paid = (order.payment_status || '').trim().toLowerCase() === 'paid';
  if (s === 'cancelled') return false;
  if (paid) return false;
  return true;
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

function formatDateOnly(iso: string): string {
  try {
    return new Date(iso).toLocaleDateString('en-IN', {
      day: 'numeric', month: 'short', year: 'numeric',
    });
  } catch { return ''; }
}

function formatTimeOnly(iso: string): string {
  try {
    return new Date(iso).toLocaleTimeString('en-IN', {
      hour: 'numeric', minute: '2-digit',
    });
  } catch { return ''; }
}

function getStatusColor(status: string): string {
  const s = (status || '').trim().toLowerCase();
  switch (s) {
    case 'pending':
    case 'placed':
      return 'text-amber-400 bg-amber-950/30 border-amber-500/30';
    case 'accepted':
      return 'text-blue-400 bg-blue-950/30 border-blue-500/30';
    case 'preparing':
      return 'text-orange-400 bg-orange-950/30 border-orange-500/30';
    case 'ready':
      return 'text-emerald-400 bg-emerald-950/30 border-emerald-500/30';
    case 'delivered':
    case 'completed':
      return 'text-emerald-400 bg-emerald-950/30 border-emerald-500/30';
    case 'cancelled':
      return 'text-rose-400 bg-rose-950/30 border-rose-500/30';
    default:
      return 'text-white/60 bg-white/5 border-white/10';
  }
}

function getPaymentStatusColor(paymentStatus: string, remainingBalance: number | null | undefined): string {
  const paid = (paymentStatus || '').trim().toLowerCase() === 'paid';
  if (paid || (remainingBalance !== undefined && remainingBalance !== null && remainingBalance <= 0)) {
    return 'text-emerald-400 bg-emerald-950/30 border-emerald-500/30';
  }
  return 'text-amber-400 bg-amber-950/30 border-amber-500/30';
}

const PANEL: React.CSSProperties = {
  border: '1px solid rgba(184, 164, 122, 0.2)',
  borderRadius: 'var(--d3-card-radius, 16px)',
  background: 'rgba(11, 11, 10, 0.8)',
  boxShadow: 'var(--d3-shadow-card, 0 8px 32px rgba(0,0,0,0.4))',
  marginBottom: '1rem',
  overflow: 'hidden',
};

const SECTION_TITLE: React.CSSProperties = {
  margin: 0,
  fontSize: '0.6875rem',
  fontWeight: 600,
  letterSpacing: '0.14em',
  textTransform: 'uppercase',
  color: GOLD,
  lineHeight: 1.3,
};

const NUMBER_FONT = 'ui-monospace, SFMono-Regular, Menlo, monospace';

// ---------------------------------------------------------------------------
// Order Card Component
// ---------------------------------------------------------------------------

interface OrderCardProps {
  order: Order;
  hotelSlug: string;
  onTrackClick: (orderId: string) => void;
}

function OrderCard({ order, hotelSlug, onTrackClick }: OrderCardProps) {
  const status = (order.status || '').trim().toLowerCase();
  const water = isWaterOrderLive(order);
  const stages = stagesForOrder(order);
  const stageIndex = statusToStageIndex(status, water);
  const isCancelled = status === 'cancelled';
  const isActive = needsPaymentWatch(order);

  const combinedBillTotal = order.combined_bill_total ?? order.total_amount ?? 0;
  const foodItems = order.items || [];

  return (
    <div style={PANEL}>
      <div style={{ padding: '1rem', display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
        {/* Header: Order ref, date, status */}
        <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', gap: 8, flexWrap: 'wrap' }}>
          <div style={{ display: 'flex', flexDirection: 'column', gap: 2, minWidth: 0 }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 8, flexWrap: 'wrap' }}>
              <p style={{ margin: 0, color: '#6B675F', fontSize: '0.75rem', letterSpacing: '0.02em' }}>
                Ref{' '}
                <span style={{ fontFamily: NUMBER_FONT, fontWeight: 600, color: GOLD, fontVariantNumeric: 'tabular-nums' }}>
                  #{order.order_number}
                </span>
              </p>
              {order.table_number && (
                <span style={{ fontSize: '0.625rem', color: '#6B675F', fontFamily: NUMBER_FONT, fontVariantNumeric: 'tabular-nums', background: 'rgba(184,164,122,0.15)', padding: '0.125rem 0.5rem', borderRadius: 4, border: '1px solid rgba(184,164,122,0.2)' }}>
                  Table {order.table_number}
                </span>
              )}
            </div>
            <p style={{ margin: 0, color: '#6B675F', fontSize: '0.6875rem', fontFamily: NUMBER_FONT, fontVariantNumeric: 'tabular-nums' }}>
              {formatDateTime(order.created_at)}
            </p>
          </div>

          <div style={{ display: 'flex', alignItems: 'center', gap: 6, flexWrap: 'wrap', flexShrink: 0 }}>
            <span className={`px-2 py-1 rounded text-[0.55rem] font-bold uppercase tracking-tighter border ${getStatusColor(status)}`}>
              {status.charAt(0).toUpperCase() + status.slice(1)}
            </span>
            <span className={`px-2 py-1 rounded text-[0.55rem] font-bold uppercase tracking-tighter border ${getPaymentStatusColor(order.payment_status, order.remaining_balance)}`}>
              {(order.payment_status === 'paid' || (order.remaining_balance !== undefined && order.remaining_balance !== null && order.remaining_balance <= 0)) ? 'Paid' : 'Unpaid'}
            </span>
          </div>
        </div>

        {/* Order Progress Timeline for active orders */}
        {isActive && !isCancelled && (
          <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
            <p style={SECTION_TITLE}>Order Progress</p>
            <div style={{ display: 'flex', flexDirection: 'column', gap: '0.4rem' }}>
              {stages.map((stage, idx) => {
                const reached = idx <= stageIndex;
                const isCurrent = idx === stageIndex;
                const isLast = idx === stages.length - 1;
                return (
                  <div key={stage.key} style={{ display: 'flex', alignItems: 'flex-start', gap: 8 }}>
                    <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', flexShrink: 0, paddingTop: 2 }}>
                      <div
                        style={{
                          width: 24,
                          height: 24,
                          borderRadius: 'var(--d3-input-radius, 8px)',
                          flexShrink: 0,
                          display: 'flex',
                          alignItems: 'center',
                          justifyContent: 'center',
                          background: reached ? 'rgba(184,164,122,0.2)' : 'rgba(11,11,10,0.6)',
                          border: reached ? '1px solid rgba(184,164,122,0.4)' : '1px solid rgba(107,103,95,0.4)',
                          color: reached ? GOLD : '#6B675F',
                          transition: 'all 250ms ease',
                        }}
                      >
                        {reached ? (
                          <svg width="12" height="12" viewBox="0 0 16 16" fill="none">
                            <path d="M3 8.5L6.5 12L13 4.5" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
                          </svg>
                        ) : (
                          <svg width="6" height="6" viewBox="0 0 10 10" fill="none">
                            <circle cx="5" cy="5" r="2" fill="currentColor" />
                          </svg>
                        )}
                      </div>
                      {!isLast && (
                        <div style={{ width: 1, height: 8, marginTop: 2, background: idx < stageIndex ? 'rgba(184,164,122,0.4)' : 'rgba(107,103,95,0.4)', borderRadius: 2, flexShrink: 0 }} />
                      )}
                    </div>
                    <div style={{ flex: 1, minWidth: 0 }}>
                      <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
                        <h4 style={{ fontFamily: 'var(--font-display)', fontSize: '0.8125rem', fontWeight: 500, color: isCurrent ? GOLD : reached ? '#F3EFE7' : '#6B675F', letterSpacing: '-0.01em', lineHeight: 1.25, margin: 0 }}>
                          {stage.title}
                        </h4>
                        {isCurrent && <span className="px-1.5 py-0.5 rounded text-[0.45rem] font-medium uppercase tracking-tight" style={{ background: 'rgba(184,164,122,0.2)', color: GOLD, border: '1px solid rgba(184,164,122,0.3)' }}>Current</span>}
                      </div>
                      <p style={{ fontSize: '0.65rem', color: reached ? '#A8A396' : '#6B675F', margin: '2px 0 0', lineHeight: 1.4 }}>
                        {stage.desc}
                      </p>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        )}

        {/* Items Summary */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
          <p style={SECTION_TITLE}>Items</p>
          <div style={{ display: 'flex', flexDirection: 'column', gap: '0.375rem' }}>
            {foodItems.length === 0 ? (
              <p style={{ margin: 0, padding: '0.5rem 0', fontSize: '0.75rem', color: '#6B675F' }}>No items recorded</p>
            ) : (
              foodItems.slice(0, 3).map((item, i) => {
                const cancelled = (item.status || '').toLowerCase() === 'cancelled';
                const unitPrice = Number(item.price_at_time);
                const lineTotal = unitPrice * item.quantity;
                return (
                  <div key={item.id} style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 8, padding: '0.375rem 0', borderBottom: i === foodItems.length - 1 ? 'none' : '1px solid rgba(184,164,122,0.1)' }}>
                    <div style={{ minWidth: 0, display: 'flex', flexDirection: 'column', gap: 1 }}>
                      <span style={{ fontSize: '0.8125rem', color: cancelled ? '#6B675F' : '#F3EFE7', lineHeight: 1.3, textDecoration: cancelled ? 'line-through' : 'none', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
                        {item.name || 'Item'}{' '}
                        <span style={{ fontSize: '0.7rem', color: '#6B675F', fontFamily: NUMBER_FONT, fontVariantNumeric: 'tabular-nums' }}>
                          ×{item.quantity}
                        </span>
                      </span>
                      <span style={{ fontSize: '0.625rem', color: '#6B675F', fontFamily: NUMBER_FONT, fontVariantNumeric: 'tabular-nums' }}>
                        Unit: {formatPrice(unitPrice, order.currency)} each
                      </span>
                    </div>
                    <span style={{ fontFamily: NUMBER_FONT, fontVariantNumeric: 'tabular-nums', fontSize: '0.875rem', color: GOLD, fontWeight: 600, whiteSpace: 'nowrap', flexShrink: 0 }}>
                      {formatPrice(lineTotal, order.currency)}
                    </span>
                  </div>
                );
              })
            )}
            {foodItems.length > 3 && (
              <p style={{ margin: '0.25rem 0 0', fontSize: '0.6875rem', color: '#6B675F' }}>
                +{foodItems.length - 3} more item{foodItems.length - 3 === 1 ? '' : 's'}
              </p>
            )}
          </div>
        </div>

        {/* Order Summary */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: '0.375rem', borderTop: '1px solid rgba(184,164,122,0.1)', paddingTop: '0.75rem', marginTop: '0.25rem' }}>
          <div style={{ display: 'flex', alignItems: 'baseline', justifyContent: 'space-between', gap: 8 }}>
            <span style={{ fontSize: '0.6875rem', letterSpacing: '0.12em', textTransform: 'uppercase', color: '#6B675F', fontWeight: 500 }}>Order Total</span>
            <span style={{ fontFamily: NUMBER_FONT, fontVariantNumeric: 'tabular-nums', fontSize: '1.125rem', color: GOLD, fontWeight: 600 }}>
              {formatPrice(combinedBillTotal, order.currency)}
            </span>
          </div>
          {order.water_charges && order.water_charges > 0 && (
            <div style={{ display: 'flex', alignItems: 'baseline', justifyContent: 'space-between', gap: 8, fontSize: '0.7rem' }}>
              <span style={{ color: '#6B675F' }}>Water Charges Included</span>
              <span style={{ color: GOLD, fontWeight: 600 }}>{formatPrice(order.water_charges, order.currency)}</span>
            </div>
          )}
          <div style={{ display: 'flex', alignItems: 'baseline', justifyContent: 'space-between', gap: 8, fontSize: '0.7rem' }}>
            <span style={{ color: '#6B675F' }}>Payment</span>
            <span style={{ color: '#A8A396', textTransform: 'capitalize' }}>{order.payment_method || 'pay_at_table'}</span>
          </div>
          {order.customer_name && (
            <div style={{ display: 'flex', alignItems: 'baseline', justifyContent: 'space-between', gap: 8, fontSize: '0.7rem' }}>
              <span style={{ color: '#6B675F' }}>Customer</span>
              <span style={{ color: '#A8A396' }}>{order.customer_name}</span>
            </div>
          )}
        </div>

        {/* Track Order Button for active orders */}
        {isActive && !isCancelled && (
          <button
            onClick={() => onTrackClick(order.id)}
            className="d3-btn-primary"
            style={{
              marginTop: '0.5rem',
              width: '100%',
              display: 'inline-flex',
              alignItems: 'center',
              justifyContent: 'center',
              gap: '0.5rem',
              padding: '0.625rem 1rem',
              fontSize: '0.8125rem',
            }}
          >
            <svg width="16" height="16" viewBox="0 0 16 16" fill="none">
              <path d="M8 3v10M3 8h10" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
            </svg>
            Track Order
          </button>
        )}

        {/* View Details Button for completed/paid orders */}
        {(isCancelled || !isActive) && (
          <Link
            href={`/order/${encodeURIComponent(order.id)}?slug=${encodeURIComponent(hotelSlug)}`}
            className="d3-btn-secondary"
            style={{
              marginTop: '0.5rem',
              width: '100%',
              display: 'inline-flex',
              alignItems: 'center',
              justifyContent: 'center',
              gap: '0.5rem',
              padding: '0.625rem 1rem',
              fontSize: '0.8125rem',
            }}
          >
            <svg width="16" height="16" viewBox="0 0 16 16" fill="none">
              <path d="M8 3v10M3 8h10" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
            </svg>
            View Details
          </Link>
        )}
      </div>
    </div>
  );
}

// ---------------------------------------------------------------------------
// Main Page Component
// ---------------------------------------------------------------------------

export default function YourOrdersPage() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const slug = searchParams.get('slug') || '';
  const table = searchParams.get('table') || '';

  const [orders, setOrders] = useState<Order[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [realtimeOk, setRealtimeOk] = useState(false);
  const [hotelId, setHotelId] = useState<string | null>(null);
  const [activeTab, setActiveTab] = useState('Your Orders');

  const backHref = slug ? `/menu/${encodeURIComponent(slug)}${table ? `?table=${encodeURIComponent(table)}` : ''}` : '/';

  // Resolve hotel_id from slug (or use slug directly if it's already a UUID)
  useEffect(() => {
    if (!slug) return;
    const isUuid = /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i.test(slug);
    if (isUuid) {
      setHotelId(slug);
    } else {
      // Will be resolved from the first API response
      setHotelId(null);
    }
  }, [slug]);

  // Fetch order history
  const loadOrders = useCallback(async (silent = false) => {
    if (!silent) setLoading(true);
    try {
      if (!slug) {
        setOrders([]);
        setError(null); // Don't show error, just empty state
        return;
      }
      // Don't call API if table is missing - show empty state instead
      if (!table) {
        setOrders([]);
        setError(null);
        if (!silent) setLoading(false);
        return;
      }
      const res = await fetch(`/api/public/orders/history?hotel_slug=${encodeURIComponent(slug)}&table_number=${encodeURIComponent(table)}`, { cache: 'no-store' });
      const json = await res.json();
      if (!res.ok || !json.success) {
        if (!silent) { setOrders([]); setError(json.error || 'Failed to load orders'); }
        return;
      }
      setOrders(json.orders || []);
      setError(null);
    } catch {
      if (!silent) { setOrders([]); setError('Could not load orders. Please try again.'); }
    } finally {
      if (!silent) setLoading(false);
    }
  }, [slug, table]);

  // Initial load
  useEffect(() => {
    loadOrders(false);
  }, [loadOrders]);

  // Update hotelId from orders response
  useEffect(() => {
    if (orders.length > 0 && !hotelId) {
      const firstHotelId = orders[0].hotel_id;
      if (firstHotelId) setHotelId(firstHotelId);
    }
  }, [orders, hotelId]);

  // Realtime subscription for all orders
  useEffect(() => {
    if (!hotelId || !isSupabaseConfigured()) return;

    const orderIds = orders.map(o => o.id);
    if (orderIds.length === 0) return;

    let dead = false;
    let channel: ReturnType<typeof supabaseClient.channel> | null = null;

    try {
      channel = supabaseClient
        .channel(`orders-rt-${hotelId}-${table}`)
        .on(
          'postgres_changes' as any,
          {
            event: 'UPDATE',
            schema: 'public',
            table: 'orders',
            filter: `hotel_id=eq.${hotelId}`,
          },
          () => {
            if (!dead) loadOrders(true);
          }
        )
        .subscribe((status: string) => {
          if (!dead) setRealtimeOk(status === 'SUBSCRIBED');
        });
    } catch {}

    return () => {
      dead = true;
      if (channel) supabaseClient.removeChannel(channel).catch(() => {});
      setRealtimeOk(false);
    };
  }, [slug, table, orders, loadOrders]);

  // Polling fallback
  useEffect(() => {
    if (!slug || orders.length === 0) return;

    const activeOrders = orders.filter(o => needsPaymentWatch(o));
    if (activeOrders.length === 0) return;

    const POLL_MS = 5_000;
    let dead = false;

    const tick = async () => {
      if (dead) return;
      await loadOrders(true);
      if (!dead) {
        const currentOrders = orders.filter(o => needsPaymentWatch(o));
        if (currentOrders.length > 0) {
          setTimeout(tick, POLL_MS);
        }
      }
    };

    const timer = setTimeout(tick, POLL_MS);
    return () => {
      dead = true;
      clearTimeout(timer);
    };
  }, [slug, table, orders, loadOrders]);

  const handleTrackClick = (orderId: string) => {
    router.push(`/order/${encodeURIComponent(orderId)}?slug=${encodeURIComponent(slug)}`);
  };

  if (loading) {
    return (
      <div
        className={`min-h-screen ${menuThemeClass(undefined)} flex items-center justify-center`}
        style={{ background: '#0B0B0A', fontFamily: 'var(--font-body)' }}
      >
        <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 12 }}>
          <svg width="28" height="28" viewBox="0 0 24 24" fill="none" style={{ animation: 'spin 1s linear infinite', color: GOLD }}>
            <circle cx="12" cy="12" r="10" stroke="currentColor" strokeOpacity="0.2" strokeWidth="1.5" />
            <path d="M12 2A10 10 0 0 1 22 12" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" />
          </svg>
          <p style={{ margin: 0, fontSize: '0.875rem', color: '#A8A396' }}>Loading your orders…</p>
        </div>
      </div>
    );
  }

  return (
    <div
      className={`min-h-screen ${menuThemeClass(undefined)} pb-28 lg:pl-64`}
      style={{ background: '#0B0B0A', fontFamily: 'var(--font-body)' }}
    >
      <header
        className="sticky top-0 z-30"
        style={{
          background: 'rgba(11, 11, 10, 0.95)',
          borderBottom: '1px solid rgba(184, 164, 122, 0.35)',
          backdropFilter: 'blur(16px)',
          WebkitBackdropFilter: 'blur(16px)',
        }}
      >
        <div className="mx-auto px-4 flex items-center justify-between gap-3" style={{ maxWidth: 'var(--d3-container-max, 480px)', height: '3.5rem' }}>
          <div className="flex items-center gap-3 min-w-0">
            <Link
              href={backHref}
              aria-label="Back to menu"
              style={{
                width: 32, height: 32, borderRadius: 'var(--d3-btn-radius, 12px)',
                display: 'flex', alignItems: 'center', justifyContent: 'center',
                background: 'rgba(11, 11, 10, 0.6)', border: '1px solid rgba(184,164,122,0.2)',
                color: '#6B675F', flexShrink: 0,
              }}
            >
              <svg width="14" height="14" viewBox="0 0 14 14" fill="none">
                <path d="M9 2L4 7L9 12" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
              </svg>
            </Link>
            <Dine3DLogo size="xs" href="/" priority />
            <div className="min-w-0">
              <h1 style={{ fontFamily: 'var(--font-display)', fontSize: '1rem', fontWeight: 500, color: '#F3EFE7', letterSpacing: '-0.01em', lineHeight: 1.2, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap', margin: 0 }}>
                Your Orders
              </h1>
              <p style={{ fontSize: '0.625rem', color: '#6B675F', margin: 0 }}>
                {table ? `Table ${table}` : 'No table selected'}
              </p>
            </div>
          </div>
          <div className="flex items-center gap-2 flex-shrink-0">
            {realtimeOk && (
              <span className="px-2 py-1 rounded text-[0.5rem] font-medium uppercase tracking-tight" style={{ background: 'rgba(16,185,129,0.2)', color: '#10B981', border: '1px solid rgba(16,185,129,0.3)' }}>
                Live
              </span>
            )}
          </div>
        </div>
      </header>

      <main className="mx-auto px-4 py-4 pb-8 lg:max-w-5xl" style={{ maxWidth: 'var(--d3-container-max, 480px)' }}>
        {error && !orders.length ? (
          <div style={{ ...PANEL, padding: '2rem', textAlign: 'center' }}>
            <p style={{ margin: 0, fontSize: '0.875rem', color: '#A8A396', lineHeight: 1.7 }}>{error}</p>
          </div>
        ) : orders.length === 0 ? (
          <div style={{ ...PANEL, padding: '2rem', textAlign: 'center' }}>
            <svg width="48" height="48" viewBox="0 0 48 48" fill="none" style={{ color: '#6B675F', opacity: 0.5, marginBottom: 12 }} aria-hidden="true">
              <path d="M24 4L42 14V34L24 44L6 34V14L24 4Z" stroke="currentColor" strokeWidth="1.3" strokeLinejoin="round" />
              <path d="M24 4V44M6 14L24 24L42 14" stroke="currentColor" strokeWidth="1" strokeOpacity="0.5" strokeLinejoin="round" />
            </svg>
            <p style={{ margin: '0 0 8px', fontSize: '1rem', color: '#F3EFE7', fontWeight: 500 }}>
              {table ? 'No orders yet' : 'Select a table to view orders'}
            </p>
            <p style={{ margin: 0, fontSize: '0.8125rem', color: '#6B675F', lineHeight: 1.6, maxWidth: '30ch' }}>
              {table
                ? 'When you place an order from this table, it will appear here with live tracking.'
                : 'Scan a table QR code or navigate from the menu to see your orders.'}
            </p>
          </div>
        ) : (
          <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
            {orders.map((order) => (
              <OrderCard
                key={order.id}
                order={order}
                hotelSlug={slug}
                onTrackClick={handleTrackClick}
              />
            ))}
          </div>
        )}
      </main>

      <style jsx global>{`
        @keyframes spin {
          to { transform: rotate(360deg); }
        }
        .d3-btn-primary {
          background: linear-gradient(135deg, #B8A47A 0%, #D4AF6A 100%);
          border: none;
          color: #0B0B0A;
          font-weight: 600;
          border-radius: var(--d3-btn-radius, 12px);
          cursor: pointer;
          transition: all 0.2s ease;
          box-shadow: 0 4px 20px rgba(184, 164, 122, 0.3);
        }
        .d3-btn-primary:hover {
          transform: translateY(-1px);
          box-shadow: 0 6px 28px rgba(184, 164, 122, 0.4);
        }
        .d3-btn-primary:active {
          transform: translateY(0);
        }
        .d3-btn-secondary {
          background: rgba(11, 11, 10, 0.8);
          border: 1px solid rgba(184, 164, 122, 0.3);
          color: #F3EFE7;
          font-weight: 600;
          border-radius: var(--d3-btn-radius, 12px);
          cursor: pointer;
          transition: all 0.2s ease;
        }
        .d3-btn-secondary:hover {
          background: rgba(184, 164, 122, 0.15);
          border-color: rgba(184, 164, 122, 0.5);
        }
      `}</style>

      <BottomNav
        variant="bottom"
        activeTab={activeTab}
        cartCount={0}
        menuSlug={slug || null}
        tableNumber={table || null}
        onTabChange={setActiveTab}
      />
      <BottomNav
        variant="sidebar"
        activeTab={activeTab}
        cartCount={0}
        menuSlug={slug || null}
        tableNumber={table || null}
        onTabChange={setActiveTab}
      />
    </div>
  );
}