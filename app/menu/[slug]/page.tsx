'use client';

import React, { useState, useEffect, useCallback, useMemo, Suspense } from 'react';
import { useSearchParams, useRouter } from 'next/navigation';
import dynamic from 'next/dynamic';
import { formatPrice } from '@/lib/menu';
import Dine3DLogo from '@/components/Dine3DLogo';

// Lazy-load 3D viewer
const FoodModelViewer = dynamic(() => import('@/components/3d/FoodModelViewer'), { ssr: false });

/* ============================================================
   LIVE TYPES — every field below comes from the database.
   Nothing here is invented: a value the restaurant has not
   stored is simply absent and is not rendered.
   ============================================================ */

interface PublicMenuItem {
  id: string;
  category_id: string | null;
  name: string;
  description: string | null;
  price: number;
  image_url: string | null;
  model_url_glb: string | null;
  model_url_usdz: string | null;
  is_veg: boolean;
  calories: number | null;
  preparation_time_mins: number | null;
  ingredients: string[] | null;
  allergens: string[] | null;
  dietary_tags: string[] | null;
  rating: number | null;
  order_count: number | null;
  is_featured: boolean;
  is_popular: boolean;
}

interface PublicCategory {
  id: string;
  name: string;
  position: number | null;
}

interface PublicHotel {
  id: string;
  name: string;
  slug: string;
  logo_url: string | null;
  currency: string | null;
  welcome_text: string | null;
  primary_color: string | null;
  secondary_color: string | null;
  menu_style: string | null;
  card_style: string | null;
  dark_mode: boolean | null;
  typography: string | null;
  tax_rate: number | null;
  service_charge: number | null;
  city: string | null;
}

interface CartItem {
  menuItem: PublicMenuItem;
  quantity: number;
  notes?: string;
}

/* ============================================================
   3D FOOD DETAIL MODAL
   ============================================================ */
function FoodDetailModal({
  item,
  currency,
  onClose,
  onAddToCart,
  cartQty,
}: {
  item: PublicMenuItem;
  currency: string | null;
  onClose: () => void;
  onAddToCart: (item: PublicMenuItem, qty: number, notes: string) => void;
  cartQty: number;
}) {
  const [qty, setQty] = useState(Math.max(1, cartQty));
  const [notes, setNotes] = useState('');
  const has3D = Boolean(item.model_url_glb?.trim());
  const image = item.image_url?.trim() || '';
  const ingredients = Array.isArray(item.ingredients) ? item.ingredients : [];
  const rating = Number(item.rating) || 0;
  const orderCount = Number(item.order_count) || 0;

  return (
    <div
      className="fixed inset-0 z-50 flex items-end sm:items-center justify-center"
      style={{ background: 'rgba(0,0,0,0.8)', backdropFilter: 'blur(8px)' }}
      onClick={(e) => e.target === e.currentTarget && onClose()}
    >
      <div
        className="w-full sm:max-w-xl max-h-[90vh] overflow-y-auto"
        style={{
          background: 'var(--bg-surface)',
          borderTop: '1px solid var(--border-light)',
          borderLeft: '1px solid var(--border-subtle)',
          borderRight: '1px solid var(--border-subtle)',
          borderRadius: '16px 16px 0 0',
          boxShadow: '0 -32px 80px rgba(0,0,0,0.8)',
        }}
      >
        {/* 3D viewer — only when the restaurant actually uploaded a model */}
        <div
          className="relative"
          style={{
            height: 280,
            background: 'var(--bg-secondary)',
            borderRadius: '16px 16px 0 0',
            overflow: 'hidden',
          }}
        >
          {has3D ? (
            <FoodModelViewer
              modelUrlGlb={item.model_url_glb ?? undefined}
              modelUrlUsdz={item.model_url_usdz ?? undefined}
              altText={item.name}
              autoRotate
              className="h-full w-full"
            />
          ) : image ? (
            <img
              src={image}
              alt={item.name}
              style={{ width: '100%', height: '100%', objectFit: 'cover' }}
            />
          ) : (
            <NoAssetPanel label="No 3D model" height="100%" />
          )}

          {/* Close button */}
          <button
            onClick={onClose}
            style={{
              position: 'absolute', top: 12, right: 12,
              width: 32, height: 32, borderRadius: '50%',
              background: 'rgba(0,0,0,0.7)',
              border: '1px solid var(--border-subtle)',
              color: 'var(--text-primary)',
              display: 'flex', alignItems: 'center', justifyContent: 'center',
              cursor: 'pointer',
            }}
          >
            <svg width="12" height="12" viewBox="0 0 12 12" fill="none">
              <path d="M1 1L11 11M11 1L1 11" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" />
            </svg>
          </button>

          {/* Veg indicator */}
          <div style={{ position: 'absolute', top: 12, left: 12 }}>
            <span
              style={{
                display: 'inline-flex', alignItems: 'center', gap: 5,
                padding: '0.1875rem 0.5rem',
                borderRadius: 4,
                fontSize: '0.5625rem',
                fontWeight: 600,
                letterSpacing: '0.12em',
                textTransform: 'uppercase',
                background: 'rgba(11,11,10,0.75)',
                border: '1px solid var(--border-warm)',
                color: item.is_veg ? 'var(--gold)' : 'var(--text-dimmed)',
              }}
            >
              <span
                style={{
                  width: 6, height: 6, borderRadius: 1,
                  border: `1px solid ${item.is_veg ? 'var(--gold-dim)' : 'var(--text-dimmed)'}`,
                }}
              />
              {item.is_veg ? 'Veg' : 'Non-veg'}
            </span>
          </div>
        </div>

        {/* Content */}
        <div className="p-5 flex flex-col gap-4">
          {/* Name + Price */}
          <div className="flex items-start justify-between gap-4">
            <div>
              <h2
                style={{
                  fontFamily: 'var(--font-display)',
                  fontSize: '1.5rem',
                  fontWeight: 500,
                  color: 'var(--text-primary)',
                  letterSpacing: '-0.015em',
                  lineHeight: 1.2,
                  marginBottom: 4,
                }}
              >
                {item.name}
              </h2>
              {item.description ? (
                <p style={{ fontSize: '0.875rem', color: 'var(--text-muted)', lineHeight: 1.6 }}>
                  {item.description}
                </p>
              ) : null}
            </div>
            <span
              style={{
                fontFamily: 'var(--font-display)',
                fontSize: '1.5rem',
                fontWeight: 500,
                color: 'var(--gold)',
                letterSpacing: '-0.02em',
                flexShrink: 0,
              }}
            >
              {formatPrice(Number(item.price) || 0, currency)}
            </span>
          </div>

          {/* Meta row — only the fields the restaurant stored */}
          {(item.preparation_time_mins || item.calories || rating > 0) && (
            <div className="flex items-center gap-4 flex-wrap">
              {item.preparation_time_mins ? (
                <span
                  style={{
                    display: 'inline-flex', alignItems: 'center', gap: 5,
                    fontSize: '0.6875rem', color: 'var(--text-muted)',
                  }}
                >
                  <svg width="12" height="12" viewBox="0 0 12 12" fill="none"><circle cx="6" cy="6" r="4.5" stroke="currentColor" strokeWidth="1" /><path d="M6 3.5V6L8 7.5" stroke="currentColor" strokeWidth="1" strokeLinecap="round" /></svg>
                  {item.preparation_time_mins} min
                </span>
              ) : null}
              {item.calories ? (
                <span
                  style={{
                    display: 'inline-flex', alignItems: 'center', gap: 5,
                    fontSize: '0.6875rem', color: 'var(--text-muted)',
                  }}
                >
                  <svg width="12" height="12" viewBox="0 0 12 12" fill="none"><path d="M6 2C6 2 3 3.5 2 6C3.5 8 6 9 6 9C6 9 8.5 8 10 6C9 3.5 6 2 6 2Z" stroke="currentColor" strokeWidth="1" strokeLinejoin="round" /></svg>
                  {item.calories} kcal
                </span>
              ) : null}
              {rating > 0 ? (
                <span
                  style={{
                    display: 'inline-flex', alignItems: 'center', gap: 4,
                    fontSize: '0.6875rem', color: 'var(--gold)',
                  }}
                >
                  ★ {rating.toFixed(1)}
                  {orderCount > 0 ? ` (${orderCount} orders)` : ''}
                </span>
              ) : null}
            </div>
          )}

          {/* Ingredients */}
          {ingredients.length > 0 && (
            <div>
              <p style={{ fontSize: '0.6875rem', color: 'var(--text-dimmed)', fontWeight: 600, letterSpacing: '0.1em', textTransform: 'uppercase', marginBottom: 6 }}>
                Ingredients
              </p>
              <div className="flex flex-wrap gap-1.5">
                {ingredients.map((ing, i) => (
                  <span
                    key={i}
                    style={{
                      padding: '0.2rem 0.625rem',
                      borderRadius: 100,
                      fontSize: '0.6875rem',
                      background: 'var(--bg-surface-2)',
                      border: '1px solid var(--border-subtle)',
                      color: 'var(--text-secondary)',
                    }}
                  >
                    {ing}
                  </span>
                ))}
              </div>
            </div>
          )}

          {/* Divider */}
          <div className="d3-divider" />

          {/* Special instructions */}
          <div>
            <label className="d3-label">Special Instructions</label>
            <textarea
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              placeholder="Any request for the kitchen"
              rows={2}
              style={{
                width: '100%', resize: 'none',
                padding: '0.75rem', borderRadius: 8,
                background: 'var(--bg-surface-2)',
                border: '1px solid var(--border-warm)',
                color: 'var(--text-primary)',
                fontSize: '0.875rem',
                outline: 'none',
              }}
            />
          </div>

          {/* Quantity + Add to Cart */}
          <div className="flex items-center gap-3">
            {/* Qty selector */}
            <div
              className="flex items-center gap-2"
              style={{
                background: 'var(--bg-surface-2)',
                border: '1px solid var(--border-subtle)',
                borderRadius: 100,
                padding: '0.25rem',
              }}
            >
              <button
                onClick={() => setQty(Math.max(1, qty - 1))}
                style={{
                  width: 32, height: 32, borderRadius: '50%',
                  background: qty <= 1 ? 'transparent' : 'var(--bg-surface-3)',
                  border: 'none', cursor: 'pointer',
                  color: 'var(--text-primary)',
                  display: 'flex', alignItems: 'center', justifyContent: 'center',
                  fontSize: '1rem', lineHeight: 1,
                }}
              >
                −
              </button>
              <span style={{ fontFamily: 'var(--font-display)', fontSize: '1.125rem', color: 'var(--text-primary)', minWidth: 20, textAlign: 'center' }}>
                {qty}
              </span>
              <button
                onClick={() => setQty(qty + 1)}
                style={{
                  width: 32, height: 32, borderRadius: 5,
                  background: 'var(--bg-surface-3)',
                  border: '1px solid var(--border-light)',
                  cursor: 'pointer',
                  color: 'var(--gold-pale)',
                  display: 'flex', alignItems: 'center', justifyContent: 'center',
                  fontSize: '1rem', lineHeight: 1, fontWeight: 500,
                }}
              >
                +
              </button>
            </div>

            {/* Add to Cart */}
            <button
              onClick={() => { onAddToCart(item, qty, notes); onClose(); }}
              className="d3-btn-primary"
              style={{ flex: 1, justifyContent: 'center', padding: '0.875rem', fontSize: '0.9375rem' }}
            >
              Add to Order · {formatPrice((Number(item.price) || 0) * qty, currency)}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}

/* ============================================================
   NO-ASSET PANEL — the honest placeholder for a dish that has
   neither a stored 3D model nor a stored photograph.
   ============================================================ */
function NoAssetPanel({ label, height }: { label: string; height?: number | string }) {
  return (
    <div
      className="flex flex-col items-center justify-center gap-3 w-full"
      style={{ height, background: 'var(--bg-secondary)', color: 'var(--text-dimmed)' }}
    >
      <svg width="34" height="34" viewBox="0 0 34 34" fill="none" style={{ opacity: 0.5 }} aria-hidden="true">
        <path d="M17 3L30 10.5V24L17 31.5L4 24V10.5L17 3Z" stroke="currentColor" strokeWidth="1.1" strokeLinejoin="round" />
        <path d="M17 3V31.5M4 10.5L17 18L30 10.5" stroke="currentColor" strokeWidth="0.9" strokeOpacity="0.5" strokeLinejoin="round" />
      </svg>
      <span style={{ fontSize: '0.5625rem', fontWeight: 600, letterSpacing: '0.16em', textTransform: 'uppercase' }}>
        {label}
      </span>
    </div>
  );
}

/* ============================================================
   CART DRAWER
   ============================================================ */
function CartDrawer({
  cart,
  currency,
  onClose,
  onAdd,
  onRemove,
  totalPrice,
  tableNumber,
  hotelId,
  slug,
  router,
}: {
  cart: CartItem[];
  currency: string | null;
  onClose: () => void;
  onAdd: (item: PublicMenuItem) => void;
  onRemove: (id: string) => void;
  totalPrice: number;
  tableNumber: string;
  hotelId: string;
  slug: string;
  router: any;
}) {
  const [customerName, setCustomerName] = useState('');
  const [orderNotes, setOrderNotes] = useState('');
  const [payment, setPayment] = useState<'pay_at_table' | 'card' | 'upi'>('pay_at_table');
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handlePlaceOrder = async () => {
    if (cart.length === 0) return;
    setSubmitting(true);
    setError(null);

    try {
      const res = await fetch('/api/orders/create', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          hotel_id: hotelId,
          table_number: tableNumber,
          customer_name: customerName.trim() || undefined,
          notes: orderNotes.trim() || undefined,
          payment_method: payment,
          items: cart.map((c) => ({
            menu_item_id: c.menuItem.id,
            quantity: c.quantity,
            price_at_time: Number(c.menuItem.price) || 0,
            notes: c.notes || undefined,
          })),
        }),
      });
      const json = await res.json();

      if (!res.ok || !json.success) {
        throw new Error(json.error || 'We could not send your order. Please try again.');
      }

      // The server assigns the permanent reference number (DINE-XXXXX) via a
      // database trigger; the create route returns it authoritatively.
      const orderNumber = json.orderNumber || json.order?.order_number || null;
      if (!orderNumber) {
        throw new Error(json.error || 'Order was placed but no reference number was assigned.');
      }
      router.push(`/order/${encodeURIComponent(orderNumber)}?slug=${encodeURIComponent(slug)}`);
    } catch (err: any) {
      setError(err.message || 'We could not send your order. Please try again.');
      setSubmitting(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex justify-end" onClick={(e) => e.target === e.currentTarget && onClose()}>
      <div
        style={{
          width: '100%', maxWidth: 400,
          background: 'var(--bg-surface)',
          borderLeft: '1px solid var(--border-subtle)',
          display: 'flex', flexDirection: 'column',
          height: '100%', overflow: 'hidden',
        }}
      >
        {/* Header */}
        <div
          className="flex items-center justify-between px-5 py-4"
          style={{ borderBottom: '1px solid var(--border-subtle)' }}
        >
          <div>
            <h3 style={{ fontFamily: 'var(--font-display)', fontSize: '1.25rem', fontWeight: 500, color: 'var(--text-primary)', letterSpacing: '-0.01em' }}>
              Your Order
            </h3>
            <span style={{ fontSize: '0.6875rem', color: 'var(--text-dimmed)' }}>
              {cart.reduce((s, c) => s + c.quantity, 0)} item{cart.reduce((s, c) => s + c.quantity, 0) === 1 ? '' : 's'}
            </span>
          </div>
          <button
            onClick={onClose}
            style={{
              width: 32, height: 32, borderRadius: '50%',
              background: 'var(--bg-surface-2)',
              border: '1px solid var(--border-subtle)',
              color: 'var(--text-muted)',
              display: 'flex', alignItems: 'center', justifyContent: 'center',
              cursor: 'pointer',
            }}
          >
            <svg width="12" height="12" viewBox="0 0 12 12" fill="none">
              <path d="M1 1L11 11M11 1L1 11" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" />
            </svg>
          </button>
        </div>

        {/* Cart Items */}
        <div className="flex-1 overflow-y-auto px-4 py-3 flex flex-col gap-2">
          {cart.map(({ menuItem, quantity }) => (
            <div
              key={menuItem.id}
              className="flex items-center justify-between gap-3 p-3 rounded-lg"
              style={{ background: 'var(--bg-surface-2)', border: '1px solid var(--border-subtle)' }}
            >
              <div className="flex-1 min-w-0">
                <p style={{ fontWeight: 600, fontSize: '0.875rem', color: 'var(--text-primary)', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                  {menuItem.name}
                </p>
                <p style={{ fontSize: '0.6875rem', color: 'var(--text-dimmed)' }}>
                  {formatPrice(Number(menuItem.price) || 0, currency)} each
                </p>
              </div>
              <div className="flex items-center gap-2">
                <button
                  onClick={() => onRemove(menuItem.id)}
                  style={{
                    width: 26, height: 26, borderRadius: '50%',
                    background: 'var(--bg-surface-3)',
                    border: '1px solid var(--border-subtle)',
                    color: 'var(--text-muted)', cursor: 'pointer',
                    display: 'flex', alignItems: 'center', justifyContent: 'center',
                    fontSize: '0.875rem', lineHeight: 1,
                  }}
                >
                  −
                </button>
                <span style={{ fontFamily: 'var(--font-display)', fontSize: '1rem', color: 'var(--text-primary)', minWidth: 16, textAlign: 'center' }}>
                  {quantity}
                </span>
                <button
                  onClick={() => onAdd(menuItem)}
                  style={{
                    width: 26, height: 26, borderRadius: 5,
                    background: 'var(--bg-surface-3)',
                    border: '1px solid var(--border-light)',
                    color: 'var(--gold-pale)', cursor: 'pointer',
                    display: 'flex', alignItems: 'center', justifyContent: 'center',
                    fontSize: '0.875rem', lineHeight: 1, fontWeight: 500,
                  }}
                >
                  +
                </button>
                <span style={{ fontFamily: 'var(--font-display)', fontSize: '1rem', color: 'var(--gold)', minWidth: 52, textAlign: 'right' }}>
                  {formatPrice((Number(menuItem.price) || 0) * quantity, currency)}
                </span>
              </div>
            </div>
          ))}

          {/* Order details form */}
          <div className="mt-3 flex flex-col gap-3">
            <div className="d3-divider" />
            <div>
              <label className="d3-label">Your Name (optional)</label>
              <input
                type="text"
                value={customerName}
                onChange={(e) => setCustomerName(e.target.value)}
                placeholder="Name for the order"
                className="d3-input"
              />
            </div>
            <div>
              <label className="d3-label">Notes for Chef (optional)</label>
              <input
                type="text"
                value={orderNotes}
                onChange={(e) => setOrderNotes(e.target.value)}
                placeholder="Allergies or preferences"
                className="d3-input"
              />
            </div>
            <div>
              <label className="d3-label">Payment Method</label>
              <div className="flex gap-2">
                {[
                  { key: 'pay_at_table', label: 'Pay at Table' },
                  { key: 'card', label: 'Card' },
                  { key: 'upi', label: 'UPI' },
                ].map((opt) => (
                  <button
                    key={opt.key}
                    onClick={() => setPayment(opt.key as any)}
                    style={{
                      flex: 1,
                      padding: '0.5rem 0.5rem',
                      borderRadius: 8,
                      fontSize: '0.6875rem', fontWeight: 600,
                      cursor: 'pointer',
                      border: payment === opt.key
                        ? '1px solid rgba(201,169,110,0.3)'
                        : '1px solid var(--border-subtle)',
                      background: payment === opt.key
                        ? 'rgba(201,169,110,0.08)'
                        : 'var(--bg-surface-2)',
                      color: payment === opt.key ? 'var(--gold)' : 'var(--text-muted)',
                      transition: 'all 200ms',
                    }}
                  >
                    {opt.label}
                  </button>
                ))}
              </div>
            </div>
          </div>
        </div>

        {/* Footer — Total + Place Order */}
        <div
          className="px-4 py-4 flex flex-col gap-3"
          style={{ borderTop: '1px solid var(--border-subtle)' }}
        >
          <div className="flex items-center justify-between">
            <span style={{ color: 'var(--text-muted)', fontSize: '0.875rem' }}>Total</span>
            <span style={{ fontFamily: 'var(--font-display)', fontSize: '1.5rem', fontWeight: 500, color: 'var(--gold)', letterSpacing: '-0.02em' }}>
              {formatPrice(totalPrice, currency)}
            </span>
          </div>
          {error && (
            <p
              role="alert"
              style={{
                fontSize: '0.75rem',
                color: 'var(--text-secondary)',
                background: 'var(--bg-surface-2)',
                border: '1px solid var(--border-warm)',
                borderRadius: 8,
                padding: '0.625rem 0.75rem',
                lineHeight: 1.5,
              }}
            >
              {error}
            </p>
          )}
          <button
            onClick={handlePlaceOrder}
            disabled={submitting || cart.length === 0}
            className="d3-btn-primary w-full"
            style={{ justifyContent: 'center', padding: '0.875rem', fontSize: '1rem', opacity: submitting ? 0.6 : 1, cursor: submitting ? 'not-allowed' : 'pointer' }}
          >
            {submitting ? (
              <>
                <svg className="animate-spin" width="16" height="16" viewBox="0 0 16 16" fill="none">
                  <circle cx="8" cy="8" r="6" stroke="currentColor" strokeWidth="2" strokeOpacity="0.3" />
                  <path d="M8 2A6 6 0 0 1 14 8" stroke="currentColor" strokeWidth="2" strokeLinecap="round" />
                </svg>
                Sending Order...
              </>
            ) : 'Place Order →'}
          </button>
        </div>
      </div>
    </div>
  );
}

/* ============================================================
   MENU CONTENT
   ============================================================ */
const UNCATEGORISED = '__uncategorised__';

function MenuContent({ slug }: { slug: string }) {
  const searchParams = useSearchParams();
  const router = useRouter();

  const [hotel, setHotel] = useState<PublicHotel | null>(null);
  const [menuItems, setMenuItems] = useState<PublicMenuItem[]>([]);
  const [categories, setCategories] = useState<PublicCategory[]>([]);
  const [loading, setLoading] = useState(true);
  const [loadError, setLoadError] = useState<string | null>(null);

  const [selectedCategory, setSelectedCategory] = useState('All');
  const [cart, setCart] = useState<CartItem[]>([]);
  const [isCartOpen, setIsCartOpen] = useState(false);
  const [inspectItem, setInspectItem] = useState<PublicMenuItem | null>(null);
  const [search, setSearch] = useState('');

  const loadMenu = useCallback(async (isPolling = false) => {
    try {
      if (!isPolling) {
        setLoading(true);
      }
      setLoadError(null);

      const res = await fetch(`/api/public/menu?slug=${encodeURIComponent(slug)}`);
      const json = await res.json();

      if (!res.ok || !json.success) {
        if (!isPolling) {
          setHotel(null);
          setMenuItems([]);
          setCategories([]);
          setLoadError(json.error || 'This menu is not available right now.');
        }
        return;
      }

      // Preserve cart state by only updating menu items and categories
      // Don't reset hotel on polling updates to avoid flickering
      if (!isPolling) {
        setHotel(json.hotel as PublicHotel);
      }
      setMenuItems((json.menuItems || []) as PublicMenuItem[]);
      setCategories((json.categories || []) as PublicCategory[]);
    } catch {
      if (!isPolling) {
        setHotel(null);
        setMenuItems([]);
        setCategories([]);
        setLoadError('This menu could not be loaded. Please refresh to try again.');
      }
    } finally {
      if (!isPolling) {
        setLoading(false);
      }
    }
  }, [slug]);

  // Initial load
  useEffect(() => {
    loadMenu(false);
  }, [loadMenu]);

  // Polling: refresh menu data every 2 seconds without losing cart state
  useEffect(() => {
    const interval = setInterval(() => {
      loadMenu(true);
    }, 2000);

    return () => clearInterval(interval);
  }, [loadMenu]);

  const currency = hotel?.currency ?? null;

  // Category pills come from the restaurant's own categories. "Uncategorised"
  // only appears when there is genuinely at least one uncategorised dish.
  const pills = useMemo(() => {
    const names = categories.map((c) => c.name).filter(Boolean);
    const hasUncategorised = menuItems.some((i) => !i.category_id || !categories.some((c) => c.id === i.category_id));
    return ['All', ...names, ...(hasUncategorised ? ['Uncategorised'] : [])];
  }, [categories, menuItems]);

  const categoryNameOf = useCallback(
    (item: PublicMenuItem) => {
      if (!item.category_id) return 'Uncategorised';
      return categories.find((c) => c.id === item.category_id)?.name || 'Uncategorised';
    },
    [categories]
  );

  const filteredItems = useMemo(() => {
    const term = search.trim().toLowerCase();
    return menuItems.filter((item) => {
      const catMatch =
        selectedCategory === 'All' ||
        (selectedCategory === 'Uncategorised'
          ? categoryNameOf(item) === 'Uncategorised'
          : categoryNameOf(item) === selectedCategory);
      const searchMatch =
        !term ||
        item.name.toLowerCase().includes(term) ||
        (item.description || '').toLowerCase().includes(term);
      return catMatch && searchMatch;
    });
  }, [menuItems, selectedCategory, search, categoryNameOf]);

  const addToCart = (item: PublicMenuItem, qty = 1) => {
    setCart((prev) => {
      const existing = prev.find((c) => c.menuItem.id === item.id);
      if (existing) return prev.map((c) => (c.menuItem.id === item.id ? { ...c, quantity: c.quantity + qty } : c));
      return [...prev, { menuItem: item, quantity: qty }];
    });
  };

  const removeFromCart = (itemId: string) => {
    setCart((prev) =>
      prev
        .map((c) => (c.menuItem.id === itemId ? { ...c, quantity: c.quantity - 1 } : c))
        .filter((c) => c.quantity > 0)
    );
  };

  const totalCount = cart.reduce((s, c) => s + c.quantity, 0);
  const totalPrice = cart.reduce((s, c) => s + (Number(c.menuItem.price) || 0) * c.quantity, 0);

  const featured = filteredItems.filter((i) => i.is_featured);
  const popular = filteredItems.filter((i) => i.is_popular && !i.is_featured);
  const rest = filteredItems.filter((i) => !i.is_featured && !i.is_popular);

  if (loading) {
    return (
      <div
        className="min-h-screen flex items-center justify-center"
        style={{ background: 'var(--bg-primary)', fontFamily: 'var(--font-body)' }}
      >
        <div style={{ width: 40, height: 40, borderRadius: '50%', border: '2px solid rgba(201,169,110,0.2)', borderTop: '2px solid var(--gold)', animation: 'spin 1s linear infinite' }} />
      </div>
    );
  }

  if (!hotel) {
    return (
      <div
        className="min-h-screen flex items-center justify-center px-6"
        style={{ background: 'var(--bg-primary)', fontFamily: 'var(--font-body)' }}
      >
        <div className="flex flex-col items-center gap-4 text-center" style={{ maxWidth: 420 }}>
          <svg width="44" height="44" viewBox="0 0 44 44" fill="none" style={{ color: 'var(--text-dimmed)', opacity: 0.5 }} aria-hidden="true">
            <circle cx="22" cy="22" r="18" stroke="currentColor" strokeWidth="1.3" />
            <path d="M15 22h14" stroke="currentColor" strokeWidth="1.3" strokeLinecap="round" />
          </svg>
          <h1 style={{ fontFamily: 'var(--font-display)', fontSize: '1.375rem', fontWeight: 500, color: 'var(--text-primary)' }}>
            Menu unavailable
          </h1>
          <p style={{ margin: 0, fontSize: '0.875rem', lineHeight: 1.7, color: 'var(--text-muted)' }}>
            {loadError || 'No menu was found for this restaurant.'}
          </p>
        </div>
      </div>
    );
  }

  return (
    <div
      className="min-h-screen"
      style={{ background: 'var(--bg-primary)', fontFamily: 'var(--font-body)', paddingBottom: '6rem' }}
    >
      {/* Sticky top nav */}
      <header
        className="sticky top-0 z-30"
        style={{
          background: 'rgba(11,10,8,0.95)',
          backdropFilter: 'blur(20px)',
          borderBottom: '1px solid var(--border-subtle)',
        }}
      >
        <div
          className="flex items-center justify-between px-4 py-3"
          style={{ maxWidth: 720, margin: '0 auto' }}
        >
          <div className="flex items-center gap-2.5">
            {/* When the restaurant has uploaded no logo, fall back to the
                official Dine3D asset rather than any redrawn mark. */}
            {hotel.logo_url?.trim() ? (
              <img
                src={hotel.logo_url}
                alt={hotel.name}
                style={{ width: 20, height: 20, objectFit: 'contain', borderRadius: 4 }}
              />
            ) : (
              <Dine3DLogo size="xs" href={null} />
            )}
            <div>
              <h1 style={{ fontFamily: 'var(--font-display)', fontSize: '1rem', fontWeight: 500, color: 'var(--text-primary)', lineHeight: 1.2 }}>
                {hotel.name}
              </h1>
              {hotel.city?.trim() ? (
                <span style={{ fontSize: '0.6rem', color: 'var(--text-dimmed)', letterSpacing: '0.14em', textTransform: 'uppercase' }}>
                  {hotel.city}
                </span>
              ) : null}
            </div>
          </div>

          {/* Cart button */}
          <button
            onClick={() => setIsCartOpen(true)}
            style={{
              display: 'flex', alignItems: 'center', gap: 7,
              padding: '0.5rem 0.875rem',
              borderRadius: 5,
              background: 'var(--bg-surface)',
              border: totalCount > 0 ? '1px solid var(--border-medium)' : '1px solid var(--border-warm)',
              color: totalCount > 0 ? 'var(--gold-pale)' : 'var(--text-muted)',
              fontWeight: 500, fontSize: '0.75rem',
              letterSpacing: '0.02em',
              cursor: 'pointer',
              transition: 'all 200ms',
            }}
          >
            <svg width="14" height="14" viewBox="0 0 14 14" fill="none">
              <path d="M1 1H3L4.5 8.5H10.5L12 3.5H4" stroke="currentColor" strokeWidth="1.2" strokeLinecap="round" strokeLinejoin="round" />
              <circle cx="5.5" cy="11.5" r="1" fill="currentColor" />
              <circle cx="9.5" cy="11.5" r="1" fill="currentColor" />
            </svg>
            {totalCount > 0 ? `${totalCount} item${totalCount > 1 ? 's' : ''} · ${formatPrice(totalPrice, currency)}` : 'Order'}
          </button>
        </div>

        {/* Search + Categories */}
        {menuItems.length > 0 && (
          <div style={{ maxWidth: 720, margin: '0 auto', padding: '0 1rem 0.625rem' }}>
            {/* Search */}
            <div className="relative mb-2">
              <svg
                width="14" height="14" viewBox="0 0 14 14" fill="none"
                style={{ position: 'absolute', left: 10, top: '50%', transform: 'translateY(-50%)', color: 'var(--text-dimmed)' }}
              >
                <circle cx="6" cy="6" r="4.5" stroke="currentColor" strokeWidth="1.2" />
                <path d="M9.5 9.5L12.5 12.5" stroke="currentColor" strokeWidth="1.2" strokeLinecap="round" />
              </svg>
              <input
                type="text"
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                placeholder="Search this menu"
                style={{
                  width: '100%',
                  padding: '0.5rem 0.875rem 0.5rem 2rem',
                  borderRadius: 8,
                  background: 'var(--bg-surface-2)',
                  border: '1px solid var(--border-subtle)',
                  color: 'var(--text-primary)',
                  fontSize: '0.8125rem',
                  outline: 'none',
                }}
              />
            </div>

            {/* Category pills */}
            {pills.length > 1 && (
              <div className="flex gap-1.5 overflow-x-auto" style={{ paddingBottom: 2 }}>
                {pills.map((cat) => (
                  <button
                    key={cat}
                    onClick={() => setSelectedCategory(cat)}
                    style={{
                      padding: '0.3125rem 0.875rem',
                      borderRadius: 4,
                      fontSize: '0.6875rem', fontWeight: 500,
                      letterSpacing: '0.06em',
                      cursor: 'pointer',
                      whiteSpace: 'nowrap',
                      border: selectedCategory === cat ? '1px solid var(--border-medium)' : '1px solid var(--border-warm)',
                      background: selectedCategory === cat ? 'var(--bg-surface-2)' : 'transparent',
                      color: selectedCategory === cat ? 'var(--gold-pale)' : 'var(--text-muted)',
                      transition: 'all 200ms',
                    }}
                  >
                    {cat}
                  </button>
                ))}
              </div>
            )}
          </div>
        )}
      </header>

      {/* Menu content */}
      <main style={{ maxWidth: 720, margin: '0 auto', padding: '1.5rem 1rem' }}>
        {hotel.welcome_text?.trim() && menuItems.length > 0 ? (
          <p
            style={{
              margin: '0 0 1.75rem',
              fontSize: '0.8125rem',
              lineHeight: 1.7,
              color: 'var(--text-muted)',
              textAlign: 'center',
            }}
          >
            {hotel.welcome_text}
          </p>
        ) : null}

        {menuItems.length === 0 ? (
          <MenuEmptyState hasSearch={Boolean(search.trim())} />
        ) : (
          <>
            {/* Featured section */}
            {featured.length > 0 && (
              <section className="mb-8">
                <div className="flex items-center gap-3 mb-4">
                  <span className="d3-eyebrow" style={{ fontSize: '0.5625rem' }}>CHEF'S FEATURED</span>
                  <div style={{ flex: 1, height: 1, background: 'var(--border-subtle)' }} />
                </div>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  {featured.map((item) => (
                    <FoodCard
                      key={item.id}
                      item={item}
                      currency={currency}
                      cart={cart}
                      onAdd={addToCart}
                      onRemove={removeFromCart}
                      onInspect={setInspectItem}
                    />
                  ))}
                </div>
              </section>
            )}

            {/* Popular section */}
            {popular.length > 0 && (
              <section className="mb-8">
                <div className="flex items-center gap-3 mb-4">
                  <span className="d3-eyebrow" style={{ fontSize: '0.5625rem' }}>MOST POPULAR</span>
                  <div style={{ flex: 1, height: 1, background: 'var(--border-subtle)' }} />
                </div>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  {popular.map((item) => (
                    <FoodCard
                      key={item.id}
                      item={item}
                      currency={currency}
                      cart={cart}
                      onAdd={addToCart}
                      onRemove={removeFromCart}
                      onInspect={setInspectItem}
                    />
                  ))}
                </div>
              </section>
            )}

            {/* All other items */}
            {rest.length > 0 && (
              <section>
                {(featured.length > 0 || popular.length > 0) && (
                  <div className="flex items-center gap-3 mb-4">
                    <span className="d3-eyebrow" style={{ fontSize: '0.5625rem' }}>ALL DISHES</span>
                    <div style={{ flex: 1, height: 1, background: 'var(--border-subtle)' }} />
                  </div>
                )}
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  {rest.map((item) => (
                    <FoodCard
                      key={item.id}
                      item={item}
                      currency={currency}
                      cart={cart}
                      onAdd={addToCart}
                      onRemove={removeFromCart}
                      onInspect={setInspectItem}
                    />
                  ))}
                </div>
              </section>
            )}

            {filteredItems.length === 0 && (
              <div className="py-20 text-center flex flex-col items-center gap-4">
                <svg width="48" height="48" viewBox="0 0 48 48" fill="none" style={{ color: 'var(--text-dimmed)', opacity: 0.4 }} aria-hidden="true">
                  <circle cx="24" cy="24" r="20" stroke="currentColor" strokeWidth="1.5" />
                  <path d="M16 24C16 19.6 19.6 16 24 16C28.4 16 32 19.6 32 24" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" />
                </svg>
                <p style={{ color: 'var(--text-muted)', fontSize: '0.9375rem' }}>No dishes found</p>
              </div>
            )}
          </>
        )}
      </main>

      {/* Food Detail Modal */}
      {inspectItem && (
        <FoodDetailModal
          item={inspectItem}
          currency={currency}
          onClose={() => setInspectItem(null)}
          onAddToCart={(item, qty, notes) => {
            setCart((prev) => {
              const existing = prev.find((c) => c.menuItem.id === item.id);
              if (existing) return prev.map((c) => (c.menuItem.id === item.id ? { ...c, quantity: c.quantity + qty, notes } : c));
              return [...prev, { menuItem: item, quantity: qty, notes }];
            });
          }}
          cartQty={cart.find((c) => c.menuItem.id === inspectItem.id)?.quantity || 0}
        />
      )}

      {/* Cart Drawer */}
      {isCartOpen && (
        <CartDrawer
          cart={cart}
          currency={currency}
          onClose={() => setIsCartOpen(false)}
          onAdd={addToCart}
          onRemove={removeFromCart}
          totalPrice={totalPrice}
          tableNumber={searchParams.get('table') || ''}
          hotelId={hotel.id}
          slug={hotel.slug}
          router={router}
        />
      )}

      {/* Floating order bar */}
      {totalCount > 0 && !isCartOpen && (
        <div
          className="fixed bottom-4 left-4 right-4 z-20"
          style={{ maxWidth: 720 - 32, margin: '0 auto' }}
        >
          <button
            onClick={() => setIsCartOpen(true)}
            className="d3-btn-primary w-full"
            style={{ justifyContent: 'space-between', padding: '1rem 1.25rem', fontSize: '0.9375rem', borderRadius: 12 }}
          >
            <span style={{ background: 'rgba(0,0,0,0.15)', padding: '0.125rem 0.5rem', borderRadius: 6, fontSize: '0.75rem', fontWeight: 700 }}>
              {totalCount}
            </span>
            <span>View Order</span>
            <span>{formatPrice(totalPrice, currency)}</span>
          </button>
        </div>
      )}
    </div>
  );
}

/* ============================================================
   MENU EMPTY STATE
   ============================================================ */
function MenuEmptyState({ hasSearch }: { hasSearch: boolean }) {
  return (
    <div className="py-20 text-center flex flex-col items-center gap-4">
      <svg width="46" height="46" viewBox="0 0 46 46" fill="none" style={{ color: 'var(--text-dimmed)', opacity: 0.45 }} aria-hidden="true">
        <path d="M23 4L41 14V32L23 42L5 32V14L23 4Z" stroke="currentColor" strokeWidth="1.2" strokeLinejoin="round" />
        <path d="M23 4V42M5 14L23 23L41 14" stroke="currentColor" strokeWidth="0.9" strokeOpacity="0.5" strokeLinejoin="round" />
      </svg>
      <p style={{ margin: 0, color: 'var(--text-muted)', fontSize: '0.9375rem' }}>
        {hasSearch ? 'No dishes found' : 'No menu items yet'}
      </p>
      {hasSearch ? null : (
        <p style={{ margin: 0, maxWidth: '32ch', color: 'var(--text-dimmed)', fontSize: '0.8125rem', lineHeight: 1.7 }}>
          This restaurant has not published any dishes for this menu yet.
        </p>
      )}
    </div>
  );
}

/* ============================================================
   FOOD CARD COMPONENT
   ============================================================ */
function FoodCard({
  item,
  currency,
  cart,
  onAdd,
  onRemove,
  onInspect,
}: {
  item: PublicMenuItem;
  currency: string | null;
  cart: CartItem[];
  onAdd: (item: PublicMenuItem) => void;
  onRemove: (id: string) => void;
  onInspect: (item: PublicMenuItem) => void;
}) {
  const inCart = cart.find((c) => c.menuItem.id === item.id);
  const has3D = Boolean(item.model_url_glb?.trim());
  const image = item.image_url?.trim() || '';
  const price = Number(item.price) || 0;
  const rating = Number(item.rating) || 0;

  return (
    <div
      style={{
        background: 'var(--bg-surface)',
        border: '1px solid var(--border-subtle)',
        borderRadius: 12,
        overflow: 'hidden',
        display: 'flex',
        flexDirection: 'column',
        transition: 'border-color 300ms',
      }}
    >
      {/* Visual area — a stored model, a stored photo, or an honest empty panel */}
      <div className="relative" style={{ background: 'var(--bg-secondary)' }}>
        {has3D ? (
          <FoodModelViewer
            modelUrlGlb={item.model_url_glb ?? undefined}
            modelUrlUsdz={item.model_url_usdz ?? undefined}
            altText={item.name}
            autoRotate
            className="h-48 w-full"
          />
        ) : image ? (
          <img
            src={image}
            alt={item.name}
            loading="lazy"
            style={{ width: '100%', height: '12rem', objectFit: 'cover', display: 'block' }}
          />
        ) : (
          <NoAssetPanel label="No 3D model" height="12rem" />
        )}

        {/* Inspect button — only meaningful when a model exists */}
        {has3D && (
          <button
            onClick={() => onInspect(item)}
            style={{
              position: 'absolute', top: 8, right: 8,
              padding: '0.25rem 0.625rem',
              borderRadius: 6,
              background: 'rgba(0,0,0,0.7)',
              border: '1px solid rgba(201,169,110,0.2)',
              color: 'var(--gold)',
              fontSize: '0.5625rem', fontWeight: 600,
              letterSpacing: '0.08em', textTransform: 'uppercase',
              cursor: 'pointer',
            }}
          >
            Inspect 3D
          </button>
        )}

        {/* Badges */}
        <div style={{ position: 'absolute', top: 8, left: 8, display: 'flex', gap: 4 }}>
          {item.is_featured && (
            <span className="d3-chip d3-chip-3d" style={{ background: 'rgba(11,11,10,0.75)' }}>
              Featured
            </span>
          )}
          {item.is_popular && !item.is_featured && (
            <span className="d3-chip" style={{ background: 'rgba(11,11,10,0.75)' }}>
              Popular
            </span>
          )}
        </div>
      </div>

      {/* Content */}
      <div className="p-3.5 flex flex-col gap-2.5">
        <div className="flex items-start justify-between gap-2">
          <div className="min-w-0">
            <div className="flex items-center gap-1.5 mb-0.5">
              <span
                style={{
                  width: 8, height: 8, borderRadius: 2,
                  display: 'inline-block', flexShrink: 0,
                  border: `1px solid ${item.is_veg ? 'var(--gold-dim)' : 'var(--text-dimmed)'}`,
                  background: item.is_veg ? 'transparent' : 'var(--text-dimmed)',
                }}
              />
              <h3 style={{
                fontFamily: 'var(--font-display)', fontSize: '1rem', fontWeight: 500,
                color: 'var(--text-primary)', letterSpacing: '-0.01em', lineHeight: 1.3,
                overflow: 'hidden', textOverflow: 'ellipsis', display: '-webkit-box',
                WebkitLineClamp: 1, WebkitBoxOrient: 'vertical',
              }}>
                {item.name}
              </h3>
            </div>
            {item.description ? (
              <p style={{
                fontSize: '0.75rem', color: 'var(--text-muted)', lineHeight: 1.5,
                display: '-webkit-box', WebkitLineClamp: 2, WebkitBoxOrient: 'vertical', overflow: 'hidden',
              }}>
                {item.description}
              </p>
            ) : null}
          </div>
          <span style={{
            fontFamily: 'var(--font-display)', fontSize: '1.125rem', fontWeight: 500,
            color: 'var(--gold)', flexShrink: 0, letterSpacing: '-0.02em',
          }}>
            {formatPrice(price, currency)}
          </span>
        </div>

        {/* Meta — rendered only for values the restaurant stored */}
        {item.calories || item.preparation_time_mins || rating > 0 ? (
          <div className="flex items-center gap-3" style={{ fontSize: '0.625rem', color: 'var(--text-dimmed)' }}>
            {item.calories ? <span>{item.calories} kcal</span> : null}
            {item.calories && item.preparation_time_mins ? <span>·</span> : null}
            {item.preparation_time_mins ? <span>{item.preparation_time_mins} min</span> : null}
            {rating > 0 ? (
              <>
                {(item.calories || item.preparation_time_mins) ? <span>·</span> : null}
                <span style={{ color: 'var(--gold)' }}>★ {rating.toFixed(1)}</span>
              </>
            ) : null}
          </div>
        ) : null}

        {/* Order controls */}
        {inCart ? (
          <div
            className="flex items-center justify-between"
            style={{
              background: 'var(--bg-surface-2)',
              border: '1px solid var(--border-subtle)',
              borderRadius: 8,
              padding: '0.375rem 0.625rem',
            }}
          >
            <button
              onClick={() => onRemove(item.id)}
              style={{
                width: 28, height: 28, borderRadius: '50%',
                background: 'var(--bg-surface-3)',
                border: 'none', cursor: 'pointer',
                color: 'var(--text-primary)',
                display: 'flex', alignItems: 'center', justifyContent: 'center',
                fontWeight: 700, fontSize: '1rem',
              }}
            >
              −
            </button>
            <span style={{ fontFamily: 'var(--font-display)', fontSize: '1rem', color: 'var(--text-primary)' }}>
              {inCart.quantity} in order
            </span>
            <button
              onClick={() => onAdd(item)}
              style={{
                width: 28, height: 28, borderRadius: 5,
                background: 'var(--bg-surface-3)',
                border: '1px solid var(--border-light)',
                cursor: 'pointer',
                color: 'var(--gold-pale)',
                display: 'flex', alignItems: 'center', justifyContent: 'center',
                fontWeight: 500, fontSize: '1rem',
              }}
            >
              +
            </button>
          </div>
        ) : (
          <button
            onClick={() => onAdd(item)}
            style={{
              width: '100%', padding: '0.5625rem',
              borderRadius: 5, border: '1px solid var(--border-medium)',
              background: 'var(--bg-surface-2)',
              color: 'var(--gold-pale)',
              fontSize: '0.75rem', fontWeight: 500, letterSpacing: '0.04em',
              cursor: 'pointer',
              transition: 'all 200ms',
            }}
            onMouseEnter={(e) => {
              e.currentTarget.style.background = 'var(--bg-surface-3)';
              e.currentTarget.style.borderColor = 'rgba(184,164,122,0.45)';
            }}
            onMouseLeave={(e) => {
              e.currentTarget.style.background = 'var(--bg-surface-2)';
              e.currentTarget.style.borderColor = 'var(--border-medium)';
            }}
          >
            Add to Order
          </button>
        )}
      </div>
    </div>
  );
}

/* ============================================================
   PAGE EXPORT
   ============================================================ */
export default function MenuPage({ params }: { params: { slug: string } }) {
  return (
    <Suspense fallback={
      <div className="min-h-screen flex items-center justify-center" style={{ background: 'var(--bg-primary)' }}>
        <div style={{ width: 40, height: 40, borderRadius: '50%', border: '2px solid rgba(201,169,110,0.2)', borderTop: '2px solid var(--gold)', animation: 'spin 1s linear infinite' }} />
      </div>
    }>
      <MenuContent slug={params.slug} />
    </Suspense>
  );
}