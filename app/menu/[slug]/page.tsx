'use client';

import React, { useState, useEffect, Suspense } from 'react';
import { useSearchParams, useRouter } from 'next/navigation';
import dynamic from 'next/dynamic';
import {
  getDemoItems,
  getDemoOrders,
  saveDemoOrders,
  getDemoCustomization,
  DemoMenuItem,
  DemoOrder,
} from '@/lib/demoData';

// Lazy-load 3D viewer
const FoodModelViewer = dynamic(() => import('@/components/3d/FoodModelViewer'), { ssr: false });

interface CartItem {
  menuItem: DemoMenuItem;
  quantity: number;
  notes?: string;
}

/* ============================================================
   3D FOOD DETAIL MODAL
   ============================================================ */
function FoodDetailModal({
  item,
  onClose,
  onAddToCart,
  cartQty,
}: {
  item: DemoMenuItem;
  onClose: () => void;
  onAddToCart: (item: DemoMenuItem, qty: number, notes: string) => void;
  cartQty: number;
}) {
  const [qty, setQty] = useState(Math.max(1, cartQty));
  const [notes, setNotes] = useState('');

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
        {/* 3D Viewer */}
        <div
          className="relative"
          style={{
            height: 280,
            background: 'var(--bg-secondary)',
            borderRadius: '16px 16px 0 0',
            overflow: 'hidden',
          }}
        >
          <FoodModelViewer
            modelUrlGlb={item.model_url_glb}
            altText={item.name}
            autoRotate
            className="h-full w-full"
          />
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
                display: 'inline-flex', alignItems: 'center', gap: 4,
                padding: '0.2rem 0.625rem',
                borderRadius: 100,
                fontSize: '0.5625rem',
                fontWeight: 700,
                letterSpacing: '0.1em',
                background: item.is_veg ? 'rgba(100,210,150,0.15)' : 'rgba(200,80,80,0.15)',
                border: item.is_veg ? '1px solid rgba(100,210,150,0.3)' : '1px solid rgba(200,80,80,0.3)',
                color: item.is_veg ? '#86EFAC' : '#FCA5A5',
              }}
            >
              {item.is_veg ? '● VEG' : '● NON-VEG'}
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
              <p style={{ fontSize: '0.875rem', color: 'var(--text-muted)', lineHeight: 1.6 }}>
                {item.description}
              </p>
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
              ${item.price.toFixed(2)}
            </span>
          </div>

          {/* Meta row */}
          <div className="flex items-center gap-4 flex-wrap">
            <span
              style={{
                display: 'inline-flex', alignItems: 'center', gap: 5,
                fontSize: '0.6875rem', color: 'var(--text-muted)',
              }}
            >
              <svg width="12" height="12" viewBox="0 0 12 12" fill="none"><circle cx="6" cy="6" r="4.5" stroke="currentColor" strokeWidth="1" /><path d="M6 3.5V6L8 7.5" stroke="currentColor" strokeWidth="1" strokeLinecap="round" /></svg>
              {item.preparation_time_mins} min
            </span>
            <span
              style={{
                display: 'inline-flex', alignItems: 'center', gap: 5,
                fontSize: '0.6875rem', color: 'var(--text-muted)',
              }}
            >
              <svg width="12" height="12" viewBox="0 0 12 12" fill="none"><path d="M6 2C6 2 3 3.5 2 6C3.5 8 6 9 6 9C6 9 8.5 8 10 6C9 3.5 6 2 6 2Z" stroke="currentColor" strokeWidth="1" strokeLinejoin="round" /></svg>
              {item.calories} kcal
            </span>
            <span
              style={{
                display: 'inline-flex', alignItems: 'center', gap: 4,
                fontSize: '0.6875rem', color: 'var(--gold)',
              }}
            >
              ★ {item.rating || 4.8} ({item.order_count || 0} orders)
            </span>
          </div>

          {/* Ingredients */}
          {item.ingredients?.length > 0 && (
            <div>
              <p style={{ fontSize: '0.6875rem', color: 'var(--text-dimmed)', fontWeight: 600, letterSpacing: '0.1em', textTransform: 'uppercase', marginBottom: 6 }}>
                Ingredients
              </p>
              <div className="flex flex-wrap gap-1.5">
                {item.ingredients.map((ing, i) => (
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
              placeholder="E.g., No onions, extra sauce..."
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
                  width: 32, height: 32, borderRadius: '50%',
                  background: 'var(--gold)',
                  border: 'none', cursor: 'pointer',
                  color: '#0B0A08',
                  display: 'flex', alignItems: 'center', justifyContent: 'center',
                  fontSize: '1rem', lineHeight: 1, fontWeight: 700,
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
              Add to Cart · ${(item.price * qty).toFixed(2)}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}

/* ============================================================
   CART DRAWER
   ============================================================ */
function CartDrawer({
  cart,
  onClose,
  onAdd,
  onRemove,
  totalPrice,
  tableNumber,
  slug,
  router,
}: {
  cart: CartItem[];
  onClose: () => void;
  onAdd: (item: DemoMenuItem) => void;
  onRemove: (id: string) => void;
  totalPrice: number;
  tableNumber: string;
  slug: string;
  router: any;
}) {
  const [customerName, setCustomerName] = useState('');
  const [orderNotes, setOrderNotes] = useState('');
  const [payment, setPayment] = useState<'pay_at_table' | 'card' | 'upi'>('pay_at_table');
  const [submitting, setSubmitting] = useState(false);
  const isDemo = process.env.NODE_ENV !== 'production' && process.env.NEXT_PUBLIC_DEMO_MODE === 'true';

  const handlePlaceOrder = async () => {
    if (cart.length === 0) return;
    setSubmitting(true);

    const newOrderId = `demo-ord-${Date.now()}`;
    const newOrder: DemoOrder = {
      id: newOrderId,
      order_code: `ORD-${Math.floor(500 + Math.random() * 400)}`,
      table_number: `Table ${tableNumber}`,
      customer_name: customerName || 'Guest Diner',
      status: 'PLACED',
      total_amount: totalPrice,
      payment_method: payment === 'pay_at_table' ? 'Pay at Table' : payment === 'card' ? 'Card / POS' : 'UPI / Wallet',
      payment_status: payment === 'pay_at_table' ? 'Unpaid' : 'Paid',
      created_at: new Date().toISOString(),
      notes: orderNotes,
      items: cart.map((c) => ({ id: c.menuItem.id, name: c.menuItem.name, quantity: c.quantity, price: c.menuItem.price })),
    };

    if (isDemo || slug === 'demo-restaurant') {
      const existing = getDemoOrders();
      saveDemoOrders([newOrder, ...existing]);
    }

    setTimeout(() => {
      setSubmitting(false);
      router.push(`/order-status/${newOrderId}`);
    }, 600);
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
              Table {tableNumber} · {cart.reduce((s, c) => s + c.quantity, 0)} items
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
                  ${menuItem.price.toFixed(2)} each
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
                    width: 26, height: 26, borderRadius: '50%',
                    background: 'rgba(201,169,110,0.15)',
                    border: '1px solid rgba(201,169,110,0.2)',
                    color: 'var(--gold)', cursor: 'pointer',
                    display: 'flex', alignItems: 'center', justifyContent: 'center',
                    fontSize: '0.875rem', lineHeight: 1, fontWeight: 700,
                  }}
                >
                  +
                </button>
                <span style={{ fontFamily: 'var(--font-display)', fontSize: '1rem', color: 'var(--gold)', minWidth: 52, textAlign: 'right' }}>
                  ${(menuItem.price * quantity).toFixed(2)}
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
                placeholder="Guest Diner"
                className="d3-input"
              />
            </div>
            <div>
              <label className="d3-label">Notes for Chef (optional)</label>
              <input
                type="text"
                value={orderNotes}
                onChange={(e) => setOrderNotes(e.target.value)}
                placeholder="Allergies, preferences..."
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
              ${totalPrice.toFixed(2)}
            </span>
          </div>
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
                Placing Order...
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
function MenuContent({ slug }: { slug: string }) {
  const searchParams = useSearchParams();
  const router = useRouter();
  const isDemo = process.env.NODE_ENV !== 'production' && process.env.NEXT_PUBLIC_DEMO_MODE === 'true';
  const tableNumber = searchParams.get('table') || '1';

  const [restaurantName, setRestaurantName] = useState('Demo Restaurant');
  const [menuItems, setMenuItems] = useState<DemoMenuItem[]>([]);
  const [categories, setCategories] = useState<string[]>(['All']);
  const [selectedCategory, setSelectedCategory] = useState('All');
  const [cart, setCart] = useState<CartItem[]>([]);
  const [isCartOpen, setIsCartOpen] = useState(false);
  const [inspectItem, setInspectItem] = useState<DemoMenuItem | null>(null);
  const [search, setSearch] = useState('');
  const [accentColor, setAccentColor] = useState('#C9A96E');

  useEffect(() => {
    if (isDemo || slug === 'demo-restaurant') {
      const items = getDemoItems();
      const cust = getDemoCustomization();
      setMenuItems(items);
      setAccentColor(cust.primary_color || '#C9A96E');
      const cats = Array.from(new Set(items.map((i) => i.category || 'Main Course')));
      setCategories(['All', ...cats]);
      setRestaurantName('Demo Restaurant');
    }
  }, [slug]);

  const addToCart = (item: DemoMenuItem, qty = 1) => {
    setCart((prev) => {
      const ex = prev.find((c) => c.menuItem.id === item.id);
      if (ex) return prev.map((c) => c.menuItem.id === item.id ? { ...c, quantity: c.quantity + qty } : c);
      return [...prev, { menuItem: item, quantity: qty }];
    });
  };

  const removeFromCart = (itemId: string) => {
    setCart((prev) =>
      prev.map((c) => c.menuItem.id === itemId ? { ...c, quantity: c.quantity - 1 } : c).filter((c) => c.quantity > 0)
    );
  };

  const totalCount = cart.reduce((s, c) => s + c.quantity, 0);
  const totalPrice = cart.reduce((s, c) => s + c.menuItem.price * c.quantity, 0);

  const filteredItems = menuItems.filter((item) => {
    const catMatch = selectedCategory === 'All' || item.category === selectedCategory;
    const searchMatch = !search || item.name.toLowerCase().includes(search.toLowerCase()) || item.description?.toLowerCase().includes(search.toLowerCase());
    return catMatch && searchMatch;
  });

  const featured = filteredItems.filter((i) => i.is_featured);
  const popular = filteredItems.filter((i) => i.is_popular && !i.is_featured);
  const rest = filteredItems.filter((i) => !i.is_featured && !i.is_popular);

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
            {/* Geometric mark */}
            <svg width="20" height="20" viewBox="0 0 26 26" fill="none">
              <polygon points="13,1 24,7 24,19 13,25 2,19 2,7" fill="none" stroke="#C9A96E" strokeWidth="1.2" />
              <line x1="13" y1="1" x2="13" y2="25" stroke="#C9A96E" strokeWidth="0.8" strokeOpacity="0.5" />
            </svg>
            <div>
              <h1 style={{ fontFamily: 'var(--font-display)', fontSize: '1rem', fontWeight: 500, color: 'var(--text-primary)', lineHeight: 1.2 }}>
                {restaurantName}
              </h1>
              <div className="flex items-center gap-1.5">
                <span style={{ width: 6, height: 6, borderRadius: '50%', background: '#86EFAC', display: 'inline-block', animation: 'pulseGold 2s ease-in-out infinite' }} />
                <span style={{ fontSize: '0.6rem', color: 'var(--text-dimmed)', letterSpacing: '0.1em', textTransform: 'uppercase' }}>
                  Table {tableNumber}
                </span>
              </div>
            </div>
          </div>

          {/* Cart button */}
          <button
            onClick={() => setIsCartOpen(true)}
            style={{
              display: 'flex', alignItems: 'center', gap: 6,
              padding: '0.5rem 0.875rem',
              borderRadius: 100,
              background: totalCount > 0 ? 'var(--gold)' : 'var(--bg-surface)',
              border: totalCount > 0 ? 'none' : '1px solid var(--border-subtle)',
              color: totalCount > 0 ? '#0B0A08' : 'var(--text-muted)',
              fontWeight: 600, fontSize: '0.75rem',
              cursor: 'pointer',
              transition: 'all 200ms',
            }}
          >
            <svg width="14" height="14" viewBox="0 0 14 14" fill="none">
              <path d="M1 1H3L4.5 8.5H10.5L12 3.5H4" stroke="currentColor" strokeWidth="1.2" strokeLinecap="round" strokeLinejoin="round" />
              <circle cx="5.5" cy="11.5" r="1" fill="currentColor" />
              <circle cx="9.5" cy="11.5" r="1" fill="currentColor" />
            </svg>
            {totalCount > 0 ? `${totalCount} item${totalCount > 1 ? 's' : ''} · $${totalPrice.toFixed(2)}` : 'Cart'}
          </button>
        </div>

        {/* Search + Categories */}
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
              placeholder="Search dishes..."
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
          <div className="flex gap-1.5 overflow-x-auto" style={{ paddingBottom: 2 }}>
            {categories.map((cat) => (
              <button
                key={cat}
                onClick={() => setSelectedCategory(cat)}
                style={{
                  padding: '0.3125rem 0.875rem',
                  borderRadius: 100,
                  fontSize: '0.6875rem', fontWeight: 600,
                  cursor: 'pointer',
                  whiteSpace: 'nowrap',
                  border: selectedCategory === cat ? 'none' : '1px solid var(--border-subtle)',
                  background: selectedCategory === cat ? 'var(--gold)' : 'transparent',
                  color: selectedCategory === cat ? '#0B0A08' : 'var(--text-muted)',
                  transition: 'all 200ms',
                }}
              >
                {cat}
              </button>
            ))}
          </div>
        </div>
      </header>

      {/* Menu content */}
      <main style={{ maxWidth: 720, margin: '0 auto', padding: '1.5rem 1rem' }}>

        {/* Featured section */}
        {featured.length > 0 && (
          <section className="mb-8">
            <div className="flex items-center gap-3 mb-4">
              <span className="d3-eyebrow" style={{ fontSize: '0.5625rem' }}>CHEF'S FEATURED</span>
              <div style={{ flex: 1, height: 1, background: 'var(--border-subtle)' }} />
            </div>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              {featured.map((item) => (
                <FoodCard key={item.id} item={item} cart={cart} onAdd={addToCart} onRemove={removeFromCart} onInspect={setInspectItem} />
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
                <FoodCard key={item.id} item={item} cart={cart} onAdd={addToCart} onRemove={removeFromCart} onInspect={setInspectItem} />
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
                <FoodCard key={item.id} item={item} cart={cart} onAdd={addToCart} onRemove={removeFromCart} onInspect={setInspectItem} />
              ))}
            </div>
          </section>
        )}

        {filteredItems.length === 0 && (
          <div className="py-20 text-center flex flex-col items-center gap-4">
            <svg width="48" height="48" viewBox="0 0 48 48" fill="none" style={{ color: 'var(--text-dimmed)', opacity: 0.4 }}>
              <circle cx="24" cy="24" r="20" stroke="currentColor" strokeWidth="1.5" />
              <path d="M16 24C16 19.6 19.6 16 24 16C28.4 16 32 19.6 32 24" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" />
            </svg>
            <p style={{ color: 'var(--text-muted)', fontSize: '0.9375rem' }}>No dishes found</p>
          </div>
        )}
      </main>

      {/* Food Detail Modal */}
      {inspectItem && (
        <FoodDetailModal
          item={inspectItem}
          onClose={() => setInspectItem(null)}
          onAddToCart={(item, qty, notes) => {
            setCart((prev) => {
              const ex = prev.find((c) => c.menuItem.id === item.id);
              if (ex) return prev.map((c) => c.menuItem.id === item.id ? { ...c, quantity: c.quantity + qty } : c);
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
          onClose={() => setIsCartOpen(false)}
          onAdd={addToCart}
          onRemove={removeFromCart}
          totalPrice={totalPrice}
          tableNumber={tableNumber}
          slug={slug}
          router={router}
        />
      )}

      {/* Floating cart bar */}
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
            <span>${totalPrice.toFixed(2)}</span>
          </button>
        </div>
      )}
    </div>
  );
}

/* ============================================================
   FOOD CARD COMPONENT
   ============================================================ */
function FoodCard({
  item,
  cart,
  onAdd,
  onRemove,
  onInspect,
}: {
  item: DemoMenuItem;
  cart: CartItem[];
  onAdd: (item: DemoMenuItem) => void;
  onRemove: (id: string) => void;
  onInspect: (item: DemoMenuItem) => void;
}) {
  const inCart = cart.find((c) => c.menuItem.id === item.id);

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
      {/* 3D viewer area */}
      <div className="relative" style={{ background: 'var(--bg-secondary)' }}>
        <FoodModelViewer
          modelUrlGlb={item.model_url_glb}
          altText={item.name}
          autoRotate
          className="h-48 w-full"
        />
        {/* Inspect button */}
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

        {/* Badges */}
        <div style={{ position: 'absolute', top: 8, left: 8, display: 'flex', gap: 4 }}>
          {item.is_featured && (
            <span style={{
              padding: '0.125rem 0.5rem', borderRadius: 100, fontSize: '0.5rem',
              background: 'rgba(201,169,110,0.15)', border: '1px solid rgba(201,169,110,0.25)',
              color: 'var(--gold)', fontWeight: 700, letterSpacing: '0.1em',
            }}>
              FEATURED
            </span>
          )}
          {item.is_popular && !item.is_featured && (
            <span style={{
              padding: '0.125rem 0.5rem', borderRadius: 100, fontSize: '0.5rem',
              background: 'rgba(160,120,255,0.1)', border: '1px solid rgba(160,120,255,0.2)',
              color: '#C4B5FD', fontWeight: 700, letterSpacing: '0.1em',
            }}>
              POPULAR
            </span>
          )}
        </div>
      </div>

      {/* Content */}
      <div className="p-3.5 flex flex-col gap-2.5">
        <div className="flex items-start justify-between gap-2">
          <div className="min-w-0">
            <div className="flex items-center gap-1.5 mb-0.5">
              <span style={{
                width: 8, height: 8, borderRadius: '50%',
                display: 'inline-block', flexShrink: 0,
                background: item.is_veg ? '#86EFAC' : '#FCA5A5',
              }} />
              <h3 style={{
                fontFamily: 'var(--font-display)', fontSize: '1rem', fontWeight: 500,
                color: 'var(--text-primary)', letterSpacing: '-0.01em', lineHeight: 1.3,
                overflow: 'hidden', textOverflow: 'ellipsis', display: '-webkit-box',
                WebkitLineClamp: 1, WebkitBoxOrient: 'vertical',
              }}>
                {item.name}
              </h3>
            </div>
            <p style={{
              fontSize: '0.75rem', color: 'var(--text-muted)', lineHeight: 1.5,
              display: '-webkit-box', WebkitLineClamp: 2, WebkitBoxOrient: 'vertical', overflow: 'hidden',
            }}>
              {item.description}
            </p>
          </div>
          <span style={{
            fontFamily: 'var(--font-display)', fontSize: '1.125rem', fontWeight: 500,
            color: 'var(--gold)', flexShrink: 0, letterSpacing: '-0.02em',
          }}>
            ${item.price.toFixed(2)}
          </span>
        </div>

        {/* Meta */}
        <div className="flex items-center gap-3" style={{ fontSize: '0.625rem', color: 'var(--text-dimmed)' }}>
          <span>{item.calories} kcal</span>
          <span>·</span>
          <span>{item.preparation_time_mins} min</span>
          {item.rating && (
            <>
              <span>·</span>
              <span style={{ color: 'var(--gold)' }}>★ {item.rating}</span>
            </>
          )}
        </div>

        {/* Cart controls */}
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
                width: 28, height: 28, borderRadius: '50%',
                background: 'var(--gold)',
                border: 'none', cursor: 'pointer',
                color: '#0B0A08',
                display: 'flex', alignItems: 'center', justifyContent: 'center',
                fontWeight: 700, fontSize: '1rem',
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
              borderRadius: 8, border: '1px solid rgba(201,169,110,0.2)',
              background: 'rgba(201,169,110,0.06)',
              color: 'var(--gold)',
              fontSize: '0.75rem', fontWeight: 600, cursor: 'pointer',
              transition: 'all 200ms',
            }}
            onMouseEnter={(e) => {
              e.currentTarget.style.background = 'var(--gold)';
              e.currentTarget.style.color = '#0B0A08';
              e.currentTarget.style.borderColor = 'var(--gold)';
            }}
            onMouseLeave={(e) => {
              e.currentTarget.style.background = 'rgba(201,169,110,0.06)';
              e.currentTarget.style.color = 'var(--gold)';
              e.currentTarget.style.borderColor = 'rgba(201,169,110,0.2)';
            }}
          >
            + Add to Cart
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
