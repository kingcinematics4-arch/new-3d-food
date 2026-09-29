'use client';

import React, { useState, useEffect, useCallback } from 'react';
import { useHotel, useOrders, Order } from '@/lib/useHotel';

function StatusBadge({ status }: { status: string }) {
  const styles: Record<string, React.CSSProperties> = {
    PLACED:    { background: 'rgba(201,169,110,0.1)', border: '1px solid rgba(201,169,110,0.25)', color: 'var(--gold)' },
    ACCEPTED:  { background: 'rgba(100,160,255,0.08)', border: '1px solid rgba(100,160,255,0.2)', color: '#A0C4FF' },
    PREPARING: { background: 'rgba(160,120,255,0.08)', border: '1px solid rgba(160,120,255,0.2)', color: '#C4B5FD' },
    READY:     { background: 'rgba(100,210,150,0.08)', border: '1px solid rgba(100,210,150,0.2)', color: '#86EFAC' },
    COMPLETED: { background: 'rgba(100,100,100,0.08)', border: '1px solid rgba(100,100,100,0.2)', color: '#9CA3AF' },
    CANCELLED: { background: 'rgba(200,80,80,0.06)',  border: '1px solid rgba(200,80,80,0.2)',   color: '#FCA5A5' },
  };
  return (
    <span
      className="d3-badge"
      style={{ ...(styles[status] || styles.CANCELLED), padding: '0.2rem 0.625rem', fontSize: '0.5625rem' }}
    >
      {status}
    </span>
  );
}

function getMinutesAgo(dateStr: string) {
  return Math.max(1, Math.floor((Date.now() - new Date(dateStr).getTime()) / 60000));
}

const TABS = ['all', 'placed', 'accepted', 'preparing', 'ready', 'completed', 'cancelled'];

export default function LiveOrdersPage() {
  const { hotel, loading: hotelLoading } = useHotel();
  const { orders, loading: ordersLoading, refetch: refetchOrders, updateOrderStatus } = useOrders(hotel?.id || null);
  const hotelSlug = hotel?.slug || '';
  const menuHref = hotelSlug ? `/menu/${hotelSlug}` : '/dashboard/settings';
  const [activeTab, setActiveTab] = useState('all');

  const handleUpdateStatus = useCallback(
    async (id: string, status: string) => {
      await updateOrderStatus(id, status);
      refetchOrders();
    },
    [updateOrderStatus, refetchOrders]
  );

  const filtered = orders.filter((o: Order) =>
    activeTab === 'all' ? true : o.status === activeTab.toUpperCase()
  );

  const getOrderItems = (order: Order) => {
    if (order.order_items && Array.isArray(order.order_items)) {
      return order.order_items.map((item: any) => ({
        id: item.id,
        name: item.name || item.menu_item?.name || 'Unknown',
        quantity: item.quantity || 1,
        price: item.price || 0,
        notes: item.notes,
      }));
    }
    return [];
  };

  if (hotelLoading || ordersLoading) {
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
    <div className="flex flex-col gap-6 max-w-[1200px] mx-auto">

      {/* Header */}
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
            Live Orders
          </h2>
          <p style={{ color: 'var(--text-muted)', fontSize: '0.875rem' }}>
            Real-time order stream for kitchen staff and servers.
          </p>
        </div>

        {/* Summary pills */}
        <div className="flex items-center gap-2">
          {[
            { label: 'Placed', count: orders.filter((o: Order) => o.status === 'PLACED').length, color: 'var(--gold)', bg: 'rgba(201,169,110,0.08)', border: 'rgba(201,169,110,0.2)' },
            { label: 'Cooking', count: orders.filter((o: Order) => ['ACCEPTED','PREPARING'].includes(o.status)).length, color: '#C4B5FD', bg: 'rgba(160,120,255,0.08)', border: 'rgba(160,120,255,0.2)' },
            { label: 'Ready', count: orders.filter((o: Order) => o.status === 'READY').length, color: '#86EFAC', bg: 'rgba(100,210,150,0.08)', border: 'rgba(100,210,150,0.2)' },
          ].map((pill) => (
            <div
              key={pill.label}
              style={{
                display: 'flex', alignItems: 'center', gap: 6,
                padding: '0.375rem 0.875rem',
                borderRadius: 100,
                background: pill.bg,
                border: `1px solid ${pill.border}`,
              }}
            >
              <span style={{ width: 6, height: 6, borderRadius: '50%', background: pill.color, display: 'inline-block' }} />
              <span style={{ fontSize: '0.6875rem', fontWeight: 600, color: pill.color }}>
                {pill.count} {pill.label}
              </span>
            </div>
          ))}
        </div>
      </div>

      {/* Tab filter */}
      <div
        className="flex gap-1 p-1 overflow-x-auto"
        style={{
          background: 'var(--bg-surface)',
          border: '1px solid var(--border-subtle)',
          borderRadius: 10,
          width: 'fit-content',
        }}
      >
        {TABS.map((tab) => {
          const count = orders.filter((o: Order) => tab === 'all' ? true : o.status === tab.toUpperCase()).length;
          const isActive = activeTab === tab;
          return (
            <button
              key={tab}
              onClick={() => setActiveTab(tab)}
              style={{
                padding: '0.4375rem 0.875rem',
                borderRadius: 7,
                fontSize: '0.6875rem',
                fontWeight: 600,
                letterSpacing: '0.06em',
                textTransform: 'uppercase',
                cursor: 'pointer',
                border: 'none',
                whiteSpace: 'nowrap',
                background: isActive ? 'var(--gold)' : 'transparent',
                color: isActive ? '#0B0A08' : 'var(--text-muted)',
                transition: 'all 200ms',
              }}
            >
              {tab} ({count})
            </button>
          );
        })}
      </div>

      {/* Orders Grid */}
      {filtered.length === 0 ? (
        <div
          className="flex flex-col items-center justify-center py-24 gap-4"
          style={{
            background: 'var(--bg-surface)',
            border: '1px solid var(--border-subtle)',
            borderRadius: 12,
          }}
        >
          <svg width="40" height="40" viewBox="0 0 40 40" fill="none" style={{ color: 'var(--text-dimmed)', opacity: 0.5 }}>
            <rect x="4" y="4" width="32" height="32" rx="6" stroke="currentColor" strokeWidth="1.5" />
            <path d="M12 16H28M12 22H22" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" />
          </svg>
          <div className="text-center">
            <p style={{ color: 'var(--text-secondary)', fontWeight: 600, marginBottom: 4 }}>No {activeTab} orders</p>
            <p style={{ color: 'var(--text-dimmed)', fontSize: '0.875rem' }}>
              Place a test order via{' '}
              <a href={menuHref} target="_blank" style={{ color: 'var(--gold)', textDecoration: 'underline' }}>
                /menu/{hotelSlug || 'your-hotel'}
              </a>
            </p>
          </div>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4">
          {filtered.map((order: Order) => {
            const minsAgo = getMinutesAgo(order.created_at);
            const isNew = order.status === 'PLACED';
            const orderItems = getOrderItems(order);
            return (
              <div
                key={order.id}
                style={{
                  background: 'var(--bg-surface)',
                  border: `1px solid ${isNew ? 'rgba(201,169,110,0.3)' : 'var(--border-subtle)'}`,
                  borderRadius: 12,
                  padding: '1.25rem',
                  display: 'flex',
                  flexDirection: 'column',
                  gap: '1rem',
                  boxShadow: isNew ? '0 0 0 1px rgba(201,169,110,0.08), 0 4px 24px rgba(0,0,0,0.3)' : 'none',
                  position: 'relative',
                  overflow: 'hidden',
                }}
              >
                {/* New order pulse indicator */}
                {isNew && (
                  <div
                    className="absolute top-0 right-0 left-0 h-0.5"
                    style={{ background: 'linear-gradient(to right, transparent, var(--gold), transparent)' }}
                  />
                )}

                {/* Order Header */}
                <div className="flex items-start justify-between">
                  <div>
                    <div className="flex items-center gap-2 mb-0.5">
                      <span style={{ fontFamily: 'var(--font-body)', fontWeight: 700, fontSize: '1rem', color: 'var(--text-primary)' }}>
                        Table {order.table_number}
                      </span>
                      <span style={{ fontSize: '0.6875rem', color: 'var(--text-dimmed)', fontFamily: 'monospace' }}>
                        #{order.id.slice(0, 8).toUpperCase()}
                      </span>
                    </div>
                    <p style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>{order.customer_name || 'Guest'}</p>
                  </div>
                  <div className="flex flex-col items-end gap-1">
                    <StatusBadge status={order.status} />
                    <span style={{ fontSize: '0.6875rem', color: 'var(--text-dimmed)' }}>⏱ {minsAgo}m ago</span>
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
                            {item.quantity}× {item.name}
                          </span>
                          {item.notes && (
                            <span style={{ fontSize: '0.6875rem', color: 'var(--gold)', display: 'block', marginTop: 2 }}>
                              Note: {item.notes}
                            </span>
                          )}
                        </div>
                        <span style={{ fontSize: '0.8125rem', color: 'var(--text-muted)', fontWeight: 500, marginLeft: 8, flexShrink: 0 }}>
                          ${(item.price * item.quantity).toFixed(2)}
                        </span>
                      </div>
                    ))
                  )}
                </div>

                {/* Order total */}
                {order.notes && (
                  <div
                    style={{
                      padding: '0.5rem 0.75rem',
                      borderRadius: 6,
                      background: 'rgba(201,169,110,0.04)',
                      border: '1px solid rgba(201,169,110,0.1)',
                      fontSize: '0.75rem',
                      color: 'var(--gold)',
                    }}
                  >
                    <strong>Chef note:</strong> {order.notes}
                  </div>
                )}

                <div
                  className="flex items-center justify-between"
                  style={{ borderTop: '1px solid var(--border-subtle)', paddingTop: '0.75rem' }}
                >
                  <span style={{ fontSize: '0.75rem', color: 'var(--text-dimmed)' }}>
                    {order.payment_method} · {order.payment_status}
                  </span>
                  <span style={{ fontFamily: 'var(--font-display)', fontSize: '1.125rem', color: 'var(--gold)', fontWeight: 500 }}>
                    ${order.total_amount.toFixed(2)}
                  </span>
                </div>

                {/* Actions */}
                <div className="flex gap-2">
                  {order.status === 'PLACED' && (
                    <button
                      onClick={() => handleUpdateStatus(order.id, 'accepted')}
                      className="d3-btn-primary"
                      style={{ flex: 1, justifyContent: 'center', padding: '0.625rem', fontSize: '0.75rem' }}
                    >
                      Accept Order
                    </button>
                  )}
                  {order.status === 'ACCEPTED' && (
                    <button
                      onClick={() => handleUpdateStatus(order.id, 'preparing')}
                      style={{
                        flex: 1, padding: '0.625rem', fontSize: '0.75rem', fontWeight: 600,
                        borderRadius: 100, cursor: 'pointer', border: 'none',
                        background: 'rgba(160,120,255,0.15)',
                        color: '#C4B5FD', transition: 'all 200ms',
                      }}
                    >
                      Start Preparing
                    </button>
                  )}
                  {order.status === 'PREPARING' && (
                    <button
                      onClick={() => handleUpdateStatus(order.id, 'ready')}
                      style={{
                        flex: 1, padding: '0.625rem', fontSize: '0.75rem', fontWeight: 600,
                        borderRadius: 100, cursor: 'pointer', border: 'none',
                        background: 'rgba(100,210,150,0.12)',
                        color: '#86EFAC', transition: 'all 200ms',
                      }}
                    >
                      Mark Ready
                    </button>
                  )}
                  {order.status === 'READY' && (
                    <button
                      onClick={() => handleUpdateStatus(order.id, 'completed')}
                      style={{
                        flex: 1, padding: '0.625rem', fontSize: '0.75rem', fontWeight: 600,
                        borderRadius: 100, cursor: 'pointer', border: '1px solid var(--border-medium)',
                        background: 'transparent', color: 'var(--text-secondary)', transition: 'all 200ms',
                      }}
                    >
                      Complete
                    </button>
                  )}
                  {!['COMPLETED', 'CANCELLED'].includes(order.status) && (
                    <button
                      onClick={() => handleUpdateStatus(order.id, 'cancelled')}
                      style={{
                        padding: '0.625rem 0.875rem', fontSize: '0.6875rem', fontWeight: 600,
                        borderRadius: 100, cursor: 'pointer',
                        background: 'rgba(200,80,80,0.06)',
                        border: '1px solid rgba(200,80,80,0.15)',
                        color: '#FCA5A5', transition: 'all 200ms',
                      }}
                    >
                      Cancel
                    </button>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
