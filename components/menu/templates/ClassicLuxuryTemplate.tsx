'use client';

import React from 'react';
import { formatPrice } from '@/lib/menu';
import Dine3DLogo from '@/components/Dine3DLogo';
import type { MenuTemplateProps } from './types';
import type { PublicMenuItem } from '@/app/menu/[slug]/MenuContent';

export default function ClassicLuxuryTemplate({
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
      className="min-h-screen text-[#1A1A1A]"
      style={{
        background: '#F8F5F0',
        fontFamily: "'Cormorant Garamond', Georgia, serif",
      }}
    >
      {/* ================= EDITORIAL TOP MASTHEAD ================= */}
      <header className="border-b border-[#B8A47A]/25 bg-[#FAF8F5]/90 backdrop-blur-md sticky top-0 z-30 transition-all">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 py-4 flex items-center justify-between">
          <div className="flex items-center gap-3">
            {hotel.logo_url?.trim() ? (
              <img
                src={hotel.logo_url}
                alt={hotel.name}
                className="w-10 h-10 object-contain rounded-full border border-[#B8A47A]/40 p-0.5 bg-white shadow-sm"
              />
            ) : (
              <div className="w-10 h-10 rounded-full border border-[#B8A47A]/40 flex items-center justify-center bg-white shadow-sm">
                <Dine3DLogo size="xs" href={null} />
              </div>
            )}
            <div>
              <span className="block text-[0.6rem] font-sans font-semibold tracking-[0.25em] text-[#9A8760] uppercase">
                {hotel.city ? `${hotel.city} • Fine Dining` : 'Haute Cuisine'}
              </span>
              <h1 className="text-xl sm:text-2xl font-normal tracking-tight text-[#1A1A1A] leading-none">
                {hotel.name}
              </h1>
            </div>
          </div>

          <div className="flex items-center gap-3">
            {tableNumber && (
              <span className="hidden sm:inline-block px-3 py-1 rounded-full text-xs font-sans tracking-wider border border-[#B8A47A]/30 bg-white/80 text-[#6E6350]">
                Table {tableNumber}
              </span>
            )}

            <button
              onClick={onOpenCart}
              className="flex items-center gap-2.5 px-4 py-2 rounded-full border border-[#B8A47A] bg-white text-[#9A8760] hover:bg-[#F4F1EA] transition-all shadow-sm font-sans text-xs tracking-wider font-medium"
            >
              <svg width="14" height="14" viewBox="0 0 14 14" fill="none" stroke="currentColor" strokeWidth="1.2">
                <path d="M1 1h2.5l1.5 7.5h6.5l1.5-5.5h-9" strokeLinecap="round" strokeLinejoin="round" />
                <circle cx="5.5" cy="11.5" r="1" fill="currentColor" />
                <circle cx="10.5" cy="11.5" r="1" fill="currentColor" />
              </svg>
              <span>{totalCount > 0 ? `${totalCount} Dish${totalCount > 1 ? 'es' : ''} · ${formatPrice(totalPrice, currency)}` : 'Order'}</span>
            </button>
          </div>
        </div>

        {/* ================= WELCOME / CHEF INTRO BANNER ================= */}
        <div className="max-w-3xl mx-auto px-4 pt-2 pb-4 text-center">
          {hotel.welcome_text && (
            <p className="text-xs sm:text-sm italic text-[#4A4A40] max-w-xl mx-auto leading-relaxed border-t border-b border-[#B8A47A]/20 py-2 my-2">
              &ldquo;{hotel.welcome_text}&rdquo;
            </p>
          )}

          {/* Search Bar */}
          <div className="relative max-w-md mx-auto mt-3">
            <input
              type="text"
              value={search}
              onChange={(e) => onSearchChange(e.target.value)}
              placeholder="Search delicacies..."
              className="w-full pl-9 pr-4 py-1.5 text-xs font-sans bg-white border border-[#B8A47A]/30 rounded-full focus:outline-none focus:border-[#B8A47A] text-[#1A1A1A] placeholder-[#A6A297] shadow-inner"
            />
            <svg
              className="absolute left-3 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-[#9A8760]"
              viewBox="0 0 14 14"
              fill="none"
              stroke="currentColor"
              strokeWidth="1.2"
            >
              <circle cx="6" cy="6" r="4.5" />
              <path d="M9.5 9.5L12.5 12.5" strokeLinecap="round" />
            </svg>
          </div>

          {/* Elegant Horizontal Serif Navigation Tabs */}
          {pills.length > 1 && (
            <div className="flex items-center justify-center gap-2 sm:gap-4 overflow-x-auto mt-4 px-2 no-scrollbar">
              {pills.map((cat, idx) => {
                const isActive = selectedCategory === cat;
                return (
                  <button
                    key={cat}
                    onClick={() => onSelectCategory(cat)}
                    className={`whitespace-nowrap px-3 py-1 text-sm tracking-wider uppercase transition-all border-b-2 ${
                      isActive
                        ? 'border-[#9A8760] text-[#9A8760] font-medium'
                        : 'border-transparent text-[#7B776E] hover:text-[#1A1A1A]'
                    }`}
                  >
                    {idx === 0 ? '✦ ALL' : cat}
                  </button>
                );
              })}
            </div>
          )}
        </div>
      </header>

      {/* ================= MAIN EDITORIAL CONTENT ================= */}
      <main className="max-w-4xl mx-auto px-4 sm:px-6 py-10 space-y-14">
        {filteredItems.length === 0 ? (
          <div className="py-20 text-center">
            <p className="text-xl text-[#7B776E] italic">No culinary selections match your inquiry.</p>
          </div>
        ) : (
          <>
            {/* 1. CHEF'S CURATED FEATURED */}
            {featuredItems.length > 0 && (
              <section>
                <div className="text-center mb-8">
                  <span className="text-[0.625rem] font-sans font-bold tracking-[0.25em] text-[#9A8760] uppercase block mb-1">
                    Signature Creations
                  </span>
                  <h2 className="text-2xl sm:text-3xl font-normal text-[#1A1A1A] tracking-tight">
                    ✦ Chef&apos;s Featured Repertoire ✦
                  </h2>
                  <div className="w-24 h-px bg-[#B8A47A] mx-auto mt-3 opacity-60" />
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                  {featuredItems.map((item) => (
                    <ClassicLuxuryCard
                      key={item.id}
                      item={item}
                      currency={currency}
                      cart={cart}
                      onAdd={onAdd}
                      onRemove={onRemove}
                      onItemClick={onItemClick}
                      onView3D={onView3D}
                      isHero
                    />
                  ))}
                </div>
              </section>
            )}

            {/* 2. POPULAR SELECTIONS */}
            {popularItems.length > 0 && (
              <section>
                <div className="text-center mb-8">
                  <span className="text-[0.625rem] font-sans font-bold tracking-[0.25em] text-[#9A8760] uppercase block mb-1">
                    Patron Favorites
                  </span>
                  <h2 className="text-2xl sm:text-3xl font-normal text-[#1A1A1A] tracking-tight">
                    Grand Reserve & Popular Courses
                  </h2>
                  <div className="w-24 h-px bg-[#B8A47A] mx-auto mt-3 opacity-60" />
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                  {popularItems.map((item) => (
                    <ClassicLuxuryCard
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

            {/* 3. ALL REGULAR DISHES */}
            {regularItems.length > 0 && (
              <section>
                {(featuredItems.length > 0 || popularItems.length > 0) && (
                  <div className="text-center mb-8">
                    <span className="text-[0.625rem] font-sans font-bold tracking-[0.25em] text-[#9A8760] uppercase block mb-1">
                      Full Service
                    </span>
                    <h2 className="text-2xl sm:text-3xl font-normal text-[#1A1A1A] tracking-tight">
                      The Complete Degustation
                    </h2>
                    <div className="w-24 h-px bg-[#B8A47A] mx-auto mt-3 opacity-60" />
                  </div>
                )}

                <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                  {regularItems.map((item) => (
                    <ClassicLuxuryCard
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

function ClassicLuxuryCard({
  item,
  currency,
  cart,
  onAdd,
  onRemove,
  onItemClick,
  onView3D,
  isHero = false,
}: {
  item: PublicMenuItem;
  currency: string | null;
  cart: { menuItem: PublicMenuItem; quantity: number }[];
  onAdd: (item: PublicMenuItem) => void;
  onRemove: (id: string) => void;
  onItemClick: (item: PublicMenuItem) => void;
  onView3D: (item: PublicMenuItem) => void;
  isHero?: boolean;
}) {
  const inCart = cart.find((c) => c.menuItem.id === item.id);
  const has3D = Boolean(item.model_url_glb?.trim());
  const image = item.image_url?.trim() || '';

  return (
    <article
      onClick={() => onItemClick(item)}
      className="group bg-[#FFFFFF] border border-[#B8A47A]/30 rounded-xl overflow-hidden shadow-[0_4px_20px_rgba(0,0,0,0.03)] hover:shadow-[0_8px_30px_rgba(184,164,122,0.18)] hover:border-[#B8A47A] transition-all duration-300 flex flex-col cursor-pointer"
    >
      {/* Large Food Photography with Inset Gold Matting */}
      <div className="relative overflow-hidden bg-[#EAE7E1] p-3 pb-0">
        <div className={`relative w-full ${isHero ? 'h-64 sm:h-72' : 'h-52'} rounded-lg overflow-hidden border border-[#B8A47A]/20`}>
          {image ? (
            <img
              src={image}
              alt={item.name}
              loading="lazy"
              className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-700"
            />
          ) : (
            <div className="w-full h-full flex flex-col items-center justify-center bg-[#F4F1EA] text-[#7B776E]">
              <span className="text-xs uppercase tracking-widest font-sans font-light">Fine Dining Presentation</span>
            </div>
          )}

          {/* Badges on Photography */}
          <div className="absolute top-3 left-3 flex items-center gap-1.5">
            <span
              className={`px-2 py-0.5 rounded text-[0.625rem] font-sans font-semibold tracking-wider uppercase border shadow-sm ${
                item.is_veg
                  ? 'bg-emerald-950/80 text-emerald-200 border-emerald-500/30'
                  : 'bg-rose-950/80 text-rose-200 border-rose-500/30'
              }`}
            >
              {item.is_veg ? 'Vegetarian' : 'Non-Veg'}
            </span>
            {item.is_featured && (
              <span className="px-2 py-0.5 rounded text-[0.625rem] font-sans font-semibold tracking-wider uppercase bg-[#1A1A1A]/85 text-[#CDB98F] border border-[#B8A47A]/40 shadow-sm">
                ✦ Chef&apos;s Signature
              </span>
            )}
          </div>

          {has3D && (
            <button
              onClick={(e) => {
                e.stopPropagation();
                onView3D(item);
              }}
              className="absolute top-3 right-3 flex items-center gap-1 px-2.5 py-1 rounded bg-[#1A1A1A]/90 hover:bg-[#1A1A1A] border border-[#B8A47A] text-[#CDB98F] text-[0.625rem] font-sans font-bold tracking-wider uppercase shadow-md transition-all hover:scale-105"
            >
              <svg width="12" height="12" viewBox="0 0 12 12" fill="none">
                <path d="M6 1L11 3.5V8.5L6 11L1 8.5V3.5L6 1Z" stroke="currentColor" strokeWidth="1.2" strokeLinejoin="round" />
                <path d="M6 1V11M1 3.5L6 6L11 3.5" stroke="currentColor" strokeWidth="1" strokeOpacity="0.6" strokeLinejoin="round" />
              </svg>
              <span>View in 3D</span>
            </button>
          )}
        </div>
      </div>

      {/* Editorial Content Presentation */}
      <div className="p-5 flex-1 flex flex-col justify-between">
        <div>
          <div className="flex items-baseline justify-between gap-4 mb-2">
            <h3 className="text-xl sm:text-2xl font-normal text-[#1A1A1A] leading-snug group-hover:text-[#9A8760] transition-colors">
              {item.name}
            </h3>
            <span className="text-lg sm:text-xl font-normal text-[#9A8760] whitespace-nowrap tracking-tight">
              {formatPrice(Number(item.price) || 0, currency)}
            </span>
          </div>

          {item.description && (
            <p className="text-sm italic text-[#55554D] leading-relaxed mb-4 line-clamp-2">
              {item.description}
            </p>
          )}

          {/* Tasting notes / dietary details */}
          <div className="flex items-center gap-3 text-xs font-sans text-[#7B776E] mb-4">
            {item.calories ? <span>{item.calories} Calories</span> : null}
            {item.calories && item.preparation_time_mins ? <span>•</span> : null}
            {item.preparation_time_mins ? <span>Prep: {item.preparation_time_mins} mins</span> : null}
            {Number(item.rating) > 0 ? (
              <>
                <span>•</span>
                <span className="text-[#9A8760]">★ {Number(item.rating).toFixed(1)}</span>
              </>
            ) : null}
          </div>
        </div>

        {/* Action Button */}
        <div className="pt-3 border-t border-[#B8A47A]/20 flex items-center justify-between gap-3">
          {inCart ? (
            <div
              onClick={(e) => e.stopPropagation()}
              className="flex items-center justify-between w-full bg-[#FAF8F5] border border-[#B8A47A] rounded-lg px-3 py-1.5"
            >
              <button
                onClick={() => onRemove(item.id)}
                className="w-7 h-7 rounded-full bg-white border border-[#B8A47A]/50 text-[#1A1A1A] font-sans font-semibold text-sm hover:bg-[#F4F1EA] transition-colors"
              >
                −
              </button>
              <span className="text-sm font-sans font-medium text-[#1A1A1A]">
                {inCart.quantity} in Degustation
              </span>
              <button
                onClick={() => onAdd(item)}
                className="w-7 h-7 rounded-full bg-[#9A8760] text-white font-sans font-semibold text-sm hover:bg-[#7E6E4C] transition-colors shadow-sm"
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
              className="w-full py-2.5 px-4 rounded-lg bg-[#FAF8F5] hover:bg-[#9A8760] text-[#9A8760] hover:text-white border border-[#B8A47A] font-sans text-xs font-semibold tracking-wider uppercase transition-all duration-300 shadow-sm"
            >
              Add to Course
            </button>
          )}
        </div>
      </div>
    </article>
  );
}
