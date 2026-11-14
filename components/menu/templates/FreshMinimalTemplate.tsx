'use client';

import React from 'react';
import { formatPrice } from '@/lib/menu';
import DinePixelLogo from '@/components/DinePixelLogo';
import type { MenuTemplateProps, CartItem, PublicMenuItemSize } from './types';
import type { PublicMenuItem } from '@/app/menu/[slug]/MenuContent';

export default function FreshMinimalTemplate({
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
      className="min-h-screen bg-[#F9FAF8] text-[#1E231F]"
      style={{ fontFamily: "'Inter', system-ui, sans-serif" }}
    >
      {/* ================= CRISP AIRY CAFÉ HEADER ================= */}
      <header className="sticky top-0 z-30 bg-white/90 backdrop-blur-md border-b border-[#E3E8E3]">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 py-3.5 flex items-center justify-between">
          <div className="flex items-center gap-3">
            {hotel.logo_url?.trim() ? (
              <img
                src={hotel.logo_url}
                alt={hotel.name}
                className="w-10 h-10 rounded-full object-cover border-2 border-[#2E7D32]/20 shadow-sm"
              />
            ) : (
              <div className="w-10 h-10 rounded-full bg-[#E8F5E9] border border-[#2E7D32]/20 flex items-center justify-center text-[#2E7D32]">
                <DinePixelLogo size="xs" href={null} />
              </div>
            )}
            <div>
              <div className="flex items-center gap-1.5 text-[0.65rem] font-bold text-[#2E7D32] uppercase tracking-wider">
                <span>🌱 Farm-Fresh</span>
                {tableNumber && <span>• Table {tableNumber}</span>}
              </div>
              <h1 className="text-lg sm:text-xl font-bold tracking-tight text-[#1E231F] leading-tight">
                {hotel.name}
              </h1>
          </div>
        </div>
      </div>

        {/* Lightweight Search & Pill Track */}
        <div className="max-w-4xl mx-auto px-4 pb-2.5">
          <div className="relative mb-2.5">
            <input
              type="text"
              value={search}
              onChange={(e) => onSearchChange(e.target.value)}
              placeholder="Search smoothies, organic bowls, artisan plates..."
              className="w-full pl-9 pr-4 py-2 bg-white border border-[#DDE3DD] rounded-full text-xs text-[#1E231F] placeholder-[#8A958A] focus:outline-none focus:border-[#2E7D32] shadow-sm transition-all"
            />
            <svg
              className="absolute left-3 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-[#2E7D32]"
              viewBox="0 0 14 14"
              fill="none"
              stroke="currentColor"
              strokeWidth="2"
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
                border: '1px solid rgba(46,125,50,0.3)',
                background: 'rgba(46,125,50,0.1)',
                color: '#2E7D32',
                fontSize: '13px',
                fontWeight: 500,
                lineHeight: 1,
                cursor: 'pointer',
                transition: 'background 0.2s',
                boxSizing: 'border-box',
                WebkitAppearance: 'none',
                appearance: 'none',
              }}
              onMouseEnter={(e) => { e.currentTarget.style.background = 'rgba(46,125,50,0.2)'; }}
              onMouseLeave={(e) => { e.currentTarget.style.background = 'rgba(46,125,50,0.1)'; }}
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
                border: '1px solid #2E7D32',
                background: '#2E7D32',
                color: '#fff',
                fontSize: '13px',
                fontWeight: 500,
                lineHeight: 1,
                cursor: 'pointer',
                transition: 'background 0.2s',
                boxSizing: 'border-box',
                WebkitAppearance: 'none',
                appearance: 'none',
              }}
              onMouseEnter={(e) => { e.currentTarget.style.background = '#1B5E20'; }}
              onMouseLeave={(e) => { e.currentTarget.style.background = '#2E7D32'; }}
            >
              <span style={{fontSize: '15px', lineHeight: 1}}>🔔</span>
              <span>Call Waiter</span>
            </button>
          </div>

          {pills.length > 1 && (
            <div className="flex items-center gap-[7px] overflow-x-auto no-scrollbar py-[2px]">
              {pills.map((cat) => {
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
                      fontWeight: 600,
                      lineHeight: 1,
                      whiteSpace: 'nowrap',
                      cursor: 'pointer',
                      transition: 'all 0.2s',
                      background: isActive ? '#2E7D32' : '#fff',
                      color: isActive ? '#fff' : '#4A554A',
                      border: isActive ? 'none' : '1px solid #DDE3DD',
                      boxShadow: isActive ? '0 2px 4px rgba(46,125,50,0.2)' : 'none',
                      boxSizing: 'border-box',
                      WebkitAppearance: 'none',
                      appearance: 'none',
                    }}
                  >
                    {cat}
                  </button>
                );
              })}
            </div>
          )}
        </div>
      </header>

      {/* ================= MAIN CAFÉ CONTENT ================= */}
      <main className="max-w-4xl mx-auto px-4 sm:px-6 py-5 space-y-6">
{hotel.welcome_text && (
            <div className="bg-[#E8F5E9]/60 border border-[#C8E6C9] rounded-2xl p-2.5 text-center">
            <p className="text-xs sm:text-sm text-[#2E7D32] font-medium leading-relaxed">
              ✨ {hotel.welcome_text}
            </p>
          </div>
        )}

{filteredItems.length === 0 ? (
            <div className="py-16 text-center">
            <p className="text-sm text-[#6A786A]">No café items match your search.</p>
          </div>
        ) : (
          <>
            {/* FEATURED SPECIALS */}
            {featuredItems.length > 0 && (
              <section>
                <div className="flex items-center gap-2 mb-2">
                  <span className="text-lg">🌿</span>
                  <h2 className="text-base sm:text-lg font-bold text-[#1E231F] tracking-tight">
                    Seasonal Specials
                  </h2>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-2.5">
                  {featuredItems.map((item) => (
                    <FreshMinimalCard
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
                <div className="flex items-center gap-2 mb-2">
                  <span className="text-lg">⭐</span>
                  <h2 className="text-base sm:text-lg font-bold text-[#1E231F] tracking-tight">
                    Café Favorites
                  </h2>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-2.5">
                  {popularItems.map((item) => (
                    <FreshMinimalCard
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
                  <div className="flex items-center gap-2 mb-2">
                    <span className="text-lg">🍃</span>
                    <h2 className="text-base sm:text-lg font-bold text-[#1E231F] tracking-tight">
                      All Items
                    </h2>
                  </div>
                )}

                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-2.5">
                  {regularItems.map((item) => (
                    <FreshMinimalCard
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

function FreshMinimalCard({
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
  cart: CartItem[];
  onAdd: (item: PublicMenuItem, qty?: number, notes?: string, size?: PublicMenuItemSize | null, sizePrice?: number) => void;
  onRemove: (itemId: string, sizeId: string | null) => void;
  onItemClick: (item: PublicMenuItem) => void;
  onView3D: (item: PublicMenuItem) => void;
}) {
  const inCartItems = cart.filter((c) => c.menuItem.id === item.id);
  const inCartQty = inCartItems.reduce((sum, c) => sum + c.quantity, 0);
  const inCart = inCartItems.length > 0 ? inCartItems[0] : undefined;
  const inCartSize = inCart?.size?.id || null;
  const has3D = Boolean(item.model_url_glb?.trim());
  const image = item.image_url?.trim() || '';

  return (
    <div
      onClick={() => onItemClick(item)}
      className="group bg-white border border-[#E3E8E3] hover:border-[#2E7D32]/50 rounded-2xl p-3 shadow-[0_2px_12px_rgba(0,0,0,0.03)] hover:shadow-[0_6px_24px_rgba(46,125,50,0.12)] transition-all duration-300 flex flex-col justify-between cursor-pointer"
    >
      <div className="flex gap-3">
        {/* ROUNDED SQUIRCLE IMAGE PRESENTATION */}
        <div className="relative w-20 h-20 sm:w-24 sm:h-24 flex-shrink-0 rounded-xl overflow-hidden bg-[#F1F4F1] border border-[#E3E8E3]">
          {image ? (
            <img
              src={image}
              alt={item.name}
              loading="lazy"
              className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
            />
          ) : (
            <div className="w-full h-full flex flex-col items-center justify-center text-[#8A958A] bg-[#F1F4F1]">
              <span className="text-[0.6rem] font-bold">Café Item</span>
            </div>
          )}

          {has3D && (
            <button
              onClick={(e) => {
                e.stopPropagation();
                onView3D(item);
              }}
              className="absolute bottom-1.5 right-1.5 px-2 py-0.5 rounded-full bg-white/95 text-[#2E7D32] border border-[#2E7D32]/30 text-[0.6rem] font-extrabold uppercase shadow-sm"
            >
              3D
            </button>
          )}
        </div>

        {/* DETAILS */}
        <div className="flex-1 min-w-0 flex flex-col justify-between">
          <div>
            <div className="flex items-center gap-1.5 mb-1">
              <span
                className={`w-2 h-2 rounded-full ${
                  item.is_veg ? 'bg-[#2E7D32]' : 'bg-[#D32F2F]'
                }`}
              />
              <span className="text-[0.625rem] font-bold text-[#6A786A] uppercase tracking-wider">
                {item.is_veg ? 'Pure Veg' : 'Non-Veg'}
              </span>
            </div>

            <h3 className="text-sm sm:text-base font-bold text-[#1E231F] group-hover:text-[#2E7D32] transition-colors leading-snug line-clamp-2">
              {item.name}
            </h3>

            {item.description && (
              <p className="text-xs text-[#6A786A] line-clamp-2 leading-relaxed mt-1">
                {item.description}
              </p>
            )}
          </div>

          <div className="flex items-center gap-2 mt-2 text-[0.65rem] text-[#8A958A] font-medium">
            {item.calories && <span className="bg-[#F1F4F1] px-2 py-0.5 rounded-full">{item.calories} kcal</span>}
            {item.preparation_time_mins && (
              <span className="bg-[#F1F4F1] px-2 py-0.5 rounded-full">{item.preparation_time_mins} min</span>
            )}
          </div>
        </div>
      </div>

      {/* FOOTER ROW */}
      <div className="mt-2.5 pt-2.5 border-t border-[#F1F4F1] flex items-center justify-between gap-2">
        <span className="text-sm font-extrabold text-[#2E7D32]">
          {formatPrice(Number(item.price) || 0, currency)}
        </span>

        {inCartQty > 0 ? (
          <div
            onClick={(e) => e.stopPropagation()}
            className="flex items-center gap-1.5 bg-[#E8F5E9] border border-[#C8E6C9] rounded-full px-1.5 py-0.4"
          >
            <button
              onClick={() => onRemove(item.id, inCartSize)}
              className="w-4.5 h-4.5 rounded-full bg-white text-[#2E7D32] font-bold flex items-center justify-center hover:bg-[#C8E6C9] transition-colors shadow-xs"
            >
              −
            </button>
            <span className="text-xs font-bold text-[#2E7D32]">
              {inCartQty}
            </span>
            <button
              onClick={() => onAdd(item)}
              className="w-4.5 h-4.5 rounded-full bg-[#2E7D32] text-white font-bold flex items-center justify-center hover:bg-[#1B5E20] transition-colors shadow-xs"
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
            className="px-3 py-1 rounded-full bg-[#E8F5E9] hover:bg-[#2E7D32] text-[#2E7D32] hover:text-white font-bold text-xs transition-all duration-200"
          >
            + Add
          </button>
        )}
      </div>
    </div>
  );
}
