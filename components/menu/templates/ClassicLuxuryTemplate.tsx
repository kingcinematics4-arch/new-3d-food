'use client';

import React from 'react';
import { formatPrice } from '@/lib/menu';
import DinePixelLogo from '@/components/DinePixelLogo';
import type { MenuTemplateProps, CartItem, PublicMenuItemSize } from './types';
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
  onViewAr,
  onOpenWater,
  onOpenWaiter,
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
                <DinePixelLogo size="xs" href={null} />
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
          </div>
        </div>

        {/* ================= WELCOME / CHEF INTRO BANNER ================= */}
        <div className="max-w-3xl mx-auto px-4 pt-2 pb-3 text-center">
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

          {/* Water & Call Waiter action row */}
          <div className="flex justify-center gap-[7px] mt-[4px]">
            <button
              type="button"
              onClick={onOpenWater}
              style={{
                display: 'inline-flex',
                alignItems: 'center',
                gap: '6px',
                padding: '0 10px',
                height: '34px',
                minHeight: '34px',
                borderRadius: '17px',
                border: '1px solid rgba(184,164,122,0.3)',
                background: 'rgba(255,255,255,0.8)',
                color: '#6E6350',
                fontSize: '13px',
                fontWeight: 500,
                lineHeight: 1,
                cursor: 'pointer',
                transition: 'background 0.2s',
                boxSizing: 'border-box',
                WebkitAppearance: 'none',
                appearance: 'none',
              }}
              onMouseEnter={(e) => { e.currentTarget.style.background = '#F4F1EA'; }}
              onMouseLeave={(e) => { e.currentTarget.style.background = 'rgba(255,255,255,0.8)'; }}
            >
              <span style={{fontSize: '15px', lineHeight: 1}}>💧</span>
              <span>Water</span>
            </button>
            <button
              type="button"
              onClick={onOpenWaiter}
              style={{
                display: 'inline-flex',
                alignItems: 'center',
                gap: '6px',
                padding: '0 10px',
                height: '34px',
                minHeight: '34px',
                borderRadius: '17px',
                border: '1px solid rgba(184,164,122,0.3)',
                background: '#B8A47A',
                color: '#1A1A1A',
                fontSize: '13px',
                fontWeight: 500,
                lineHeight: 1,
                cursor: 'pointer',
                transition: 'background 0.2s',
                boxSizing: 'border-box',
                WebkitAppearance: 'none',
                appearance: 'none',
              }}
              onMouseEnter={(e) => { e.currentTarget.style.background = '#9A8760'; }}
              onMouseLeave={(e) => { e.currentTarget.style.background = '#B8A47A'; }}
            >
              <span style={{fontSize: '15px', lineHeight: 1}}>🔔</span>
              <span>Call Waiter</span>
            </button>
          </div>

          {/* Elegant Horizontal Serif Navigation Tabs */}
          {pills.length > 1 && (
            <div className="flex items-center justify-center gap-[7px] overflow-x-auto mt-[3px] px-[4px] no-scrollbar">
              {pills.map((cat, idx) => {
                const isActive = selectedCategory === cat;
                return (
                  <button
                    key={cat}
                    onClick={() => onSelectCategory(cat)}
                    style={{
                      display: 'inline-flex',
                      alignItems: 'center',
                      padding: '0 12px',
                      height: '32px',
                      minHeight: '32px',
                      borderRadius: '16px',
                      fontSize: '13px',
                      fontWeight: 500,
                      lineHeight: 1,
                      whiteSpace: 'nowrap',
                      cursor: 'pointer',
                      transition: 'all 0.2s',
                      borderBottom: isActive ? '2px solid #9A8760' : '2px solid transparent',
                      color: isActive ? '#9A8760' : '#7B776E',
                      background: 'transparent',
                      boxSizing: 'border-box',
                      WebkitAppearance: 'none',
                      appearance: 'none',
                    }}
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
      <main className="max-w-4xl mx-auto px-4 sm:px-6 py-5 pb-28 sm:pb-24 space-y-6">
        {filteredItems.length === 0 ? (
          <div className="py-12 text-center">
            <p className="text-lg text-[#7B776E] italic">No culinary selections match your inquiry.</p>
          </div>
        ) : (
          <>
            {/* 1. CHEF'S CURATED FEATURED */}
            {featuredItems.length > 0 && (
              <section>
                <div className="text-center mb-4">
                  <span className="text-[0.55rem] font-sans font-bold tracking-[0.25em] text-[#9A8760] uppercase block mb-0.5">
                    Signature Creations
                  </span>
                  <h2 className="text-xl sm:text-2xl font-normal text-[#1A1A1A] tracking-tight">
                    ✦ Chef&apos;s Featured Repertoire ✦
                  </h2>
                  <div className="w-20 h-px bg-[#B8A47A] mx-auto mt-2 opacity-60" />
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-3.5">
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
                                 onViewAr={onViewAr}
                      isHero
                    />
                  ))}
                </div>
              </section>
            )}

            {/* 2. POPULAR SELECTIONS */}
            {popularItems.length > 0 && (
              <section>
                <div className="text-center mb-4">
                  <span className="text-[0.55rem] font-sans font-bold tracking-[0.25em] text-[#9A8760] uppercase block mb-0.5">
                    Patron Favorites
                  </span>
                  <h2 className="text-xl sm:text-2xl font-normal text-[#1A1A1A] tracking-tight">
                    Grand Reserve & Popular Courses
                  </h2>
                  <div className="w-20 h-px bg-[#B8A47A] mx-auto mt-2 opacity-60" />
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-3.5">
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
                                 onViewAr={onViewAr}
                    />
                  ))}
                </div>
              </section>
            )}

            {/* 3. ALL REGULAR DISHES */}
            {regularItems.length > 0 && (
              <section>
                {(featuredItems.length > 0 || popularItems.length > 0) && (
                  <div className="text-center mb-4">
                    <span className="text-[0.55rem] font-sans font-bold tracking-[0.25em] text-[#9A8760] uppercase block mb-0.5">
                      Full Service
                    </span>
                    <h2 className="text-xl sm:text-2xl font-normal text-[#1A1A1A] tracking-tight">
                      The Complete Degustation
                    </h2>
                    <div className="w-20 h-px bg-[#B8A47A] mx-auto mt-2 opacity-60" />
                  </div>
                )}

                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-3.5">
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
                                 onViewAr={onViewAr}
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
  onViewAr,
  isHero = false,
}: {
  item: PublicMenuItem;
  currency: string | null;
  cart: CartItem[];
  onAdd: (item: PublicMenuItem, qty?: number, notes?: string, size?: PublicMenuItemSize | null, sizePrice?: number) => void;
  onRemove: (itemId: string, sizeId: string | null) => void;
  onItemClick: (item: PublicMenuItem) => void;
  onView3D: (item: PublicMenuItem) => void;
  onViewAr?: (item: PublicMenuItem) => void;
  isHero?: boolean;
}) {
  const inCartItems = cart.filter((c) => c.menuItem.id === item.id);
  const inCartQty = inCartItems.reduce((sum, c) => sum + c.quantity, 0);
  const inCart = inCartItems.length > 0 ? inCartItems[0] : undefined;
  const inCartSize = inCart?.size?.id || null;
  const hasGlb = Boolean(item.model_url_glb?.trim());
  const hasUsdz = Boolean(item.model_url_usdz?.trim());
  const has3D = hasGlb || hasUsdz;
  const image = item.image_url?.trim() || '';

  return (
    <article
      onClick={() => onItemClick(item)}
      className="group bg-[#FFFFFF] border border-[#B8A47A]/30 rounded-xl overflow-hidden shadow-[0_4px_20px_rgba(0,0,0,0.03)] hover:shadow-[0_8px_30px_rgba(184,164,122,0.18)] hover:border-[#B8A47A] transition-all duration-300 flex flex-col cursor-pointer"
    >
      {/* Large Food Photography with Inset Gold Matting */}
      <div className="relative overflow-hidden bg-[#EAE7E1] p-2 pb-0">
        <div className={`relative w-full ${isHero ? 'h-52 sm:h-60' : 'h-40'} rounded-lg overflow-hidden border border-[#B8A47A]/20`}>
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
          <div className="absolute top-2.5 left-2.5 flex items-center gap-1">
            <span
              className={`px-1.5 py-0.4 rounded text-[0.55rem] font-sans font-semibold tracking-wider uppercase border shadow-sm ${
                item.is_veg
                  ? 'bg-emerald-950/80 text-emerald-200 border-emerald-500/30'
                  : 'bg-rose-950/80 text-rose-200 border-rose-500/30'
              }`}
            >
              {item.is_veg ? 'Veg' : 'Non-Veg'}
            </span>
            {item.is_featured && (
              <span className="px-1.5 py-0.4 rounded text-[0.55rem] font-sans font-semibold tracking-wider uppercase bg-[#1A1A1A]/85 text-[#CDB98F] border border-[#B8A47A]/40 shadow-sm">
                ✦ Chef&apos;s Signature
              </span>
            )}
          </div>

          <div className="absolute top-2.5 right-2.5 flex flex-col gap-1.5 items-end">
            {hasGlb ? (
              <button
                onClick={(e) => {
                  e.stopPropagation();
                  onView3D(item);
                }}
                className="flex items-center gap-1 px-2 py-0.75 rounded bg-[#1A1A1A]/90 hover:bg-[#1A1A1A] border border-[#B8A47A] text-[#CDB98F] text-[0.55rem] font-sans font-bold tracking-wider uppercase shadow-md transition-all hover:scale-105"
              >
                <span>View in 3D</span>
              </button>
            ) : null}
            {has3D ? (
              <button
                onClick={(e) => {
                  e.stopPropagation();
                  (onViewAr || onView3D)(item);
                }}
                className="flex items-center gap-1 px-2 py-0.75 rounded bg-[#1A1A1A]/90 hover:bg-[#1A1A1A] border border-[#B8A47A] text-[#CDB98F] text-[0.55rem] font-sans font-bold tracking-wider uppercase shadow-md transition-all hover:scale-105"
                title="View in AR on compatible devices (Android uses GLB, Apple uses USDZ)"
              >
                <span>View in AR</span>
              </button>
            ) : null}
          </div>
        </div>
      </div>

      {/* Editorial Content Presentation */}
      <div className="p-3 flex-1 flex flex-col justify-between">
        <div>
          <div className="flex items-baseline justify-between gap-3 mb-1.5">
            <h3 className="text-lg sm:text-xl font-normal text-[#1A1A1A] leading-snug group-hover:text-[#9A8760] transition-colors">
              {item.name}
            </h3>
            <span className="text-base sm:text-lg font-normal text-[#9A8760] whitespace-nowrap tracking-tight">
              {formatPrice(Number(item.price) || 0, currency)}
            </span>
          </div>

          {item.description && (
            <p className="text-[0.8rem] italic text-[#55554D] leading-relaxed mb-3 line-clamp-2">
              {item.description}
            </p>
          )}

          {/* Tasting notes / dietary details */}
          <div className="flex items-center gap-2.5 text-[0.7rem] font-sans text-[#7B776E] mb-3">
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
        <div className="pt-2 border-t border-[#B8A47A]/20 flex items-center justify-between gap-2">
          {inCartQty > 0 ? (
            <div
              onClick={(e) => e.stopPropagation()}
              className="flex items-center justify-between w-full bg-[#FAF8F5] border border-[#B8A47A] rounded-lg px-2 py-1"
            >
              <button
                onClick={() => onRemove(item.id, inCartSize)}
                className="w-4.5 h-4.5 rounded-full bg-white border border-[#B8A47A]/50 text-[#1A1A1A] font-sans font-semibold text-[0.7rem] hover:bg-[#F4F1EA] transition-colors"
              >
                −
              </button>
              <span className="text-[0.75rem] font-sans font-medium text-[#1A1A1A]">
                {inCartQty} in Degustation
              </span>
              <button
                onClick={() => onAdd(item)}
                className="w-4.5 h-4.5 rounded-full bg-[#9A8760] text-white font-sans font-semibold text-[0.7rem] hover:bg-[#7E6E4C] transition-colors shadow-sm"
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
              className="w-full py-1.5 px-3 rounded-lg bg-[#FAF8F5] hover:bg-[#9A8760] text-[#9A8760] hover:text-white border border-[#B8A47A] font-sans text-[0.65rem] font-semibold tracking-wider uppercase transition-all duration-300 shadow-sm"
            >
              Add to Course
            </button>
          )}
        </div>
      </div>
    </article>
  );
}
