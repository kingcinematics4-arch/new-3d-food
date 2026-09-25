'use client';

import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import { getDemoOrders, getDemoItems } from '@/lib/demoData';

function StatCard({ label, value, change, icon }: { label: string; value: string; change: string; icon: React.ReactNode }) {
  return (
    <div
      style={{
        background: 'var(--bg-surface)',
        border: '1px solid var(--border-subtle)',
        borderRadius: 12,
        padding: '1.5rem',
        display: 'flex',
        flexDirection: 'column',
        gap: '1rem',
        transition: 'all 300ms',
      }}
      onMouseEnter={(e) => {
        e.currentTarget.style.borderColor = 'rgba(201,169,110,0.15)';
        e.currentTarget.style.background = 'var(--bg-surface-2)';
      }}
      onMouseLeave={(e) => {
        e.currentTarget.style.borderColor = 'var(--border-subtle)';
        e.currentTarget.style.background = 'var(--bg-surface)';
      }}
    >
      <div className="flex items-center justify-between">
        <span style={{ fontSize: '0.6875rem', color: 'var(--text-dimmed)', fontFamily: 'var(--font-body)', fontWeight: 600, letterSpacing: '0.1em', textTransform: 'uppercase' }}>
          {label}
        </span>
        <div style={{
          width: 32, height: 32, borderRadius: 8,
          background: 'rgba(201,169,110,0.08)',
          border: '1px solid rgba(201,169,110,0.12)',
          display: 'flex', alignItems: 'center', justifyContent: 'center',
          color: 'var(--gold)',
        }}>
          {icon}
        </div>
      </div>
      <div>
        <span style={{
          fontFamily: 'var(--font-display)',
          fontSize: '2rem',
          fontWeight: 500,
          color: 'var(--text-primary)',
          letterSpacing: '-0.03em',
          lineHeight: 1,
          display: 'block',
        }}>
          {value}
        </span>
        <span style={{ fontSize: '0.6875rem', color: 'var(--text-dimmed)', marginTop: 4, display: 'block' }}>
          {change}
        </span>
      </div>
    </div>
  );
}

function StatusDot({ status }: { status: string }) {
  const colors: Record<string, string> = {
    PLACED: 'var(--gold)',
    ACCEPTED: '#A0C4FF',
    PREPARING: '#C4B5FD',
    READY: '#86EFAC',
    COMPLETED: '#6B7280',
    CANCELLED: '#FCA5A5',
  };
  return (
    <span
      style={{
        width: 7, height: 7, borderRadius: '50%',
        background: colors[status] || '#6B7280',
        display: 'inline-block',
        flexShrink: 0,
      }}
    />
  );
}

export default function DashboardOverview() {
  const [stats, setStats] = useState([
    { label: 'Orders Today', value: '–', change: 'Loading...', icon: (
      <svg width="14" height="14" viewBox="0 0 14 14" fill="none"><path d="M2 2H12L11 5H3L2 2Z" stroke="currentColor" strokeWidth="1.1" strokeLinejoin="round" /><rect x="1" y="5" width="12" height="7" rx="1.5" stroke="currentColor" strokeWidth="1.1" /></svg>
    )},
    { label: 'Revenue', value: '–', change: 'Loading...', icon: (
      <svg width="14" height="14" viewBox="0 0 14 14" fill="none"><circle cx="7" cy="7" r="5.5" stroke="currentColor" strokeWidth="1.1" /><path d="M7 4V5.5M7 8.5V10M5 6.5C5 5.7 5.9 5 7 5C8.1 5 9 5.7 9 6.5C9 7.3 8.1 8 7 8C5.9 8 5 8.7 5 9.5C5 10.3 5.9 11 7 11C8.1 11 9 10.3 9 9.5" stroke="currentColor" strokeWidth="1.1" strokeLinecap="round" /></svg>
    )},
    { label: '3D Menu Items', value: '–', change: 'Loading...', icon: (
      <svg width="14" height="14" viewBox="0 0 14 14" fill="none"><path d="M7 1L12 4V10L7 13L2 10V4L7 1Z" stroke="currentColor" strokeWidth="1.1" strokeLinejoin="round" /></svg>
    )},
    { label: 'QR Scans Today', value: '–', change: 'Loading...', icon: (
      <svg width="14" height="14" viewBox="0 0 14 14" fill="none"><rect x="1" y="1" width="4" height="4" rx="0.75" stroke="currentColor" strokeWidth="1.1" /><rect x="9" y="1" width="4" height="4" rx="0.75" stroke="currentColor" strokeWidth="1.1" /><rect x="1" y="9" width="4" height="4" rx="0.75" stroke="currentColor" strokeWidth="1.1" /><path d="M9 9H11V11M11 13H13M13 9H13.01M9 13H9.01" stroke="currentColor" strokeWidth="1.1" strokeLinecap="round" /></svg>
    )},
  ]);

  const [recentOrders, setRecentOrders] = useState<any[]>([]);

  useEffect(() => {
    const orders = getDemoOrders();
    const items = getDemoItems();
    const revenue = orders.reduce((sum, o) => sum + o.total_amount, 0);
    setStats([
      { label: 'Orders Today', value: `${orders.length}`, change: '+12% vs yesterday', icon: stats[0].icon },
      { label: 'Revenue', value: `$${revenue.toFixed(0)}`, change: '+8% this week', icon: stats[1].icon },
      { label: '3D Menu Items', value: `${items.length}`, change: '2 models pending', icon: stats[2].icon },
      { label: 'QR Scans Today', value: '189', change: 'Peak at 1:30 PM', icon: stats[3].icon },
    ]);
    setRecentOrders(orders.slice(0, 5));
  }, []);

  const quickActions = [
    { label: 'Add Dish', href: '/dashboard/menu', icon: '+' },
    { label: 'View Orders', href: '/dashboard/orders', icon: '→' },
    { label: 'Generate QR', href: '/dashboard/qr', icon: '⬢' },
    { label: 'Analytics', href: '/dashboard/analytics', icon: '↗' },
  ];

  return (
    <div className="flex flex-col gap-8 max-w-[1200px] mx-auto">

      {/* Welcome header */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
        <div>
          <h2
            style={{
              fontFamily: 'var(--font-display)',
              fontSize: '1.75rem',
              fontWeight: 500,
              color: 'var(--text-primary)',
              letterSpacing: '-0.02em',
              lineHeight: 1.2,
              marginBottom: '0.25rem',
            }}
          >
            Good evening
          </h2>
          <p style={{ color: 'var(--text-muted)', fontSize: '0.875rem' }}>
            Here's what's happening at your restaurant today.
          </p>
        </div>

        <div className="flex items-center gap-3">
          <Link
            href="/menu/demo-restaurant"
            target="_blank"
            className="d3-btn-ghost"
            style={{ padding: '0.5625rem 1.125rem', fontSize: '0.8125rem' }}
          >
            View Customer Menu ↗
          </Link>
          <Link
            href="/dashboard/menu"
            className="d3-btn-primary"
            style={{ padding: '0.5625rem 1.125rem', fontSize: '0.8125rem' }}
          >
            + Add Dish
          </Link>
        </div>
      </div>

      {/* Stats Grid */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        {stats.map((stat, i) => (
          <StatCard key={i} {...stat} />
        ))}
      </div>

      {/* Quick Actions */}
      <div
        style={{
          background: 'var(--bg-surface)',
          border: '1px solid var(--border-subtle)',
          borderRadius: 12,
          padding: '1.5rem',
        }}
      >
        <div className="flex items-center justify-between mb-4">
          <h3 style={{ fontFamily: 'var(--font-body)', fontWeight: 600, color: 'var(--text-primary)', fontSize: '0.875rem' }}>
            Quick Actions
          </h3>
        </div>
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
          {quickActions.map((action) => (
            <Link
              key={action.href}
              href={action.href}
              style={{
                display: 'flex',
                flexDirection: 'column',
                gap: '0.5rem',
                padding: '1rem',
                borderRadius: 10,
                border: '1px solid var(--border-subtle)',
                background: 'var(--bg-surface-2)',
                textDecoration: 'none',
                transition: 'all 200ms',
              }}
              onMouseEnter={(e) => {
                e.currentTarget.style.borderColor = 'rgba(201,169,110,0.2)';
                e.currentTarget.style.background = 'var(--bg-elevated)';
              }}
              onMouseLeave={(e) => {
                e.currentTarget.style.borderColor = 'var(--border-subtle)';
                e.currentTarget.style.background = 'var(--bg-surface-2)';
              }}
            >
              <span style={{ fontSize: '1.25rem', color: 'var(--gold)' }}>{action.icon}</span>
              <span style={{ fontSize: '0.8125rem', fontWeight: 500, color: 'var(--text-primary)' }}>{action.label}</span>
            </Link>
          ))}
        </div>
      </div>

      {/* Two columns: Recent Orders + Capabilities */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">

        {/* Recent Orders */}
        <div
          style={{
            background: 'var(--bg-surface)',
            border: '1px solid var(--border-subtle)',
            borderRadius: 12,
            padding: '1.5rem',
          }}
        >
          <div className="flex items-center justify-between mb-5">
            <h3 style={{ fontFamily: 'var(--font-body)', fontWeight: 600, color: 'var(--text-primary)', fontSize: '0.875rem' }}>
              Recent Orders
            </h3>
            <Link
              href="/dashboard/orders"
              style={{ fontSize: '0.75rem', color: 'var(--gold)', textDecoration: 'none' }}
            >
              View all →
            </Link>
          </div>

          {recentOrders.length === 0 ? (
            <div
              className="py-12 text-center flex flex-col items-center gap-3"
              style={{ color: 'var(--text-dimmed)' }}
            >
              <svg width="32" height="32" viewBox="0 0 32 32" fill="none" style={{ opacity: 0.4 }}>
                <rect x="4" y="4" width="24" height="24" rx="4" stroke="currentColor" strokeWidth="1.5" />
                <path d="M10 12H22M10 16H18M10 20H14" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" />
              </svg>
              <p style={{ fontSize: '0.875rem' }}>No orders yet today</p>
            </div>
          ) : (
            <div className="flex flex-col gap-2">
              {recentOrders.map((order) => (
                <div
                  key={order.id}
                  className="flex items-center justify-between py-3 px-3 rounded-lg"
                  style={{
                    background: 'var(--bg-surface-2)',
                    border: '1px solid var(--border-subtle)',
                  }}
                >
                  <div className="flex items-center gap-2.5 min-w-0">
                    <StatusDot status={order.status} />
                    <div className="min-w-0">
                      <span style={{ fontWeight: 600, fontSize: '0.8125rem', color: 'var(--text-primary)', display: 'block' }}>
                        {order.order_code}
                      </span>
                      <span style={{ fontSize: '0.6875rem', color: 'var(--text-dimmed)', display: 'block' }}>
                        {order.table_number} · {order.customer_name}
                      </span>
                    </div>
                  </div>
                  <div className="flex flex-col items-end gap-1">
                    <span style={{ fontFamily: 'var(--font-display)', fontSize: '0.9375rem', color: 'var(--gold)', fontWeight: 500 }}>
                      ${order.total_amount.toFixed(2)}
                    </span>
                    <span className="d3-badge" style={{
                      fontSize: '0.5rem',
                      padding: '0.1rem 0.5rem',
                      ...(order.status === 'PLACED'
                        ? { background: 'rgba(201,169,110,0.1)', border: '1px solid rgba(201,169,110,0.2)', color: 'var(--gold)' }
                        : order.status === 'PREPARING' || order.status === 'ACCEPTED'
                        ? { background: 'rgba(160,120,255,0.08)', border: '1px solid rgba(160,120,255,0.2)', color: '#C4B5FD' }
                        : order.status === 'READY'
                        ? { background: 'rgba(100,210,150,0.08)', border: '1px solid rgba(100,210,150,0.2)', color: '#86EFAC' }
                        : { background: 'rgba(100,100,100,0.08)', border: '1px solid rgba(100,100,100,0.2)', color: '#9CA3AF' })
                      }
                    }>
                      {order.status}
                    </span>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Platform Capabilities */}
        <div
          style={{
            background: 'var(--bg-surface)',
            border: '1px solid var(--border-subtle)',
            borderRadius: 12,
            padding: '1.5rem',
          }}
        >
          <h3 style={{ fontFamily: 'var(--font-body)', fontWeight: 600, color: 'var(--text-primary)', fontSize: '0.875rem', marginBottom: '1.25rem' }}>
            Platform Capabilities
          </h3>
          <div className="flex flex-col gap-2.5">
            {[
              { label: '3D Menu Management', desc: 'Add, edit, price, and manage all dishes with 3D models', href: '/dashboard/menu', active: true },
              { label: 'Customer 3D Menu', desc: '360° dish viewer, cart, checkout & ordering', href: '/menu/demo-restaurant', external: true, active: true },
              { label: 'Live Order System', desc: 'PLACED → PREPARING → READY → COMPLETED', href: '/dashboard/orders', active: true },
              { label: 'Brand Customization', desc: 'Colors, typography, branding and menu design', href: '/dashboard/customize', active: true },
            ].map((cap, i) => (
              <Link
                key={i}
                href={cap.href}
                target={cap.external ? '_blank' : undefined}
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'space-between',
                  gap: '1rem',
                  padding: '0.875rem',
                  borderRadius: 8,
                  background: 'var(--bg-surface-2)',
                  border: '1px solid var(--border-subtle)',
                  textDecoration: 'none',
                  transition: 'all 200ms',
                }}
                onMouseEnter={(e) => e.currentTarget.style.borderColor = 'rgba(201,169,110,0.2)'}
                onMouseLeave={(e) => e.currentTarget.style.borderColor = 'var(--border-subtle)'}
              >
                <div>
                  <div className="flex items-center gap-2 mb-0.5">
                    <span
                      style={{
                        width: 7, height: 7, borderRadius: '50%',
                        background: cap.active ? '#86EFAC' : 'var(--text-dimmed)',
                        flexShrink: 0,
                      }}
                    />
                    <span style={{ fontSize: '0.8125rem', fontWeight: 600, color: 'var(--text-primary)' }}>
                      {cap.label}
                    </span>
                  </div>
                  <p style={{ fontSize: '0.6875rem', color: 'var(--text-dimmed)', paddingLeft: '0.9375rem' }}>
                    {cap.desc}
                  </p>
                </div>
                <svg width="14" height="14" viewBox="0 0 14 14" fill="none" style={{ color: 'var(--text-dimmed)', flexShrink: 0 }}>
                  <path d="M5 2.5L9.5 7L5 11.5" stroke="currentColor" strokeWidth="1.2" strokeLinecap="round" strokeLinejoin="round" />
                </svg>
              </Link>
            ))}
          </div>
        </div>
      </div>

    </div>
  );
}
