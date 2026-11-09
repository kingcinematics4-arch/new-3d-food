'use client';

import React, { useState } from 'react';
import { formatPrice } from '@/lib/menu';
import { HotelWaterSettings } from '@/lib/waterSettings';

interface WaterCategoryModalProps {
  waterSettings?: HotelWaterSettings | null;
  currency: string | null;
  isOpen: boolean;
  onClose: () => void;
  hotelId: string;
  tableNumber: string;
}

type WaterType = 'normal' | 'mineral' | 'cold';

type StatusMsg = {
  type: 'success' | 'error';
  text: string;
  key: WaterType;
} | null;

export default function WaterCategoryModal({
  waterSettings,
  currency,
  isOpen,
  onClose,
  hotelId,
  tableNumber,
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

  const [loading, setLoading] = useState<WaterType | null>(null);
  const [statusMsg, setStatusMsg] = useState<StatusMsg>(null);

  if (!isOpen) return null;

  const normalConfig = waterSettings?.normal ?? { enabled: true, price: 0 };
  const mineralConfig = waterSettings?.mineral ?? {
    enabled: true,
    price: 20,
    sizes: [
      { size: '500ml', price: 10, enabled: true },
      { size: '1L', price: 20, enabled: true },
    ],
  };
  const coldConfig = waterSettings?.cold ?? {
    enabled: true,
    price: 25,
    sizes: [
      { size: '500ml', price: 15, enabled: true },
      { size: '1L', price: 25, enabled: true },
    ],
  };

  const getPriceForType = (type: WaterType): number => {
    if (type === 'normal') return 0;
    const cfg = type === 'mineral' ? mineralConfig : coldConfig;
    const size = selectedSizes[type];
    const sizeOpt = cfg.sizes?.find((s) => s.size === size && s.enabled);
    if (sizeOpt) return sizeOpt.price;
    return cfg.price || 0;
  };

  const showStatus = (key: WaterType, type: 'success' | 'error', text: string) => {
    setStatusMsg({ key, type, text });
    setTimeout(() => setStatusMsg(null), 3500);
  };

  // ── Normal Water → Direct Order (free) ───────────────────────────────────────
  const handleNormalWater = async () => {
    if (loading) return;
    setLoading('normal');
    setStatusMsg(null);

    const qty = quantities.normal || 1;

    try {
      const res = await fetch('/api/orders/create', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          hotel_id: hotelId,
          table_number: tableNumber,
          order_type: 'dine_in',
          payment_method: 'pay_at_table',
          items: [
            {
              menu_item_id: null,
              quantity: qty,
              price_at_time: 0,
              item_name: 'Free Water',
              item_kind: 'water',
              notes: null,
            },
          ],
        }),
      });
      const data = await res.json();
      if (!res.ok || !data.success) throw new Error(data.error || 'Order failed');
      showStatus(
        'normal',
        'success',
        `✓ Free water ordered! ${qty}x Free Water. Order #${data.orderNumber || data.orderId} for Table ${tableNumber}.`
      );
      setQuantities((prev) => ({ ...prev, normal: 1 }));
    } catch (err: any) {
      showStatus('normal', 'error', err.message || 'Could not place order. Please try again.');
    } finally {
      setLoading(null);
    }
  };

  // ── Mineral / Cold Water → Direct Order ──────────────────────────────────────
  const handleOrderNow = async (type: 'mineral' | 'cold', title: string) => {
    if (loading) return;
    setLoading(type);
    setStatusMsg(null);

    const qty = quantities[type] || 1;
    const price = getPriceForType(type);
    const size = selectedSizes[type];
    const itemName = size ? `${title} (${size})` : title;

    try {
      const res = await fetch('/api/orders/create', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          hotel_id: hotelId,
          table_number: tableNumber,
          order_type: 'dine_in',
          payment_method: 'pay_at_table',
          items: [
            {
              menu_item_id: null,
              quantity: qty,
              price_at_time: price,
              item_name: itemName,
              item_kind: 'water',
              notes: null,
            },
          ],
        }),
      });
      const data = await res.json();
      if (!res.ok || !data.success) throw new Error(data.error || 'Order failed');
      showStatus(
        type,
        'success',
        `✓ ${qty}x ${itemName} ordered! Order #${data.orderNumber || data.orderId} placed for Table ${tableNumber}.`
      );
      // Reset quantity after successful order
      setQuantities((prev) => ({ ...prev, [type]: 1 }));
    } catch (err: any) {
      showStatus(type, 'error', err.message || 'Could not place order. Please try again.');
    } finally {
      setLoading(null);
    }
  };

  const btnStyle = (disabled: boolean): React.CSSProperties => ({
    padding: '0.5rem 1rem',
    borderRadius: 8,
    background: disabled ? 'rgba(201,169,110,0.4)' : 'var(--gold, #C9A96E)',
    color: '#0B0B0A',
    fontSize: '0.75rem',
    fontWeight: 600,
    border: 'none',
    cursor: disabled ? 'not-allowed' : 'pointer',
    opacity: disabled ? 0.7 : 1,
    transition: 'opacity 0.15s',
    whiteSpace: 'nowrap' as const,
  });

  const qtyBtnStyle: React.CSSProperties = {
    width: 28,
    height: 28,
    borderRadius: 6,
    background: 'rgba(243,239,231,0.08)',
    border: 'none',
    color: 'var(--text-primary, #F3EFE7)',
    cursor: 'pointer',
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
                Table {tableNumber} · Orders placed instantly
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

        <div className="p-5 flex flex-col gap-4">

          {/* ── 1. Normal Water ── */}
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
                    Filtered drinking water served complimentary.
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
                    flexShrink: 0,
                  }}
                >
                  FREE
                </span>
              </div>

              {/* Status for normal */}
              {statusMsg?.key === 'normal' && (
                <div
                  style={{
                    padding: '0.5rem 0.75rem',
                    borderRadius: 8,
                    fontSize: '0.8125rem',
                    background: statusMsg.type === 'success' ? 'rgba(16,185,129,0.12)' : 'rgba(239,68,68,0.12)',
                    color: statusMsg.type === 'success' ? '#34D399' : '#F87171',
                    border: `1px solid ${statusMsg.type === 'success' ? 'rgba(16,185,129,0.3)' : 'rgba(239,68,68,0.3)'}`,
                  }}
                >
                  {statusMsg.text}
                </div>
              )}

              <div className="flex items-center justify-between pt-2" style={{ borderTop: '1px solid rgba(243,239,231,0.05)' }}>
                <div className="flex items-center gap-2">
                  <button
                    type="button"
                    onClick={() => setQuantities({ ...quantities, normal: Math.max(1, (quantities.normal || 1) - 1) })}
                    style={qtyBtnStyle}
                  >
                    -
                  </button>
                  <span style={{ fontSize: '0.875rem', fontWeight: 600, minWidth: 20, textAlign: 'center', color: 'var(--text-primary, #F3EFE7)' }}>
                    {quantities.normal || 1}
                  </span>
                  <button
                    type="button"
                    onClick={() => setQuantities({ ...quantities, normal: (quantities.normal || 1) + 1 })}
                    style={qtyBtnStyle}
                  >
                    +
                  </button>
                </div>

                <button
                  type="button"
                  disabled={loading === 'normal'}
                  onClick={handleNormalWater}
                  style={btnStyle(loading === 'normal')}
                >
                  {loading === 'normal' ? '⏳ Sending…' : 'Request Free Water'}
                </button>
              </div>
            </div>
          )}

          {/* ── 2. Mineral Water ── */}
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
                    flexShrink: 0,
                  }}
                >
                  {formatPrice(getPriceForType('mineral'), currency)}
                </span>
              </div>

              {/* Sizes */}
              {mineralConfig.sizes && mineralConfig.sizes.filter((s) => s.enabled).length > 0 && (
                <div className="flex items-center gap-2 flex-wrap">
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

              {/* Status for mineral */}
              {statusMsg?.key === 'mineral' && (
                <div
                  style={{
                    padding: '0.5rem 0.75rem',
                    borderRadius: 8,
                    fontSize: '0.8125rem',
                    background: statusMsg.type === 'success' ? 'rgba(16,185,129,0.12)' : 'rgba(239,68,68,0.12)',
                    color: statusMsg.type === 'success' ? '#34D399' : '#F87171',
                    border: `1px solid ${statusMsg.type === 'success' ? 'rgba(16,185,129,0.3)' : 'rgba(239,68,68,0.3)'}`,
                  }}
                >
                  {statusMsg.text}
                </div>
              )}

              <div className="flex items-center justify-between pt-2" style={{ borderTop: '1px solid rgba(243,239,231,0.05)' }}>
                <div className="flex items-center gap-2">
                  <button
                    type="button"
                    onClick={() => setQuantities({ ...quantities, mineral: Math.max(1, (quantities.mineral || 1) - 1) })}
                    style={qtyBtnStyle}
                  >
                    -
                  </button>
                  <span style={{ fontSize: '0.875rem', fontWeight: 600, minWidth: 20, textAlign: 'center', color: 'var(--text-primary, #F3EFE7)' }}>
                    {quantities.mineral || 1}
                  </span>
                  <button
                    type="button"
                    onClick={() => setQuantities({ ...quantities, mineral: (quantities.mineral || 1) + 1 })}
                    style={qtyBtnStyle}
                  >
                    +
                  </button>
                </div>

                <button
                  type="button"
                  disabled={loading === 'mineral'}
                  onClick={() => handleOrderNow('mineral', 'Mineral Water')}
                  style={btnStyle(loading === 'mineral')}
                >
                  {loading === 'mineral'
                    ? '⏳ Ordering…'
                    : `Order Now • ${formatPrice(getPriceForType('mineral') * (quantities.mineral || 1), currency)}`}
                </button>
              </div>
            </div>
          )}

          {/* ── 3. Cold Water ── */}
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
                    flexShrink: 0,
                  }}
                >
                  {formatPrice(getPriceForType('cold'), currency)}
                </span>
              </div>

              {/* Sizes */}
              {coldConfig.sizes && coldConfig.sizes.filter((s) => s.enabled).length > 0 && (
                <div className="flex items-center gap-2 flex-wrap">
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

              {/* Status for cold */}
              {statusMsg?.key === 'cold' && (
                <div
                  style={{
                    padding: '0.5rem 0.75rem',
                    borderRadius: 8,
                    fontSize: '0.8125rem',
                    background: statusMsg.type === 'success' ? 'rgba(16,185,129,0.12)' : 'rgba(239,68,68,0.12)',
                    color: statusMsg.type === 'success' ? '#34D399' : '#F87171',
                    border: `1px solid ${statusMsg.type === 'success' ? 'rgba(16,185,129,0.3)' : 'rgba(239,68,68,0.3)'}`,
                  }}
                >
                  {statusMsg.text}
                </div>
              )}

              <div className="flex items-center justify-between pt-2" style={{ borderTop: '1px solid rgba(243,239,231,0.05)' }}>
                <div className="flex items-center gap-2">
                  <button
                    type="button"
                    onClick={() => setQuantities({ ...quantities, cold: Math.max(1, (quantities.cold || 1) - 1) })}
                    style={qtyBtnStyle}
                  >
                    -
                  </button>
                  <span style={{ fontSize: '0.875rem', fontWeight: 600, minWidth: 20, textAlign: 'center', color: 'var(--text-primary, #F3EFE7)' }}>
                    {quantities.cold || 1}
                  </span>
                  <button
                    type="button"
                    onClick={() => setQuantities({ ...quantities, cold: (quantities.cold || 1) + 1 })}
                    style={qtyBtnStyle}
                  >
                    +
                  </button>
                </div>

                <button
                  type="button"
                  disabled={loading === 'cold'}
                  onClick={() => handleOrderNow('cold', 'Cold Water')}
                  style={btnStyle(loading === 'cold')}
                >
                  {loading === 'cold'
                    ? '⏳ Ordering…'
                    : `Order Now • ${formatPrice(getPriceForType('cold') * (quantities.cold || 1), currency)}`}
                </button>
              </div>
            </div>
          )}

        </div>
      </div>
    </div>
  );
}
