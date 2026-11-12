'use client';

import Link from 'next/link';
import { useSearchParams } from 'next/navigation';
import { useState } from 'react';
import { User, Clock, MapPin, Phone, CreditCard } from 'lucide-react';
import BottomNav from '@/components/nav/BottomNav';

const orders = [
  { id: 'ORD-8842', date: '2 Nov 2026', items: 3, total: '₹540', status: 'Delivered' },
  { id: 'ORD-8791', date: '28 Oct 2026', items: 2, total: '₹320', status: 'Completed' },
  { id: 'ORD-8733', date: '24 Oct 2026', items: 1, total: '₹180', status: 'Cancelled' },
];

const infoCards = [
  { label: 'Table Number', value: 'Table 1', icon: MapPin },
  { label: 'Preferred Payment', value: 'UPI', icon: CreditCard },
  { label: 'Total Orders', value: orders.length.toString(), icon: Clock },
];

export default function ProfilePage() {
  const searchParams = useSearchParams();
  const slug = searchParams.get('slug') || null;
  const table = searchParams.get('table') || null;
  const [activeTab, setActiveTab] = useState('Profile');

  const menuHref = slug ? `/menu/${encodeURIComponent(slug)}` : '/menu';

  return (
    <div className="min-h-screen flex flex-col pb-20" style={{ background: '#0B0B0A', color: '#F3EFE7', fontFamily: "'Inter', system-ui, sans-serif" }}>
      <header className="border-b border-white/10 bg-black/80 backdrop-blur-md sticky top-0 z-20 px-6 py-4">
        <div className="max-w-4xl mx-auto flex items-center justify-between">
          <Link href={menuHref} className="flex items-center gap-2 px-4 py-1.5 rounded-full border border-white/20 bg-white/5 text-xs font-medium text-white/80 hover:bg-white/10 transition-colors">
            <User size="14" strokeWidth="1.5" stroke="white" />
            <span>Back to Menu</span>
          </Link>
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-full bg-white/10 flex items-center justify-center border border-white/20 overflow-hidden">
              <User size="20" strokeWidth="1.5" stroke="white" />
            </div>
            <div className="text-right hidden sm:block">
              <h1 className="text-base font-bold tracking-tight text-white">Guest Profile</h1>
              <p className="text-[0.65rem] text-white/50">DinePixel Customer</p>
            </div>
          </div>
        </div>
      </header>

      <main className="max-w-4xl mx-auto px-6 py-12 flex-1">
        {/* Profile Info */}
        <section className="mb-10">
          <h2 className="text-lg sm:text-xl font-light tracking-tight text-white mb-6">Your Details</h2>
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
            {infoCards.map((card) => (
              <div key={card.label} className="rounded-xl border border-white/10 bg-white/5 p-4 flex items-center gap-3">
                <div className="w-8 h-8 rounded-lg bg-white/5 flex items-center justify-center shrink-0 border border-white/10">
                  <card.icon size="14" strokeWidth="1.5" stroke="#B8A47A" />
                </div>
                <div className="flex-1 min-w-0">
                  <p className="text-[0.6rem] font-bold tracking-wider uppercase text-white/40">{card.label}</p>
                  <p className="text-sm font-medium text-white">{card.value}</p>
                </div>
              </div>
            ))}
          </div>
        </section>

        {/* Order History */}
        <section>
          <h2 className="text-lg sm:text-xl font-light tracking-tight text-white mb-6">Order History</h2>
          <div className="space-y-3">
            {orders.map((order) => (
              <div key={order.id} className="rounded-xl border border-white/10 bg-white/5 p-4 flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-white">{order.id}</p>
                  <p className="text-xs text-white/50">{order.date} &bull; {order.items} item{order.items === 1 ? '' : 's'}</p>
                </div>
                <div className="text-right">
                  <p className="text-sm font-medium text-white">{order.total}</p>
                  <span className={`text-[0.6rem] font-bold px-2 py-0.5 rounded uppercase tracking-tighter ${
                    order.status === 'Delivered' ? 'bg-emerald-950/30 text-emerald-400 border border-emerald-500/30' :
                    order.status === 'Completed' ? 'bg-blue-950/30 text-blue-400 border border-blue-500/30' :
                    'bg-rose-950/30 text-rose-400 border border-rose-500/30'
                  }`}>
                    {order.status}
                  </span>
                </div>
              </div>
            ))}
          </div>
        </section>
      </main>

      <footer className="border-t border-white/10 bg-black/80 px-6 py-6 text-center">
        <p className="text-[0.55rem] text-white/40 tracking-wider uppercase">
          DinePixel Profile &bull; Manage your dining preferences{slug ? ` &bull; Table ${table || '—'}` : ''}
        </p>
      </footer>

      <BottomNav
        activeTab={activeTab}
        cartCount={0}
        menuSlug={slug}
        tableNumber={table}
        onTabChange={setActiveTab}
      />
    </div>
  );
}
