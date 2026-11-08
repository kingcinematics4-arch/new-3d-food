'use client';

import React, { useState } from 'react';
import { formatPrice } from '@/lib/menu';
import { HotelWaterSettings, WaterSizeOption } from '@/lib/waterSettings';
import { PublicMenuItem } from '@/app/menu/[slug]/MenuContent';

interface WaterCategoryModalProps {
  waterSettings?: HotelWaterSettings | null;
  currency: string | null;
  isOpen: boolean;
  onClose: () => void;
  onAddToCart: (item: PublicMenuItem, qty: number, notes: string) => void;
}

export default function WaterCategoryModal({
  waterSettings,
  currency,
  isOpen,
  onClose,
  onAddToCart,
}: WaterCategoryModalProps) {
  const [quantities, setQuantities] = useState<Record<string, number>>({
    normal: 1,
    mineral: 1,
    cold: 1,
  });

  const [selectedSizes, setSelectedSizes] = useState<Record<string, string>>({
    mineral: '500ml',
    cold: '500ml',
  });

  const [addedNotice, setAddedNotice] = useState<string | null>(null);

  if (!isOpen) return null;

  const normalConfig = waterSettings?.normal ?? { enabled: true, price: 0 };
  const mineralConfig = waterSettings?.mineral ?? { enabled: true, price: 20, sizes: [{ size: '500ml', price: 10, enabled: true }, { size: '1L', price: 20, enabled: true }] };
  const coldConfig = waterSettings?.cold ?? { enabled: true, price: 25, sizes: [{ size: '500ml', price: 15, enabled: true }, { size: '1L', price: 25, enabled: true }] };

  const getPriceForType = (type: 'normal' | 'mineral' | 'cold') => {
    if (type === 'normal') return 0;
    const cfg = type === 'mineral' ? mineralConfig : coldConfig;
    const size = selectedSizes[type];
    const sizeOpt = cfg.sizes?.find((s) => s.size === size && s.enabled);
    if (sizeOpt) return sizeOpt.price;
    return cfg.price || 0;
  };

  const handleAdd = (type: 'normal' | 'mineral' | 'cold', title: string) => {
    const qty = quantities[type] || 1;
    const price = getPriceForType(type);
    const size = type !== 'normal' ? selectedSizes[type] : undefined;

    const pseudoId = `water-${type}-${size || 'std'}`;
    const pseudoItem: PublicMenuItem = {
      id: pseudoId,
      category_id: 'water-category',
      name: size ? `${title} (${size})` : title,
      description: type === 'normal' ? 'Complimentary pure drinking water' : `${title} served chilled or bottled`,
      price: price,
      image_url: null,
      model_url_glb: null,
      model_url_usdz: null,
      is_veg: true,
      calories: 0,
      preparation_time_mins: 2,
      ingredients: ['Water'],
      allergens: [],
      dietary_tags: ['Beverage', 'Water'],
      rating: 5,
      order_count: 100,
      is_featured: false,
      is_popular: false,
    };

    onAddToCart(pseudoItem, qty, size ? `Size: ${size}` : '');
    setAddedNotice(`Added ${qty}x ${pseudoItem.name} to order`);
    setTimeout(() => setAddedNotice(null), 2500);
  };

  return (
    <div
      className="fixed inset-0 z-50 flex items-end sm:items-center justify-center p-0 sm:p-4"
      style={{ background: 'rgba(0,0,0,0.8)', backdropFilter: 'blur(8px)' }}
      onClick={(e) => e.target === e.currentTarget && onClose()}
    >
      <div
        className="w-full sm:max-w-md max-h-[90vh] overflow-y-auto flex flex-col"
        style={{
          background: 'var(--bg-surface, #141413)',
          border: '1px solid var(--border-warm, rgba(201,169,110,0.2))',
          borderRadius: '16px 16px 0 0',
          boxShadow: '0 -20px 60px rgba(0,0,0,0.7)',
        }}
      >
        {/* Header */}
        <div
          className="flex items-center justify-between px-5 py-4"
          style={{ borderBottom: '1px solid var(--border-subtle, rgba(243,239,231,0.08))' }}
        >
          <div className="flex items-center gap-2">
            <span className="text-2xl">💧</span>
            <div>
              <h2
                style={{
                  fontFamily: 'var(--font-display, serif)',
                  fontSize: '1.25rem',
                  fontWeight: 600,
                  color: 'var(--text-primary, #F3EFE7)',
                  margin: 0,
                }}
              >
                Water Selection
              </h2>
              <p style={{ margin: '2px 0 0', fontSize: '0.75rem', color: 'var(--text-dimmed, #7A766F)' }}>
                Fresh drinking water & packaged mineral options
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            style={{
              width: 32,
              height: 32,
              borderRadius: '50%',
              background: 'var(--bg-surface-2, #1E1D1A)',
              border: '1px solid var(--border-subtle, rgba(243,239,231,0.08))',
              color: 'var(--text-muted, #9E988D)',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              cursor: 'pointer',
            }}
          >
            ✕
          </button>
        </div>

        {addedNotice && (
          <div
            style={{
              background: 'rgba(16, 185, 129, 0.15)',
              borderBottom: '1px solid #10B981',
              color: '#34D399',
              padding: '0.5rem 1rem',
              fontSize: '0.8125rem',
              textAlign: 'center',
              fontWeight: 500,
            }}
          >
            ✓ {addedNotice}
          </div>
        )}

        <div className="p-5 flex flex-col gap-4">
          {/* 1. Normal Water */}
          {normalConfig.enabled !== false && (
            <div
              style={{
                background: 'var(--bg-surface-2, #1E1D1A)',
                border: '1px solid var(--border-subtle, rgba(243,239,231,0.08))',
                borderRadius: 12,
                padding: '1rem',
                display: 'flex',
                flexDirection: 'column',
                gap: '0.75rem',
              }}
            >
              <div className="flex items-start justify-between">
                <div>
                  <div className="flex items-center gap-2">
                    <span className="text-base">🚰</span>
                    <h3 style={{ fontSize: '0.9375rem', fontWeight: 600, color: 'var(--text-primary, #F3EFE7)', margin: 0 }}>
                      Normal Water
                    </h3>
                  </div>
                  <p style={{ margin: '4px 0 0', fontSize: '0.75rem', color: 'var(--text-muted, #9E988D)' }}>
                    Filtered drinking water served complimentary by the restaurant.
                  </p>
                </div>
                <span
                  style={{
                    background: 'rgba(16, 185, 129, 0.15)',
                    color: '#34D399',
                    padding: '2px 8px',
                    borderRadius: 100,
                    fontSize: '0.75rem',
                    fontWeight: 700,
                    letterSpacing: '0.05em',
                  }}
                >
                  FREE
                </span>
              </div>

              <div className="flex items-center justify-between pt-2" style={{ borderTop: '1px solid rgba(243,239,231,0.05)' }}>
                <div className="flex items-center gap-2">
                  <button
                    type="button"
                    onClick={() => setQuantities({ ...quantities, normal: Math.max(1, (quantities.normal || 1) - 1) })}
                    style={{
                      width: 28,
                      height: 28,
                      borderRadius: 6,
                      background: 'rgba(243,239,231,0.08)',
                      border: 'none',
                      color: 'var(--text-primary, #F3EFE7)',
                      cursor: 'pointer',
                    }}
                  >
                    -
                  </button>
                  <span style={{ fontSize: '0.875rem', fontWeight: 600, minWidth: 20, textAlign: 'center', color: 'var(--text-primary, #F3EFE7)' }}>
                    {quantities.normal || 1}
                  </span>
                  <button
                    type="button"
                    onClick={() => setQuantities({ ...quantities, normal: (quantities.normal || 1) + 1 })}
                    style={{
                      width: 28,
                      height: 28,
                      borderRadius: 6,
                      background: 'rgba(243,239,231,0.08)',
                      border: 'none',
                      color: 'var(--text-primary, #F3EFE7)',
                      cursor: 'pointer',
                    }}
                  >
                    +
                  </button>
                </div>

                <button
                  type="button"
                  onClick={() => handleAdd('normal', 'Normal Water')}
                  style={{
                    padding: '0.5rem 1rem',
                    borderRadius: 8,
                    background: 'var(--gold, #C9A96E)',
                    color: '#0B0B0A',
                    fontSize: '0.75rem',
                    fontWeight: 600,
                    border: 'none',
                    cursor: 'pointer',
                  }}
                >
                  Add Free Water
                </button>
              </div>
            </div>
          )}

          {/* 2. Mineral Water */}
          {mineralConfig.enabled && (
            <div
              style={{
                background: 'var(--bg-surface-2, #1E1D1A)',
                border: '1px solid var(--border-subtle, rgba(243,239,231,0.08))',
                borderRadius: 12,
                padding: '1rem',
                display: 'flex',
                flexDirection: 'column',
                gap: '0.75rem',
              }}
            >
              <div className="flex items-start justify-between">
                <div>
                  <div className="flex items-center gap-2">
                    <span className="text-base">🍾</span>
                    <h3 style={{ fontSize: '0.9375rem', fontWeight: 600, color: 'var(--text-primary, #F3EFE7)', margin: 0 }}>
                      Mineral Water
                    </h3>
                  </div>
                  <p style={{ margin: '4px 0 0', fontSize: '0.75rem', color: 'var(--text-muted, #9E988D)' }}>
                    Packaged sealed mineral water bottle.
                  </p>
                </div>
                <span
                  style={{
                    fontFamily: 'var(--font-display, serif)',
                    color: 'var(--gold, #C9A96E)',
                    fontSize: '1rem',
                    fontWeight: 600,
                  }}
                >
                  {formatPrice(getPriceForType('mineral'), currency)}
                </span>
              </div>

              {/* Sizes selector */}
              {mineralConfig.sizes && mineralConfig.sizes.filter((s) => s.enabled).length > 0 && (
                <div className="flex items-center gap-2">
                  <span style={{ fontSize: '0.6875rem', color: 'var(--text-dimmed, #7A766F)', textTransform: 'uppercase' }}>Size:</span>
                  {mineralConfig.sizes.filter((s) => s.enabled).map((s) => {
                    const active = (selectedSizes.mineral || mineralConfig.sizes![0].size) === s.size;
                    return (
                      <button
                        key={s.size}
                        type="button"
                        onClick={() => setSelectedSizes({ ...selectedSizes, mineral: s.size })}
                        style={{
                          padding: '0.25rem 0.625rem',
                          borderRadius: 6,
                          fontSize: '0.6875rem',
                          fontWeight: 600,
                          background: active ? 'rgba(201,169,110,0.2)' : 'rgba(243,239,231,0.05)',
                          border: `1px solid ${active ? 'var(--gold, #C9A96E)' : 'transparent'}`,
                          color: active ? 'var(--gold, #C9A96E)' : 'var(--text-muted, #9E988D)',
                          cursor: 'pointer',
                        }}
                      >
                        {s.size} ({formatPrice(s.price, currency)})
                      </button>
                    );
                  })}
                </div>
              )}

              <div className="flex items-center justify-between pt-2" style={{ borderTop: '1px solid rgba(243,239,231,0.05)' }}>
                <div className="flex items-center gap-2">
                  <button
                    type="button"
                    onClick={() => setQuantities({ ...quantities, mineral: Math.max(1, (quantities.mineral || 1) - 1) })}
                    style={{
                      width: 28,
                      height: 28,
                      borderRadius: 6,
                      background: 'rgba(243,239,231,0.08)',
                      border: 'none',
                      color: 'var(--text-primary, #F3EFE7)',
                      cursor: 'pointer',
                    }}
                  >
                    -
                  </button>
                  <span style={{ fontSize: '0.875rem', fontWeight: 600, minWidth: 20, textAlign: 'center', color: 'var(--text-primary, #F3EFE7)' }}>
                    {quantities.mineral || 1}
                  </span>
                  <button
                    type="button"
                    onClick={() => setQuantities({ ...quantities, mineral: (quantities.mineral || 1) + 1 })}
                    style={{
                      width: 28,
                      height: 28,
                      borderRadius: 6,
                      background: 'rgba(243,239,231,0.08)',
                      border: 'none',
                      color: 'var(--text-primary, #F3EFE7)',
                      cursor: 'pointer',
                    }}
                  >
                    +
                  </button>
                </div>

                <button
                  type="button"
                  onClick={() => handleAdd('mineral', 'Mineral Water')}
                  style={{
                    padding: '0.5rem 1rem',
                    borderRadius: 8,
                    background: 'var(--gold, #C9A96E)',
                    color: '#0B0B0A',
                    fontSize: '0.75rem',
                    fontWeight: 600,
                    border: 'none',
                    cursor: 'pointer',
                  }}
                >
                  Add to Order • {formatPrice(getPriceForType('mineral') * (quantities.mineral || 1), currency)}
                </button>
              </div>
            </div>
          )}

          {/* 3. Cold Water */}
          {coldConfig.enabled && (
            <div
              style={{
                background: 'var(--bg-surface-2, #1E1D1A)',
                border: '1px solid var(--border-subtle, rgba(243,239,231,0.08))',
                borderRadius: 12,
                padding: '1rem',
                display: 'flex',
                flexDirection: 'column',
                gap: '0.75rem',
              }}
            >
              <div className="flex items-start justify-between">
                <div>
                  <div className="flex items-center gap-2">
                    <span className="text-base">🧊</span>
                    <h3 style={{ fontSize: '0.9375rem', fontWeight: 600, color: 'var(--text-primary, #F3EFE7)', margin: 0 }}>
                      Cold Water
                    </h3>
                  </div>
                  <p style={{ margin: '4px 0 0', fontSize: '0.75rem', color: 'var(--text-muted, #9E988D)' }}>
                    Refreshing chilled drinking water or chilled bottle.
                  </p>
                </div>
                <span
                  style={{
                    fontFamily: 'var(--font-display, serif)',
                    color: 'var(--gold, #C9A96E)',
                    fontSize: '1rem',
                    fontWeight: 600,
                  }}
                >
                  {formatPrice(getPriceForType('cold'), currency)}
                </span>
              </div>

              {/* Sizes selector */}
              {coldConfig.sizes && coldConfig.sizes.filter((s) => s.enabled).length > 0 && (
                <div className="flex items-center gap-2">
                  <span style={{ fontSize: '0.6875rem', color: 'var(--text-dimmed, #7A766F)', textTransform: 'uppercase' }}>Size:</span>
                  {coldConfig.sizes.filter((s) => s.enabled).map((s) => {
                    const active = (selectedSizes.cold || coldConfig.sizes![0].size) === s.size;
                    return (
                      <button
                        key={s.size}
                        type="button"
                        onClick={() => setSelectedSizes({ ...selectedSizes, cold: s.size })}
                        style={{
                          padding: '0.25rem 0.625rem',
                          borderRadius: 6,
                          fontSize: '0.6875rem',
                          fontWeight: 600,
                          background: active ? 'rgba(201,169,110,0.2)' : 'rgba(243,239,231,0.05)',
                          border: `1px solid ${active ? 'var(--gold, #C9A96E)' : 'transparent'}`,
                          color: active ? 'var(--gold, #C9A96E)' : 'var(--text-muted, #9E988D)',
                          cursor: 'pointer',
                        }}
                      >
                        {s.size} ({formatPrice(s.price, currency)})
                      </button>
                    );
                  })}
                </div>
              )}

              <div className="flex items-center justify-between pt-2" style={{ borderTop: '1px solid rgba(243,239,231,0.05)' }}>
                <div className="flex items-center gap-2">
                  <button
                    type="button"
                    onClick={() => setQuantities({ ...quantities, cold: Math.max(1, (quantities.cold || 1) - 1) })}
                    style={{
                      width: 28,
                      height: 28,
                      borderRadius: 6,
                      background: 'rgba(243,239,231,0.08)',
                      border: 'none',
                      color: 'var(--text-primary, #F3EFE7)',
                      cursor: 'pointer',
                    }}
                  >
                    -
                  </button>
                  <span style={{ fontSize: '0.875rem', fontWeight: 600, minWidth: 20, textAlign: 'center', color: 'var(--text-primary, #F3EFE7)' }}>
                    {quantities.cold || 1}
                  </span>
                  <button
                    type="button"
                    onClick={() => setQuantities({ ...quantities, cold: (quantities.cold || 1) + 1 })}
                    style={{
                      width: 28,
                      height: 28,
                      borderRadius: 6,
                      background: 'rgba(243,239,231,0.08)',
                      border: 'none',
                      color: 'var(--text-primary, #F3EFE7)',
                      cursor: 'pointer',
                    }}
                  >
                    +
                  </button>
                </div>

                <button
                  type="button"
                  onClick={() => handleAdd('cold', 'Cold Water')}
                  style={{
                    padding: '0.5rem 1rem',
                    borderRadius: 8,
                    background: 'var(--gold, #C9A96E)',
                    color: '#0B0B0A',
                    fontSize: '0.75rem',
                    fontWeight: 600,
                    border: 'none',
                    cursor: 'pointer',
                  }}
                >
                  Add to Order • {formatPrice(getPriceForType('cold') * (quantities.cold || 1), currency)}
                </button>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
