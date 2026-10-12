'use client';

import React from 'react';
import { formatPrice } from '@/lib/menu';
import Dine3DLogo from '@/components/Dine3DLogo';
import type { MenuTemplateProps } from './types';
import type { PublicMenuItem } from '@/app/menu/[slug]/MenuContent';

export default function ContemporaryPremiumTemplate({
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
      className="min-h-screen text-[#1A1A1A] bg-[#F5F3EF]"
      style={{ fontFamily: "'Manrope', 'Inter', system-ui, sans-serif" }}
    >
      {/* ================= ASYMMETRIC EDITORIAL MASTHEAD ================= */}
      <header className="sticky top-0 z-30 bg-[#F5F3EF]/95 backdrop-blur-md border-b border-[#1A1A1A]/10">
        <div className="max-w-6xl mx-auto px-4 sm:px-8 py-4 flex items-baseline justify-between">
          <div className="flex items-center gap-4">
            {hotel.logo_url?.trim() ? (
              <img
                src={hotel.logo_url}
                alt={hotel.name}
                className="w-10 h-10 object-cover rounded-none border border-[#1A1A1A]"
              />
            ) : (
              <div className="w-10 h-10 rounded-none border border-[#1A1A1A] flex items-center justify-center bg-white">
                <Dine3DLogo size="xs" href={null} />
              </div>
            )}
            <div>
              <span className="block text-[0.625rem] font-mono tracking-widest text-[#A67C52] uppercase">
                {tableNumber ? `SEAT // TABLE ${tableNumber}` : 'CONTEMPORARY ATELIER'}
              </span>
              <h1 className="text-xl sm:text-2xl font-light tracking-tight text-[#1A1A1A] uppercase">
                {hotel.name}
              </h1>
            </div>
          </div>

          <div className="flex items-center gap-4">
            <button
              onClick={onOpenCart}
              className="flex items-center gap-3 px-5 py-2 rounded-none border border-[#1A1A1A] bg-[#1A1A1A] text-white hover:bg-transparent hover:text-[#1A1A1A] text-xs font-mono tracking-widest uppercase transition-all duration-300"
            >
              <span>BAG [{totalCount}]</span>
              <span className="text-[#A67C52] font-semibold">{formatPrice(totalPrice, currency)}</span>
            </button>
          </div>
        </div>

        {/* Numbered Editorial Category Navigation */}
        <div className="max-w-6xl mx-auto px-4 sm:px-8 pb-3">
          <div className="relative mb-3">
            <input
              type="text"
              value={search}
              onChange={(e) => onSearchChange(e.target.value)}
              placeholder="SEARCH CATALOG // BY DISH, INGREDIENT, VINTAGE..."
              className="w-full pl-9 pr-4 py-2 bg-white border border-[#1A1A1A]/15 rounded-none text-xs font-mono text-[#1A1A1A] placeholder-[#8C8C7E] focus:outline-none focus:border-[#1A1A1A] transition-colors"
            />
            <svg
              className="absolute left-3 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-[#1A1A1A]"
              viewBox="0 0 14 14"
              fill="none"
              stroke="currentColor"
              strokeWidth="1.5"
            >
              <circle cx="6" cy="6" r="4.5" />
              <path d="M9.5 9.5L12.5 12.5" strokeLinecap="round" />
            </svg>
          </div>

          {pills.length > 1 && (
            <div className="flex items-center gap-4 sm:gap-6 overflow-x-auto no-scrollbar py-1">
              {pills.map((cat, idx) => {
                const isActive = selectedCategory === cat;
                const formattedNum = String(idx).padStart(2, '0');
                return (
                  <button
                    key={cat}
                    onClick={() => onSelectCategory(cat)}
                    className={`whitespace-nowrap pb-1.5 text-xs font-mono tracking-widest uppercase transition-all border-b-2 ${
                      isActive
                        ? 'border-[#1A1A1A] text-[#1A1A1A] font-bold'
                        : 'border-transparent text-[#8C8C7E] hover:text-[#1A1A1A]'
                    }`}
                  >
                    <span className="text-[#A67C52] mr-1.5">{formattedNum} /</span>
                    <span>{cat}</span>
                  </button>
                );
              })}
            </div>
          )}
        </div>
      </header>

      {/* ================= ASYMMETRIC EDITORIAL BODY ================= */}
      <main className="max-w-6xl mx-auto px-4 sm:px-8 py-10 space-y-16">
        {hotel.welcome_text && (
          <div className="border-l-2 border-[#A67C52] pl-6 py-2 max-w-2xl">
            <p className="text-xs sm:text-sm font-light text-[#5A5A50] leading-relaxed">
              {hotel.welcome_text}
            </p>
          </div>
        )}

        {filteredItems.length === 0 ? (
          <div className="py-24 text-center">
            <p className="text-sm font-mono text-[#8C8C7E] uppercase tracking-widest">
              [ 00 ] — NO CATALOG ITEMS FOUND
            </p>
          </div>
        ) : (
          <>
            {/* 1. LARGE HERO SHOWCASE FOR FEATURED DISHES */}
            {featuredItems.length > 0 && (
              <section>
                <div className="flex items-baseline justify-between border-b border-[#1A1A1A] pb-2 mb-8">
                  <h2 className="text-lg sm:text-xl font-light tracking-tight uppercase">
                    [ 01 ] HERO SELECTIONS
                  </h2>
                  <span className="text-xs font-mono text-[#A67C52] uppercase tracking-widest">
                    ATELIER HIGHLIGHTS
                  </span>
                </div>

                <div className="space-y-8">
                  {featuredItems.map((item) => (
                    <ContemporaryHeroCard
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

            {/* 2. ASYMMETRIC GRID FOR POPULAR DISHES */}
            {popularItems.length > 0 && (
              <section>
                <div className="flex items-baseline justify-between border-b border-[#1A1A1A] pb-2 mb-8">
                  <h2 className="text-lg sm:text-xl font-light tracking-tight uppercase">
                    [ 02 ] SIGNATURE REPERTOIRE
                  </h2>
                  <span className="text-xs font-mono text-[#A67C52] uppercase tracking-widest">
                    POPULAR COURSES
                  </span>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                  {popularItems.map((item) => (
                    <ContemporaryEditorialCard
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

            {/* 3. COMPLETE ATELIER CATALOG */}
            {regularItems.length > 0 && (
              <section>
                {(featuredItems.length > 0 || popularItems.length > 0) && (
                  <div className="flex items-baseline justify-between border-b border-[#1A1A1A] pb-2 mb-8">
                    <h2 className="text-lg sm:text-xl font-light tracking-tight uppercase">
                      [ 03 ] DEGUSTATION INDEX
                    </h2>
                    <span className="text-xs font-mono text-[#A67C52] uppercase tracking-widest">
                      ALL PLATES
                    </span>
                  </div>
                )}

                <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                  {regularItems.map((item) => (
                    <ContemporaryEditorialCard
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

// FULL-WIDTH CINEMATIC HERO CARD FOR FEATURED ITEMS
function ContemporaryHeroCard({
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
    <article
      onClick={() => onItemClick(item)}
      className="group bg-white border border-[#1A1A1A] rounded-none p-5 sm:p-7 grid grid-cols-1 lg:grid-cols-12 gap-6 items-center shadow-sm hover:shadow-md transition-shadow cursor-pointer"
    >
      {/* Cinematic 16:9 Photographic Frame */}
      <div className="lg:col-span-7 relative h-64 sm:h-80 overflow-hidden bg-[#EDEAE3] border border-[#1A1A1A]/20">
        {image ? (
          <img
            src={image}
            alt={item.name}
            loading="lazy"
            className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-700"
          />
        ) : (
          <div className="w-full h-full flex items-center justify-center text-xs font-mono text-[#8C8C7E]">
            [ VISUAL ASSET RESERVED ]
          </div>
        )}

        <div className="absolute top-3 left-3 flex gap-2">
          <span
            className={`px-2.5 py-0.5 text-[0.625rem] font-mono uppercase tracking-wider ${
              item.is_veg ? 'bg-emerald-950 text-emerald-300' : 'bg-neutral-900 text-neutral-300'
            }`}
          >
            {item.is_veg ? 'VEGETARIAN' : 'ANIMAL PROTEIN'}
          </span>
          <span className="px-2.5 py-0.5 text-[0.625rem] font-mono uppercase tracking-wider bg-[#A67C52] text-white">
            CHEF&apos;S HERO
          </span>
        </div>

        {has3D && (
          <button
            onClick={(e) => {
              e.stopPropagation();
              onView3D(item);
            }}
            className="absolute top-3 right-3 px-3 py-1 bg-white/95 text-black border border-black text-[0.625rem] font-mono tracking-widest uppercase hover:bg-black hover:text-white transition-colors"
          >
            3D SPATIAL // VIEW
          </button>
        )}
      </div>

      {/* Editorial Text Block */}
      <div className="lg:col-span-5 flex flex-col justify-between h-full space-y-6">
        <div>
          <span className="text-[0.625rem] font-mono text-[#A67C52] tracking-widest uppercase block mb-1">
            EXHIBITION PLATE
          </span>
          <h3 className="text-2xl sm:text-3xl font-light text-[#1A1A1A] uppercase tracking-tight leading-none mb-3">
            {item.name}
          </h3>

          <div className="text-xl sm:text-2xl font-light text-[#A67C52] mb-4">
            {formatPrice(Number(item.price) || 0, currency)}
          </div>

          {item.description && (
            <p className="text-xs sm:text-sm text-[#5A5A50] leading-relaxed font-light mb-4">
              {item.description}
            </p>
          )}

          <div className="flex items-center gap-4 text-xs font-mono text-[#8C8C7E]">
            {item.calories && <span>{item.calories} KCAL</span>}
            {item.preparation_time_mins && <span>PREP {item.preparation_time_mins}M</span>}
          </div>
        </div>

        {/* Action Row */}
        <div className="pt-4 border-t border-[#1A1A1A]/10">
          {inCart ? (
            <div
              onClick={(e) => e.stopPropagation()}
              className="flex items-center justify-between w-full border border-[#1A1A1A] p-2"
            >
              <button
                onClick={() => onRemove(item.id)}
                className="w-8 h-8 border border-[#1A1A1A] bg-white font-mono text-xs hover:bg-[#1A1A1A] hover:text-white"
              >
                −
              </button>
              <span className="font-mono text-xs uppercase">
                {inCart.quantity} SELECTED
              </span>
              <button
                onClick={() => onAdd(item)}
                className="w-8 h-8 border border-[#1A1A1A] bg-[#1A1A1A] text-white font-mono text-xs"
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
              className="w-full py-3 rounded-none bg-[#1A1A1A] hover:bg-transparent text-white hover:text-[#1A1A1A] border border-[#1A1A1A] font-mono text-xs uppercase tracking-widest transition-all duration-200"
            >
              SELECT FOR DEGUSTATION +
            </button>
          )}
        </div>
      </div>
    </article>
  );
}

// ASYMMETRIC 2-COLUMN EDITORIAL CARD
function ContemporaryEditorialCard({
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
    <article
      onClick={() => onItemClick(item)}
      className="group bg-white border border-[#1A1A1A] rounded-none p-5 flex flex-col justify-between shadow-sm hover:shadow-md transition-shadow cursor-pointer"
    >
      <div>
        <div className="relative h-52 overflow-hidden bg-[#EDEAE3] border border-[#1A1A1A]/15 mb-4">
          {image ? (
            <img
              src={image}
              alt={item.name}
              loading="lazy"
              className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-700"
            />
          ) : (
            <div className="w-full h-full flex items-center justify-center text-xs font-mono text-[#8C8C7E]">
              [ PLATE ]
            </div>
          )}

          <div className="absolute top-2.5 left-2.5 flex gap-1.5">
            <span
              className={`px-2 py-0.5 text-[0.55rem] font-mono uppercase tracking-wider ${
                item.is_veg ? 'bg-emerald-950 text-emerald-300' : 'bg-neutral-900 text-neutral-300'
              }`}
            >
              {item.is_veg ? 'VEG' : 'NON-VEG'}
            </span>
          </div>

          {has3D && (
            <button
              onClick={(e) => {
                e.stopPropagation();
                onView3D(item);
              }}
              className="absolute top-2.5 right-2.5 px-2.5 py-0.5 bg-white/95 text-black border border-black text-[0.55rem] font-mono tracking-widest uppercase hover:bg-black hover:text-white transition-colors"
            >
              3D // VIEW
            </button>
          )}
        </div>

        <div className="flex items-baseline justify-between gap-3 mb-1.5">
          <h3 className="text-lg font-light text-[#1A1A1A] uppercase tracking-tight line-clamp-1">
            {item.name}
          </h3>
          <span className="text-base font-light text-[#A67C52] whitespace-nowrap">
            {formatPrice(Number(item.price) || 0, currency)}
          </span>
        </div>

        {item.description && (
          <p className="text-xs text-[#5A5A50] font-light line-clamp-2 leading-relaxed mb-3">
            {item.description}
          </p>
        )}
      </div>

      <div className="pt-3 border-t border-[#1A1A1A]/10 flex items-center justify-between gap-2">
        {inCart ? (
          <div
            onClick={(e) => e.stopPropagation()}
            className="flex items-center justify-between w-full border border-[#1A1A1A] p-1.5"
          >
            <button
              onClick={() => onRemove(item.id)}
              className="w-6 h-6 border border-[#1A1A1A] bg-white font-mono text-xs hover:bg-[#1A1A1A] hover:text-white"
            >
              −
            </button>
            <span className="font-mono text-xs uppercase">
              {inCart.quantity} SELECTED
            </span>
            <button
              onClick={() => onAdd(item)}
              className="w-6 h-6 border border-[#1A1A1A] bg-[#1A1A1A] text-white font-mono text-xs"
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
            className="w-full py-2 rounded-none bg-white hover:bg-[#1A1A1A] text-[#1A1A1A] hover:text-white border border-[#1A1A1A] font-mono text-xs uppercase tracking-widest transition-all duration-200"
          >
            SELECT +
          </button>
        )}
      </div>
    </article>
  );
}
