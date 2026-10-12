'use client';

import React from 'react';
import { formatPrice } from '@/lib/menu';
import Dine3DLogo from '@/components/Dine3DLogo';
import type { MenuTemplateProps } from './types';
import type { PublicMenuItem } from '@/app/menu/[slug]/MenuContent';

export default function IndianHeritageTemplate({
  hotel,
  currency,
  tableNumber,
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
  return (
    <div
      className="min-h-screen text-[#E8E1D1] bg-[#1D150E]"
      style={{
        fontFamily: "'Cormorant Garamond', 'Georgia', serif",
        backgroundImage: `radial-gradient(circle at 50% 0%, rgba(198,154,110,0.08) 0%, transparent 60%)`,
      }}
    >
      {/* ================= ROYAL HAVELI ORNATE MASTHEAD ================= */}
      <header className="sticky top-0 z-30 bg-[#1D150E]/95 backdrop-blur-md border-b border-[#C69A6E]/30">
        <div className="max-w-4xl mx-auto px-4 py-3 flex items-center justify-between">
          <div className="flex items-center gap-3">
            {hotel.logo_url?.trim() ? (
              <img
                src={hotel.logo_url}
                alt={hotel.name}
                className="w-10 h-10 object-cover rounded border-2 border-[#C69A6E] p-0.5 bg-[#2A2015] shadow-md"
              />
            ) : (
              <div className="w-10 h-10 rounded border-2 border-[#C69A6E] flex items-center justify-center bg-[#2A2015] text-[#C69A6E] shadow-md">
                <Dine3DLogo size="xs" href={null} />
              </div>
            )}
            <div>
              <div className="flex items-center gap-1.5 text-[0.625rem] font-sans font-bold tracking-[0.2em] text-[#C69A6E] uppercase">
                <span>✦ Shahi Dastarkhwan</span>
                {tableNumber && <span>• Mez {tableNumber}</span>}
              </div>
              <h1 className="text-xl sm:text-2xl font-normal tracking-wide text-[#E8E1D1] leading-none">
                {hotel.name}
              </h1>
            </div>
          </div>

          <div className="flex items-center gap-2">
            <button
              onClick={onOpenCart}
              className="flex items-center gap-2 px-4 py-1.5 rounded border border-[#C69A6E] bg-[#2A2015] hover:bg-[#35291C] text-[#C69A6E] text-xs font-sans tracking-widest uppercase transition-all shadow-[0_2px_12px_rgba(198,154,110,0.15)]"
            >
              <span className="text-sm">❖</span>
              <span>{totalCount > 0 ? `${totalCount} Pakwan · ${formatPrice(totalPrice, currency)}` : 'Thali'}</span>
            </button>
          </div>
        </div>

        {/* Ornate Search & Heritage Boxed Tabs */}
        <div className="max-w-4xl mx-auto px-4 pb-3">
          <div className="relative mb-3">
            <input
              type="text"
              value={search}
              onChange={(e) => onSearchChange(e.target.value)}
              placeholder="Search royal biryanis, kebabs, curries & artisanal breads..."
              className="w-full pl-9 pr-4 py-2 bg-[#2A2015] border border-[#C69A6E]/30 rounded text-xs font-sans text-[#E8E1D1] placeholder-[#A69470] focus:outline-none focus:border-[#C69A6E] transition-colors"
            />
            <svg
              className="absolute left-3 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-[#C69A6E]"
              viewBox="0 0 14 14"
              fill="none"
              stroke="currentColor"
              strokeWidth="1.5"
            >
              <circle cx="6" cy="6" r="4.5" />
              <path d="M9.5 9.5L12.5 12.5" strokeLinecap="round" />
            </svg>
          </div>

          {/* Boxed Heritage Tabs with Brass Edges */}
          {pills.length > 1 && (
            <div className="flex items-center gap-2 overflow-x-auto no-scrollbar py-1">
              {pills.map((cat) => {
                const isActive = selectedCategory === cat;
                return (
                  <button
                    key={cat}
                    onClick={() => onSelectCategory(cat)}
                    className={`px-3.5 py-1.5 rounded text-xs font-sans uppercase tracking-widest whitespace-nowrap transition-all duration-200 border ${
                      isActive
                        ? 'bg-[#C69A6E] text-[#1D150E] font-bold border-[#D4AF7C] shadow-[0_0_12px_rgba(198,154,110,0.3)]'
                        : 'bg-[#2A2015] hover:bg-[#35291C] text-[#C9BAA0] border-[#5A4630]'
                    }`}
                  >
                    {cat}
                  </button>
                );
              })}
            </div>
          )}
        </div>
      </header>

      {/* ================= MAIN HERITAGE COURSES ================= */}
      <main className="max-w-4xl mx-auto px-4 sm:px-6 py-10 space-y-14">
        {hotel.welcome_text && (
          <div className="text-center border-t border-b border-[#C69A6E]/30 py-4 px-6 bg-[#2A2015]/40 max-w-2xl mx-auto">
            <span className="text-xs text-[#C69A6E] block mb-1">✦ ════ ❖ ════ ✦</span>
            <p className="text-sm italic text-[#C9BAA0] leading-relaxed">
              &ldquo;{hotel.welcome_text}&rdquo;
            </p>
          </div>
        )}

        {filteredItems.length === 0 ? (
          <div className="py-24 text-center">
            <p className="text-lg italic text-[#A69470]">No traditional delicacies found matching your request.</p>
          </div>
        ) : (
          <>
            {/* SHAHI KHAS — CHEF'S FEATURED */}
            {featuredItems.length > 0 && (
              <section>
                <div className="text-center mb-8">
                  <span className="text-[0.625rem] font-sans font-bold tracking-[0.3em] text-[#C69A6E] uppercase block mb-1">
                    Royal Banquet
                  </span>
                  <h2 className="text-2xl sm:text-3xl font-normal text-[#E8E1D1] tracking-wide">
                    ❖ Shahi Khas Curations ❖
                  </h2>
                  <div className="flex items-center justify-center gap-2 mt-2 text-[#C69A6E]/60 text-xs">
                    <span>✦ ─── ❖ ─── ✦</span>
                  </div>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  {featuredItems.map((item) => (
                    <IndianHeritageCard
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

            {/* DASTARKHWAN POPULAR */}
            {popularItems.length > 0 && (
              <section>
                <div className="text-center mb-8">
                  <span className="text-[0.625rem] font-sans font-bold tracking-[0.3em] text-[#C69A6E] uppercase block mb-1">
                    Tradition & Fame
                  </span>
                  <h2 className="text-2xl sm:text-3xl font-normal text-[#E8E1D1] tracking-wide">
                    ❖ Lazeez & Celebrated Pakwan ❖
                  </h2>
                  <div className="flex items-center justify-center gap-2 mt-2 text-[#C69A6E]/60 text-xs">
                    <span>✦ ─── ❖ ─── ✦</span>
                  </div>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  {popularItems.map((item) => (
                    <IndianHeritageCard
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

            {/* ALL COURSES */}
            {regularItems.length > 0 && (
              <section>
                {(featuredItems.length > 0 || popularItems.length > 0) && (
                  <div className="text-center mb-8">
                    <span className="text-[0.625rem] font-sans font-bold tracking-[0.3em] text-[#C69A6E] uppercase block mb-1">
                      Complete Feast
                    </span>
                    <h2 className="text-2xl sm:text-3xl font-normal text-[#E8E1D1] tracking-wide">
                      ❖ Sampoorna Dastarkhwan ❖
                    </h2>
                    <div className="flex items-center justify-center gap-2 mt-2 text-[#C69A6E]/60 text-xs">
                      <span>✦ ─── ❖ ─── ✦</span>
                    </div>
                  </div>
                )}

                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  {regularItems.map((item) => (
                    <IndianHeritageCard
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

function IndianHeritageCard({
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
      className="group relative bg-[#2A2015] border-2 border-[#5A4630] hover:border-[#C69A6E] rounded-lg p-3 transition-all duration-300 flex flex-col justify-between shadow-[0_4px_24px_rgba(0,0,0,0.6)] cursor-pointer"
    >
      {/* Decorative Brass Corner Flourishes */}
      <span className="absolute top-1 left-1 text-[0.625rem] text-[#C69A6E]/50 pointer-events-none">❖</span>
      <span className="absolute top-1 right-1 text-[0.625rem] text-[#C69A6E]/50 pointer-events-none">❖</span>
      <span className="absolute bottom-1 left-1 text-[0.625rem] text-[#C69A6E]/50 pointer-events-none">❖</span>
      <span className="absolute bottom-1 right-1 text-[0.625rem] text-[#C69A6E]/50 pointer-events-none">❖</span>

      {/* ARCHED / FRAMED FOOD IMAGE */}
      <div className="relative w-full h-52 overflow-hidden rounded-t-[28px] rounded-b border border-[#C69A6E]/30 bg-[#1D150E]">
        {image ? (
          <img
            src={image}
            alt={item.name}
            loading="lazy"
            className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-700"
          />
        ) : (
          <div className="w-full h-full flex flex-col items-center justify-center text-[#A69470] bg-[#1D150E]">
            <span className="text-xs uppercase font-sans tracking-widest">Royal Pakwan</span>
          </div>
        )}

        {/* Traditional Heritage Veg / Non-Veg Framed Badge */}
        <div className="absolute top-3 left-3 flex items-center gap-1.5">
          <div
            className={`w-4 h-4 rounded-xs border-2 flex items-center justify-center bg-[#1D150E]/90 ${
              item.is_veg ? 'border-emerald-500' : 'border-rose-600'
            }`}
          >
            <div
              className={`w-2 h-2 rounded-full ${
                item.is_veg ? 'bg-emerald-500' : 'bg-rose-600'
              }`}
            />
          </div>
          {item.is_featured && (
            <span className="px-2 py-0.5 rounded text-[0.6rem] font-sans font-bold tracking-wider uppercase bg-[#1D150E]/90 text-[#D4AF7C] border border-[#C69A6E]/50">
              ✦ Shahi Khas
            </span>
          )}
        </div>

        {has3D && (
          <button
            onClick={(e) => {
              e.stopPropagation();
              onView3D(item);
            }}
            className="absolute top-3 right-3 flex items-center gap-1 px-2.5 py-1 rounded bg-[#1D150E]/95 border border-[#C69A6E] text-[#D4AF7C] text-[0.625rem] font-sans font-bold tracking-wider uppercase transition-transform hover:scale-105"
          >
            <span>❖ 3D DARSHAN</span>
          </button>
        )}
      </div>

      {/* DISH ATTRIBUTES */}
      <div className="pt-3 px-1 flex-1 flex flex-col justify-between">
        <div>
          <div className="flex items-baseline justify-between gap-3 mb-1.5">
            <h3 className="text-lg sm:text-xl font-normal text-[#E8E1D1] group-hover:text-[#D4AF7C] transition-colors leading-snug">
              {item.name}
            </h3>
            <span className="text-lg font-normal text-[#C69A6E] whitespace-nowrap">
              {formatPrice(Number(item.price) || 0, currency)}
            </span>
          </div>

          {item.description && (
            <p className="text-xs sm:text-sm italic text-[#C9BAA0] line-clamp-2 leading-relaxed mb-3">
              {item.description}
            </p>
          )}

          <div className="flex items-center gap-3 text-xs font-sans text-[#A69470] mb-3">
            {item.calories ? <span>{item.calories} kCal</span> : null}
            {item.preparation_time_mins ? <span>• Dum: {item.preparation_time_mins} min</span> : null}
            {Number(item.rating) > 0 ? (
              <span className="text-[#D4AF7C]">★ {Number(item.rating).toFixed(1)}</span>
            ) : null}
          </div>
        </div>

        {/* BRASS THALI ACTION */}
        <div className="pt-2.5 border-t border-[#5A4630] flex items-center justify-between gap-2">
          {inCart ? (
            <div
              onClick={(e) => e.stopPropagation()}
              className="flex items-center justify-between w-full bg-[#1D150E] border border-[#C69A6E] rounded px-3 py-1"
            >
              <button
                onClick={() => onRemove(item.id)}
                className="w-6 h-6 rounded bg-[#2A2015] text-[#E8E1D1] font-sans font-bold text-xs flex items-center justify-center hover:bg-[#35291C]"
              >
                −
              </button>
              <span className="text-xs font-sans font-semibold text-[#D4AF7C]">
                {inCart.quantity} in Thali
              </span>
              <button
                onClick={() => onAdd(item)}
                className="w-6 h-6 rounded bg-[#C69A6E] text-[#1D150E] font-sans font-bold text-xs flex items-center justify-center hover:bg-[#D4AF7C]"
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
              className="w-full py-2 rounded bg-[#35291C] hover:bg-[#C69A6E] text-[#C69A6E] hover:text-[#1D150E] border border-[#C69A6E]/60 font-sans text-xs font-bold uppercase tracking-widest transition-all duration-300"
            >
              ✦ Add to Thali
            </button>
          )}
        </div>
      </div>
    </div>
  );
}
