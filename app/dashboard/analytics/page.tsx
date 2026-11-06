'use client';

export const dynamic = 'force-dynamic';

import React, { useState, useMemo, useEffect } from 'react';
import dynamicChart from 'next/dynamic';
import { useHotel, useOrders, useMenuItems, Order } from '@/lib/useHotel';
import { formatPrice } from '@/lib/menu';

const Chart = dynamicChart(() => import('react-apexcharts'), { ssr: false });

const TZ = 'Asia/Kolkata';
type RangeKey = 'day' | '7days' | 'month' | '6months' | 'year';

const RANGE_LABELS: Record<RangeKey, string> = {
  day: 'Day',
  '7days': '7 Days',
  month: 'Month',
  '6months': '6 Months',
  year: '1 Year',
};

/* ─── Timezone helpers (Asia/Kolkata) ─── */
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

function daysInMonth(year: number, month: number) {
  return new Date(year, month, 0).getDate(); // month is 1-based
}

const normalise = (s: string | null | undefined) => (s || '').trim().toLowerCase();
const isCancelled = (o: Order) => normalise(o.status) === 'cancelled';
const isCompleted = (o: Order) => {
  const s = normalise(o.status);
  return s === 'completed' || s === 'delivered' || s === 'served';
};

function orderRevenue(o: Order): number {
  const v = o.total_amount != null ? Number(o.total_amount) : Number(o.subtotal || 0);
  return Number.isFinite(v) ? v : 0;
}

function activeItems(o: Order) {
  return (o.order_items || []).filter((it: any) => normalise(it.status) !== 'cancelled');
}

function monthStart(year: number, month: number) {
  return new Date(`${year}-${String(month).padStart(2, '0')}-01T00:00:00+05:30`);
}
function nextMonthStart(year: number, month: number) {
  const ny = month === 12 ? year + 1 : year;
  const nm = month === 12 ? 1 : month + 1;
  return new Date(`${ny}-${String(nm).padStart(2, '0')}-01T00:00:00+05:30`);
}
function dayStartIST(year: number, month: number, day: number) {
  return new Date(`${year}-${String(month).padStart(2, '0')}-${String(day).padStart(2, '0')}T00:00:00+05:30`);
}

function formatBucketLabel(d: Date, range: RangeKey) {
  if (range === 'day') {
    return new Intl.DateTimeFormat('en-US', { timeZone: TZ, hour: 'numeric', hour12: true }).format(d);
  }
  if (range === '6months' || range === 'year') {
    return new Intl.DateTimeFormat('en-US', { timeZone: TZ, month: 'short' }).format(d);
  }
  // 7days / month -> short weekday + day for clarity across month
  if (range === 'month') {
    return new Intl.DateTimeFormat('en-US', { timeZone: TZ, day: 'numeric' }).format(d);
  }
  return new Intl.DateTimeFormat('en-US', { timeZone: TZ, weekday: 'short' }).format(d);
}

function rangeNote(range: RangeKey) {
  if (range === 'day') return 'Today (IST)';
  if (range === '7days') return 'Last 7 days';
  if (range === 'month') return 'This month (IST)';
  if (range === '6months') return 'Last 6 months';
  return 'Last 12 months';
}

/* ─── Shared chart palette (Dine3D black & gold) ─── */
const INK_MUTED = '#9B968C';
const INK_DIM = '#6B675F';
const GRID_LINE = 'rgba(243,239,231,0.06)';
const GOLD = '#D4B36A';
const COPPER = '#8A4B38';
const SAGE = '#7E9A86';
const SLATE = '#7D8794';

/* Revenue & Order Volume — previous premium metallic series palette */
const SERIES_GOLD = '#D4B36A';
const SERIES_GOLD_FADE = 'rgba(212,179,106,0.02)';
const SERIES_BRONZE = '#9B7348';
const SERIES_BRONZE_FADE = 'rgba(155,115,72,0.02)';
const SERIES_COPPER = '#8A4B38';
const SERIES_COPPER_FADE = 'rgba(138,75,56,0.02)';

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
  const [isMounted, setIsMounted] = useState(false);
  const [now, setNow] = useState<Date>(() => new Date());
  const [timeRange, setTimeRange] = useState<RangeKey>('month');

  useEffect(() => {
    setIsMounted(true);
    setNow(new Date());
  }, []);

  // Compute IST-anchored range (from inclusive, to exclusive) + buckets for graph.
  const range = useMemo(() => {
    const p = kolkataParts(now);
    let from: Date;
    let to: Date;
    let buckets: { start: Date; end: Date }[] = [];

    if (timeRange === 'day') {
      from = dayStartIST(p.year, p.month, p.day);
      const tomorrow = new Date(from.getTime() + 24 * 60 * 60 * 1000);
      to = tomorrow;
      buckets = Array.from({ length: 24 }, (_, i) => ({
        start: new Date(from.getTime() + i * 60 * 60 * 1000),
        end: new Date(from.getTime() + (i + 1) * 60 * 60 * 1000),
      }));
    } else if (timeRange === '7days') {
      const todayStart = dayStartIST(p.year, p.month, p.day);
      from = new Date(todayStart.getTime() - 6 * 24 * 60 * 60 * 1000);
      to = new Date(todayStart.getTime() + 24 * 60 * 60 * 1000);
      buckets = Array.from({ length: 7 }, (_, i) => ({
        start: new Date(from.getTime() + i * 24 * 60 * 60 * 1000),
        end: new Date(from.getTime() + (i + 1) * 24 * 60 * 60 * 1000),
      }));
    } else if (timeRange === 'month') {
      from = monthStart(p.year, p.month);
      to = nextMonthStart(p.year, p.month);
      const dim = daysInMonth(p.year, p.month);
      buckets = Array.from({ length: dim }, (_, i) => ({
        start: dayStartIST(p.year, p.month, i + 1),
        end: dayStartIST(p.year, p.month, i + 1 + (i + 1 === dim ? 0 : 1)),
      }));
      // fix last bucket end = next month start
      if (buckets.length) buckets[buckets.length - 1].end = to;
    } else if (timeRange === '6months') {
      // last 6 months including current month
      const months: { y: number; m: number }[] = [];
      let y = p.year, m = p.month;
      for (let i = 0; i < 6; i++) { months.unshift({ y, m }); m -= 1; if (m < 1) { m = 12; y -= 1; } }
      from = monthStart(months[0].y, months[0].m);
      to = nextMonthStart(p.year, p.month);
      buckets = months.map(({ y: yy, m: mm }) => ({ start: monthStart(yy, mm), end: nextMonthStart(yy, mm) }));
    } else {
      // 1 year = last 12 months including current
      const months: { y: number; m: number }[] = [];
      let y = p.year, m = p.month;
      for (let i = 0; i < 12; i++) { months.unshift({ y, m }); m -= 1; if (m < 1) { m = 12; y -= 1; } }
      from = monthStart(months[0].y, months[0].m);
      to = nextMonthStart(p.year, p.month);
      buckets = months.map(({ y: yy, m: mm }) => ({ start: monthStart(yy, mm), end: nextMonthStart(yy, mm) }));
    }

    const labels = buckets.map((b) => formatBucketLabel(b.start, timeRange));
    const rangeLabel = new Intl.DateTimeFormat('en-IN', { timeZone: TZ, day: 'numeric', month: 'short', year: 'numeric' }).format(from)
      + ' – ' + new Intl.DateTimeFormat('en-IN', { timeZone: TZ, day: 'numeric', month: 'short', year: 'numeric' }).format(new Date(to.getTime() - 1));
    return { from, to, buckets, labels, rangeLabel, p };
  }, [now, timeRange]);

  const ordersOpts = useMemo(() => (
    hotel?.id ? { scope: 'all' as const, from: range.from.toISOString(), to: range.to.toISOString() } : undefined
  ), [hotel?.id, range.from, range.to]);

  const { orders, loading: ordersLoading } = useOrders(hotel?.id || null, ordersOpts);
  const { items: menuItems } = useMenuItems(hotel?.id || null);

  const currency = hotel?.currency;

  // Real DB records in selected range, deduped by id.
  const rangeOrders = useMemo(() => {
    const seen = new Set<string>();
    const fromMs = range.from.getTime();
    const toMs = range.to.getTime();
    return orders.filter((o: Order) => {
      if (!o || !o.id) return false;
      if (seen.has(o.id)) return false;
      const t = new Date(o.created_at).getTime();
      if (!Number.isFinite(t)) return false;
      if (t < fromMs || t >= toMs) return false;
      seen.add(o.id);
      return true;
    });
  }, [orders, range.from, range.to]);

  const stats = useMemo(() => {
    let totalRevenue = 0;
    let completed = 0;
    let cancelled = 0;
    let pending = 0;
    let itemsSold = 0;
    rangeOrders.forEach((o) => {
      if (isCancelled(o)) {
        cancelled += 1;
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
    const totalOrders = rangeOrders.length;
    const eligibleOrders = totalOrders - cancelled;
    const aov = eligibleOrders > 0 ? totalRevenue / eligibleOrders : 0;
    return { totalRevenue, totalOrders, completed, cancelled, pending, aov, itemsSold };
  }, [rangeOrders]);

  const daily = useMemo(() => {
    const revenue = Array(range.buckets.length).fill(0) as number[];
    const placed = Array(range.buckets.length).fill(0) as number[];
    const completed = Array(range.buckets.length).fill(0) as number[];
    const cancelled = Array(range.buckets.length).fill(0) as number[];
    rangeOrders.forEach((o) => {
      const t = new Date(o.created_at).getTime();
      // find bucket (linear scan is fine for <=31 buckets)
      const idx = range.buckets.findIndex((b) => t >= b.start.getTime() && t < b.end.getTime());
      if (idx < 0) return;
      placed[idx] += 1;
      if (isCancelled(o)) cancelled[idx] += 1;
      else {
        revenue[idx] += orderRevenue(o);
        if (isCompleted(o)) completed[idx] += 1;
      }
    });
    return { revenue, placed, completed, cancelled };
  }, [rangeOrders, range.buckets]);

  const bestDishes = useMemo(() => {
    const map = new Map<string, { name: string; qty: number; revenue: number; menuItemId?: string; image?: string | null }>();
    rangeOrders.forEach((o) => {
      if (isCancelled(o)) return;
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
  }, [rangeOrders, menuItems]);

  const statusDist = useMemo(() => {
    let completed = 0, pending = 0, preparing = 0, cancelled = 0;
    rangeOrders.forEach((o) => {
      const s = normalise(o.status);
      if (s === 'cancelled') cancelled += 1;
      else if (s === 'completed' || s === 'delivered' || s === 'served') completed += 1;
      else if (s === 'preparing' || s === 'accepted' || s === 'ready') preparing += 1;
      else pending += 1;
    });
    return { completed, pending, preparing, cancelled };
  }, [rangeOrders]);

  const paymentDist = useMemo(() => {
    const map = new Map<string, number>();
    rangeOrders.forEach((o) => {
      const m = normalise(o.payment_method);
      let label = 'Other';
      if (m.includes('upi')) label = 'UPI';
      else if (m === 'card' || m.includes('card') || m.includes('credit') || m.includes('debit')) label = 'Card';
      else if (m.includes('pay_at_table') || m.includes('table') || (!m || m === 'unknown')) label = 'Pay at Table';
      else if (m.includes('cash') || m.includes('counter')) label = 'Pay at Table';
      else if (m.includes('online') || m.includes('net') || m.includes('razor') || m.includes('stripe') || m.includes('wallet')) label = 'Card';
      map.set(label, (map.get(label) || 0) + 1);
    });
    const order = ['Pay at Table', 'Card', 'UPI'];
    const out = order.map((k) => [k, map.get(k) || 0] as [string, number]).filter(([, v]) => v > 0);
    map.forEach((v, k) => { if (!order.includes(k) && v > 0) out.push([k, v]); });
    return out;
  }, [rangeOrders]);
  const paymentTotal = paymentDist.reduce((s, [, v]) => s + v, 0);

  const baseChart = {
    chart: {
      toolbar: { show: false },
      background: 'transparent',
      fontFamily: 'Inter, system-ui, sans-serif',
      animations: { enabled: true, speed: 600, animateFrom: 'end', animateTo: true },
      dropShadow: { enabled: false },
    },
    theme: { mode: 'dark' as const },
    dataLabels: { enabled: false },
    grid: {
      borderColor: GRID_LINE,
      strokeDashArray: 3,
      xaxis: { lines: { show: false } },
      yaxis: { lines: { show: false } },
    },
  };

  const dailyTotal = daily.revenue.reduce((a, b) => a + b, 0);

  const salesTrendSeries = useMemo(() => ([
    { name: 'Revenue', data: daily.revenue, type: 'area' as const, yAxisIndex: 0 },
    { name: 'Orders Count', data: daily.placed, type: 'area' as const, yAxisIndex: 1 },
    { name: 'Cancelled', data: daily.cancelled, type: 'area' as const, yAxisIndex: 1 },
  ]), [daily]);

  const salesTrendOptions: any = {
    ...baseChart,
    chart: {
      ...baseChart.chart,
      type: 'area',
      events: {
        mounted: (chartContext: any) => {
          const el = chartContext?.el;
          if (!el) return;
          const reposition = () => {
            const wrap = el.querySelector('.apexcharts-tooltip') as HTMLElement | null;
            const inner = el.querySelector('.apexcharts-inner') as HTMLElement | null;
            if (!wrap || !inner || wrap.style.display === 'none' || wrap.classList.contains('apexcharts-tooltip-hidden')) return;
            const cRect = inner.getBoundingClientRect();
            const maxW = Math.max(200, Math.min(360, cRect.width - 12));
            wrap.style.maxWidth = `${maxW}px`;
            wrap.style.width = 'max-content';
            wrap.style.boxSizing = 'border-box';
            wrap.style.overflow = 'visible';
            const w2 = wrap.getBoundingClientRect();
            let left = parseFloat(wrap.style.left || '0');
            if (Number.isNaN(left)) left = w2.left - cRect.left;
            if (left + w2.width > cRect.width - 4) left = Math.max(4, left - w2.width - 18);
            if (left < 4) left = 4;
            if (left + w2.width > cRect.width - 4) left = Math.max(4, cRect.width - w2.width - 4);
            wrap.style.left = `${left}px`;
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
    colors: [SERIES_GOLD, SERIES_BRONZE, SERIES_COPPER],
    stroke: { curve: 'smooth', width: [2.5, 2, 2], dashArray: 0 },
    markers: { size: 0, hover: { size: 5, strokeWidth: 0 } },
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
      categories: range.labels,
      labels: { style: { colors: INK_DIM, fontSize: '10px' }, rotate: 0, hideOverlappingLabels: true },
      axisBorder: { show: false },
      axisTicks: { show: false },
      tickAmount: Math.min(10, range.labels.length),
    },
    yaxis: [
      {
        labels: {
          style: { colors: INK_DIM, fontSize: '10px' },
          formatter: (val: number) => `₹${Number(val || 0).toLocaleString('en-IN', { maximumFractionDigits: 0 })}`,
        },
      },
      {
        opposite: true,
        labels: {
          style: { colors: INK_DIM, fontSize: '10px' },
          formatter: (val: number) => `${Math.round(Number(val || 0))}`,
        },
      },
    ],
    tooltip: {
      theme: 'dark',
      style: { fontSize: '12px' },
      shared: true,
      custom: (opts: any) => {
        const seriesNames = salesTrendSeries.map((s: any) => s.name);
        const seriesColors = salesTrendOptions.colors;
        const series = opts.series || [];
        const dataPointIndex = opts.dataPointIndex;
        const label = opts.w?.globals?.categoryLabels?.[dataPointIndex] ?? opts.xAxisCategory ?? '';
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

  const paymentShades = ['#B8A47A', '#D9CBAB', '#8E8578', '#C2BCB0', '#6B675F'];
  const payDonutOpts: any = {
    chart: {
      type: 'donut',
      background: 'transparent',
      fontFamily: 'Inter, system-ui, sans-serif',
      animations: { enabled: true, speed: 600, animateFrom: 'end', animateTo: true },
    },
    theme: { mode: 'dark' },
    labels: paymentDist.map((p) => p[0]),
    colors: paymentDist.map((_, i) => paymentShades[i % paymentShades.length]),
    stroke: { width: 2, colors: ['#171613'] },
    legend: {
      position: 'bottom',
      labels: { colors: INK_MUTED, fontSize: '11px' },
      markers: { width: 6, height: 6, strokeWidth: 0 },
      itemMargin: { horizontal: 8, vertical: 6 },
    },
    dataLabels: { enabled: false },
    tooltip: { theme: 'dark', style: { fontSize: '12px' }, y: { formatter: (v: number) => `${v} order${v === 1 ? '' : 's'}` } },
    plotOptions: { pie: { donut: { size: '78%', labels: { show: false } } } },
  };
  const payDonutSeries = paymentDist.map((p) => p[1]);

  const loading = hotelLoading || ordersLoading;

  return (
    <div className="flex flex-col gap-8" style={{ maxWidth: 1180 }}>
      <header className="flex flex-col gap-4 lg:flex-row lg:items-end lg:justify-between">
        <div className="min-w-0">
          <span className="d3-eyebrow" style={{ fontSize: '0.5625rem' }}>Analytics</span>
          <h1 style={{ fontFamily: 'var(--font-display)', fontSize: 'clamp(2rem, 4vw, 2.75rem)', fontWeight: 500, color: 'var(--text-primary)', letterSpacing: '-0.025em', lineHeight: 1.1, margin: '0.5rem 0 0' }}>
            Performance
          </h1>
          <p style={{ margin: '0.5rem 0 0', fontSize: '0.875rem', lineHeight: 1.6, color: 'var(--text-muted)', maxWidth: '60ch' }}>
            Business performance for the selected period, based on real order records (Asia/Kolkata).
          </p>
        </div>
        <div className="w-full min-w-0 lg:w-auto lg:flex-shrink-0 flex flex-col items-start lg:items-end gap-2">
          <div className="d3-segment w-full sm:w-auto" role="group" aria-label="Reporting period">
            {(['day', '7days', 'month', '6months', 'year'] as RangeKey[]).map((r) => (
              <button
                key={r}
                type="button"
                className="d3-segment-item flex-1 sm:flex-none justify-center"
                data-active={timeRange === r}
                onClick={() => setTimeRange(r)}
              >
                {RANGE_LABELS[r]}
              </button>
            ))}
          </div>
          <span className="d3-chip" style={{ color: 'var(--text-muted)' }}>{rangeNote(timeRange)} · {range.rangeLabel}</span>
        </div>
      </header>

      {loading && <p style={{ color: 'var(--text-muted)', fontSize: '0.875rem' }}>Compiling the figures…</p>}

      {/* Summary (selected period) */}
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 xl:grid-cols-4">
        <Metric label="Total Revenue" value={formatPrice(stats.totalRevenue, currency)} note={stats.cancelled > 0 ? 'Excludes cancelled orders' : rangeNote(timeRange)} />
        <Metric label="Total Orders" value={`${stats.totalOrders}`} note="Placed in period" />
        <Metric label="Completed Orders" value={`${stats.completed}`} note="Successfully completed" />
        <Metric label="Cancelled Orders" value={`${stats.cancelled}`} note="Cancelled in period" />
        <Metric label="Pending Orders" value={`${stats.pending}`} note="Not completed or cancelled" />
        <Metric label="Average Order Value" value={formatPrice(stats.aov, currency)} note="Revenue ÷ eligible orders" />
        <Metric label="Total Items Sold" value={`${stats.itemsSold}`} note="Dish quantity (excl. cancelled)" />
      </div>

      {/* Revenue & Order Volume (combined, Image 1 structure) + Payment Methods */}
      <div className="grid min-w-0 grid-cols-1 gap-6 lg:grid-cols-12">
        <section className="min-w-0 lg:col-span-7 d3-panel p-5 sm:p-6">
          <PanelHeading
            title="Revenue & Order Volume"
            aside={<span className="d3-chip">{RANGE_LABELS[timeRange]}</span>}
          />
          {isMounted && (dailyTotal > 0 || daily.placed.some((v) => v > 0)) ? (
            <Chart options={salesTrendOptions} series={salesTrendSeries} type="area" height={320} />
          ) : (
            <Empty text="No data recorded for the selected period." />
          )}
        </section>
        <section className="min-w-0 lg:col-span-5 d3-panel p-5 sm:p-6 flex flex-col">
          <PanelHeading title="Payment Methods" />
          <div className="flex-1 flex flex-col justify-center">
            {isMounted && paymentTotal > 0 ? (
              <>
                <Chart options={payDonutOpts} series={payDonutSeries} type="donut" height={240} />
                <div style={{ marginTop: '0.75rem', display: 'flex', flexDirection: 'column', gap: 6 }}>
                  {paymentDist.map((p) => (
                    <div key={p[0]} style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.75rem', color: 'var(--text-muted)' }}>
                      <span>{p[0]}</span>
                      <span style={{ color: 'var(--text-primary)', fontWeight: 600 }}>{p[1]} · {Math.round((p[1] / Math.max(paymentTotal, 1)) * 100)}%</span>
                    </div>
                  ))}
                </div>
              </>
            ) : (
              <Empty text="No payment data for the selected period." />
            )}
          </div>
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
          <Empty text="No dish sales recorded for the selected period." />
        )}
      </section>

      {/* Status distribution */}
      <section className="min-w-0 d3-panel p-5 sm:p-6">
        <PanelHeading title="Order Status Distribution" aside={<span className="d3-chip">{stats.totalOrders} orders</span>} />
        {isMounted && stats.totalOrders > 0 ? (
          <Chart options={statusDonutOpts} series={statusDonutSeries} type="donut" height={260} />
        ) : (
          <Empty text="No orders recorded for the selected period." />
        )}
      </section>
    </div>
  );
}
