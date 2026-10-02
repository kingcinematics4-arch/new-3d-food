'use client';

import React, { useState, useMemo, useEffect } from 'react';
import dynamic from 'next/dynamic';
import { useHotel, useOrders, useMenuItems } from '@/lib/useHotel';
import { Order } from '@/lib/useHotel';
import { formatPrice } from '@/lib/menu';

const Chart = dynamic(() => import('react-apexcharts'), { ssr: false });

const DAYS = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];

/* Shared chart palette — champagne and bone only */
const INK_MUTED = '#9B968C';
const INK_DIM = '#6B675F';
const GRID_LINE = 'rgba(243,239,231,0.06)';
const ACCENT = '#B8A47A';
const ACCENT_SOFT = 'rgba(184,164,122,0.22)';

function getDayLabel(date: Date): string {
  return DAYS[date.getDay()];
}

/* ============================================================
   METRIC CARD
   ============================================================ */
function Metric({
  label,
  value,
  note,
}: {
  label: string;
  value: string;
  note: string;
}) {
  return (
    <div className="d3-panel p-5">
      <span
        style={{
          display: 'block',
          fontSize: '0.5625rem',
          fontWeight: 600,
          letterSpacing: '0.18em',
          textTransform: 'uppercase',
          color: 'var(--text-dimmed)',
        }}
      >
        {label}
      </span>
      <span className="d3-figure" style={{ display: 'block', fontSize: '2rem', marginTop: '0.875rem' }}>
        {value}
      </span>
      <span
        style={{
          display: 'block',
          marginTop: 8,
          fontSize: '0.6875rem',
          color: 'var(--text-muted)',
        }}
      >
        {note}
      </span>
    </div>
  );
}

/* ============================================================
   PANEL HEADING
   ============================================================ */
function PanelHeading({
  title,
  aside,
}: {
  title: string;
  aside?: React.ReactNode;
}) {
  return (
    <div
      className="flex items-baseline justify-between gap-4"
      style={{ paddingBottom: '1rem', marginBottom: '1.25rem', borderBottom: '1px solid var(--border-warm)' }}
    >
      <h3 className="d3-panel-title" style={{ fontSize: '1.125rem' }}>
        {title}
      </h3>
      {aside}
    </div>
  );
}

export default function AnalyticsDashboardPage() {
  const { hotel, loading: hotelLoading } = useHotel();
  const { orders, loading: ordersLoading } = useOrders(hotel?.id || null);
  const { items: menuItems, loading: itemsLoading } = useMenuItems(hotel?.id || null);
  const [isMounted, setIsMounted] = useState(false);
  const [timeRange, setTimeRange] = useState<'today' | '7days' | '30days'>('7days');

  useEffect(() => {
    setIsMounted(true);
  }, []);

  const now = new Date();
  const cutoff = useMemo(() => {
    const d = new Date(now);
    if (timeRange === 'today') {
      d.setHours(0, 0, 0, 0);
    } else if (timeRange === '7days') {
      d.setDate(d.getDate() - 7);
    } else {
      d.setDate(d.getDate() - 30);
    }
    return d;
  }, [timeRange, now]);

  const filteredOrders = useMemo(() => {
    return orders.filter((o: Order) => {
      const d = new Date(o.created_at);
      return d >= cutoff && d <= now;
    });
  }, [orders, cutoff, now]);

  const totalRevenue = useMemo(
    () => filteredOrders.reduce((s: number, o: Order) => s + (o.total_amount || 0), 0),
    [filteredOrders]
  );
  const totalOrdersCount = filteredOrders.length;
  const aov = totalOrdersCount > 0 ? totalRevenue / totalOrdersCount : 0;

  const dailyBuckets = useMemo(() => {
    const days: number = timeRange === 'today' ? 1 : timeRange === '7days' ? 7 : 30;
    const buckets = Array.from({ length: days }, (_, i) => {
      const d = new Date(now);
      d.setDate(d.getDate() - (days - 1 - i));
      d.setHours(0, 0, 0, 0);
      return d;
    });
    return buckets;
  }, [timeRange, now]);

  const dailyLabels = dailyBuckets.map((d) =>
    timeRange === '30days' ? `${d.getMonth() + 1}/${d.getDate()}` : getDayLabel(d)
  );

  const salesTrendSeries = useMemo(() => {
    const revData = dailyBuckets.map((bucket) => {
      const next = new Date(bucket);
      next.setDate(next.getDate() + 1);
      return filteredOrders
        .filter((o: Order) => {
          const d = new Date(o.created_at);
          return d >= bucket && d < next;
        })
        .reduce((s: number, o: Order) => s + (o.total_amount || 0), 0);
    });
    const countData = dailyBuckets.map((bucket) => {
      const next = new Date(bucket);
      next.setDate(next.getDate() + 1);
      return filteredOrders.filter((o: Order) => {
        const d = new Date(o.created_at);
        return d >= bucket && d < next;
      }).length;
    });
    return [
      { name: 'Revenue', data: revData },
      { name: 'Orders Count', data: countData },
    ];
  }, [filteredOrders, dailyBuckets]);

  const topDishes = useMemo(() => {
    const dishMap: Record<string, number> = {};
    filteredOrders.forEach((o: Order) => {
      (o.order_items || []).forEach((item: any) => {
        const name = item.name || item.menu_item?.name || item.menu_item_id || 'Unknown';
        dishMap[name] = (dishMap[name] || 0) + (item.quantity || 1);
      });
    });
    return Object.entries(dishMap)
      .map(([name, qty]) => ({ name, qty }))
      .sort((a, b) => b.qty - a.qty)
      .slice(0, 5);
  }, [filteredOrders]);

  const topDishesOptions: any = {
    chart: {
      type: 'bar',
      toolbar: { show: false },
      background: 'transparent',
      fontFamily: 'Inter, system-ui, sans-serif',
    },
    theme: { mode: 'dark' },
    plotOptions: { bar: { borderRadius: 2, horizontal: true, barHeight: '46%' } },
    colors: [ACCENT],
    dataLabels: {
      enabled: true,
      style: { colors: [INK_MUTED], fontSize: '11px', fontWeight: 500 },
      offsetX: 6,
    },
    xaxis: {
      categories: topDishes.map((d) => d.name),
      labels: { style: { colors: INK_MUTED, fontSize: '11px' } },
      axisBorder: { show: false },
      axisTicks: { show: false },
    },
    yaxis: {
      labels: { style: { colors: INK_DIM, fontSize: '10px' } },
    },
    grid: { borderColor: GRID_LINE, strokeDashArray: 0, xaxis: { lines: { show: false } } },
    legend: { show: false },
    tooltip: { theme: 'dark', style: { fontSize: '12px' } },
  };
  const topDishesSeries = [{ name: 'Units Sold', data: topDishes.map((d) => d.qty) }];

  const paymentMethodMap: Record<string, number> = {};
  filteredOrders.forEach((o: Order) => {
    const pm = o.payment_method || 'Unknown';
    paymentMethodMap[pm] = (paymentMethodMap[pm] || 0) + 1;
  });
  const paymentEntries = Object.entries(paymentMethodMap).sort((a, b) => b[1] - a[1]);

  // Shades of bone and champagne — no saturated hues anywhere.
  const paymentShades = ['#B8A47A', '#D9CBAB', '#8E8578', '#C2BCB0', '#6B675F'];
  const paymentMethodOptions: any = {
    chart: { type: 'donut', background: 'transparent', fontFamily: 'Inter, system-ui, sans-serif' },
    theme: { mode: 'dark' },
    labels: paymentEntries.map(([k]) => k),
    colors: paymentEntries.map((_, i) => paymentShades[i % paymentShades.length]),
    stroke: { width: 2, colors: ['#171613'] },
    legend: {
      position: 'bottom',
      labels: { colors: INK_MUTED, fontSize: '11px' },
      markers: { width: 6, height: 6, strokeWidth: 0 },
      itemMargin: { horizontal: 6, vertical: 4 },
    },
    dataLabels: { enabled: false },
    tooltip: { theme: 'dark', style: { fontSize: '12px' } },
  };
  const paymentMethodSeries = paymentEntries.map(([, v]) => v);

  const salesTrendOptions: any = {
    chart: {
      type: 'area',
      toolbar: { show: false },
      background: 'transparent',
      fontFamily: 'Inter, system-ui, sans-serif',
    },
    theme: { mode: 'dark' },
    colors: [ACCENT, 'rgba(243,239,231,0.34)'],
    stroke: { curve: 'straight', width: 2, dashArray: 0 },
    markers: { size: 0, hover: { size: 4 } },
    fill: {
      type: 'solid',
      opacity: 0.1,
      colors: [ACCENT_SOFT],
    },
    legend: {
      position: 'top',
      horizontalAlign: 'left',
      labels: { colors: INK_MUTED, fontSize: '11px' },
      markers: { width: 6, height: 6, strokeWidth: 0 },
      itemMargin: { horizontal: 8, vertical: 0 },
    },
    xaxis: {
      categories: dailyLabels,
      labels: { style: { colors: INK_DIM, fontSize: '10px' } },
      axisBorder: { show: true, color: GRID_LINE },
      axisTicks: { show: false },
    },
    yaxis: [
      {
        labels: { style: { colors: INK_DIM, fontSize: '10px' } },
      },
      { opposite: true, show: false },
    ],
    grid: { borderColor: GRID_LINE, strokeDashArray: 0 },
    tooltip: { theme: 'dark', style: { fontSize: '12px' }, shared: true },
  };

  const loading = hotelLoading || ordersLoading || itemsLoading;
  const featuredCount = menuItems.filter((m: any) => m.is_featured || m.is_popular).length;

  const RANGE_LABELS: Record<string, string> = {
    today: 'Today',
    '7days': 'Last 7 Days',
    '30days': 'Last 30 Days',
  };

  return (
    <div className="flex flex-col gap-8" style={{ maxWidth: 1180 }}>
      {/* ================= Page header ================= */}
      <header
        className="flex flex-col sm:flex-row items-start sm:items-end justify-between gap-5"
      >
        <div>
          <span className="d3-eyebrow" style={{ fontSize: '0.5625rem' }}>
            Analytics
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
            Revenue Intelligence
          </h1>
          <p
            style={{
              margin: '0.5rem 0 0',
              fontSize: '0.875rem',
              lineHeight: 1.6,
              color: 'var(--text-muted)',
              maxWidth: '56ch',
            }}
          >
            Sales volume, average basket value and menu performance, drawn from your live
            order history.
          </p>
        </div>

        <div className="d3-segment" role="group" aria-label="Reporting period">
          {(['today', '7days', '30days'] as const).map((range) => (
            <button
              key={range}
              type="button"
              className="d3-segment-item"
              data-active={timeRange === range}
              onClick={() => setTimeRange(range)}
            >
              {RANGE_LABELS[range]}
            </button>
          ))}
        </div>
      </header>

      {loading && (
        <p style={{ color: 'var(--text-muted)', fontSize: '0.875rem' }}>
          Compiling the figures…
        </p>
      )}

      {/* ================= Metrics ================= */}
      <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-4 gap-5">
        <Metric
          label="Total Revenue"
          value={formatPrice(totalRevenue, hotel?.currency)}
          note={
            totalOrdersCount > 0
              ? `${totalOrdersCount} orders in this period`
              : 'No orders in this period'
          }
        />
        <Metric
          label="Orders Placed"
          value={`${totalOrdersCount}`}
          note={totalOrdersCount > 0 ? 'Recorded against this menu' : 'No data yet'}
        />
        <Metric
          label="Average Order Value"
          value={formatPrice(aov, hotel?.currency)}
          note={
            totalOrdersCount > 0
              ? `Across ${totalOrdersCount} orders`
              : 'Awaiting first order'
          }
        />
        <Metric
          label="Menu Items"
          value={`${menuItems.length}`}
          note={
            menuItems.length > 0
              ? `${featuredCount} featured or popular`
              : 'No menu items yet'
          }
        />
      </div>

      {/* ================= Charts ================= */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        <section className="lg:col-span-8 d3-panel p-6">
          <PanelHeading
            title="Revenue & Order Volume"
            aside={
              <span className="d3-chip">
                {timeRange === 'today'
                  ? 'Today'
                  : timeRange === '7days'
                  ? 'Last 7 days'
                  : 'Last 30 days'}
              </span>
            }
          />
          {isMounted && salesTrendSeries[0].data.some((v) => v > 0) ? (
            <Chart options={salesTrendOptions} series={salesTrendSeries} type="area" height={300} />
          ) : (
            <p
              style={{
                color: 'var(--text-dimmed)',
                fontSize: '0.875rem',
                padding: '3rem 0',
                textAlign: 'center',
              }}
            >
              No order data for this period.
            </p>
          )}
        </section>

        <section className="lg:col-span-4 d3-panel p-6 flex flex-col">
          <PanelHeading title="Payment Methods" />
          <div className="flex-1 flex flex-col justify-center">
            {isMounted && paymentMethodSeries.length > 0 ? (
              <>
                <Chart
                  options={paymentMethodOptions}
                  series={paymentMethodSeries}
                  type="donut"
                  height={220}
                />
                <p
                  style={{
                    marginTop: '0.75rem',
                    textAlign: 'center',
                    fontSize: '0.6875rem',
                    color: 'var(--text-muted)',
                  }}
                >
                  {paymentEntries[0][0]} leads with {paymentEntries[0][1]} orders
                </p>
              </>
            ) : (
              <p
                style={{
                  color: 'var(--text-dimmed)',
                  fontSize: '0.875rem',
                  padding: '2rem 0',
                  textAlign: 'center',
                }}
              >
                No payment data for this period.
              </p>
            )}
          </div>
        </section>
      </div>

      {/* ================= Top dishes ================= */}
      <section className="d3-panel p-6">
        <PanelHeading
          title="Best Sellers"
          aside={<span className="d3-chip">Units sold</span>}
        />
        {isMounted && topDishes.length > 0 ? (
          <Chart options={topDishesOptions} series={topDishesSeries} type="bar" height={260} />
        ) : (
          <p
            style={{
              color: 'var(--text-dimmed)',
              fontSize: '0.875rem',
              padding: '2.5rem 0',
              textAlign: 'center',
            }}
          >
            No dish sales data for this period.
          </p>
        )}
      </section>
    </div>
  );
}