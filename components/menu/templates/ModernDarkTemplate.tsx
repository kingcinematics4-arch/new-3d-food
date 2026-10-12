'use client';

import React from 'react';
import { formatPrice } from '@/lib/menu';
import Dine3DLogo from '@/components/Dine3DLogo';
import type { MenuTemplateProps } from './types';
import type { PublicMenuItem } from '@/app/menu/[slug]/MenuContent';

export default function ModernDarkTemplate({
  hotel,
  currency,
  tableNumber,
  categories,
  pills,
  selectedCategory,
  onSelectCategory,
  search,
  onSearchChange,
  filteredItems,
  featuredItems,
  popularItems,
  regularItems,
  cart,
  totalCount,
  totalPrice,
  onAdd,
  onRemove,
  onItemClick,
  onView3D,
  onOpenCart,
}: MenuTemplateProps) {
  // Count items per category for pills
  const getCatCount = (catName: string) => {
    if (catName === 'All') return filteredItems.length;
    if (catName === 'Uncategorised') {
      return filteredItems.filter((i) => !i.category_id).length;
    }
    const cat = categories.find((c) => c.name === catName);
    return filteredItems.filter((i) => i.category_id === cat?.id).length;
  };

  return (
    <div
      className="min-h-screen text-white bg-[#0A0A0A]"
      style={{ fontFamily: "'Manrope', 'Inter', system-ui, sans-serif" }}
    >
      {/* ================= SLEEK DARK HEADER ================= */}
      <header className="sticky top-0 z-30 bg-[#0A0A0A]/95 backdrop-blur-xl border-b border-white/10">
        <div className="max-w-5xl mx-auto px-4 py-3 flex items-center justify-between gap-3">
          <div className="flex items-center gap-3">
            {hotel.logo_url?.trim() ? (
              <img
                src={hotel.logo_url}
                alt={hotel.name}
                className="w-9 h-9 rounded-lg object-cover border border-white/20 bg-neutral-900"
              />
            ) : (
              <div className="w-9 h-9 rounded-lg bg-neutral-900 border border-white/15 flex items-center justify-center">
                <Dine3DLogo size="xs" href={null} />
              </div>
            )}
            <div>
              <div className="flex items-center gap-2">
                <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse" />
                <span className="text-[0.65rem] font-bold tracking-widest text-[#E1C99A] uppercase">
                  {tableNumber ? `Table ${tableNumber}` : 'Kitchen Live'}
                </span>
              </div>
              <h1 className="text-base sm:text-lg font-bold tracking-tight text-white leading-tight">
                {hotel.name}
              </h1>
            </div>
          </div>

          <div className="flex items-center gap-2">
            <button
              onClick={onOpenCart}
              className="relative flex items-center gap-2 px-3.5 py-1.5 rounded-lg bg-[#E1C99A] hover:bg-[#F0DCAF] text-black font-bold text-xs tracking-wider uppercase transition-all shadow-[0_0_15px_rgba(225,201,154,0.3)]"
            >
              <svg width="14" height="14" viewBox="0 0 14 14" fill="none" stroke="currentColor" strokeWidth="2">
                <path d="M1 1h2l1.2 6.5h7.2l1.6-4.5H3.5" strokeLinecap="round" strokeLinejoin="round" />
                <circle cx="5" cy="11" r="1.2" fill="currentColor" />
                <circle cx="10" cy="11" r="1.2" fill="currentColor" />
              </svg>
              <span>{totalCount > 0 ? `${totalCount} · ${formatPrice(totalPrice, currency)}` : 'Cart'}</span>
            </button>
          </div>
        </div>

        {/* Search & Horizontal Category Scroll */}
        <div className="max-w-5xl mx-auto px-4 pb-3">
          <div className="relative mb-3">
            <input
              type="text"
              value={search}
              onChange={(e) => onSearchChange(e.target.value)}
              placeholder="Search modern plates, drinks, chef specials..."
              className="w-full pl-9 pr-4 py-2 bg-neutral-900/90 border border-white/15 rounded-lg text-xs text-white placeholder-neutral-500 focus:outline-none focus:border-[#E1C99A] transition-colors"
            />
            <svg
              className="absolute left-3 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-neutral-400"
              viewBox="0 0 14 14"
              fill="none"
              stroke="currentColor"
              strokeWidth="1.5"
            >
              <circle cx="6" cy="6" r="4.5" />
              <path d="M9.5 9.5L12.5 12.5" strokeLinecap="round" />
            </svg>
          </div>

          {/* Horizontal category track with item count capsules */}
          {pills.length > 1 && (
            <div className="flex items-center gap-2 overflow-x-auto no-scrollbar py-0.5">
              {pills.map((cat) => {
                const isActive = selectedCategory === cat;
                const count = getCatCount(cat);
                return (
                  <button
                    key={cat}
                    onClick={() => onSelectCategory(cat)}
                    className={`flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-semibold whitespace-nowrap transition-all duration-200 ${
                      isActive
                        ? 'bg-[#E1C99A] text-black shadow-[0_0_12px_rgba(225,201,154,0.4)]'
                        : 'bg-neutral-900/80 hover:bg-neutral-800 text-neutral-300 border border-white/10'
                    }`}
                  >
                    <span>{cat}</span>
                    <span
                      className={`text-[0.625rem] px-1.5 py-0.2 rounded-full font-bold ${
                        isActive ? 'bg-black/20 text-black' : 'bg-neutral-800 text-neutral-400'
                      }`}
                    >
                      {count}
                    </span>
                  </button>
                );
              })}
            </div>
          )}
        </div>
      </header>

      {/* ================= MAIN CONTENT ================= */}
      <main className="max-w-5xl mx-auto px-4 py-6 space-y-10">
        {hotel.welcome_text && (
          <div className="p-4 rounded-xl bg-gradient-to-r from-neutral-900 via-neutral-900/60 to-transparent border border-white/10">
            <p className="text-xs sm:text-sm text-neutral-300 tracking-wide font-light">
              {hotel.welcome_text}
            </p>
          </div>
        )}

        {filteredItems.length === 0 ? (
          <div className="py-24 text-center">
            <div className="w-12 h-12 rounded-full bg-neutral-900 border border-white/10 mx-auto flex items-center justify-center text-neutral-500 mb-3">
              ✕
            </div>
            <p className="text-sm text-neutral-400">No dishes match your search criteria.</p>
          </div>
        ) : (
          <>
            {/* FEATURED DISHES */}
            {featuredItems.length > 0 && (
              <section>
                <div className="flex items-center justify-between mb-4">
                  <div className="flex items-center gap-2">
                    <span className="w-1.5 h-4 bg-[#E1C99A] rounded-full" />
                    <h2 className="text-base sm:text-lg font-bold tracking-tight text-white uppercase">
                      Spotlight Dishes
                    </h2>
                  </div>
                  <span className="text-xs text-[#E1C99A] font-semibold tracking-wider">
                    {featuredItems.length} curated
                  </span>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-5">
                  {featuredItems.map((item) => (
                    <ModernDarkCard
                      key={item.id}
                      item={item}
                      currency={currency}
                      cart={cart}
                      onAdd={onAdd}
                      onRemove={onRemove}
                      onItemClick={onItemClick}
                      onView3D={onView3D}
                    />
                  ))}
                </div>
              </section>
            )}

            {/* POPULAR DISHES */}
            {popularItems.length > 0 && (
              <section>
                <div className="flex items-center justify-between mb-4">
                  <div className="flex items-center gap-2">
                    <span className="w-1.5 h-4 bg-amber-400 rounded-full" />
                    <h2 className="text-base sm:text-lg font-bold tracking-tight text-white uppercase">
                      Most Ordered
                    </h2>
                  </div>
                  <span className="text-xs text-neutral-400 font-semibold tracking-wider">
                    Trending
                  </span>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-5">
                  {popularItems.map((item) => (
                    <ModernDarkCard
                      key={item.id}
                      item={item}
                      currency={currency}
                      cart={cart}
                      onAdd={onAdd}
                      onRemove={onRemove}
                      onItemClick={onItemClick}
                      onView3D={onView3D}
                    />
                  ))}
                </div>
              </section>
            )}

            {/* ALL DISHES */}
            {regularItems.length > 0 && (
              <section>
                {(featuredItems.length > 0 || popularItems.length > 0) && (
                  <div className="flex items-center gap-2 mb-4">
                    <span className="w-1.5 h-4 bg-neutral-600 rounded-full" />
                    <h2 className="text-base sm:text-lg font-bold tracking-tight text-white uppercase">
                      Menu Selection
                    </h2>
                  </div>
                )}

                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-5">
                  {regularItems.map((item) => (
                    <ModernDarkCard
                      key={item.id}
                      item={item}
                      currency={currency}
                      cart={cart}
                      onAdd={onAdd}
                      onRemove={onRemove}
                      onItemClick={onItemClick}
                      onView3D={onView3D}
                    />
                  ))}
                </div>
              </section>
            )}
          </>
        )}
      </main>
    </div>
  );
}

function ModernDarkCard({
  item,
  currency,
  cart,
  onAdd,
  onRemove,
  onItemClick,
  onView3D,
}: {
  item: PublicMenuItem;
  currency: string | null;
  cart: { menuItem: PublicMenuItem; quantity: number }[];
  onAdd: (item: PublicMenuItem) => void;
  onRemove: (id: string) => void;
  onItemClick: (item: PublicMenuItem) => void;
  onView3D: (item: PublicMenuItem) => void;
}) {
  const inCart = cart.find((c) => c.menuItem.id === item.id);
  const has3D = Boolean(item.model_url_glb?.trim());
  const image = item.image_url?.trim() || '';

  return (
    <div
      onClick={() => onItemClick(item)}
      className="group relative bg-[#141414] hover:bg-[#1A1A1A] border border-white/10 hover:border-[#E1C99A]/50 rounded-2xl overflow-hidden transition-all duration-300 flex flex-col justify-between shadow-[0_4px_24px_rgba(0,0,0,0.5)] cursor-pointer"
    >
      {/* IMAGE-FIRST DOMINANT CONTAINER */}
      <div className="relative w-full h-48 bg-neutral-900 overflow-hidden">
        {image ? (
          <img
            src={image}
            alt={item.name}
            loading="lazy"
            className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
          />
        ) : (
          <div className="w-full h-full flex flex-col items-center justify-center text-neutral-600 bg-neutral-900">
            <span className="text-[0.65rem] uppercase font-bold tracking-widest">No Image</span>
          </div>
        )}

        {/* Dark Gradient Overlay for text contrast */}
        <div className="absolute inset-0 bg-gradient-to-t from-[#141414] via-transparent to-black/40" />

        {/* Floating Top Badges */}
        <div className="absolute top-3 left-3 flex items-center gap-1.5">
          <span
            className={`w-2.5 h-2.5 rounded-full ${
              item.is_veg ? 'bg-emerald-400 shadow-[0_0_8px_#34d399]' : 'bg-rose-500 shadow-[0_0_8px_#f43f5e]'
            }`}
          />
          {item.is_featured && (
            <span className="px-2 py-0.5 rounded-full text-[0.6rem] font-extrabold uppercase tracking-wider bg-[#E1C99A] text-black">
              Featured
            </span>
          )}
        </div>

        {has3D && (
          <button
            onClick={(e) => {
              e.stopPropagation();
              onView3D(item);
            }}
            className="absolute top-3 right-3 flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-black/80 hover:bg-black text-[#E1C99A] border border-[#E1C99A]/50 text-[0.625rem] font-bold tracking-wider uppercase backdrop-blur-md transition-transform hover:scale-105"
          >
            <span className="w-2 h-2 rounded-full bg-[#E1C99A] animate-ping" />
            <span>3D LIVE</span>
          </button>
        )}

        {/* Floating Price Pill at Bottom Right of Image */}
        <div className="absolute bottom-3 right-3 px-3 py-1 rounded-lg bg-black/80 border border-white/20 backdrop-blur-md">
          <span className="text-sm font-bold text-[#E1C99A]">
            {formatPrice(Number(item.price) || 0, currency)}
          </span>
        </div>
      </div>

      {/* COMPACT BOTTOM CONTENT */}
      <div className="p-4 flex-1 flex flex-col justify-between">
        <div>
          <h3 className="text-base font-bold text-white group-hover:text-[#E1C99A] transition-colors leading-tight mb-1.5 line-clamp-1">
            {item.name}
          </h3>

          {item.description && (
            <p className="text-xs text-neutral-400 line-clamp-2 leading-relaxed mb-3">
              {item.description}
            </p>
          )}

          <div className="flex items-center gap-3 text-[0.65rem] text-neutral-400 font-medium mb-3">
            {item.calories ? <span>⚡ {item.calories} kcal</span> : null}
            {item.preparation_time_mins ? <span>⏱ {item.preparation_time_mins}m</span> : null}
            {Number(item.rating) > 0 && <span className="text-amber-300">★ {Number(item.rating).toFixed(1)}</span>}
          </div>
        </div>

        {/* TACTILE BOTTOM QUICK ADD ACTION */}
        <div className="pt-2 border-t border-white/10">
          {inCart ? (
            <div
              onClick={(e) => e.stopPropagation()}
              className="flex items-center justify-between w-full bg-neutral-900 border border-[#E1C99A]/50 rounded-xl px-2 py-1"
            >
              <button
                onClick={() => onRemove(item.id)}
                className="w-7 h-7 rounded-lg bg-neutral-800 hover:bg-neutral-700 text-white font-bold flex items-center justify-center transition-colors"
              >
                −
              </button>
              <span className="text-xs font-bold text-[#E1C99A]">
                {inCart.quantity} in Order
              </span>
              <button
                onClick={() => onAdd(item)}
                className="w-7 h-7 rounded-lg bg-[#E1C99A] hover:bg-[#F0DCAF] text-black font-bold flex items-center justify-center transition-colors"
              >
                +
              </button>
            </div>
          ) : (
            <button
              onClick={(e) => {
                e.stopPropagation();
                onAdd(item);
              }}
              className="w-full py-2 rounded-xl bg-neutral-900 hover:bg-[#E1C99A] text-neutral-200 hover:text-black border border-white/15 hover:border-[#E1C99A] font-bold text-xs uppercase tracking-wider transition-all duration-200"
            >
              + Quick Add
            </button>
          )}
        </div>
      </div>
    </div>
  );
}
