'use client';

import React, { useEffect, useState } from 'react';
import dynamic from 'next/dynamic';
import { CubeIcon } from './DishCard';
import { detectArPlatform, isArSupportedForDevice, arAvailabilityLabel } from '@/lib/arAvailability';

// Existing 3D preview viewer (preserved)
const FoodModelViewer = dynamic(() => import('@/components/3d/FoodModelViewer'), {
  ssr: false,
  loading: () => (
    <div
      style={{
        width: '100%',
        height: '100%',
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        justifyContent: 'center',
        gap: 14,
        background: 'var(--bg-secondary)',
        color: 'var(--text-dimmed)',
      }}
    >
      <span
        style={{
          width: 26,
          height: 26,
          borderRadius: '50%',
          border: '1px solid rgba(201,169,110,0.18)',
          borderTopColor: 'var(--gold)',
          animation: 'spin 1.1s linear infinite',
        }}
      />
      <span style={{ fontSize: '0.625rem', letterSpacing: '0.18em', textTransform: 'uppercase' }}>
        Preparing 3D view
      </span>
    </div>
  ),
});

// AR delivery via Google <model-viewer> (Scene Viewer / Quick Look / WebXR)
const ArViewer = dynamic(() => import('@/components/3d/ArViewer'), {
  ssr: false,
  loading: () => (
    <div style={{ width: '100%', height: '100%', display: 'flex', alignItems: 'center', justifyContent: 'center', color: 'var(--text-dimmed)', fontSize: '0.75rem' }}>
      Loading AR…
    </div>
  ),
});

interface Dish3DItem {
  id: string;
  name: string;
  description: string | null;
  price: number;
  image_url: string | null;
  model_url_glb: string | null;
  model_url_usdz: string | null;
  is_veg: boolean;
  calories: number | null;
  preparation_time_mins: number | null;
  dietary_tags: string[] | null;
  rating: number | null;
  order_count: number | null;
}

interface Dish3DModalProps {
  item: Dish3DItem | null;
  priceLabel: string;
  categoryName: string;
  onClose: () => void;
  initialMode?: '3d' | 'ar';
}

/**
 * 3D preview remains available independently of AR (GLB-based viewer when present;
 * image fallback otherwise). AR availability is per-device and per-format:
 * - Android: GLB enables AR (Scene Viewer/WebXR)
 * - iPhone/iPad: USDZ enables AR (Quick Look)
 * - Both: correct format selected automatically
 * GLB and USDZ are NOT both required.
 */
export default function Dish3DModal({ item, priceLabel, categoryName, onClose, initialMode = '3d' }: Dish3DModalProps) {
  const [mode, setMode] = useState<'3d' | 'ar'>(initialMode === 'ar' ? 'ar' : '3d');
  const [platform, setPlatform] = useState<'ios' | 'android' | 'other'>('other');

  useEffect(() => {
    setPlatform(detectArPlatform());
  }, []);

  useEffect(() => {
    setMode(initialMode === 'ar' ? 'ar' : '3d');
  }, [initialMode, item?.id]);

  if (!item) return null;

  const modelUrlGlb = item.model_url_glb?.trim() || '';
  const modelUrlUsdz = item.model_url_usdz?.trim() || '';
  const photo = item.image_url?.trim() || '';
  const hasGlb = Boolean(modelUrlGlb);
  const hasUsdz = Boolean(modelUrlUsdz);
  const hasAnyModel = hasGlb || hasUsdz;
  const arAvailableForDevice = isArSupportedForDevice(platform, modelUrlGlb, modelUrlUsdz);
  const effectiveMode = mode === 'ar' && arAvailableForDevice ? 'ar' : '3d';
  const arMessage = arAvailabilityLabel(platform, modelUrlGlb, modelUrlUsdz);

  return (
    <div
      className="fixed inset-0 z-[70] flex items-center justify-center p-3 sm:p-4"
      style={{ background: 'rgba(6,5,4,0.88)', backdropFilter: 'blur(12px)' }}
      onClick={(e) => {
        if (e.target === e.currentTarget) onClose();
      }}
      role="dialog"
      aria-modal="true"
      aria-label={`${item.name} 3D view`}
    >
      <div
        style={{
          width: '100%',
          maxWidth: 860,
          maxHeight: '90vh',
          display: 'flex',
          flexDirection: 'column',
          background: 'var(--bg-surface)',
          border: '1px solid var(--border-medium, rgba(184,164,122,0.25))',
          borderRadius: 'var(--d3-modal-radius, 14px)',
          boxShadow: '0 24px 64px rgba(0,0,0,0.7)',
          overflow: 'hidden',
        }}
      >
        <div style={{ position: 'relative', height: 'min(50vh, 400px)', flexShrink: 0, background: 'var(--bg-secondary)' }}>
          {effectiveMode === 'ar' && arAvailableForDevice ? (
            <ArViewer
              modelUrlGlb={hasGlb ? modelUrlGlb : undefined}
              modelUrlUsdz={hasUsdz ? modelUrlUsdz : undefined}
              altText={item.name}
              posterUrl={photo || undefined}
              className="h-full w-full"
            />
          ) : hasGlb ? (
            <FoodModelViewer
              modelUrlGlb={modelUrlGlb}
              modelUrlUsdz={hasUsdz ? modelUrlUsdz : undefined}
              imageUrl={photo || undefined}
              altText={item.name}
              autoRotate
              className="h-full w-full"
            />
          ) : photo ? (
            <div style={{ width: '100%', height: '100%', display: 'flex', alignItems: 'center', justifyContent: 'center', position: 'relative' }}>
              <img src={photo} alt={item.name} style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
              <div style={{ position: 'absolute', inset: 0, display: 'flex', alignItems: 'flex-end', justifyContent: 'center', padding: 16, background: 'linear-gradient(to top, rgba(0,0,0,0.5), transparent 50%)' }}>
                <span style={{ color: '#fff', fontSize: '0.8125rem', fontWeight: 500, textAlign: 'center' }}>
                  3D preview requires a GLB model. {hasUsdz ? 'A USDZ model is available for AR on compatible Apple devices.' : 'No 3D model uploaded.'}
                </span>
              </div>
            </div>
          ) : (
            <div style={{ width: '100%', height: '100%', display: 'flex', alignItems: 'center', justifyContent: 'center', color: 'var(--text-dimmed)', fontSize: '0.8125rem', padding: 20, textAlign: 'center' }}>
              No 3D model uploaded for this dish.
            </div>
          )}

          {/* Close button */}
          <button
            type="button"
            onClick={onClose}
            aria-label="Close 3D view"
            style={{
              position: 'absolute',
              top: 12,
              right: 12,
              width: 36,
              height: 36,
              borderRadius: '50%',
              background: 'rgba(11,10,8,0.85)',
              border: '1px solid var(--border-medium, rgba(255,255,255,0.2))',
              backdropFilter: 'blur(8px)',
              color: 'var(--text-primary, #F3EFE7)',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              cursor: 'pointer',
              zIndex: 10,
              transition: 'transform 150ms ease, background 150ms ease',
            }}
          >
            <svg width="14" height="14" viewBox="0 0 12 12" fill="none" aria-hidden="true">
              <path d="M1 1L11 11M11 1L1 11" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" />
            </svg>
          </button>

          {/* Format Badges */}
          <div style={{ position: 'absolute', top: 12, left: 12, zIndex: 10, display: 'flex', gap: 6, flexWrap: 'wrap' }}>
            <span
              style={{
                display: 'inline-flex',
                alignItems: 'center',
                gap: 5,
                padding: '0.25rem 0.6rem',
                borderRadius: 6,
                background: 'rgba(11,10,8,0.85)',
                border: '1px solid var(--border-medium, rgba(184,164,122,0.3))',
                color: 'var(--gold, #B8A47A)',
                fontSize: '0.6875rem',
                fontWeight: 600,
                letterSpacing: '0.04em',
                backdropFilter: 'blur(8px)',
              }}
            >
              <CubeIcon size={12} />
              {effectiveMode === 'ar' ? 'AR View Active' : '3D Interactive'}
            </span>
            {hasGlb ? (
              <span
                style={{
                  padding: '0.25rem 0.5rem',
                  borderRadius: 6,
                  background: 'rgba(11,10,8,0.75)',
                  border: '1px solid var(--border-warm, rgba(255,255,255,0.15))',
                  color: 'var(--text-secondary, #C2BCB0)',
                  fontSize: '0.625rem',
                  fontWeight: 600,
                  backdropFilter: 'blur(8px)',
                }}
              >
                GLB
              </span>
            ) : null}
            {hasUsdz ? (
              <span
                style={{
                  padding: '0.25rem 0.5rem',
                  borderRadius: 6,
                  background: 'rgba(11,10,8,0.75)',
                  border: '1px solid var(--border-warm, rgba(255,255,255,0.15))',
                  color: 'var(--text-secondary, #C2BCB0)',
                  fontSize: '0.625rem',
                  fontWeight: 600,
                  backdropFilter: 'blur(8px)',
                }}
              >
                USDZ
              </span>
            ) : null}
          </div>

          {/* Mode Switcher: 3D Preview vs View in AR (Tactile, High-Contrast Segmented Switch) */}
          {hasAnyModel ? (
            <div
              style={{
                position: 'absolute',
                bottom: 12,
                right: 12,
                zIndex: 10,
                display: 'flex',
                alignItems: 'center',
                gap: 4,
                padding: 4,
                borderRadius: 999,
                background: 'rgba(11,10,8,0.92)',
                border: '1px solid var(--border-medium, rgba(184,164,122,0.35))',
                backdropFilter: 'blur(12px)',
                boxShadow: '0 4px 16px rgba(0,0,0,0.4)',
              }}
            >
              <button
                type="button"
                onClick={() => setMode('3d')}
                style={{
                  padding: '0.45rem 0.85rem',
                  borderRadius: 999,
                  fontSize: '0.75rem',
                  fontWeight: 600,
                  cursor: 'pointer',
                  border: effectiveMode === '3d' ? '1px solid var(--gold, #B8A47A)' : '1px solid transparent',
                  background: effectiveMode === '3d' ? 'var(--gold, #B8A47A)' : 'transparent',
                  color: effectiveMode === '3d' ? '#0B0B0A' : 'var(--text-secondary, #F3EFE7)',
                  transition: 'all 180ms ease',
                }}
              >
                3D Preview
              </button>
              <button
                type="button"
                onClick={() => { if (arAvailableForDevice) setMode('ar'); }}
                disabled={!arAvailableForDevice}
                title={arAvailableForDevice ? 'View in AR on this device' : arMessage}
                style={{
                  padding: '0.45rem 0.85rem',
                  borderRadius: 999,
                  fontSize: '0.75rem',
                  fontWeight: 600,
                  cursor: arAvailableForDevice ? 'pointer' : 'not-allowed',
                  border: effectiveMode === 'ar' ? '1px solid var(--gold, #B8A47A)' : '1px solid transparent',
                  background: effectiveMode === 'ar' ? 'var(--gold, #B8A47A)' : 'transparent',
                  color: effectiveMode === 'ar'
                    ? '#0B0B0A'
                    : arAvailableForDevice
                    ? 'var(--text-secondary, #F3EFE7)'
                    : 'var(--text-dimmed, #777)',
                  opacity: arAvailableForDevice ? 1 : 0.45,
                  transition: 'all 180ms ease',
                }}
              >
                View in AR
              </button>
            </div>
          ) : null}
        </div>

        {/* Scrollable details content */}
        <div
          style={{
            flex: 1,
            overflowY: 'auto',
            padding: '1.25rem 1.5rem',
            display: 'flex',
            flexDirection: 'column',
            gap: '1rem',
          }}
        >
          <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', gap: 16 }}>
            <div style={{ minWidth: 0, flex: 1 }}>
              {categoryName ? (
                <span style={{ fontSize: '0.625rem', fontWeight: 700, letterSpacing: '0.15em', textTransform: 'uppercase', color: 'var(--gold, #B8A47A)' }}>
                  {categoryName}
                </span>
              ) : null}
              <h2 style={{ fontFamily: 'var(--font-display)', fontSize: '1.5rem', fontWeight: 600, color: 'var(--text-primary, #F3EFE7)', letterSpacing: '-0.02em', lineHeight: 1.25, margin: '0.25rem 0 0' }}>
                {item.name}
              </h2>
              {item.description ? (
                <p style={{ margin: '0.5rem 0 0', fontSize: '0.8125rem', lineHeight: 1.6, color: 'var(--text-muted, #9B968C)', maxWidth: '58ch' }}>
                  {item.description}
                </p>
              ) : null}
            </div>
            <span style={{ fontFamily: 'var(--font-display)', fontSize: '1.375rem', fontWeight: 600, color: 'var(--gold, #B8A47A)', letterSpacing: '-0.02em', flexShrink: 0 }}>
              {priceLabel}
            </span>
          </div>

          <div style={{ height: 1, background: 'var(--border-subtle, rgba(255,255,255,0.08))', width: '100%' }} />

          <div style={{ display: 'flex', alignItems: 'center', flexWrap: 'wrap', gap: 12, fontSize: '0.75rem', color: 'var(--text-secondary, #C2BCB0)' }}>
            {item.calories ? (
              <span style={{ display: 'inline-flex', alignItems: 'center', gap: 4 }}>
                <span style={{ color: 'var(--gold, #B8A47A)' }}>⚡</span> {item.calories} kcal
              </span>
            ) : null}
            {item.preparation_time_mins ? (
              <span style={{ display: 'inline-flex', alignItems: 'center', gap: 4 }}>
                <span style={{ color: 'var(--gold, #B8A47A)' }}>⏱</span> {item.preparation_time_mins} min prep
              </span>
            ) : null}
            {Number(item.rating) > 0 ? (
              <span style={{ display: 'inline-flex', alignItems: 'center', gap: 4, color: 'var(--gold, #B8A47A)', fontWeight: 600 }}>
                ★ {Number(item.rating).toFixed(1)}
              </span>
            ) : null}
            {Array.isArray(item.dietary_tags) && item.dietary_tags.map((tag) => (
              <span
                key={tag}
                style={{
                  padding: '0.2rem 0.5rem',
                  borderRadius: 4,
                  background: 'var(--bg-surface-2, rgba(255,255,255,0.06))',
                  border: '1px solid var(--border-subtle, rgba(255,255,255,0.1))',
                  fontSize: '0.6875rem',
                  color: 'var(--text-secondary, #C2BCB0)',
                }}
              >
                {tag}
              </span>
            ))}
          </div>

          <div
            style={{
              padding: '0.625rem 0.875rem',
              borderRadius: 8,
              background: 'var(--bg-surface-2, rgba(255,255,255,0.04))',
              border: '1px solid var(--border-subtle, rgba(255,255,255,0.08))',
              fontSize: '0.75rem',
              color: 'var(--text-muted, #9B968C)',
              lineHeight: 1.5,
            }}
          >
            {arMessage} {arAvailableForDevice ? ' Tap "View in your space" in AR mode to place the model in real scale.' : ''}
            {!hasGlb && hasUsdz ? ' 3D preview in this viewer requires a GLB model.' : ''}
          </div>

          {/* Action Row */}
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'flex-end', gap: 10, marginTop: 'auto', paddingTop: '0.5rem' }}>
            <button
              type="button"
              onClick={onClose}
              style={{
                padding: '0.55rem 1.125rem',
                borderRadius: 8,
                background: 'var(--bg-surface-2, rgba(255,255,255,0.08))',
                border: '1px solid var(--border-warm, rgba(255,255,255,0.15))',
                color: 'var(--text-primary, #F3EFE7)',
                fontSize: '0.8125rem',
                fontWeight: 500,
                cursor: 'pointer',
                transition: 'all 150ms ease',
              }}
            >
              Close
            </button>
            {arAvailableForDevice && effectiveMode !== 'ar' ? (
              <button
                type="button"
                onClick={() => setMode('ar')}
                style={{
                  display: 'inline-flex',
                  alignItems: 'center',
                  gap: 6,
                  padding: '0.55rem 1.25rem',
                  borderRadius: 8,
                  background: 'var(--gold, #B8A47A)',
                  border: '1px solid var(--gold, #B8A47A)',
                  color: '#0B0B0A',
                  fontSize: '0.8125rem',
                  fontWeight: 700,
                  cursor: 'pointer',
                  transition: 'all 150ms ease',
                }}
              >
                <CubeIcon size={13} />
                <span>Launch AR Placement</span>
              </button>
            ) : null}
          </div>
        </div>
      </div>
    </div>
  );
}
