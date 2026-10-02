'use client';

import React, { useState, useCallback } from 'react';
import { useHotel, useOrders, Order } from '@/lib/useHotel';

/* Statuses read as one monochrome family — only the newest
   order carries the champagne accent. */
const STATUS_CLASS: Record<string, string> = {
  PLACED: 'd3-status-placed',
  ACCEPTED: 'd3-status-accepted',
  PREPARING: 'd3-status-preparing',
  READY: 'd3-status-ready',
  COMPLETED: 'd3-status-completed',
  CANCELLED: 'd3-status-cancelled',
};

function StatusBadge({ status }: { status: string }) {
  return (
    <span className={`d3-badge ${STATUS_CLASS[status] || STATUS_CLASS.CANCELLED}`}>
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
            { label: 'New', count: orders.filter((o: Order) => o.status === 'PLACED').length },
            { label: 'In Kitchen', count: orders.filter((o: Order) => ['ACCEPTED','PREPARING'].includes(o.status)).length },
            { label: 'Ready', count: orders.filter((o: Order) => o.status === 'READY').length },
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

      {/* Tab filter */}
      <div className="d3-segment" role="group" aria-label="Filter orders by status">
        {TABS.map((tab) => {
          const count = orders.filter((o: Order) => tab === 'all' ? true : o.status === tab.toUpperCase()).length;
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

      {/* Orders Grid */}
      {filtered.length === 0 ? (
        <div className="d3-empty">
          <svg width="38" height="38" viewBox="0 0 40 40" fill="none" style={{ opacity: 0.45 }} aria-hidden="true">
            <rect x="6" y="9" width="28" height="22" rx="3" stroke="currentColor" strokeWidth="1.1" />
            <path d="M13 17H27M13 22H21" stroke="currentColor" strokeWidth="1.1" strokeLinecap="round" />
          </svg>
          <h3 className="d3-empty-title">No {activeTab} orders</h3>
          <p className="d3-empty-body">
            Nothing in this state right now. Place a test order from{' '}
            <a href={menuHref} target="_blank" style={{ color: 'var(--gold)' }}>
              /menu/{hotelSlug || 'your-restaurant'}
            </a>{' '}
            to see it appear here.
          </p>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-5">
          {filtered.map((order: Order) => {
            const minsAgo = getMinutesAgo(order.created_at);
            const isNew = order.status === 'PLACED';
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
                      Table {order.table_number}
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
                  <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'flex-end', gap: 7, flexShrink: 0 }}>
                    <StatusBadge status={order.status} />
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
                  <span style={{ fontSize: '0.6875rem', color: 'var(--text-dimmed)' }}>
                    {order.payment_method} · {order.payment_status}
                  </span>
                  <span className="d3-figure" style={{ fontSize: '1.125rem', color: 'var(--gold)' }}>
                    ${order.total_amount.toFixed(2)}
                  </span>
                </div>

                {/* Actions */}
                <div className="flex flex-col gap-8" style={{ gap: 8 }}>
                  {order.status === 'PLACED' && (
                    <button
                      type="button"
                      onClick={() => handleUpdateStatus(order.id, 'accepted')}
                      className="d3-btn-primary"
                      style={{ flex: 1 }}
                    >
                      Accept Order
                    </button>
                  )}
                  {order.status === 'ACCEPTED' && (
                    <button
                      type="button"
                      onClick={() => handleUpdateStatus(order.id, 'preparing')}
                      className="d3-btn-quiet"
                      style={{ flex: 1 }}
                    >
                      Start Preparing
                    </button>
                  )}
                  {order.status === 'PREPARING' && (
                    <button
                      type="button"
                      onClick={() => handleUpdateStatus(order.id, 'ready')}
                      className="d3-btn-quiet"
                      style={{ flex: 1 }}
                    >
                      Mark Ready
                    </button>
                  )}
                  {order.status === 'READY' && (
                    <button
                      type="button"
                      onClick={() => handleUpdateStatus(order.id, 'completed')}
                      className="d3-btn-quiet"
                      style={{ flex: 1 }}
                    >
                      Complete
                    </button>
                  )}
                  {!['COMPLETED', 'CANCELLED'].includes(order.status) && (
                    <button
                      type="button"
                      onClick={() => handleUpdateStatus(order.id, 'cancelled')}
                      className="d3-btn-inline d3-btn-danger"
                    >
                      Cancel
                    </button>
                  )}
                </div>
              </article>
            );
          })}
        </div>
      )}
    </div>
  );
}
