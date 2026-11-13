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
      <span style={{ fontSize: '0.5625rem', letterSpacing: '0.18em', textTransform: 'uppercase' }}>
        Preparing 3D view
      </span>
    </div>
  ),
});

// AR delivery via Google <model-viewer> (Scene Viewer / Quick Look / WebXR)
const ArViewer = dynamic(() => import('@/components/3d/ArViewer'), {
  ssr: false,
  loading: () => (
    <div style={{ width: '100%', height: '100%', display: 'flex', alignItems: 'center', justifyContent: 'center', color: 'var(--text-dimmed)', fontSize: '0.6875rem' }}>
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
      className="fixed inset-0 z-50 flex items-center justify-center p-4"
      style={{ background: 'rgba(6,5,4,0.86)', backdropFilter: 'blur(10px)' }}
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
          overflowY: 'auto',
          background: 'var(--bg-surface)',
          border: '1px solid var(--border-warm)',
          borderRadius: 10,
        }}
      >
        <div style={{ position: 'relative', height: 'min(52vh, 420px)', background: 'var(--bg-secondary)' }}>
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
              <div style={{ position: 'absolute', inset: 0, display: 'flex', alignItems: 'flex-end', justifyContent: 'center', padding: 16, background: 'linear-gradient(to top, rgba(0,0,0,0.45), transparent 40%)' }}>
                <span style={{ color: '#fff', fontSize: '0.75rem', textAlign: 'center' }}>
                  3D preview requires a GLB model. {hasUsdz ? 'A USDZ model is available for AR on compatible Apple devices.' : 'No 3D model uploaded.'}
                </span>
              </div>
            </div>
          ) : (
            <div style={{ width: '100%', height: '100%', display: 'flex', alignItems: 'center', justifyContent: 'center', color: 'var(--text-dimmed)', fontSize: '0.75rem', padding: 20, textAlign: 'center' }}>
              No 3D model uploaded for this dish.
            </div>
          )}

          <button
            type="button"
            onClick={onClose}
            aria-label="Close 3D view"
            style={{
              position: 'absolute',
              top: 12,
              right: 12,
              width: 32,
              height: 32,
              borderRadius: '50%',
              background: 'rgba(11,10,8,0.75)',
              border: '1px solid var(--border-subtle)',
              backdropFilter: 'blur(6px)',
              color: 'var(--text-secondary)',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              cursor: 'pointer',
              zIndex: 5,
            }}
          >
            <svg width="12" height="12" viewBox="0 0 12 12" fill="none" aria-hidden="true">
              <path d="M1 1L11 11M11 1L1 11" stroke="currentColor" strokeWidth="1.4" strokeLinecap="round" />
            </svg>
          </button>

          <div style={{ position: 'absolute', top: 12, left: 12, zIndex: 5, display: 'flex', gap: 6, flexWrap: 'wrap' }}>
            <span className="d3-chip d3-chip-3d" style={{ background: 'rgba(11,10,8,0.75)', backdropFilter: 'blur(6px)' }}>
              <CubeIcon size={10} />
              {effectiveMode === 'ar' ? 'AR View' : '3D Preview'}
            </span>
            {hasGlb ? <span className="d3-chip" style={{ background: 'rgba(11,10,8,0.72)', backdropFilter: 'blur(6px)' }}>GLB</span> : null}
            {hasUsdz ? <span className="d3-chip" style={{ background: 'rgba(11,10,8,0.72)', backdropFilter: 'blur(6px)' }}>USDZ</span> : null}
          </div>

          {hasAnyModel ? (
            <div style={{ position: 'absolute', bottom: 12, right: 12, zIndex: 5, display: 'flex', gap: 8, flexWrap: 'wrap', justifyContent: 'flex-end' }}>
              <button
                type="button"
                onClick={() => setMode('3d')}
                className={effectiveMode === '3d' ? 'd3-btn-quiet' : 'd3-btn-subtle'}
                style={{ padding: '0.4rem 0.75rem', fontSize: '0.625rem' }}
              >
                3D Preview
              </button>
              <button
                type="button"
                onClick={() => { if (arAvailableForDevice) setMode('ar'); }}
                disabled={!arAvailableForDevice}
                className={effectiveMode === 'ar' ? 'd3-btn-quiet' : 'd3-btn-subtle'}
                style={{ padding: '0.4rem 0.75rem', fontSize: '0.625rem', opacity: arAvailableForDevice ? 1 : 0.55, cursor: arAvailableForDevice ? 'pointer' : 'not-allowed' }}
                title={arAvailableForDevice ? 'View in AR on this device' : arMessage}
              >
                View in AR
              </button>
            </div>
          ) : null}
        </div>

        <div style={{ padding: '1.5rem 1.75rem 1.75rem', display: 'flex', flexDirection: 'column', gap: '1rem' }}>
          <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', gap: 16 }}>
            <div style={{ minWidth: 0 }}>
              {categoryName ? (
                <span style={{ fontSize: '0.5625rem', fontWeight: 600, letterSpacing: '0.18em', textTransform: 'uppercase', color: 'var(--gold-dim)' }}>
                  {categoryName}
                </span>
              ) : null}
              <h2 style={{ fontFamily: 'var(--font-display)', fontSize: '1.75rem', fontWeight: 500, color: 'var(--text-primary)', letterSpacing: '-0.02em', lineHeight: 1.2, margin: '0.25rem 0 0' }}>
                {item.name}
              </h2>
              {item.description ? (
                <p style={{ margin: '0.5rem 0 0', fontSize: '0.875rem', lineHeight: 1.65, color: 'var(--text-muted)', maxWidth: '52ch' }}>
                  {item.description}
                </p>
              ) : null}
            </div>
            <span style={{ fontFamily: 'var(--font-display)', fontSize: '1.5rem', fontWeight: 500, color: 'var(--gold)', letterSpacing: '-0.02em', flexShrink: 0 }}>
              {priceLabel}
            </span>
          </div>

          <div className="d3-divider" />

          <div style={{ display: 'flex', alignItems: 'center', flexWrap: 'wrap', gap: 12, fontSize: '0.6875rem', color: 'var(--text-dimmed)' }}>
            {item.calories ? <span>{item.calories} kcal</span> : null}
            {item.preparation_time_mins ? <span>{item.preparation_time_mins} min prep</span> : null}
            {Number(item.rating) > 0 ? <span style={{ color: 'var(--gold)' }}>★ {Number(item.rating).toFixed(1)}</span> : null}
            {Array.isArray(item.dietary_tags) && item.dietary_tags.map((tag) => (
              <span key={tag} className="d3-chip">{tag}</span>
            ))}
          </div>

          <div style={{ fontSize: '0.6875rem', color: 'var(--text-muted)', lineHeight: 1.5 }}>
            {arMessage} {arAvailableForDevice ? ' Tap "View in your space" in AR mode to place the model (camera permission/device support required).' : ''}
            {!hasGlb && hasUsdz ? ' 3D preview in this viewer requires a GLB model.' : ''}
          </div>

          <div style={{ display: 'flex', alignItems: 'center', flexWrap: 'wrap', gap: 8, marginTop: '0.25rem' }}>
            <button type="button" className="d3-btn-subtle" onClick={onClose}>Close</button>
            {arAvailableForDevice ? (
              <button type="button" className="d3-btn-3d" onClick={() => setMode('ar')}>
                <CubeIcon size={10} />
                View in AR
              </button>
            ) : null}
          </div>
        </div>
      </div>
    </div>
  );
}
