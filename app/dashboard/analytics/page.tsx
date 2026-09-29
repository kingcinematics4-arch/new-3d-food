'use client';

import React, { useState, useMemo, useEffect } from 'react';
import dynamic from 'next/dynamic';
import { useHotel, useOrders, useMenuItems } from '@/lib/useHotel';
import { Order } from '@/lib/useHotel';

const Chart = dynamic(() => import('react-apexcharts'), { ssr: false });

const DAYS = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];

function getDayLabel(date: Date): string {
  return DAYS[date.getDay()];
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
      { name: 'Revenue ($)', data: revData },
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
    chart: { type: 'bar', toolbar: { show: false }, background: 'transparent' },
    theme: { mode: 'dark' },
    plotOptions: { bar: { borderRadius: 6, horizontal: true } },
    colors: ['#f59e0b'],
    xaxis: { labels: { style: { colors: '#9ca3af' } } },
    yaxis: {
      categories: topDishes.map((d) => d.name),
      labels: { style: { colors: '#9ca3af' } },
    },
    grid: { borderColor: '#1f2937' },
  };
  const topDishesSeries = [{ name: 'Units Sold', data: topDishes.map((d) => d.qty) }];

  const paymentMethodMap: Record<string, number> = {};
  filteredOrders.forEach((o: Order) => {
    const pm = o.payment_method || 'Unknown';
    paymentMethodMap[pm] = (paymentMethodMap[pm] || 0) + 1;
  });
  const paymentEntries = Object.entries(paymentMethodMap).sort((a, b) => b[1] - a[1]);

  const paymentMethodOptions: any = {
    chart: { type: 'donut', background: 'transparent' },
    theme: { mode: 'dark' },
    labels: paymentEntries.map(([k]) => k),
    colors: ['#f59e0b', '#3b82f6', '#10b981'],
    legend: { position: 'bottom', labels: { colors: '#9ca3af' } },
  };
  const paymentMethodSeries = paymentEntries.map(([, v]) => v);

  const salesTrendOptions: any = {
    chart: {
      type: 'area',
      toolbar: { show: false },
      background: 'transparent',
    },
    theme: { mode: 'dark' },
    colors: ['#f59e0b', '#10b981'],
    stroke: { curve: 'smooth', width: 3 },
    fill: {
      type: 'gradient',
      gradient: {
        shadeIntensity: 1,
        opacityFrom: 0.45,
        opacityTo: 0.05,
      },
    },
    xaxis: {
      categories: dailyLabels,
      labels: { style: { colors: '#9ca3af' } },
    },
    yaxis: {
      labels: { style: { colors: '#9ca3af' } },
    },
    grid: { borderColor: '#1f2937' },
  };

  const loading = hotelLoading || ordersLoading || itemsLoading;

  return (
    <div className="space-y-6">
      {/* Header Bar */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <h1 className="text-2xl font-bold text-white">
            Analytics & Revenue Intelligence
          </h1>
          <p className="text-gray-400 text-sm">
            Track sales volume, 3D menu engagement, peak ordering times, and average basket value.
          </p>
        </div>

        {/* Time Filter Buttons */}
        <div className="flex items-center space-x-2 bg-gray-900 border border-gray-800 p-1.5 rounded-xl">
          {(['today', '7days', '30days'] as const).map((range) => (
            <button
              key={range}
              onClick={() => setTimeRange(range)}
              className={`px-3.5 py-1.5 rounded-lg text-xs font-semibold capitalize transition ${
                timeRange === range
                  ? 'bg-amber-500 text-black shadow-md'
                  : 'text-gray-400 hover:text-white'
              }`}
            >
              {range === '7days' ? 'Last 7 Days' : range === '30days' ? 'Last 30 Days' : 'Today'}
            </button>
          ))}
        </div>
      </div>

      {loading && (
        <p className="text-sm text-gray-400">Loading analytics data…</p>
      )}

      {/* KPI Cards Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-5">
        <div className="bg-gray-900 border border-gray-800 p-5 rounded-2xl shadow-xl">
          <p className="text-xs uppercase font-semibold text-gray-400">Total Revenue</p>
          <p className="text-3xl font-extrabold text-white mt-2">${totalRevenue.toFixed(2)}</p>
          <p className="text-xs text-emerald-400 mt-1.5 font-medium">
            {totalOrdersCount > 0 ? `${totalOrdersCount} orders in period` : 'No orders in this period'}
          </p>
        </div>

        <div className="bg-gray-900 border border-gray-800 p-5 rounded-2xl shadow-xl">
          <p className="text-xs uppercase font-semibold text-gray-400">Total Orders Placed</p>
          <p className="text-3xl font-extrabold text-white mt-2">{totalOrdersCount}</p>
          <p className="text-xs text-emerald-400 mt-1.5 font-medium">
            {aov > 0 ? `Revenue: $${totalRevenue.toFixed(2)}` : 'No data yet'}
          </p>
        </div>

        <div className="bg-gray-900 border border-gray-800 p-5 rounded-2xl shadow-xl">
          <p className="text-xs uppercase font-semibold text-gray-400">Average Order Value (AOV)</p>
          <p className="text-3xl font-extrabold text-white mt-2">${aov.toFixed(2)}</p>
          <p className="text-xs text-amber-400 mt-1.5 font-medium">
            {totalOrdersCount > 0 ? `From ${totalOrdersCount} orders` : 'No orders yet'}
          </p>
        </div>

        <div className="bg-gray-900 border border-gray-800 p-5 rounded-2xl shadow-xl">
          <p className="text-xs uppercase font-semibold text-gray-400">3D Menu Items</p>
          <p className="text-3xl font-extrabold text-white mt-2">{menuItems.length}</p>
          <p className="text-xs text-blue-400 mt-1.5 font-medium">
            {menuItems.length > 0 ? `${menuItems.filter((m: any) => m.is_popular).length} featured` : 'No menu items'}
          </p>
        </div>
      </div>

      {/* Charts Section */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        {/* Sales Trend Chart */}
        <div className="lg:col-span-8 bg-gray-900 border border-gray-800 p-6 rounded-2xl shadow-xl space-y-4">
          <div className="flex items-center justify-between border-b border-gray-800 pb-3">
            <h3 className="text-lg font-bold text-white">Revenue & Order Volume Trend</h3>
            <span className="text-xs text-amber-400 font-semibold">
              {timeRange === 'today' ? 'Today' : timeRange === '7days' ? 'Weekly' : 'Monthly'}
            </span>
          </div>

          {isMounted && salesTrendSeries[0].data.some((v) => v > 0) && (
            <Chart
              options={salesTrendOptions}
              series={salesTrendSeries}
              type="area"
              height={300}
            />
          )}
          {isMounted && !salesTrendSeries[0].data.some((v) => v > 0) && (
            <p className="text-gray-400 text-sm pb-4">No order data for this period.</p>
          )}
        </div>

        {/* Payment Methods Breakdown */}
        <div className="lg:col-span-4 bg-gray-900 border border-gray-800 p-6 rounded-2xl shadow-xl space-y-4 flex flex-col justify-between">
          <h3 className="text-lg font-bold text-white border-b border-gray-800 pb-3">
            Payment Method Split
          </h3>

          {isMounted && paymentMethodSeries.length > 0 && (
            <Chart
              options={paymentMethodOptions}
              series={paymentMethodSeries}
              type="donut"
              height={260}
            />
          )}
          {isMounted && paymentMethodSeries.length === 0 && (
            <p className="text-gray-400 text-sm">No payment data for this period.</p>
          )}

          {paymentEntries.length > 0 && (
            <div className="text-center pt-2">
              <p className="text-xs text-gray-400">
                {paymentEntries[0][0]} leads with {paymentEntries[0][1]} orders
              </p>
            </div>
          )}
        </div>
      </div>

      {/* Top Dishes Bar Chart */}
      <div className="bg-gray-900 border border-gray-800 p-6 rounded-2xl shadow-xl space-y-4">
        <h3 className="text-lg font-bold text-white border-b border-gray-800 pb-3">
          Top Performing 3D Dishes (Units Sold)
        </h3>

        {isMounted && topDishes.length > 0 && (
          <Chart
            options={topDishesOptions}
            series={topDishesSeries}
            type="bar"
            height={260}
          />
        )}
        {isMounted && topDishes.length === 0 && (
          <p className="text-gray-400 text-sm pb-4">No dish sales data for this period.</p>
        )}
      </div>
    </div>
  );
}
