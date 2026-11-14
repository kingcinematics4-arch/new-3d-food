'use client';

import React, { useState, useEffect, useCallback, useMemo } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import dynamic from 'next/dynamic';
import { formatPrice } from '@/lib/menu';
import { menuThemeClass } from '@/lib/menuThemes';
import { MenuThemeProviderContext } from '@/components/menu/MenuThemeProvider';
import DinePixelLogo from '@/components/DinePixelLogo';
import {
  ClassicLuxuryTemplate,
  ModernDarkTemplate,
  FreshMinimalTemplate,
  IndianHeritageTemplate,
  ContemporaryPremiumTemplate,
  CustomTemplate,
} from '@/components/menu/templates';
import { cloneCustomThemeConfig, type CustomThemeConfig } from '@/lib/customTheme';
import { customThemeToCssVars } from '@/components/menu/MenuThemeProvider';
import ServiceRequestModal from '@/components/menu/ServiceRequestModal';
import WaterCategoryModal from '@/components/menu/WaterCategoryModal';
import OrderSlideToConfirm from '@/components/menu/OrderSlideToConfirm';
import BottomNav from '@/components/nav/BottomNav';
import { HotelWaterSettings } from '@/lib/waterSettings';

const FoodModelViewer = dynamic(() => import('@/components/3d/FoodModelViewer'), { ssr: false });
const Dish3DModal = dynamic(() => import('@/components/menu/Dish3DModal'), { ssr: false });

export interface PublicMenuItemSize {
  id: string;
  name: string;
  price: number;
  position: number;
  is_available: boolean;
}

export interface PublicMenuItem {
  id: string;
  category_id: string | null;
  name: string;
  description: string | null;
  price: number;
  image_url: string | null;
  model_url_glb: string | null;
  model_url_usdz: string | null;
  is_veg: boolean;
  calories: number | null;
  preparation_time_mins: number | null;
  ingredients: string[] | null;
  allergens: string[] | null;
  dietary_tags: string[] | null;
  rating: number | null;
  order_count: number | null;
  is_featured: boolean;
  is_popular: boolean;
  has_sizes: boolean;
  size_selection_required: boolean;
  sizes?: PublicMenuItemSize[];
}

export interface PublicCategory {
  id: string;
  name: string;
  position: number | null;
}

export interface PublicHotel {
  id: string;
  name: string;
  slug: string;
  logo_url: string | null;
  currency: string | null;
  welcome_text: string | null;
  primary_color: string | null;
  secondary_color: string | null;
  menu_style: string | null;
  card_style: string | null;
  dark_mode: boolean | null;
  typography: string | null;
  menu_theme: string | null;
  custom_theme_config?: CustomThemeConfig | null;
  tax_rate: number | null;
  service_charge: number | null;
  city: string | null;
  water_settings?: HotelWaterSettings | null;
}

interface CartItem {
  menuItem: PublicMenuItem;
  quantity: number;
  notes?: string;
  size?: PublicMenuItemSize | null;
  sizePrice?: number;
}

function selectableSizes(item: PublicMenuItem): PublicMenuItemSize[] {
  return (item.sizes || []).filter((s) => s.is_available !== false);
}

function hasSelectableSizes(item: PublicMenuItem): boolean {
  return Boolean(item.has_sizes && selectableSizes(item).length > 0);
}

function FoodDetailModal({
  item,
  currency,
  onClose,
  onAddToCart,
  cartQty,
  onView3D,
}: {
  item: PublicMenuItem;
  currency: string | null;
  onClose: () => void;
  onAddToCart: (item: PublicMenuItem, qty: number, notes: string, size?: PublicMenuItemSize | null, sizePrice?: number) => void;
  cartQty: number;
  onView3D: (item: PublicMenuItem) => void;
}) {
  const [qty, setQty] = useState(Math.max(1, cartQty));
  const [notes, setNotes] = useState('');
  const [selectedSize, setSelectedSize] = useState<PublicMenuItemSize | null>(null);
  const hasGlb = Boolean(item.model_url_glb?.trim());
  const hasUsdz = Boolean(item.model_url_usdz?.trim());
  const has3D = hasGlb || hasUsdz;
  const image = item.image_url?.trim() || '';
  const ingredients = Array.isArray(item.ingredients) ? item.ingredients : [];
  const rating = Number(item.rating) || 0;
  const orderCount = Number(item.order_count) || 0;
  const availableSizes = (item.sizes || []).filter(s => s.is_available);

  const effectivePrice = selectedSize ? selectedSize.price : Number(item.price) || 0;
  // Any dish that actually has selectable sizes requires one. The hotel-level
  // size_selection_required flag is treated as a default; it must never allow
  // an un-sized item into the cart once size options exist.
  const requiresSize = availableSizes.length > 0;
  const canAddToCart = !requiresSize || selectedSize !== null;

  return (
    <div
      className="fixed inset-0 z-50 flex items-end sm:items-center justify-center"
      style={{ background: 'rgba(0,0,0,0.8)', backdropFilter: 'blur(8px)' }}
      onClick={(e) => e.target === e.currentTarget && onClose()}
    >
         <div
          className="w-full sm:max-w-xl max-h-[90vh] overflow-y-auto"
          style={{
            background: 'var(--bg-surface)',
            borderTop: '1px solid var(--border-light)',
            borderLeft: '1px solid var(--border-subtle)',
            borderRight: '1px solid var(--border-subtle)',
            borderRadius: 'var(--d3-modal-radius)',
            boxShadow: '0 -32px 80px rgba(0,0,0,0.8)',
          }}
        >
          <div
            className="d3-food-image relative"
            style={{
              height: 'calc(var(--d3-image-height) * 0.8)',
              background: 'var(--bg-secondary)',
              borderRadius: 'var(--d3-modal-image-radius)',
              overflow: 'hidden',
            }}
          >
          {image ? (
            <img
              src={image}
              alt={item.name}
              style={{ width: '100%', height: '100%', objectFit: 'cover' }}
            />
          ) : (
            <NoAssetPanel label="No photo" height="100%" />
          )}

          <button
            onClick={onClose}
            style={{
              position: 'absolute', top: 10, right: 10,
              width: 28, height: 28, borderRadius: '50%',
              background: 'rgba(0,0,0,0.7)',
              border: '1px solid var(--border-subtle)',
              color: 'var(--text-primary)',
              display: 'flex', alignItems: 'center', justifyContent: 'center',
              cursor: 'pointer',
            }}
          >
            <svg width="11" height="11" viewBox="0 0 12 12" fill="none">
              <path d="M1 1L11 11M11 1L1 11" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" />
            </svg>
          </button>

          <div style={{ position: 'absolute', top: 10, left: 10 }}>
            <span
              style={{
                display: 'inline-flex', alignItems: 'center', gap: 4,
                padding: '0.15625rem 0.4375rem',
                borderRadius: 4,
                fontSize: '0.5rem',
                fontWeight: 600,
                letterSpacing: '0.12em',
                textTransform: 'uppercase',
                background: 'rgba(11,11,10,0.75)',
                border: '1px solid var(--border-warm)',
                color: item.is_veg ? 'var(--gold)' : 'var(--text-dimmed)',
              }}
            >
              <span
                style={{
                  width: 5, height: 5, borderRadius: 1,
                  border: `1px solid ${item.is_veg ? 'var(--gold-dim)' : 'var(--text-dimmed)'}`,
                }}
              />
              {item.is_veg ? 'Veg' : 'Non-veg'}
            </span>
          </div>

          {has3D && (
            <button
              onClick={() => onView3D(item)}
              style={{
                position: 'absolute', bottom: 8, left: '50%', transform: 'translateX(-50%)',
                display: 'inline-flex', alignItems: 'center', gap: 4,
                padding: '0.375rem 0.75rem',
                borderRadius: 100,
                background: 'rgba(0,0,0,0.8)',
                border: '1px solid rgba(201,169,110,0.3)',
                color: 'var(--gold)',
                fontSize: '0.5625rem', fontWeight: 600,
                letterSpacing: '0.06em', textTransform: 'uppercase',
                cursor: 'pointer',
                boxShadow: '0 4px 16px rgba(0,0,0,0.4)',
              }}
            >
              <svg width="10" height="10" viewBox="0 0 12 12" fill="none">
                <path d="M6 1L6 11M1 6L11 6" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" />
                <circle cx="6" cy="6" r="4.5" stroke="currentColor" strokeWidth="1" strokeDasharray="4 2" />
              </svg>
              View in 3D
            </button>
          )}
        </div>

        <div className="p-3 flex flex-col gap-2.5">
          <div className="flex items-start justify-between gap-4">
            <div>
              <h2
                style={{
                  fontFamily: 'var(--font-display)',
                  fontSize: '1.25rem',
                  fontWeight: 500,
                  color: 'var(--text-primary)',
                  letterSpacing: '-0.015em',
                  lineHeight: 1.2,
                  marginBottom: 2,
                }}
              >
                {item.name}
              </h2>
              {item.description ? (
                <p style={{ fontSize: '0.75rem', color: 'var(--text-muted)', lineHeight: 1.5 }}>
                  {item.description}
                </p>
              ) : null}
            </div>
            <span className="d3-price"
              style={{
                fontFamily: 'var(--font-display)',
                fontSize: '1.25rem',
                fontWeight: 500,
                color: 'var(--gold)',
                letterSpacing: '-0.02em',
                flexShrink: 0,
              }}
            >
              {formatPrice(effectivePrice, currency)}
              {selectedSize && <span style={{ fontSize: '0.75rem', fontWeight: 400, color: 'var(--text-muted)', marginLeft: 8 }}>({selectedSize.name})</span>}
            </span>
          </div>

          {availableSizes.length > 0 && (
            <div style={{ display: 'flex', flexDirection: 'column', gap: '0.25rem', paddingTop: '0.25rem' }}>
              <label className="d3-label" style={{ fontSize: '0.625rem' }}>
                Select Size {requiresSize && <span style={{ color: '#FCA5A5', marginLeft: 4 }}>*</span>}
              </label>
              <div style={{ display: 'flex', flexWrap: 'wrap', gap: 5 }}>
                {availableSizes.map((size) => (
                  <button
                    key={size.id}
                    type="button"
                    onClick={() => setSelectedSize(size)}
                    style={{
                      padding: '0.375rem 0.75rem',
                      borderRadius: 'var(--d3-input-radius)',
                      border: selectedSize?.id === size.id
                        ? '2px solid var(--gold)'
                        : '1px solid var(--border-warm)',
                      background: selectedSize?.id === size.id
                        ? 'rgba(201,169,110,0.1)'
                        : 'var(--bg-surface-2)',
                      color: selectedSize?.id === size.id
                        ? 'var(--gold)'
                        : 'var(--text-primary)',
                      fontSize: '0.6875rem',
                      fontWeight: selectedSize?.id === size.id ? 600 : 500,
                      cursor: 'pointer',
                      transition: 'all 200ms',
                      display: 'flex',
                      flexDirection: 'column',
                      alignItems: 'center',
                      gap: 1,
                      minWidth: 68,
                    }}
                  >
                    <span>{size.name}</span>
                    <span style={{ fontSize: '0.5625rem', fontWeight: 500, fontFamily: 'var(--font-display)' }}>
                      {formatPrice(size.price, currency)}
                    </span>
                  </button>
                ))}
              </div>
            </div>
          )}

          <div className="flex items-center gap-2 flex-wrap" style={{ fontSize: '0.5625rem' }}>
            {item.preparation_time_mins ? (
              <span style={{ display: 'inline-flex', alignItems: 'center', gap: 5, color: 'var(--text-muted)' }}>
                <svg width="12" height="12" viewBox="0 0 12 12" fill="none"><circle cx="6" cy="6" r="4.5" stroke="currentColor" strokeWidth="1" /><path d="M6 3.5V6 L8 7.5" stroke="currentColor" strokeWidth="1" strokeLinecap="round" /></svg>
                {item.preparation_time_mins} min
              </span>
            ) : null}
            {item.calories ? (
              <span style={{ display: 'inline-flex', alignItems: 'center', gap: 5, color: 'var(--text-muted)' }}>
                <svg width="12" height="12" viewBox="0 0 12 12" fill="none"><path d="M6 2C6 2 3.5 3.5 2 6C3.5 8 6 9 6 9C6 9 8.5 8 10 6C9 3.5 6 2 6 2Z" stroke="currentColor" strokeWidth="1" strokeLinejoin="round" /></svg>
                {item.calories} kcal
              </span>
            ) : null}
            {rating > 0 ? (
              <span style={{ display: 'inline-flex', alignItems: 'center', gap: 4, color: 'var(--gold)' }}>
                ★ {rating.toFixed(1)}
                {orderCount > 0 ? ` (${orderCount} orders)` : ''}
              </span>
            ) : null}
          </div>

          {ingredients.length > 0 && (
            <div>
              <p style={{ fontSize: '0.5625rem', color: 'var(--text-dimmed)', fontWeight: 600, letterSpacing: '0.1em', textTransform: 'uppercase', marginBottom: 3 }}>
                Ingredients
              </p>
              <div className="flex flex-wrap gap-1">
                {ingredients.map((ing, i) => (
                  <span
                    key={i}
                    style={{
                      padding: '0.15625rem 0.4375rem',
                      borderRadius: 100,
                      fontSize: '0.5625rem',
                      background: 'var(--bg-surface-2)',
                      border: '1px solid var(--border-subtle)',
                      color: 'var(--text-secondary)',
                    }}
                  >
                    {ing}
                  </span>
                ))}
              </div>
            </div>
          )}

          <div className="d3-divider" />

          <div>
            <label className="d3-label" style={{ fontSize: '0.625rem' }}>Special Instructions</label>
            <textarea
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              placeholder="Any request for the kitchen"
              rows={2}
              style={{
                width: '100%', resize: 'none',
                padding: '0.5rem', borderRadius: 'var(--d3-input-radius)',
                background: 'var(--bg-surface-2)',
                border: '1px solid var(--border-warm)',
                color: 'var(--text-primary)',
                fontSize: '0.75rem',
                outline: 'none',
              }}
            />
          </div>

          <div className="flex items-center gap-2">
            <div
              className="flex items-center gap-1"
              style={{
                background: 'var(--bg-surface-2)',
                border: '1px solid var(--border-subtle)',
                borderRadius: 'var(--d3-input-radius)',
                padding: '0.25rem 0.4375rem',
              }}
            >
              <button
                onClick={() => setQty(Math.max(1, qty - 1))}
                style={{
                  width: 24, height: 24, borderRadius: '50%',
                  background: qty <= 1 ? 'transparent' : 'var(--bg-surface-3)',
                  border: 'none', cursor: 'pointer',
                  color: 'var(--text-primary)',
                  display: 'flex', alignItems: 'center', justifyContent: 'center',
                  fontSize: '0.75rem', lineHeight: 1,
                }}
              >
                −
              </button>
              <span style={{ fontFamily: 'var(--font-display)', fontSize: '0.9375rem', color: 'var(--text-primary)', minWidth: 16, textAlign: 'center' }}>
                {qty}
              </span>
              <button
                onClick={() => setQty(qty + 1)}
                style={{
                  width: 24, height: 24, borderRadius: 5,
                  background: 'var(--bg-surface-3)',
                  border: '1px solid var(--border-light)',
                  cursor: 'pointer',
                  color: 'var(--gold-pale)',
                  display: 'flex', alignItems: 'center', justifyContent: 'center',
                  fontSize: '0.75rem', lineHeight: 1, fontWeight: 500,
                }}
              >
                +
              </button>
            </div>

            <button
              onClick={() => {
                if (!canAddToCart) return;
                onAddToCart(item, qty, notes, selectedSize, selectedSize?.price);
                onClose();
              }}
              className="d3-btn-primary"
              style={{ flex: 1, justifyContent: 'center', padding: '0.625rem', fontSize: '0.8125rem', opacity: canAddToCart ? 1 : 0.5 }}
              disabled={!canAddToCart}
            >
              Add to Order · {formatPrice(effectivePrice * qty, currency)}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}

function SizeSelectionModal({
  item,
  currency,
  initialQty = 1,
  onClose,
  onConfirm,
  onViewDetails,
}: {
  item: PublicMenuItem;
  currency: string | null;
  initialQty?: number;
  onClose: () => void;
  onConfirm: (item: PublicMenuItem, qty: number, size: PublicMenuItemSize, sizePrice: number) => void;
  onViewDetails: (item: PublicMenuItem) => void;
}) {
  const availableSizes = (item.sizes || []).filter((s) => s.is_available !== false);
  const [selectedSizeId, setSelectedSizeId] = useState<string | null>(null);
  const [qty, setQty] = useState(Math.max(1, initialQty));

  const selectedSize = availableSizes.find((s) => s.id === selectedSizeId) || null;
  const unitPrice = selectedSize ? selectedSize.price : Number(item.price) || 0;
  const canAdd = selectedSize !== null;
  const image = item.image_url?.trim() || '';

  return (
    <div
      className="fixed inset-0 z-[60] flex items-end sm:items-center justify-center"
      style={{ background: 'rgba(0,0,0,0.8)', backdropFilter: 'blur(8px)' }}
      onClick={(e) => e.target === e.currentTarget && onClose()}
    >
      <div
        className="w-full sm:max-w-md max-h-[90vh] overflow-y-auto"
        style={{
          background: 'var(--bg-surface)',
          border: '1px solid var(--border-subtle)',
          borderRadius: 'var(--d3-modal-radius)',
          boxShadow: '0 -32px 80px rgba(0,0,0,0.8)',
        }}
      >
        <div className="flex items-start gap-3 p-4" style={{ borderBottom: '1px solid var(--border-subtle)' }}>
          {image ? (
            <img
              src={image}
              alt={item.name}
              style={{ width: 64, height: 64, borderRadius: 10, objectFit: 'cover', flexShrink: 0 }}
            />
          ) : (
            <NoAssetPanel label="No photo" height={64} />
          )}
          <div style={{ flex: 1, minWidth: 0 }}>
            <h2 style={{ fontFamily: 'var(--font-display)', fontSize: '1.25rem', fontWeight: 500, color: 'var(--text-primary)', lineHeight: 1.2, margin: 0 }}>
              {item.name}
            </h2>
            {item.description ? (
              <p style={{ margin: '4px 0 0', fontSize: '0.75rem', color: 'var(--text-muted)', lineHeight: 1.5 }}>
                {item.description}
              </p>
            ) : null}
            <p style={{ margin: '6px 0 0', fontSize: '0.75rem', color: 'var(--text-dimmed)' }}>
              Choose a size to continue
            </p>
          </div>
          <button
            type="button"
            onClick={onClose}
            aria-label="Close"
            style={{
              width: 30, height: 30, borderRadius: '50%', flexShrink: 0,
              background: 'var(--bg-surface-2)', border: '1px solid var(--border-subtle)',
              color: 'var(--text-muted)', cursor: 'pointer',
              display: 'flex', alignItems: 'center', justifyContent: 'center',
            }}
          >
            <svg width="11" height="11" viewBox="0 0 12 12" fill="none">
              <path d="M1 1L11 11M11 1L1 11" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" />
            </svg>
          </button>
        </div>

        <div className="p-4 flex flex-col gap-4">
          <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
            <label className="d3-label" style={{ fontSize: '0.75rem' }}>
              Select Size <span style={{ color: '#FCA5A5', marginLeft: 4 }}>*</span>
            </label>
            <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
              {availableSizes.map((size) => {
                const selected = selectedSizeId === size.id;
                return (
                  <button
                    key={size.id}
                    type="button"
                    onClick={() => setSelectedSizeId(size.id)}
                    style={{
                      display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 12,
                      width: '100%', padding: '0.6875rem 0.875rem',
                      borderRadius: 'var(--d3-input-radius)',
                      border: selected ? '2px solid var(--gold)' : '1px solid var(--border-warm)',
                      background: selected ? 'rgba(201,169,110,0.1)' : 'var(--bg-surface-2)',
                      color: selected ? 'var(--gold)' : 'var(--text-primary)',
                      cursor: 'pointer', transition: 'all 200ms', textAlign: 'left',
                    }}
                  >
                    <span style={{ display: 'flex', alignItems: 'center', gap: 8, fontWeight: selected ? 600 : 500 }}>
                      <span
                        style={{
                          width: 16, height: 16, borderRadius: '50%', flexShrink: 0,
                          border: selected ? '2px solid var(--gold)' : '1px solid var(--border-medium)',
                          display: 'inline-flex', alignItems: 'center', justifyContent: 'center',
                        }}
                      >
                        {selected && <span style={{ width: 8, height: 8, borderRadius: '50%', background: 'var(--gold)' }} />}
                      </span>
                      {size.name}
                    </span>
                    <span style={{ fontFamily: 'var(--font-display)', fontWeight: 600 }}>
                      {formatPrice(size.price, currency)}
                    </span>
                  </button>
                );
              })}
            </div>
          </div>

          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 12 }}>
            <span style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>Quantity</span>
            <div
              className="flex items-center gap-2"
              style={{
                background: 'var(--bg-surface-2)', border: '1px solid var(--border-subtle)',
                borderRadius: 'var(--d3-input-radius)', padding: '0.25rem 0.5rem',
              }}
            >
              <button
                type="button"
                onClick={() => setQty((q) => Math.max(1, q - 1))}
                style={{ width: 30, height: 30, borderRadius: '50%', background: qty <= 1 ? 'transparent' : 'var(--bg-surface-3)', border: 'none', color: 'var(--text-primary)', cursor: 'pointer', fontSize: '1rem' }}
              >
                −
              </button>
              <span style={{ fontFamily: 'var(--font-display)', fontSize: '1rem', color: 'var(--text-primary)', minWidth: 20, textAlign: 'center' }}>{qty}</span>
              <button
                type="button"
                onClick={() => setQty((q) => q + 1)}
                style={{ width: 30, height: 30, borderRadius: 5, background: 'var(--bg-surface-3)', border: '1px solid var(--border-light)', color: 'var(--gold-pale)', cursor: 'pointer', fontSize: '1rem', fontWeight: 500 }}
              >
                +
              </button>
            </div>
          </div>

          <div className="flex items-center gap-3">
            <button
              type="button"
              className="d3-btn-primary"
              disabled={!canAdd}
              onClick={() => {
                if (!selectedSize) return;
                onConfirm(item, qty, selectedSize, selectedSize.price);
                onClose();
              }}
              style={{ flex: 1, justifyContent: 'center', padding: '0.875rem', fontSize: '0.9375rem', opacity: canAdd ? 1 : 0.5 }}
            >
              Add to Order · {formatPrice(unitPrice * qty, currency)}
            </button>
            <button
              type="button"
              onClick={() => {
                onClose();
                onViewDetails(item);
              }}
              className="d3-btn-subtle"
              style={{ padding: '0.875rem 0.75rem', whiteSpace: 'nowrap' }}
            >
              Details
            </button>
          </div>
          {!canAdd && (
            <p style={{ margin: 0, fontSize: '0.6875rem', color: 'var(--text-dimmed)', textAlign: 'center' }}>
              Select a size to enable adding this dish.
            </p>
          )}
        </div>
      </div>
    </div>
  );
}

function NoAssetPanel({ label, height }: { label: string; height?: number | string }) {
  return (
    <div
      className="flex flex-col items-center justify-center gap-3 w-full"
      style={{ height, background: 'var(--bg-secondary)', color: 'var(--text-dimmed)' }}
    >
      <svg width="34" height="34" viewBox="0 0 34 34" fill="none" style={{ opacity: 0.5 }} aria-hidden="true">
        <path d="M17 3L30 10.5V24L17 31.5L4 24V10.5L17 3Z" stroke="currentColor" strokeWidth="1.1" strokeLinejoin="round" />
        <path d="M17 3V31.5M4 10.5L17 18L30 10.5" stroke="currentColor" strokeWidth="0.9" strokeOpacity="0.5" strokeLinejoin="round" />
      </svg>
      <span style={{ fontSize: '0.5625rem', fontWeight: 600, letterSpacing: '0.16em', textTransform: 'uppercase' }}>
        {label}
      </span>
    </div>
  );
}

function CartDrawer({
  cart,
  currency,
  onClose,
  onAdd,
  onRemove,
  onChangeSize,
  totalPrice,
  tableNumber,
  hotelId,
  slug,
  router,
  addToOrderId,
  addToOrderNumber,
}: {
  cart: CartItem[];
  currency: string | null;
  onClose: () => void;
  onAdd: (item: PublicMenuItem, qty?: number, notes?: string, size?: PublicMenuItemSize | null, sizePrice?: number) => void;
  onRemove: (id: string, sizeId: string | null) => void;
  onChangeSize: (itemId: string, currentSizeId: string | null, newSizeId: string) => void;
  totalPrice: number;
  tableNumber: string;
  hotelId: string;
  slug: string;
  router: any;
  addToOrderId?: string | null;
  addToOrderNumber?: string | null;
}) {
  const [customerName, setCustomerName] = useState('');
  const [orderNotes, setOrderNotes] = useState('');
  const [payment, setPayment] = useState<'pay_at_table' | 'card' | 'upi'>('pay_at_table');
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [slideKey, setSlideKey] = useState(0);

  const handlePlaceOrder = async () => {
    if (cart.length === 0) return;

    const missingSize = cart.find(
      (c) => (c.menuItem.sizes || []).some((s) => s.is_available !== false) && !c.size
    );
    if (missingSize) {
      setError(`Select a size for ${missingSize.menuItem.name} before placing the order.`);
      return;
    }

    setSubmitting(true);
    setError(null);

    try {
      if (addToOrderId) {
        const res = await fetch('/api/orders/add-items', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            order_id: addToOrderId,
            items: cart.map((c) => ({
              menu_item_id: c.menuItem.id,
              quantity: c.quantity,
              notes: c.notes || undefined,
              size_id: c.size?.id || undefined,
              size_name: c.size?.name || undefined,
              size_price: c.sizePrice !== undefined ? c.sizePrice : undefined,
            })),
          }),
        });
        const json = await res.json();

        if (!res.ok || !json.success) {
          throw new Error(json.error || 'We could not add items to the order. Please try again.');
        }

        router.push(`/order/${encodeURIComponent(addToOrderId)}?slug=${encodeURIComponent(slug)}`);
        return;
      }

      const res = await fetch('/api/orders/create', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          hotel_id: hotelId,
          table_number: tableNumber,
          customer_name: customerName.trim() || undefined,
          notes: orderNotes.trim() || undefined,
          payment_method: payment,
          items: cart.map((c) => ({
            menu_item_id: c.menuItem.id,
            quantity: c.quantity,
            price_at_time: c.sizePrice !== undefined ? c.sizePrice : Number(c.menuItem.price) || 0,
            notes: c.notes || undefined,
            size_id: c.size?.id || undefined,
            size_name: c.size?.name || undefined,
            size_price: c.sizePrice !== undefined ? c.sizePrice : undefined,
          })),
        }),
      });
      const json = await res.json();

      if (!res.ok || !json.success) {
        throw new Error(json.error || 'We could not send your order. Please try again.');
      }

      const orderId = json.orderId || json.order?.id || null;
      if (!orderId) {
        throw new Error(json.error || 'Order was placed but no reference was assigned.');
      }
      router.push(`/order/${encodeURIComponent(orderId)}?slug=${encodeURIComponent(slug)}`);
    } catch (err: any) {
      setError(err.message || 'We could not send your order. Please try again.');
      setSubmitting(false);
      // Reset slide so customer can try again
      setSlideKey((k) => k + 1);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex justify-end" onClick={(e) => e.target === e.currentTarget && onClose()}>
      <div
        style={{
          width: '100%', maxWidth: 400,
          background: 'var(--bg-surface)',
          borderLeft: '1px solid var(--border-subtle)',
          display: 'flex', flexDirection: 'column',
          height: '100%', overflow: 'hidden',
          paddingBottom: 'max(env(safe-area-inset-bottom), 120px)',
        }}
      >
        <div
          className="flex items-center justify-between px-5 py-4"
          style={{ borderBottom: '1px solid var(--border-subtle)' }}
        >
          <div>
            <h3 style={{ fontFamily: 'var(--font-display)', fontSize: '1.25rem', fontWeight: 500, color: 'var(--text-primary)', letterSpacing: '-0.01em' }}>
              {addToOrderId ? 'Add to Existing Order' : 'Your Order'}
            </h3>
            <span style={{ fontSize: '0.6875rem', color: 'var(--text-dimmed)' }}>
              {cart.reduce((s, c) => s + c.quantity, 0)} item{cart.reduce((s, c) => s + c.quantity, 0) === 1 ? '' : 's'}
              {addToOrderNumber && <> · Order #{addToOrderNumber}</>}
            </span>
          </div>
          <button
            onClick={onClose}
            style={{
              width: 32, height: 32, borderRadius: '50%',
              background: 'var(--bg-surface-2)',
              border: '1px solid var(--border-subtle)',
              color: 'var(--text-muted)',
              display: 'flex', alignItems: 'center', justifyContent: 'center',
              cursor: 'pointer',
            }}
          >
            <svg width="12" height="12" viewBox="0 0 12 12" fill="none">
              <path d="M1 1L11 11M11 1L1 11" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" />
            </svg>
          </button>
        </div>

        <div className="flex-1 overflow-y-auto px-3 py-2.5 flex flex-col gap-2">
          {cart.map(({ menuItem, quantity, size, sizePrice }) => {
            const itemPrice = sizePrice !== undefined ? sizePrice : Number(menuItem.price) || 0;
            const availableSizes = (menuItem.sizes || []).filter((s) => s.is_available !== false);
            const canChangeSize = availableSizes.length > 1;
            return (
              <div
                key={`${menuItem.id}-${size?.id || 'default'}`}
                className="flex items-start justify-between gap-2.5 p-2.5 rounded-lg"
                style={{ background: 'var(--bg-surface-2)', border: '1px solid var(--border-subtle)' }}
              >
                <div className="flex-1 min-w-0" style={{ display: 'flex', flexDirection: 'column', gap: 3 }}>
                  <p style={{ fontWeight: 600, fontSize: '0.8125rem', color: 'var(--text-primary)', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap', margin: 0 }}>
                    {menuItem.name}
                  </p>
                  {size && (
                    <p style={{ margin: 0, fontSize: '0.6875rem', color: 'var(--gold)', fontWeight: 500 }}>
                      Size: {size.name}
                    </p>
                  )}
                  <p style={{ margin: 0, fontSize: '0.625rem', color: 'var(--text-dimmed)' }}>
                    {formatPrice(itemPrice, currency)} each
                  </p>
                  {canChangeSize && (
                    <select
                      aria-label={`Change size for ${menuItem.name}`}
                      value={size?.id || ''}
                      onChange={(e) => onChangeSize(menuItem.id, size?.id || null, e.target.value)}
                      style={{
                        marginTop: 2, maxWidth: '100%', padding: '0.25rem 0.375rem',
                        borderRadius: 6, background: 'var(--bg-surface-3)',
                        border: '1px solid var(--border-subtle)', color: 'var(--text-primary)',
                        fontSize: '0.6875rem', cursor: 'pointer',
                      }}
                    >
                      {availableSizes.map((s) => (
                        <option key={s.id} value={s.id}>
                          {s.name} · {formatPrice(s.price, currency)}
                        </option>
                      ))}
                    </select>
                  )}
                </div>
                <div className="flex items-center gap-1.5" style={{ flexShrink: 0 }}>
                  <button
                    onClick={() => onRemove(menuItem.id, size?.id || null)}
                    style={{
                      width: 22, height: 22, borderRadius: '50%',
                      background: 'var(--bg-surface-3)',
                      border: '1px solid var(--border-subtle)',
                      color: 'var(--text-muted)', cursor: 'pointer',
                      display: 'flex', alignItems: 'center', justifyContent: 'center',
                      fontSize: '0.75rem', lineHeight: 1,
                    }}
                  >
                    −
                  </button>
                  <span style={{ fontFamily: 'var(--font-display)', fontSize: '0.9375rem', color: 'var(--text-primary)', minWidth: 14, textAlign: 'center' }}>
                    {quantity}
                  </span>
                  <button
                    onClick={() => onAdd(menuItem, 1, '', size, sizePrice)}
                    style={{
                      width: 22, height: 22, borderRadius: 5,
                      background: 'var(--bg-surface-3)',
                      border: '1px solid var(--border-light)',
                      color: 'var(--gold-pale)', cursor: 'pointer',
                      display: 'flex', alignItems: 'center', justifyContent: 'center',
                      fontSize: '0.75rem', lineHeight: 1, fontWeight: 500,
                    }}
                  >
                    +
                  </button>
                  <span style={{ fontFamily: 'var(--font-display)', fontSize: '0.9375rem', color: 'var(--gold)', minWidth: 44, textAlign: 'right' }}>
                    {formatPrice(itemPrice * quantity, currency)}
                  </span>
                </div>
              </div>
            );
          })}

          <div className="mt-2.5 flex flex-col gap-2.5">
            <div className="d3-divider" />
            <div>
              <label className="d3-label" style={{ fontSize: '0.6875rem' }}>Your Name (optional)</label>
              <input
                type="text"
                value={customerName}
                onChange={(e) => setCustomerName(e.target.value)}
                placeholder="Name for the order"
                className="d3-input"
                style={{ padding: '0.5rem 0.625rem', fontSize: '0.8125rem' }}
              />
            </div>
            <div>
              <label className="d3-label" style={{ fontSize: '0.6875rem' }}>Notes for Chef (optional)</label>
              <input
                type="text"
                value={orderNotes}
                onChange={(e) => setOrderNotes(e.target.value)}
                placeholder="Allergies or preferences"
                className="d3-input"
                style={{ padding: '0.5rem 0.625rem', fontSize: '0.8125rem' }}
              />
            </div>
            <div>
              <label className="d3-label" style={{ fontSize: '0.6875rem' }}>Payment Method</label>
              <div className="flex gap-1.5">
                {[
                  { key: 'pay_at_table', label: 'Pay at Table' },
                  { key: 'card', label: 'Card' },
                  { key: 'upi', label: 'UPI' },
                ].map((opt) => (
                  <button
                    key={opt.key}
                    onClick={() => setPayment(opt.key as any)}
                    style={{
                      flex: 1,
                      padding: '0.4375rem 0.5rem',
                      borderRadius: 6,
                      fontSize: '0.625rem', fontWeight: 600,
                      cursor: 'pointer',
                      border: payment === opt.key
                        ? '1px solid var(--border-medium)'
                        : '1px solid var(--border-subtle)',
                      background: payment === opt.key
                        ? 'var(--bg-surface-3)'
                        : 'var(--bg-surface-2)',
                      color: payment === opt.key ? 'var(--gold)' : 'var(--text-muted)',
                      transition: 'all 200ms',
                    }}
                  >
                    {opt.label}
                  </button>
                ))}
              </div>
            </div>
          </div>
        </div>

        <div
          className="px-3 py-3 flex flex-col gap-2.5"
          style={{ borderTop: '1px solid var(--border-subtle)' }}
        >
           <div className="flex items-center justify-between">
            <span style={{ color: 'var(--text-muted)', fontSize: '0.8125rem' }}>Total</span>
            <span className="d3-price" style={{ fontFamily: 'var(--font-display)', fontSize: '1.375rem', fontWeight: 500, color: 'var(--gold)', letterSpacing: '-0.02em' }}>
              {formatPrice(totalPrice, currency)}
            </span>
          </div>
          {error && (
            <p
              role="alert"
              style={{
                fontSize: '0.6875rem',
                color: 'var(--text-secondary)',
                background: 'var(--bg-surface-2)',
                border: '1px solid var(--border-warm)',
                borderRadius: 6,
                padding: '0.5rem 0.625rem',
                lineHeight: 1.5,
              }}
            >
              {error}
            </p>
          )}
          <OrderSlideToConfirm
            key={slideKey}
            onConfirm={handlePlaceOrder}
            disabled={submitting || cart.length === 0}
          />
        </div>
      </div>
    </div>
  );
}

function MenuEmptyState({ hasSearch }: { hasSearch: boolean }) {
  return (
    <div className="py-20 text-center flex flex-col items-center gap-4">
      <svg width="46" height="46" viewBox="0 0 46 46" fill="none" style={{ color: 'var(--text-dimmed)', opacity: 0.45 }} aria-hidden="true">
        <path d="M23 4L41 14V32L23 42L5 32V14L23 4Z" stroke="currentColor" strokeWidth="1.2" strokeLinejoin="round" />
        <path d="M23 4V42M5 14L23 23L41 14" stroke="currentColor" strokeWidth="0.9" strokeOpacity="0.5" strokeLinejoin="round" />
      </svg>
      <p style={{ margin: 0, color: 'var(--text-muted)', fontSize: '0.9375rem' }}>
        {hasSearch ? 'No dishes found' : 'No menu items yet'}
      </p>
      {hasSearch ? null : (
        <p style={{ margin: 0, maxWidth: '32ch', color: 'var(--text-dimmed)', fontSize: '0.8125rem', lineHeight: 1.7 }}>
          This restaurant has not published any dishes for this menu yet.
        </p>
      )}
    </div>
  );
}

function FoodCard({
  item,
  currency,
  cart,
  onAdd,
  onRemove,
  onClick,
  onView3D,
}: {
  item: PublicMenuItem;
  currency: string | null;
  cart: CartItem[];
  onAdd: (item: PublicMenuItem) => void;
  onRemove: (id: string) => void;
  onClick: (item: PublicMenuItem) => void;
  onView3D: (item: PublicMenuItem) => void;
}) {
  const inCart = cart.find((c) => c.menuItem.id === item.id);
  const has3D = Boolean(item.model_url_glb?.trim() || item.model_url_usdz?.trim());
  const image = item.image_url?.trim() || '';
  const price = Number(item.price) || 0;
  const rating = Number(item.rating) || 0;

  return (
    <div
      className="d3-food-card"
      style={{
        background: 'var(--bg-surface)',
        border: '1px solid var(--border-subtle)',
        borderRadius: 'var(--d3-card-radius)',
        overflow: 'hidden',
        display: 'flex',
        flexDirection: 'column',
        transition: 'border-color 300ms',
      }}
    >
      <div className="d3-food-image relative" style={{ background: 'var(--bg-secondary)' }}>
        {image ? (
          <img
            src={image}
            alt={item.name}
            loading="lazy"
            style={{ width: '100%', height: 'var(--d3-image-height)', objectFit: 'cover', display: 'block' }}
          />
        ) : (
          <NoAssetPanel label="No photo" height="var(--d3-image-height)" />
        )}

        {has3D && (
          <span
            style={{
              position: 'absolute', top: 8, right: 8,
              padding: '0.1875rem 0.5rem',
              borderRadius: 4,
              background: 'rgba(0,0,0,0.7)',
              border: '1px solid var(--border-subtle)',
              color: 'var(--gold)',
              fontSize: '0.5rem', fontWeight: 600,
              letterSpacing: '0.08em', textTransform: 'uppercase',
            }}
          >
            3D
          </span>
        )}

        <div style={{ position: 'absolute', top: 8, left: 8, display: 'flex', gap: 4 }}>
          {item.is_featured && (
            <span className="d3-chip d3-chip-3d" style={{ background: 'rgba(11,11,10,0.75)' }}>
              Featured
            </span>
          )}
          {item.is_popular && !item.is_featured && (
            <span className="d3-chip" style={{ background: 'rgba(11,11,10,0.75)' }}>
              Popular
            </span>
          )}
        </div>
      </div>

      <div className="p-3 flex flex-col gap-2" onClick={() => onClick(item)} style={{ cursor: 'pointer' }}>
        <div className="flex items-start justify-between gap-2">
          <div className="min-w-0">
            <div className="flex items-center gap-1.5 mb-0.5">
              <span
                style={{
                  width: 8, height: 8, borderRadius: 2,
                  display: 'inline-block', flexShrink: 0,
                  border: `1px solid ${item.is_veg ? 'var(--gold-dim)' : 'var(--text-dimmed)'}`,
                  background: item.is_veg ? 'transparent' : 'var(--text-dimmed)',
                }}
              />
              <h3 style={{
                fontFamily: 'var(--font-display)', fontSize: '0.9375rem', fontWeight: 500,
                color: 'var(--text-primary)', letterSpacing: '-0.01em', lineHeight: 1.3,
                overflow: 'hidden', textOverflow: 'ellipsis', display: '-webkit-box',
                WebkitLineClamp: 1, WebkitBoxOrient: 'vertical',
              }}>
                {item.name}
              </h3>
            </div>
            {item.description ? (
              <p style={{
                fontSize: '0.6875rem', color: 'var(--text-muted)', lineHeight: 1.5,
                display: '-webkit-box', WebkitLineClamp: 2, WebkitBoxOrient: 'vertical', overflow: 'hidden',
              }}>
                {item.description}
              </p>
            ) : null}
          </div>
          <span className="d3-price" style={{
             fontFamily: 'var(--font-display)', fontSize: '1rem', fontWeight: 500,
             color: 'var(--gold)', flexShrink: 0, letterSpacing: '-0.02em',
           }}>
            {formatPrice(price, currency)}
          </span>
        </div>

        {item.calories || item.preparation_time_mins || rating > 0 ? (
          <div className="flex items-center gap-2.5" style={{ fontSize: '0.5625rem', color: 'var(--text-dimmed)' }}>
            {item.calories ? <span>{item.calories} kcal</span> : null}
            {item.calories && item.preparation_time_mins ? <span>·</span> : null}
            {item.preparation_time_mins ? <span>{item.preparation_time_mins} min</span> : null}
            {rating > 0 ? (
              <>
                {(item.calories || item.preparation_time_mins) ? <span>·</span> : null}
                <span style={{ color: 'var(--gold)' }}>★ {rating.toFixed(1)}</span>
              </>
            ) : null}
          </div>
        ) : null}

        {inCart ? (
          <div
            className="flex items-center justify-between"
            style={{
              background: 'var(--bg-surface-2)',
              border: '1px solid var(--border-subtle)',
              borderRadius: 'var(--d3-input-radius)',
              padding: '0.3125rem 0.5rem',
            }}
          >
            <button
              onClick={() => onRemove(item.id)}
              style={{
                width: 24, height: 24, borderRadius: '50%',
                background: 'var(--bg-surface-3)',
                border: 'none', cursor: 'pointer',
                color: 'var(--text-primary)',
                display: 'flex', alignItems: 'center', justifyContent: 'center',
                fontWeight: 700, fontSize: '0.875rem',
              }}
            >
              −
            </button>
            <span style={{ fontFamily: 'var(--font-display)', fontSize: '0.9375rem', color: 'var(--text-primary)' }}>
              {inCart.quantity} in order
            </span>
            <button
              onClick={() => onAdd(item)}
              style={{
                width: 24, height: 24, borderRadius: 5,
                background: 'var(--bg-surface-3)',
                border: '1px solid var(--border-light)',
                cursor: 'pointer',
                color: 'var(--gold-pale)',
                display: 'flex', alignItems: 'center', justifyContent: 'center',
                fontWeight: 500, fontSize: '0.875rem',
              }}
            >
              +
            </button>
          </div>
        ) : (
            <button
              onClick={() => onAdd(item)}
              style={{
                width: '100%', padding: '0.5rem',
                borderRadius: 'var(--d3-btn-radius)', border: '1px solid var(--border-medium)',
                background: 'var(--bg-surface-2)',
                color: 'var(--gold-pale)',
                fontSize: '0.6875rem', fontWeight: 500, letterSpacing: '0.04em',
                cursor: 'pointer',
                transition: 'all 200ms',
              }}
              onMouseEnter={(e) => {
                e.currentTarget.style.background = 'var(--bg-surface-3)';
                e.currentTarget.style.borderColor = 'var(--border-medium)';
              }}
              onMouseLeave={(e) => {
                e.currentTarget.style.background = 'var(--bg-surface-2)';
                e.currentTarget.style.borderColor = 'var(--border-medium)';
              }}
            >
              Add to Order
            </button>
        )}

{has3D && (
            <button
              type="button"
              onClick={(e) => {
                e.stopPropagation();
                onView3D(item);
              }}
              style={{
                display: 'inline-flex', alignItems: 'center', justifyContent: 'center', gap: 5,
                width: '100%', padding: '0.4375rem',
                borderRadius: 'var(--d3-btn-radius)',                 border: '1px solid var(--border-light)',
                background: 'var(--bg-surface-2)',
                color: 'var(--gold)',
                fontSize: '0.625rem', fontWeight: 600,
                letterSpacing: '0.06em', textTransform: 'uppercase',
                cursor: 'pointer',
                transition: 'all 200ms',
              }}
              onMouseEnter={(e) => {
                e.currentTarget.style.background = 'var(--bg-surface-3)';
                e.currentTarget.style.borderColor = 'var(--border-medium)';
              }}
              onMouseLeave={(e) => {
                e.currentTarget.style.background = 'var(--bg-surface-2)';
                e.currentTarget.style.borderColor = 'var(--border-light)';
              }}
            >
              <svg width="11" height="11" viewBox="0 0 12 12" fill="none">
                <path d="M6 1L6 11M1 6L11 6" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" />
                <circle cx="6" cy="6" r="4.5" stroke="currentColor" strokeWidth="1" strokeDasharray="4 2" />
              </svg>
              View in 3D
            </button>
        )}
      </div>
    </div>
  );
}

/* ============================================================
   MENU CONTENT
   ============================================================ */
export default function MenuContent({
  slug,
  initialTableNumber,
  initialHotel,
  initialItems,
  initialCategories,
  initialError,
  addToOrderId,
  addToOrderNumber,
}: {
  slug: string;
  initialTableNumber: string;
  initialHotel: PublicHotel | null;
  initialItems: PublicMenuItem[];
  initialCategories: PublicCategory[];
  initialError: string | null;
  addToOrderId?: string | null;
  addToOrderNumber?: string | null;
}) {
  const router = useRouter();

  const [hotel, setHotel] = useState<PublicHotel | null>(initialHotel);
  const [menuItems, setMenuItems] = useState<PublicMenuItem[]>(initialItems);
  const [categories, setCategories] = useState<PublicCategory[]>(initialCategories);
  const [loading, setLoading] = useState(!initialHotel && !initialError);
  const [loadError, setLoadError] = useState<string | null>(initialError);

  const [selectedCategory, setSelectedCategory] = useState('All');
  const [cart, setCart] = useState<CartItem[]>([]);
  const [isCartOpen, setIsCartOpen] = useState(false);
  const [inspectItem, setInspectItem] = useState<PublicMenuItem | null>(null);
  const [sizeModalItemId, setSizeModalItemId] = useState<string | null>(null);
  const [sizeModalQty, setSizeModalQty] = useState(1);
  const [view3DItem, setView3DItem] = useState<PublicMenuItem | null>(null);
  const [view3DMode, setView3DMode] = useState<'3d' | 'ar'>('3d');
  const [search, setSearch] = useState('');
  const [isServiceModalOpen, setIsServiceModalOpen] = useState(false);
  const [isWaterModalOpen, setIsWaterModalOpen] = useState(false);
  const [activeBottomTab, setActiveBottomTab] = useState('Menu');

  // Open cart drawer if navigated from Cart tab on another page
  const searchParams = useSearchParams();
  useEffect(() => {
    if (searchParams.get('openCart') === '1') {
      setIsCartOpen(true);
    }
  }, [searchParams]);

  // Open the size picker for dishes that have size options enabled, otherwise
  // keep the existing detail modal.
  const handleCardClick = useCallback((item: PublicMenuItem) => {
    if (hasSelectableSizes(item)) {
      setSizeModalQty(1);
      setSizeModalItemId(item.id);
      return;
    }
    setInspectItem(item);
  }, []);

  const loadMenu = useCallback(async (isPolling = false) => {
    try {
      if (!isPolling) {
        setLoading(true);
      }
      setLoadError(null);

      const res = await fetch(`/api/public/menu?slug=${encodeURIComponent(slug)}`);
      const json = await res.json();

      if (!res.ok || !json.success) {
        if (!isPolling) {
          setHotel(null);
          setMenuItems([]);
          setCategories([]);
          setLoadError(json.error || 'This menu is not available right now.');
        }
        return;
      }

      if (!isPolling) {
        setHotel(json.hotel as PublicHotel);
      } else if (json.hotel) {
        // Keep cart/UI state intact, but pick up dashboard theme changes so
        // Menu/View Order stay in sync with the restaurant's saved theme.
        setHotel((prev) => {
          const next = json.hotel as PublicHotel;
          if (!prev) return next;
          const prevTheme = prev.menu_theme || null;
          const nextTheme = next.menu_theme || null;
          const prevCfg = JSON.stringify(prev.custom_theme_config || null);
          const nextCfg = JSON.stringify(next.custom_theme_config || null);
          if (prevTheme === nextTheme && prevCfg === nextCfg) return prev;
          return { ...prev, ...next };
        });
      }
      setMenuItems((json.menuItems || []) as PublicMenuItem[]);
      setCategories((json.categories || []) as PublicCategory[]);
    } catch {
      if (!isPolling) {
        setHotel(null);
        setMenuItems([]);
        setCategories([]);
        setLoadError('This menu could not be loaded. Please refresh to try again.');
      }
    } finally {
      if (!isPolling) {
        setLoading(false);
      }
    }
  }, [slug]);

  // Initial load only if SSR didn't provide data
  useEffect(() => {
    if (!initialHotel && !initialError) {
      loadMenu(false);
    }
  }, [loadMenu, initialHotel, initialError]);

  // Polling: refresh menu data every 2 seconds without losing cart state
  useEffect(() => {
    const interval = setInterval(() => {
      loadMenu(true);
    }, 2000);

    return () => clearInterval(interval);
  }, [loadMenu]);

  const currency = hotel?.currency ?? null;
  const sizeModalItem = sizeModalItemId
    ? menuItems.find((i) => i.id === sizeModalItemId) || null
    : null;

  const pills = useMemo(() => {
    const categoryIdsWithItems = new Set(
      menuItems.map((i) => i.category_id).filter(Boolean)
    );
    const availableCategories = categories.filter((c) => categoryIdsWithItems.has(c.id));
    const names = availableCategories.map((c) => c.name).filter(Boolean);
    const hasUncategorised = menuItems.some((i) => !i.category_id || !categories.some((c) => c.id === i.category_id));
    const basePills = ['All', 'Water 💧', ...names, ...(hasUncategorised ? ['Uncategorised'] : [])];
    return basePills;
  }, [categories, menuItems]);

  const categoryNameOf = useCallback(
    (item: PublicMenuItem) => {
      if (!item.category_id) return 'Uncategorised';
      return categories.find((c) => c.id === item.category_id)?.name || 'Uncategorised';
    },
    [categories]
  );

  const filteredItems = useMemo(() => {
    const term = search.trim().toLowerCase();
    return menuItems.filter((item) => {
      const catMatch =
        selectedCategory === 'All' ||
        (selectedCategory === 'Uncategorised'
          ? categoryNameOf(item) === 'Uncategorised'
          : categoryNameOf(item) === selectedCategory);
      const searchMatch =
        !term ||
        item.name.toLowerCase().includes(term) ||
        (item.description || '').toLowerCase().includes(term);
      return catMatch && searchMatch;
    });
  }, [menuItems, selectedCategory, search, categoryNameOf]);

  const addToCart = (item: PublicMenuItem, qty = 1, notes = '', size?: PublicMenuItemSize | null, sizePrice?: number) => {
    const resolvedSizePrice = size
      ? sizePrice !== undefined
        ? sizePrice
        : size.price
      : undefined;

    setCart((prev) => {
      const sizeKey = size?.id || 'default';
      const existing = prev.find((c) => c.menuItem.id === item.id && (c.size?.id || 'default') === sizeKey);
      if (existing) return prev.map((c) => (c.menuItem.id === item.id && (c.size?.id || 'default') === sizeKey ? { ...c, quantity: c.quantity + qty, notes: notes || c.notes } : c));
      return [...prev, { menuItem: item, quantity: qty, notes: notes || undefined, size: size || null, sizePrice: resolvedSizePrice }];
    });
  };

  // Quick-add entry point used by menu cards and templates. If the dish has
  // selectable sizes, open the size modal instead of adding an un-sized item.
  const requestAdd = (item: PublicMenuItem, qty = 1, notes = '', size?: PublicMenuItemSize | null, sizePrice?: number) => {
    if (!size && hasSelectableSizes(item)) {
      setSizeModalQty(Math.max(1, qty));
      setSizeModalItemId(item.id);
      return;
    }
    addToCart(item, qty, notes, size, sizePrice);
  };

  const changeCartItemSize = (itemId: string, currentSizeId: string | null, newSizeId: string) => {
    setCart((prev) => {
      const currentIndex = prev.findIndex(
        (c) => c.menuItem.id === itemId && (c.size?.id || null) === (currentSizeId || null)
      );
      if (currentIndex === -1) return prev;

      const current = prev[currentIndex];
      const nextSize = selectableSizes(current.menuItem).find((s) => s.id === newSizeId);
      if (!nextSize) return prev;

      // If the target size already has its own cart line, merge quantities into it.
      const mergeIndex = prev.findIndex(
        (c, i) => i !== currentIndex && c.menuItem.id === itemId && (c.size?.id || null) === newSizeId
      );
      if (mergeIndex !== -1) {
        const mergeTarget = prev[mergeIndex];
        return prev
          .filter((_, i) => i !== currentIndex)
          .map((c) => (c === mergeTarget ? { ...c, quantity: c.quantity + current.quantity } : c));
      }

      return prev.map((c, i) =>
        i === currentIndex ? { ...c, size: nextSize, sizePrice: nextSize.price } : c
      );
    });
  };

  const removeFromCart = (itemId: string, sizeId: string | null = null) => {
    const sizeKey = sizeId || 'default';
    setCart((prev) =>
      prev
        .map((c) => {
          const cSizeKey = c.size?.id || 'default';
          if (c.menuItem.id === itemId && cSizeKey === sizeKey) {
            return { ...c, quantity: c.quantity - 1 };
          }
          return c;
        })
        .filter((c) => c.quantity > 0)
    );
  };

  const totalCount = cart.reduce((s, c) => s + c.quantity, 0);
  const totalPrice = cart.reduce((s, c) => s + (c.sizePrice !== undefined ? c.sizePrice : Number(c.menuItem.price) || 0) * c.quantity, 0);

  const featured = filteredItems.filter((i) => i.is_featured);
  const popular = filteredItems.filter((i) => i.is_popular && !i.is_featured);
  const rest = filteredItems.filter((i) => !i.is_featured && !i.is_popular);

  if (loading) {
    return (
      <div
        className={`min-h-screen flex items-center justify-center ${menuThemeClass(hotel?.menu_theme || undefined)}`}
        style={{
          background: 'var(--bg-primary)',
          fontFamily: 'var(--font-body)',
          ...(hotel?.menu_theme === 'custom'
            ? (customThemeToCssVars(cloneCustomThemeConfig(hotel?.custom_theme_config) as CustomThemeConfig) as React.CSSProperties)
            : {}),
        }}
      >
        <div style={{ width: 40, height: 40, borderRadius: '50%', border: '2px solid var(--border-light)', borderTop: '2px solid var(--gold)', animation: 'spin 1s linear infinite' }} />
      </div>
    );
  }

  if (!hotel) {
    return (
      <div
        className={`min-h-screen flex items-center justify-center px-6 ${menuThemeClass(undefined)}`}
        style={{ background: 'var(--bg-primary)', fontFamily: 'var(--font-body)' }}
      >
        <div className="flex flex-col items-center gap-4 text-center" style={{ maxWidth: 420 }}>
          <svg width="44" height="44" viewBox="0 0 44 44" fill="none" style={{ color: 'var(--text-dimmed)', opacity: 0.5 }} aria-hidden="true">
            <circle cx="22" cy="22" r="18" stroke="currentColor" strokeWidth="1.3" />
            <path d="M15 22h14" stroke="currentColor" strokeWidth="1.3" strokeLinecap="round" />
          </svg>
          <h1 style={{ fontFamily: 'var(--font-display)', fontSize: '1.375rem', fontWeight: 500, color: 'var(--text-primary)' }}>
            Menu unavailable
          </h1>
          <p style={{ margin: 0, fontSize: '0.875rem', lineHeight: 1.7, color: 'var(--text-muted)' }}>
            {loadError || 'No menu was found for this restaurant.'}
          </p>
        </div>
      </div>
    );
  }

  return (
    <MenuThemeProviderContext themeId={hotel?.menu_theme || undefined} customConfig={hotel?.custom_theme_config}>
      <div
        className={`min-h-screen ${menuThemeClass(hotel?.menu_theme || undefined)} pb-[100px] sm:pb-24 lg:pl-64`}
        style={{
          background: 'var(--bg-primary)',
          fontFamily: 'var(--font-body)',
          ...(hotel?.menu_theme === 'custom'
            ? (customThemeToCssVars(cloneCustomThemeConfig(hotel?.custom_theme_config) as CustomThemeConfig) as React.CSSProperties)
            : {}),
        }}
      >
        {(() => {
          const commonProps = {
            hotel,
            currency,
            tableNumber: initialTableNumber,
            categories,
            pills,
            selectedCategory,
            onSelectCategory: (cat: string) => {
              if (cat === 'Water 💧') {
                setIsWaterModalOpen(true);
              } else {
                setSelectedCategory(cat);
              }
            },
            search,
            onSearchChange: setSearch,
            filteredItems,
            featuredItems: featured,
            popularItems: popular,
            regularItems: rest,
            cart,
            totalCount,
            totalPrice,
            onAdd: requestAdd,
            onRemove: removeFromCart,
            onItemClick: handleCardClick,
            onView3D: (item: PublicMenuItem) => { setView3DMode('3d'); setView3DItem(item); },
            onViewAr: (item: PublicMenuItem) => { setView3DMode('ar'); setView3DItem(item); },
            onOpenCart: () => setIsCartOpen(true),
            onOpenWater: () => setIsWaterModalOpen(true),
            onOpenWaiter: () => setIsServiceModalOpen(true),
          };

          switch (hotel.menu_theme) {
            case 'custom':
              return <CustomTemplate {...commonProps} customConfig={hotel.custom_theme_config} />;
            case 'modern-dark':
              return <ModernDarkTemplate {...commonProps} />;
            case 'fresh-minimal':
              return <FreshMinimalTemplate {...commonProps} />;
            case 'indian-heritage':
              return <IndianHeritageTemplate {...commonProps} />;
            case 'contemporary-premium':
              return <ContemporaryPremiumTemplate {...commonProps} />;
            case 'classic-luxury':
            default:
              return <ClassicLuxuryTemplate {...commonProps} />;
          }
        })()}

        {sizeModalItem && hasSelectableSizes(sizeModalItem) && (
          <SizeSelectionModal
            key={sizeModalItem.id}
            item={sizeModalItem}
            currency={currency}
            initialQty={sizeModalQty}
            onClose={() => setSizeModalItemId(null)}
            onConfirm={(item, qty, size, sizePrice) => addToCart(item, qty, '', size, sizePrice)}
            onViewDetails={(item) => setInspectItem(item)}
          />
        )}

        {inspectItem && (
          <FoodDetailModal
            item={inspectItem}
            currency={currency}
            onClose={() => setInspectItem(null)}
            onAddToCart={addToCart}
            cartQty={cart.find((c) => c.menuItem.id === inspectItem.id)?.quantity || 0}
            onView3D={(item: PublicMenuItem) => { setView3DMode('3d'); setView3DItem(item); }}
          />
        )}

        {view3DItem && (
          <Dish3DModal
            item={view3DItem}
            priceLabel={formatPrice(Number(view3DItem.price) || 0, currency)}
            categoryName={categories.find((c) => c.id === view3DItem.category_id)?.name || ''}
            initialMode={view3DMode}
            onClose={() => setView3DItem(null)}
          />
        )}

        {/* Call Waiter & Water Order Modals */}
        <ServiceRequestModal
          hotelId={hotel.id}
          tableNumber={initialTableNumber || 'Takeaway'}
          isOpen={isServiceModalOpen}
          onClose={() => setIsServiceModalOpen(false)}
        />

        <WaterCategoryModal
          waterSettings={hotel.water_settings}
          currency={currency}
          isOpen={isWaterModalOpen}
          onClose={() => setIsWaterModalOpen(false)}
          hotelId={hotel.id}
          tableNumber={initialTableNumber || 'Takeaway'}
        />

        {/* Water & Call Waiter actions moved to template header row (below search) */}

        {isCartOpen && (
          <CartDrawer
            cart={cart}
            currency={currency}
            onClose={() => setIsCartOpen(false)}
            onAdd={addToCart}
            onRemove={removeFromCart}
            onChangeSize={changeCartItemSize}
            totalPrice={totalPrice}
            tableNumber={initialTableNumber}
            hotelId={hotel.id}
            slug={hotel.slug}
            router={router}
            addToOrderId={addToOrderId}
            addToOrderNumber={addToOrderNumber}
          />
        )}

        {/* Sidebar navigation for desktop */}
        <BottomNav
          variant="sidebar"
          activeTab={activeBottomTab}
          cartCount={totalCount}
          menuSlug={hotel.slug || null}
          tableNumber={initialTableNumber || null}
          onTabChange={setActiveBottomTab}
          onOpenCart={() => setIsCartOpen(true)}
        />

        {/* Fixed bottom navigation bar (mobile only) */}
        <BottomNav
          variant="bottom"
          activeTab={activeBottomTab}
          cartCount={totalCount}
          menuSlug={hotel.slug || null}
          tableNumber={initialTableNumber || null}
          onTabChange={setActiveBottomTab}
          onOpenCart={() => setIsCartOpen(true)}
        />
      </div>
    </MenuThemeProviderContext>
  );
}
