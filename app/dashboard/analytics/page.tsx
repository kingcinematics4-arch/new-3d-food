'use client';

export const dynamic = 'force-dynamic';

import React, { useState, useMemo, useEffect } from 'react';
import dynamicChart from 'next/dynamic';
import { useHotel, useOrders, useMenuItems } from '@/lib/useHotel';
import { Order } from '@/lib/useHotel';
import { formatPrice } from '@/lib/menu';

const Chart = dynamicChart(() => import('react-apexcharts'), { ssr: false });

const DAYS = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];

const normalise = (status: string) => (status || '').trim().toLowerCase();

/* Shared chart palette — champagne and bone only */
const INK_MUTED = '#9B968C';
const INK_DIM = '#6B675F';
const GRID_LINE = 'rgba(243,239,231,0.06)';
const ACCENT = '#B8A47A';
const ACCENT_SOFT = 'rgba(184,164,122,0.22)';

/* Revenue & Order Volume — premium metallic series palette */
const SERIES_GOLD = '#D4B36A'; // upper (Revenue) — premium champagne gold
const SERIES_GOLD_FADE = 'rgba(212,179,106,0.02)';
const SERIES_BRONZE = '#9B7348'; // middle (Orders Count) — muted antique bronze
const SERIES_BRONZE_FADE = 'rgba(155,115,72,0.02)';
const SERIES_COPPER = '#8A4B38'; // lower (Cancelled) — elegant dark copper
const SERIES_COPPER_FADE = 'rgba(138,75,56,0.02)';

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
      <div
        className="d3-panel flex flex-col justify-between p-5"
        style={{ minHeight: 132, minWidth: 0 }}
      >
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
        <span
          className="d3-figure"
          style={{
            display: 'block',
            fontSize: 'clamp(1.5rem, 2.2vw, 2rem)',
            marginTop: '0.875rem',
            wordBreak: 'break-word',
          }}
        >
          {value}
        </span>
        <span
          style={{
            display: 'block',
            marginTop: 8,
            fontSize: '0.6875rem',
            lineHeight: 1.45,
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
  const { orders, refetch: refetchOrders } = useOrders(hotel?.id || null);
  const { items: menuItems, refetch: refetchItems } = useMenuItems(hotel?.id || null);
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

  const nonCancelledOrders = useMemo(() => {
    return filteredOrders.filter((o: Order) => normalise(o.status) !== 'cancelled');
  }, [filteredOrders]);

  const totalRevenue = useMemo(
    () => nonCancelledOrders.reduce((s: number, o: Order) => s + (o.total_amount || 0), 0),
    [nonCancelledOrders]
  );
  const totalOrdersCount = nonCancelledOrders.length;
  const aov = totalOrdersCount > 0 ? totalRevenue / totalOrdersCount : 0;

  const cancelledCount = filteredOrders.filter((o: Order) => normalise(o.status) === 'cancelled').length;

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
    const cancelledData = dailyBuckets.map((bucket) => {
      const next = new Date(bucket);
      next.setDate(next.getDate() + 1);
      return filteredOrders.filter((o: Order) => {
        const d = new Date(o.created_at);
        return d >= bucket && d < next && normalise(o.status) === 'cancelled';
      }).length;
    });
    return [
      { name: 'Revenue', data: revData, type: 'area', yAxisIndex: 0 },
      { name: 'Orders Count', data: countData, type: 'area', yAxisIndex: 1 },
      { name: 'Cancelled', data: cancelledData, type: 'area', yAxisIndex: 1 },
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
      animations: { enabled: true, speed: 400, animateFrom: 'end', animateTo: true },
    },
    theme: { mode: 'dark' },
    plotOptions: { bar: { borderRadius: 4, horizontal: true, barHeight: '40%' } },
    colors: [ACCENT],
    dataLabels: { enabled: false },
    xaxis: {
      categories: topDishes.map((d) => d.name),
      labels: { style: { colors: INK_MUTED, fontSize: '11px' } },
      axisBorder: { show: false },
      axisTicks: { show: false },
    },
    yaxis: {
      labels: { style: { colors: INK_DIM, fontSize: '10px' }, maxWidth: 140 },
    },
    grid: { borderColor: GRID_LINE, strokeDashArray: 3, xaxis: { lines: { show: false } }, yaxis: { lines: { show: false } } },
    legend: { show: false },
    tooltip: { theme: 'dark', style: { fontSize: '12px' }, y: { formatter: (val: number) => `${val} unit${val === 1 ? '' : 's'}` } },
  };
  const topDishesSeries = [{ name: 'Units Sold', data: topDishes.map((d) => d.qty) }];

  const paymentMethodMap: Record<string, number> = {};
  filteredOrders.forEach((o: Order) => {
    const pm = o.payment_method || 'Unknown';
    paymentMethodMap[pm] = (paymentMethodMap[pm] || 0) + 1;
  });
  const paymentEntries = Object.entries(paymentMethodMap).sort((a, b) => b[1] - a[1]);

  // Human-readable labels for the stored payment_method values.
  const paymentMethodLabels: Record<string, string> = {
    pay_at_table: 'Pay at Table',
    pay_at_table_cash: 'Pay at Table',
    pay_at_table_card: 'Pay at Table',
    card: 'Card',
    credit_card: 'Card',
    debit_card: 'Card',
    upi: 'UPI',
    net_banking: 'Net Banking',
    wallet: 'Wallet',
    cash: 'Cash',
    unknown: 'Other',
  };

  const paymentMethodOptions: any = {
    chart: {
      type: 'donut',
      background: 'transparent',
      fontFamily: 'Inter, system-ui, sans-serif',
      animations: { enabled: true, speed: 600, animateFrom: 'end', animateTo: true },
    },
    theme: { mode: 'dark' },
    labels: paymentEntries.map(([k]) => paymentMethodLabels[k] || k),
    colors: ['#B8A47A', '#D9CBAB', '#8E8578'],
    stroke: { width: 2, colors: ['#171613'] },
    legend: {
      position: 'bottom',
      labels: { colors: INK_MUTED, fontSize: '11px' },
      markers: { width: 6, height: 6, strokeWidth: 0 },
      itemMargin: { horizontal: 8, vertical: 6 },
    },
    dataLabels: { enabled: false },
tooltip: {
        theme: 'dark',
        style: { fontSize: '12px' },
        y: { formatter: (val: number) => `${val} order${val === 1 ? '' : 's'}` },
        x: { formatter: (_label: string) => _label },
      },
      plotOptions: { donut: { size: '78%', labels: { show: false } } },
  };
  const paymentMethodSeries = paymentEntries.map(([, v]) => v);

  const salesTrendOptions: any = {
    chart: {
      type: 'area',
      toolbar: { show: false },
      background: 'transparent',
      fontFamily: 'Inter, system-ui, sans-serif',
      animations: { enabled: true, speed: 600, animateFrom: 'end', animateTo: true },
      dropShadow: { enabled: false },
      events: {
        // Reposition ApexCharts' tooltip wrapper so it never overflows the
        // chart boundary. On desktop, flip left of the data point when
        // there is insufficient room on the right. On narrow/mobile
        // containers, clamp fully inside the chart.
        mounted: (chartContext: any) => {
          const el = chartContext?.el;
          if (!el) return;
          const reposition = () => {
            const wrap = el.querySelector('.apexcharts-tooltip') as HTMLElement | null;
            const inner = el.querySelector('.apexcharts-inner') as HTMLElement | null;
            if (!wrap || !inner || wrap.style.display === 'none' || wrap.classList.contains('apexcharts-tooltip-hidden')) return;
            const cRect = inner.getBoundingClientRect();
            const wRect = wrap.getBoundingClientRect();
            // Let the tooltip size to its content up to the container.
            const maxW = Math.max(200, Math.min(360, cRect.width - 12));
            wrap.style.maxWidth = `${maxW}px`;
            wrap.style.width = 'max-content';
            wrap.style.boxSizing = 'border-box';
            wrap.style.overflow = 'visible';
            // Re-read after width adjustment.
            const w2 = wrap.getBoundingClientRect();
            let left = parseFloat(wrap.style.left || '0');
            if (Number.isNaN(left)) left = w2.left - cRect.left;
            // Flip to the left of the active point when overflowing right.
            if (left + w2.width > cRect.width - 4) {
              left = Math.max(4, left - w2.width - 18);
            }
            // Clamp inside container (mobile / narrow).
            if (left < 4) left = 4;
            if (left + w2.width > cRect.width - 4) left = Math.max(4, cRect.width - w2.width - 4);
            wrap.style.left = `${left}px`;
            // Clamp vertical position if needed.
            let top = parseFloat(wrap.style.top || '0');
            if (!Number.isNaN(top)) {
              if (top < 4) wrap.style.top = '4px';
              if (top + w2.height > cRect.height - 4) wrap.style.top = `${Math.max(4, cRect.height - w2.height - 4)}px`;
            }
          };
          const obs = new MutationObserver(() => requestAnimationFrame(reposition));
          obs.observe(el, { attributes: true, subtree: true, attributeFilter: ['style', 'class'] });
          (el as any).__kiloTooltipObs = obs;
        },
        beforeDestroy: (chartContext: any) => {
          const el = chartContext?.el;
          (el as any)?.__kiloTooltipObs?.disconnect?.();
        },
      },
    },
    theme: { mode: 'dark' },
    // Upper/middle/lower zones: champagne gold, antique bronze, dark copper
    colors: [SERIES_GOLD, SERIES_BRONZE, SERIES_COPPER],
    stroke: { curve: 'smooth', width: [2.5, 2, 2], dashArray: 0 },
    markers: { size: 0, hover: { size: 5, strokeWidth: 0 } },
    dataLabels: { enabled: false },
    fill: {
      type: 'gradient',
      gradient: {
        shade: 'dark',
        type: 'vertical',
        shadeIntensity: 0.25,
        opacityFrom: 0.42,
        opacityTo: 0.02,
        stops: [0, 88, 100],
        gradientToColors: [SERIES_GOLD_FADE, SERIES_BRONZE_FADE, SERIES_COPPER_FADE],
      },
    },
    legend: {
      position: 'top',
      horizontalAlign: 'left',
      fontSize: '11px',
      labels: { colors: INK_MUTED, fontWeight: 500 },
      markers: { width: 8, height: 8, radius: 4, strokeWidth: 0 },
      itemMargin: { horizontal: 12, vertical: 0 },
      formatter: (seriesName: string) => seriesName,
    },
    xaxis: {
      categories: dailyLabels,
      labels: { style: { colors: INK_DIM, fontSize: '10px' } },
      axisBorder: { show: false },
      axisTicks: { show: false },
    },
    yaxis: [
      {
        // Primary axis — Revenue (INR)
        labels: {
          style: { colors: INK_DIM, fontSize: '10px' },
          formatter: (val: number) => `₹${Number(val || 0).toLocaleString('en-IN', { maximumFractionDigits: 0 })}`,
        },
      },
      {
        // Secondary axis — order counts (no currency symbol)
        opposite: true,
        labels: {
          style: { colors: INK_DIM, fontSize: '10px' },
          formatter: (val: number) => `${Math.round(Number(val || 0))}`,
        },
      },
    ],
    grid: {
      borderColor: GRID_LINE,
      strokeDashArray: 3,
      xaxis: { lines: { show: false } },
      yaxis: { lines: { show: false } },
    },
    tooltip: {
      theme: 'dark',
      style: { fontSize: '12px' },
      shared: true,
      // ApexCharts wraps the custom HTML in a fixed-width container that
      // can clip long content. Positioning is handled by chart.events
      // (mounted) so the tooltip flips left on desktop when needed and
      // stays fully inside the chart on mobile.
      custom: (opts: any) => {
        const seriesNames = salesTrendSeries.map((s: any) => s.name);
        const seriesColors = salesTrendOptions.colors;
        const series = opts.series || [];
        const dataPointIndex = opts.dataPointIndex;
        const label = opts.xAxisCategory || '';

        const rows = series
          .map((s: any[], si: number) => {
            const name = seriesNames[si] || '';
            const val = s[dataPointIndex];
            if (val == null) return '';
            const formatted =
              name === 'Revenue'
                ? `₹${Number(val).toLocaleString('en-IN', { maximumFractionDigits: 0 })}`
                : `${Math.round(Number(val))} order${Math.round(Number(val)) === 1 ? '' : 's'}`;
            const color = seriesColors[si] || SERIES_GOLD;
            return `<div style="display:grid;grid-template-columns:8px 1fr auto;align-items:center;column-gap:12px;row-gap:0;padding:4px 0;min-width:0;">
            <span style="width:8px;height:8px;border-radius:50%;background:${color};display:block;"></span>
            <span style="color:var(--text-muted);white-space:nowrap;min-width:0;">${name}</span>
            <span style="color:var(--text-primary);font-weight:600;white-space:nowrap;text-align:right;padding-left:8px;">${formatted}</span>
          </div>`;
          })
          .filter(Boolean)
          .join('');

        return `<div data-kilo-tooltip="sales-trend" style="min-width:180px;max-width:240px;width:max-content;padding:8px 12px;box-sizing:border-box;">
          <div style="color:var(--text-dimmed);font-size:11px;font-weight:500;margin-bottom:8px;white-space:nowrap;">${label}</div>
          ${rows}
        </div>`;
      },
    },
  };

  const loading = hotelLoading;
  const featuredCount = menuItems.filter((m: any) => m.is_featured || m.is_popular).length;

  const RANGE_LABELS: Record<string, string> = {
    today: 'Today',
    '7days': 'Last 7 Days',
    '30days': 'Last 30 Days',
  };

  return (
    <div className="flex flex-col gap-8" style={{ maxWidth: 1180 }}>
      {/* ================= Page header ================= */}
      <header className="flex flex-col gap-4 lg:flex-row lg:items-end lg:justify-between">
        <div className="min-w-0">
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

        <div className="w-full min-w-0 lg:w-auto lg:flex-shrink-0">
          <div className="d3-segment w-full sm:w-auto" role="group" aria-label="Reporting period">
            {(['today', '7days', '30days'] as const).map((range) => (
              <button
                key={range}
                type="button"
                className="d3-segment-item flex-1 sm:flex-none justify-center"
                data-active={timeRange === range}
                onClick={() => setTimeRange(range)}
              >
                {RANGE_LABELS[range]}
              </button>
            ))}
          </div>
        </div>
      </header>

      {loading && (
        <p style={{ color: 'var(--text-muted)', fontSize: '0.875rem' }}>
          Compiling the figures…
        </p>
      )}

      {/* ================= Metrics ================= */}
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 xl:grid-cols-5">
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
          label="Cancelled Orders"
          value={`${cancelledCount}`}
          note={
            cancelledCount > 0
              ? 'Excluded from revenue and AOV'
              : 'No cancelled orders'
          }
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
      <div className="grid min-w-0 grid-cols-1 gap-6 lg:grid-cols-12">
        <section className="min-w-0 lg:col-span-8 d3-panel p-5 sm:p-6">
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
            <Chart options={salesTrendOptions} series={salesTrendSeries} type="area" height={340} />
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

        <section className="min-w-0 lg:col-span-4 d3-panel p-5 sm:p-6 flex flex-col">
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
                {paymentEntries.length > 0 && (
                  <p
                    style={{
                      marginTop: '0.75rem',
                      textAlign: 'center',
                      fontSize: '0.6875rem',
                      color: 'var(--text-muted)',
                    }}
                  >
                    {paymentMethodLabels[paymentEntries[0][0]] || paymentEntries[0][0]} accounts for{' '}
                    {paymentEntries[0][1]} of {paymentEntries.reduce((s, [, v]) => s + v, 0)} orders
                  </p>
                )}
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
      <section className="min-w-0 d3-panel p-5 sm:p-6">
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