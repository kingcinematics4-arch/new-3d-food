'use client';

import React from 'react';
import Link from 'next/link';
import { useHotel, useOrders, useDashboardStats } from '@/lib/useHotel';
import { formatPrice } from '@/lib/menu';

function StatCard({ label, value, change, icon, loading }: { label: string; value: string; change: string; icon: React.ReactNode; loading?: boolean }) {
  return (
    <div
      className="d3-panel"
      style={{
        padding: '1.5rem',
        display: 'flex',
        flexDirection: 'column',
        gap: '1.125rem',
        opacity: loading ? 0.5 : 1,
        pointerEvents: loading ? 'none' : 'auto',
      }}
    >
      <div className="flex items-start justify-between gap-3">
        <span style={{ fontSize: '0.5625rem', color: 'var(--text-dimmed)', fontWeight: 600, letterSpacing: '0.18em', textTransform: 'uppercase' }}>
          {label}
        </span>
        <span style={{ color: 'var(--text-dimmed)', flexShrink: 0 }}>{icon}</span>
      </div>
      <div>
        <span className="d3-figure" style={{ fontSize: '2rem', display: 'block' }}>
          {value}
        </span>
        <span style={{ fontSize: '0.6875rem', color: 'var(--text-dimmed)', marginTop: 6, display: 'block' }}>
          {change}
        </span>
      </div>
    </div>
  );
}

/* One monochrome family — only the newest order is marked.
   Keys are the lowercase statuses the app stores. */
const STATUS_CLASS: Record<string, string> = {
  placed: 'd3-status-placed',
  pending: 'd3-status-placed',
  accepted: 'd3-status-accepted',
  preparing: 'd3-status-preparing',
  ready: 'd3-status-ready',
  completed: 'd3-status-completed',
  cancelled: 'd3-status-cancelled',
};

export default function DashboardOverview() {
  const { hotel, loading: hotelLoading } = useHotel();
  const { orders, loading: ordersLoading } = useOrders(hotel?.id || null);
  const { stats, loading: statsLoading } = useDashboardStats(hotel?.id || null);
  const hotelSlug = hotel?.slug || '';
  const menuHref = hotelSlug ? `/menu/${hotelSlug}` : '/dashboard/settings';

  const revenue = stats.revenueToday;

  const statCards = [
    { label: 'Orders Today', value: `${stats.ordersToday}`, change: 'Real-time count', icon: (
      <svg width="14" height="14" viewBox="0 0 14 14" fill="none"><path d="M2 2H12L11 5H3L2 2Z" stroke="currentColor" strokeWidth="1.1" strokeLinejoin="round" /><rect x="1" y="5" width="12" height="7" rx="1.5" stroke="currentColor" strokeWidth="1.1" /></svg>
    )},
    { label: 'Revenue Today', value: formatPrice(revenue, hotel?.currency), change: 'From today’s orders', icon: (
      <svg width="14" height="14" viewBox="0 0 14 14" fill="none"><circle cx="7" cy="7" r="5.5" stroke="currentColor" strokeWidth="1.1" /><path d="M7 4V5.5M7 8.5V10M5 6.5C5 5.7 5.9 5 7 5C8.1 5 9 5.7 9 6.5C9 7.3 8.1 8 7 8C5.9 8 5 8.7 5 9.5C5 10.3 5.9 11 7 11C8.1 11 9 10.3 9 9.5" stroke="currentColor" strokeWidth="1.1" strokeLinecap="round" /></svg>
    )},
    { label: '3D Menu Items', value: `${stats.menuItemsCount}`, change: 'See all items', icon: (
      <svg width="14" height="14" viewBox="0 0 14 14" fill="none"><path d="M7 1L12 4V10L7 13L2 10V4L7 1Z" stroke="currentColor" strokeWidth="1.1" strokeLinejoin="round" /></svg>
    )},
  ];

  if (hotelLoading || statsLoading) {
    return (
      <div className="flex flex-col gap-8" style={{ maxWidth: 1180 }}>
        <div>
          <span className="d3-eyebrow" style={{ fontSize: '0.5625rem' }}>
            Overview
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
            Good evening
          </h1>
          <p style={{ margin: '0.5rem 0 0', color: 'var(--text-muted)', fontSize: '0.875rem' }}>
            Loading your restaurant data…
          </p>
        </div>
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
          {statCards.map((stat, i) => (
            <StatCard key={i} {...stat} loading={true} />
          ))}
        </div>
      </div>
    );
  }

  const recentOrders = orders.slice(0, 5);

  const quickActions = [
    { label: 'Add Dish', href: '/dashboard/menu' },
    { label: 'View Orders', href: '/dashboard/orders' },
    { label: 'Generate QR', href: '/dashboard/qr' },
    { label: 'Analytics', href: '/dashboard/analytics' },
  ];

  return (
    <div className="flex flex-col gap-8" style={{ maxWidth: 1180 }}>

      {/* Welcome header */}
      <header
        className="flex flex-col sm:flex-row items-start sm:items-end justify-between gap-5"
      >
        <div>
          <span className="d3-eyebrow" style={{ fontSize: '0.5625rem' }}>
            Overview
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
            Good evening
          </h1>
          <p
            style={{
              margin: '0.5rem 0 0',
              fontSize: '0.875rem',
              lineHeight: 1.6,
              color: 'var(--text-muted)',
              maxWidth: '52ch',
            }}
          >
            Here is what is happening across your floor today.
          </p>
        </div>

        <div style={{ display: 'flex', alignItems: 'center', gap: 8, flexShrink: 0 }}>
          <Link href={menuHref} target="_blank" className="d3-btn-ghost">
            View Customer Menu
          </Link>
          <Link href="/dashboard/menu" className="d3-btn-primary">
            Add Dish
          </Link>
        </div>
      </header>

      {/* Stats Grid */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        {statCards.map((stat, i) => (
          <StatCard key={i} {...stat} />
        ))}
      </div>

      {/* Quick Actions */}
      <div
        style={{
          display: 'grid',
          gridTemplateColumns: 'repeat(auto-fit, minmax(180px, 1fr))',
          gap: 16,
          paddingBottom: '1.5rem',
          borderBottom: '1px solid var(--border-warm)',
        }}
      >
        {quickActions.map((action) => (
          <Link
            key={action.href}
            href={action.href}
            className="d3-panel d3-card"
            style={{
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'space-between',
              gap: 12,
              padding: '1.125rem 1.25rem',
              textDecoration: 'none',
            }}
          >
            <span style={{ fontSize: '0.8125rem', fontWeight: 500, color: 'var(--text-primary)' }}>
              {action.label}
            </span>
            <svg width="12" height="12" viewBox="0 0 14 14" fill="none" style={{ color: 'var(--text-dimmed)', flexShrink: 0 }} aria-hidden="true">
              <path d="M5 2.5L9.5 7L5 11.5" stroke="currentColor" strokeWidth="1.2" strokeLinecap="round" strokeLinejoin="round" />
            </svg>
          </Link>
        ))}
      </div>

      {/* Two columns: Recent Orders + Capabilities */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">

        {/* Recent Orders */}
        <section className="d3-panel p-6">
          <div
            className="flex items-baseline justify-between gap-4"
            style={{ paddingBottom: '1rem', marginBottom: '1.25rem', borderBottom: '1px solid var(--border-warm)' }}
          >
            <h2 className="d3-panel-title" style={{ fontSize: '1.125rem' }}>
              Recent Orders
            </h2>
            <Link
              href="/dashboard/orders"
              style={{ fontSize: '0.6875rem', letterSpacing: '0.08em', textTransform: 'uppercase', color: 'var(--gold-dim)', textDecoration: 'none' }}
            >
              All orders
            </Link>
          </div>

          {recentOrders.length === 0 ? (
            <div
              className="flex flex-col items-center text-center gap-3"
              style={{ padding: '3rem 1rem', color: 'var(--text-dimmed)' }}
            >
              <svg width="30" height="30" viewBox="0 0 32 32" fill="none" style={{ opacity: 0.45 }} aria-hidden="true">
                <rect x="5" y="8" width="22" height="17" rx="3" stroke="currentColor" strokeWidth="1.1" />
                <path d="M10 15H22M10 19H18" stroke="currentColor" strokeWidth="1.1" strokeLinecap="round" />
              </svg>
              <p style={{ margin: 0, fontSize: '0.875rem' }}>No orders yet today</p>
            </div>
          ) : (
            <div style={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
              {recentOrders.map((order) => (
                <div
                  key={order.id}
                  className="flex items-center justify-between gap-4"
                  style={{
                    padding: '0.875rem 0',
                    borderBottom: '1px solid var(--border-warm)',
                  }}
                >
                  <div className="min-w-0">
                    <span
                      style={{
                        fontFamily: 'ui-monospace, SFMono-Regular, Menlo, monospace',
                        fontSize: '0.75rem',
                        letterSpacing: '0.06em',
                        color: 'var(--text-primary)',
                        display: 'block',
                      }}
                    >
                      #{order.id.slice(0, 8).toUpperCase()}
                    </span>
                    <span style={{ fontSize: '0.6875rem', color: 'var(--text-dimmed)', display: 'block', marginTop: 3 }}>
                      {order.table_number || '—'} · {order.customer_name || '—'}
                    </span>
                  </div>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 14, flexShrink: 0 }}>
                    <span className={`d3-badge ${STATUS_CLASS[(order.status || '').toLowerCase()] || STATUS_CLASS.cancelled}`}>
                      {order.status}
                    </span>
                    <span className="d3-figure" style={{ fontSize: '1rem', color: 'var(--gold)' }}>
                      {formatPrice(Number(order.total_amount) || 0, hotel?.currency)}
                    </span>
                  </div>
                </div>
              ))}
            </div>
          )}
        </section>

        {/* Platform Capabilities */}
        <section className="d3-panel p-6">
          <div
            className="flex items-baseline justify-between gap-4"
            style={{ paddingBottom: '1rem', marginBottom: '1.25rem', borderBottom: '1px solid var(--border-warm)' }}
          >
            <h2 className="d3-panel-title" style={{ fontSize: '1.125rem' }}>
              Platform
            </h2>
          </div>
          <div style={{ display: 'flex', flexDirection: 'column' }}>
            {[
              { label: '3D Menu Management', desc: 'Add, edit, price and manage every dish with optional 3D', href: '/dashboard/menu' },
              { label: 'Customer 3D Menu', desc: '360° viewer, cart, checkout and ordering', href: menuHref, external: true },
              { label: 'Live Order System', desc: 'Placed → Preparing → Ready → Completed', href: '/dashboard/orders' },
              { label: 'Brand Customization', desc: 'Palette, typography and menu art direction', href: '/dashboard/customize' },
            ].map((cap, i) => (
              <Link
                key={i}
                href={cap.href}
                target={cap.external ? '_blank' : undefined}
                className="d3-card"
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'space-between',
                  gap: '1.25rem',
                  padding: '1rem 0',
                  borderRadius: 0,
                  border: 'none',
                  borderTop: i === 0 ? 'none' : '1px solid var(--border-warm)',
                  background: 'transparent',
                  textDecoration: 'none',
                }}
              >
                <div>
                  <span style={{ fontSize: '0.8125rem', fontWeight: 500, color: 'var(--text-primary)', display: 'block' }}>
                    {cap.label}
                  </span>
                  <span style={{ fontSize: '0.6875rem', color: 'var(--text-dimmed)', display: 'block', marginTop: 3 }}>
                    {cap.desc}
                  </span>
                </div>
                <svg width="12" height="12" viewBox="0 0 14 14" fill="none" style={{ color: 'var(--text-dimmed)', flexShrink: 0 }} aria-hidden="true">
                  <path d="M5 2.5L9.5 7L5 11.5" stroke="currentColor" strokeWidth="1.2" strokeLinecap="round" strokeLinejoin="round" />
                </svg>
              </Link>
            ))}
          </div>
        </section>
      </div>

    </div>
  );
}
