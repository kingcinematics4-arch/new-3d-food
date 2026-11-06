'use client';

export const dynamic = 'force-dynamic';

import React, { useState, useMemo, useEffect } from 'react';
import dynamicChart from 'next/dynamic';
import { useHotel, useOrders, useMenuItems, Order } from '@/lib/useHotel';
import { formatPrice } from '@/lib/menu';

const Chart = dynamicChart(() => import('react-apexcharts'), { ssr: false });

const TZ = 'Asia/Kolkata';

/* ─── Timezone / month helpers (Asia/Kolkata) ─── */
function kolkataParts(date: Date) {
  const parts = new Intl.DateTimeFormat('en-CA', {
    timeZone: TZ,
    year: 'numeric',
    month: '2-digit',
    day: '2-digit',
  }).formatToParts(date);
  const get = (t: string) => parts.find((p) => p.type === t)?.value || '';
  return { year: +get('year'), month: +get('month'), day: +get('day') };
}

function isCurrentMonthKolkata(iso: string | null | undefined, ref: Date) {
  if (!iso) return false;
  const d = new Date(iso);
  if (Number.isNaN(d.getTime())) return false;
  const a = kolkataParts(d);
  const b = kolkataParts(ref);
  return a.year === b.year && a.month === b.month;
}

function daysInMonth(year: number, month: number) {
  return new Date(year, month, 0).getDate(); // month is 1-based
}

function monthLabel(year: number, month: number) {
  return new Intl.DateTimeFormat('en-IN', {
    timeZone: TZ,
    month: 'long',
    year: 'numeric',
  }).format(new Date(Date.UTC(year, month - 1, 1)));
}

const normalise = (s: string | null | undefined) => (s || '').trim().toLowerCase();
const isCancelled = (o: Order) => normalise(o.status) === 'cancelled';
const isCompleted = (o: Order) => {
  const s = normalise(o.status);
  return s === 'completed' || s === 'delivered' || s === 'served';
};
const isPending = (o: Order) => {
  const s = normalise(o.status);
  return s !== 'cancelled' && !isCompleted(o);
};

function orderRevenue(o: Order): number {
  // Use actual stored order amount; subtotal fallback.
  const v = o.total_amount != null ? Number(o.total_amount) : Number(o.subtotal || 0);
  return Number.isFinite(v) ? v : 0;
}

function activeItems(o: Order) {
  return (o.order_items || []).filter((it: any) => normalise(it.status) !== 'cancelled');
}

/* ─── Shared chart palette (Dine3D black & gold) ─── */
const INK_MUTED = '#9B968C';
const INK_DIM = '#6B675F';
const GRID = 'rgba(243,239,231,0.06)';
const GOLD = '#D4B36A';
const BRONZE = '#9B7348';
const COPPER = '#8A4B38';
const SAGE = '#7E9A86';
const SLATE = '#7D8794';

function Metric({ label, value, note }: { label: string; value: string; note: string }) {
  return (
    <div className="d3-panel flex flex-col justify-between p-5" style={{ minHeight: 124, minWidth: 0 }}>
      <span style={{ display: 'block', fontSize: '0.5625rem', fontWeight: 600, letterSpacing: '0.18em', textTransform: 'uppercase', color: 'var(--text-dimmed)' }}>
        {label}
      </span>
      <span className="d3-figure" style={{ display: 'block', fontSize: 'clamp(1.4rem, 2vw, 1.9rem)', marginTop: '0.75rem', wordBreak: 'break-word' }}>
        {value}
      </span>
      <span style={{ display: 'block', marginTop: 8, fontSize: '0.6875rem', lineHeight: 1.45, color: 'var(--text-muted)' }}>{note}</span>
    </div>
  );
}

function PanelHeading({ title, aside }: { title: string; aside?: React.ReactNode }) {
  return (
    <div className="flex items-baseline justify-between gap-4" style={{ paddingBottom: '1rem', marginBottom: '1.25rem', borderBottom: '1px solid var(--border-warm)' }}>
      <h3 className="d3-panel-title" style={{ fontSize: '1.125rem' }}>{title}</h3>
      {aside}
    </div>
  );
}

function Empty({ text }: { text: string }) {
  return <p style={{ color: 'var(--text-dimmed)', fontSize: '0.875rem', padding: '2.5rem 0', textAlign: 'center' }}>{text}</p>;
}

export default function AnalyticsDashboardPage() {
  const { hotel, loading: hotelLoading } = useHotel();
  const { orders } = useOrders(hotel?.id || null);
  const { items: menuItems } = useMenuItems(hotel?.id || null);
  const [isMounted, setIsMounted] = useState(false);
  // Ref date drives auto month reset (Asia/Kolkata). Refresh on mount; cheap.
  const [now, setNow] = useState<Date>(() => new Date());

  useEffect(() => {
    setIsMounted(true);
    setNow(new Date());
  }, []);

  const month = useMemo(() => {
    const p = kolkataParts(now);
    const dim = daysInMonth(p.year, p.month);
    const days = Array.from({ length: dim }, (_, i) => i + 1);
    return { ...p, dim, days, label: monthLabel(p.year, p.month) };
  }, [now]);

  // One month only (current month, Asia/Kolkata). Real DB records, deduped by id.
  const monthOrders = useMemo(() => {
    const seen = new Set<string>();
    return orders.filter((o: Order) => {
      if (!o || !o.id) return false;
      if (seen.has(o.id)) return false;
      if (!isCurrentMonthKolkata(o.created_at, now)) return false;
      seen.add(o.id);
      return true;
    });
  }, [orders, now]);

  const currency = hotel?.currency;

  const stats = useMemo(() => {
    let totalRevenue = 0;
    let completed = 0;
    let cancelled = 0;
    let pending = 0;
    let itemsSold = 0;
    monthOrders.forEach((o) => {
      if (isCancelled(o)) {
        cancelled += 1;
        // cancelled orders excluded from completed revenue
      } else {
        totalRevenue += orderRevenue(o);
        activeItems(o).forEach((it: any) => {
          const q = Number(it.quantity);
          if (Number.isFinite(q) && q > 0) itemsSold += q;
        });
        if (isCompleted(o)) completed += 1;
        else pending += 1;
      }
    });
    const totalOrders = monthOrders.length;
    const eligibleOrders = totalOrders - cancelled; // for AOV (exclude cancelled)
    const aov = eligibleOrders > 0 ? totalRevenue / eligibleOrders : 0;
    return { totalRevenue, totalOrders, completed, cancelled, pending, aov, itemsSold };
  }, [monthOrders]);

  // Per-day buckets (1..dim) in Kolkata month
  const daily = useMemo(() => {
    const revenue = Array(month.dim).fill(0) as number[];
    const placed = Array(month.dim).fill(0) as number[];
    const completed = Array(month.dim).fill(0) as number[];
    const cancelled = Array(month.dim).fill(0) as number[];
    monthOrders.forEach((o) => {
      const p = kolkataParts(new Date(o.created_at));
      if (p.year !== month.year || p.month !== month.month) return;
      const idx = p.day - 1;
      if (idx < 0 || idx >= month.dim) return;
      placed[idx] += 1;
      if (isCancelled(o)) cancelled[idx] += 1;
      else {
        revenue[idx] += orderRevenue(o);
        if (isCompleted(o)) completed[idx] += 1;
      }
    });
    return { revenue, placed, completed, cancelled };
  }, [monthOrders, month]);

  // Best-selling dishes (by quantity, top 5) + revenue; image from menu
  const bestDishes = useMemo(() => {
    const map = new Map<string, { name: string; qty: number; revenue: number; menuItemId?: string; image?: string | null }>();
    monthOrders.forEach((o) => {
      if (isCancelled(o)) return; // exclude cancelled orders from dish revenue context
      activeItems(o).forEach((it: any) => {
        const name: string = it.name || it.menu_item?.name || 'Unknown';
        const qty = Number(it.quantity) || 0;
        if (qty <= 0) return;
        const unit = it.price_at_time != null ? Number(it.price_at_time) : (it.price != null ? Number(it.price) : Number(it.menu_item?.price || 0));
        const rev = (Number.isFinite(unit) ? unit : 0) * qty;
        const key = it.menu_item_id || name;
        const cur = map.get(key) || { name, qty: 0, revenue: 0, menuItemId: it.menu_item_id, image: null };
        cur.qty += qty;
        cur.revenue += rev;
        if (!cur.menuItemId && it.menu_item_id) cur.menuItemId = it.menu_item_id;
        map.set(key, cur);
      });
    });
    const menuById = new Map(menuItems.map((m: any) => [m.id, m]));
    const menuByName = new Map(menuItems.map((m: any) => [normalise(m.name), m]));
    return Array.from(map.values())
      .map((d) => {
        const mi = (d.menuItemId && menuById.get(d.menuItemId)) || menuByName.get(normalise(d.name));
        return { ...d, image: mi?.image_url || null };
      })
      .sort((a, b) => b.qty - a.qty)
      .slice(0, 5);
  }, [monthOrders, menuItems]);

  // Order status distribution
  const statusDist = useMemo(() => {
    let completed = 0, pending = 0, preparing = 0, cancelled = 0;
    monthOrders.forEach((o) => {
      const s = normalise(o.status);
      if (s === 'cancelled') cancelled += 1;
      else if (s === 'completed' || s === 'delivered' || s === 'served') completed += 1;
      else if (s === 'preparing' || s === 'accepted' || s === 'ready') preparing += 1;
      else pending += 1; // placed/pending/unknown
    });
    return { completed, pending, preparing, cancelled };
  }, [monthOrders]);

  // Payment method distribution
  const paymentDist = useMemo(() => {
    const map = new Map<string, number>();
    monthOrders.forEach((o) => {
      const m = normalise(o.payment_method);
      let label = 'Other';
      if (m === 'cash' || m.includes('cash') || m.includes('counter')) label = 'Cash';
      else if (m === 'upi' || m.includes('upi') || m === 'card' || m.includes('card') || m.includes('online') || m.includes('net') || m.includes('razor') || m.includes('stripe') || m.includes('wallet')) label = 'Online';
      else if (!m || m === 'unknown' || m.includes('pay_at_table')) label = 'Pay at Table';
      map.set(label, (map.get(label) || 0) + 1);
    });
    return Array.from(map.entries()).sort((a, b) => b[1] - a[1]);
  }, [monthOrders]);

  const baseChart = {
    chart: { toolbar: { show: false }, background: 'transparent', fontFamily: 'Inter, system-ui, sans-serif', animations: { enabled: true, speed: 400 } },
    theme: { mode: 'dark' as const },
    dataLabels: { enabled: false },
    grid: { borderColor: GRID, strokeDashArray: 3, xaxis: { lines: { show: false } }, yaxis: { lines: { show: false } } },
  };

  const dayCats = month.days.map(String);

  const revenueTrendOpts: any = {
    ...baseChart,
    chart: { ...baseChart.chart, type: 'area' },
    colors: [GOLD],
    stroke: { curve: 'smooth', width: 2.5 },
    fill: { type: 'gradient', gradient: { shade: 'dark', type: 'vertical', opacityFrom: 0.35, opacityTo: 0.02, stops: [0, 90, 100] } },
    xaxis: { categories: dayCats, labels: { style: { colors: INK_DIM, fontSize: '10px' }, rotate: 0, hideOverlappingLabels: true }, axisBorder: { show: false }, axisTicks: { show: false }, tickAmount: Math.min(10, month.dim) },
    yaxis: { labels: { style: { colors: INK_DIM, fontSize: '10px' }, formatter: (v: number) => `₹${Math.round(v || 0).toLocaleString('en-IN')}` } },
    legend: { show: false },
    tooltip: { theme: 'dark', y: { formatter: (v: number) => `₹${Number(v || 0).toLocaleString('en-IN', { maximumFractionDigits: 0 })}` } },
  };
  const revenueTrendSeries = [{ name: 'Revenue', data: daily.revenue }];

  const orderVolOpts: any = {
    ...baseChart,
    chart: { ...baseChart.chart, type: 'bar' },
    colors: [BRONZE, SAGE, COPPER],
    plotOptions: { bar: { borderRadius: 3, columnWidth: '55%' } },
    stroke: { show: true, width: 1, colors: ['transparent'] },
    xaxis: { categories: dayCats, labels: { style: { colors: INK_DIM, fontSize: '10px' }, rotate: 0, hideOverlappingLabels: true }, axisBorder: { show: false }, axisTicks: { show: false }, tickAmount: Math.min(10, month.dim) },
    yaxis: { labels: { style: { colors: INK_DIM, fontSize: '10px' }, formatter: (v: number) => `${Math.round(v || 0)}` } },
    legend: { position: 'top', horizontalAlign: 'left', labels: { colors: INK_MUTED }, markers: { width: 8, height: 8, radius: 4, strokeWidth: 0 } },
    tooltip: { theme: 'dark', shared: true, intersect: false },
  };
  const orderVolSeries = [
    { name: 'Orders Placed', data: daily.placed },
    { name: 'Completed', data: daily.completed },
    { name: 'Cancelled', data: daily.cancelled },
  ];

  const bestOpts: any = {
    ...baseChart,
    chart: { ...baseChart.chart, type: 'bar' },
    plotOptions: { bar: { borderRadius: 4, horizontal: true, barHeight: '42%' } },
    colors: [GOLD],
    xaxis: { categories: bestDishes.map((d) => d.name), labels: { style: { colors: INK_MUTED, fontSize: '11px' } }, axisBorder: { show: false }, axisTicks: { show: false } },
    yaxis: { labels: { style: { colors: INK_DIM, fontSize: '10px' }, maxWidth: 160 } },
    legend: { show: false },
    tooltip: { theme: 'dark', y: { formatter: (v: number) => `${Math.round(v || 0)} sold` } },
  };
  const bestSeries = [{ name: 'Quantity Sold', data: bestDishes.map((d) => d.qty) }];

  const statusDonutOpts: any = {
    ...baseChart,
    chart: { ...baseChart.chart, type: 'donut' },
    labels: ['Completed', 'Pending', 'Preparing', 'Cancelled'],
    colors: [SAGE, SLATE, GOLD, COPPER],
    stroke: { width: 2, colors: ['#171613'] },
    legend: { position: 'bottom', labels: { colors: INK_MUTED, fontSize: '11px' }, markers: { width: 6, height: 6, strokeWidth: 0 } },
    tooltip: { theme: 'dark', y: { formatter: (v: number) => `${v} order${v === 1 ? '' : 's'}` } },
    plotOptions: { pie: { donut: { size: '72%' } } },
  };
  const statusDonutSeries = [statusDist.completed, statusDist.pending, statusDist.preparing, statusDist.cancelled];

  const payDonutOpts: any = {
    ...baseChart,
    chart: { ...baseChart.chart, type: 'donut' },
    labels: paymentDist.map((p) => p[0]),
    colors: [GOLD, SAGE, BRONZE, SLATE, COPPER],
    stroke: { width: 2, colors: ['#171613'] },
    legend: { position: 'bottom', labels: { colors: INK_MUTED, fontSize: '11px' }, markers: { width: 6, height: 6, strokeWidth: 0 } },
    tooltip: { theme: 'dark', y: { formatter: (v: number) => `${v} order${v === 1 ? '' : 's'}` } },
    plotOptions: { pie: { donut: { size: '72%' } } },
  };
  const payDonutSeries = paymentDist.map((p) => p[1]);

  const loading = hotelLoading;

  return (
    <div className="flex flex-col gap-8" style={{ maxWidth: 1180 }}>
      <header className="flex flex-col gap-4 lg:flex-row lg:items-end lg:justify-between">
        <div className="min-w-0">
          <span className="d3-eyebrow" style={{ fontSize: '0.5625rem' }}>Analytics</span>
          <h1 style={{ fontFamily: 'var(--font-display)', fontSize: 'clamp(2rem, 4vw, 2.75rem)', fontWeight: 500, color: 'var(--text-primary)', letterSpacing: '-0.025em', lineHeight: 1.1, margin: '0.5rem 0 0' }}>
            Monthly Performance
          </h1>
          <p style={{ margin: '0.5rem 0 0', fontSize: '0.875rem', lineHeight: 1.6, color: 'var(--text-muted)', maxWidth: '60ch' }}>
            Business performance for the current month, based on real order records (Asia/Kolkata).
          </p>
        </div>
        <div className="flex items-center gap-2">
          <span className="d3-chip">{month.label}</span>
          <span className="d3-chip" style={{ color: 'var(--text-muted)' }}>1–{month.dim} {month.label.split(' ')[0]}</span>
        </div>
      </header>

      {loading && <p style={{ color: 'var(--text-muted)', fontSize: '0.875rem' }}>Compiling the figures…</p>}

      {/* Monthly business summary */}
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 xl:grid-cols-4">
        <Metric label="Total Revenue" value={formatPrice(stats.totalRevenue, currency)} note={stats.cancelled > 0 ? 'Excludes cancelled orders' : 'This month (IST)'} />
        <Metric label="Total Orders" value={`${stats.totalOrders}`} note="Placed this month" />
        <Metric label="Completed Orders" value={`${stats.completed}`} note="Successfully completed" />
        <Metric label="Cancelled Orders" value={`${stats.cancelled}`} note="Cancelled this month" />
        <Metric label="Pending Orders" value={`${stats.pending}`} note="Not completed or cancelled" />
        <Metric label="Average Order Value" value={formatPrice(stats.aov, currency)} note="Revenue ÷ eligible orders" />
        <Metric label="Total Items Sold" value={`${stats.itemsSold}`} note="Dish quantity (excl. cancelled)" />
      </div>

      {/* Revenue Trend + Order Volume */}
      <div className="grid min-w-0 grid-cols-1 gap-6 lg:grid-cols-12">
        <section className="min-w-0 lg:col-span-7 d3-panel p-5 sm:p-6">
          <PanelHeading title="Revenue Trend" aside={<span className="d3-chip">Total {formatPrice(daily.revenue.reduce((a, b) => a + b, 0), currency)}</span>} />
          {isMounted && daily.revenue.some((v) => v > 0) ? (
            <Chart options={revenueTrendOpts} series={revenueTrendSeries} type="area" height={320} />
          ) : (
            <Empty text="No revenue recorded for this month." />
          )}
        </section>
        <section className="min-w-0 lg:col-span-5 d3-panel p-5 sm:p-6">
          <PanelHeading title="Order Volume" aside={<span className="d3-chip">Daily</span>} />
          {isMounted && daily.placed.some((v) => v > 0) ? (
            <Chart options={orderVolOpts} series={orderVolSeries} type="bar" height={320} />
          ) : (
            <Empty text="No orders recorded for this month." />
          )}
        </section>
      </div>

      {/* Best-selling dishes */}
      <section className="min-w-0 d3-panel p-5 sm:p-6">
        <PanelHeading title="Best-Selling Dishes" aside={<span className="d3-chip">Top 5 by quantity</span>} />
        {bestDishes.length > 0 ? (
          <div className="grid min-w-0 grid-cols-1 gap-6 lg:grid-cols-12">
            <div className="min-w-0 lg:col-span-7">
              {isMounted && <Chart options={bestOpts} series={bestSeries} type="bar" height={260} />}
            </div>
            <div className="min-w-0 lg:col-span-5 flex flex-col gap-3">
              {bestDishes.map((d, i) => (
                <div key={d.menuItemId || d.name} className="flex items-center gap-3" style={{ padding: '0.6rem 0.75rem', borderRadius: 10, border: '1px solid var(--border-warm)', background: 'var(--bg-secondary)' }}>
                  <span className="d3-figure" style={{ width: 22, textAlign: 'center', fontSize: '0.95rem', color: 'var(--text-dimmed)' }}>{i + 1}</span>
                  <div style={{ width: 44, height: 44, borderRadius: 8, overflow: 'hidden', background: 'rgba(243,239,231,0.04)', flexShrink: 0, display: 'flex', alignItems: 'center', justifyContent: 'center', border: '1px solid var(--border-warm)' }}>
                    {d.image ? (
                      // eslint-disable-next-line @next/next/no-img-element
                      <img src={d.image} alt={d.name} style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
                    ) : (
                      <span style={{ fontSize: '0.6rem', color: 'var(--text-dimmed)' }}>—</span>
                    )}
                  </div>
                  <div className="min-w-0 flex-1">
                    <div style={{ fontSize: '0.8125rem', fontWeight: 600, color: 'var(--text-primary)', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>{d.name}</div>
                    <div style={{ fontSize: '0.6875rem', color: 'var(--text-muted)', marginTop: 2 }}>{d.qty} sold · {formatPrice(d.revenue, currency)}</div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        ) : (
          <Empty text="No dish sales recorded for this month." />
        )}
      </section>

      {/* Status + Payment */}
      <div className="grid min-w-0 grid-cols-1 gap-6 lg:grid-cols-2">
        <section className="min-w-0 d3-panel p-5 sm:p-6">
          <PanelHeading title="Order Status Distribution" aside={<span className="d3-chip">{stats.totalOrders} orders</span>} />
          {isMounted && stats.totalOrders > 0 ? (
            <Chart options={statusDonutOpts} series={statusDonutSeries} type="donut" height={260} />
          ) : (
            <Empty text="No orders recorded for this month." />
          )}
        </section>
        <section className="min-w-0 d3-panel p-5 sm:p-6">
          <PanelHeading title="Payment Method Distribution" />
          {isMounted && paymentDist.length > 0 ? (
            <Chart options={payDonutOpts} series={payDonutSeries} type="donut" height={260} />
          ) : (
            <Empty text="No payment data for this month." />
          )}
        </section>
      </div>
    </div>
  );
}
