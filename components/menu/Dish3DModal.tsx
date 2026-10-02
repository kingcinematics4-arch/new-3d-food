'use client';

import React from 'react';
import dynamic from 'next/dynamic';
import type { MenuItem } from '@/lib/useHotel';
import { CubeIcon } from './DishCard';

// The 3D canvas is heavy — only load it when the modal is actually opened.
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

interface Dish3DModalProps {
  item: MenuItem | null;
  priceLabel: string;
  categoryName: string;
  onClose: () => void;
}

/**
 * Optional 3D enhancement. Rendered only for dishes that actually have a
 * model attached — never as a stand-in for the food photograph.
 */
export default function Dish3DModal({ item, priceLabel, categoryName, onClose }: Dish3DModalProps) {
  if (!item) return null;

  const modelUrlGlb = item.model_url_glb?.trim() || '';
  const modelUrlUsdz = item.model_url_usdz?.trim() || '';
  const photo = item.image_url?.trim() || '';

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
          overflow: 'hidden',
        }}
      >
        {/* Viewer */}
        <div style={{ position: 'relative', height: 'min(52vh, 420px)', background: 'var(--bg-secondary)' }}>
          <FoodModelViewer
            modelUrlGlb={modelUrlGlb || undefined}
            modelUrlUsdz={modelUrlUsdz || undefined}
            imageUrl={photo || undefined}
            altText={item.name}
            autoRotate
            className="h-full w-full"
          />

          {/* Close */}
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
            }}
          >
            <svg width="12" height="12" viewBox="0 0 12 12" fill="none" aria-hidden="true">
              <path d="M1 1L11 11M11 1L1 11" stroke="currentColor" strokeWidth="1.4" strokeLinecap="round" />
            </svg>
          </button>

          <div style={{ position: 'absolute', top: 12, left: 12 }}>
            <span className="d3-chip d3-chip-3d" style={{ background: 'rgba(11,10,8,0.75)', backdropFilter: 'blur(6px)' }}>
              <CubeIcon size={10} />
              3D Experience
            </span>
          </div>
        </div>

        {/* Details */}
        <div style={{ padding: '1.5rem 1.75rem 1.75rem', display: 'flex', flexDirection: 'column', gap: '1rem' }}>
          <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', gap: 16 }}>
            <div style={{ minWidth: 0 }}>
              {categoryName && (
                <span
                  style={{
                    fontSize: '0.5625rem',
                    fontWeight: 600,
                    letterSpacing: '0.18em',
                    textTransform: 'uppercase',
                    color: 'var(--gold-dim)',
                  }}
                >
                  {categoryName}
                </span>
              )}
              <h2
                style={{
                  fontFamily: 'var(--font-display)',
                  fontSize: '1.75rem',
                  fontWeight: 500,
                  color: 'var(--text-primary)',
                  letterSpacing: '-0.02em',
                  lineHeight: 1.2,
                  margin: '0.25rem 0 0',
                }}
              >
                {item.name}
              </h2>
              {item.description && (
                <p
                  style={{
                    margin: '0.5rem 0 0',
                    fontSize: '0.875rem',
                    lineHeight: 1.65,
                    color: 'var(--text-muted)',
                    maxWidth: '52ch',
                  }}
                >
                  {item.description}
                </p>
              )}
            </div>
            <span
              style={{
                fontFamily: 'var(--font-display)',
                fontSize: '1.5rem',
                fontWeight: 500,
                color: 'var(--gold)',
                letterSpacing: '-0.02em',
                flexShrink: 0,
              }}
            >
              {priceLabel}
            </span>
          </div>

          <div className="d3-divider" />

          <div
            style={{
              display: 'flex',
              alignItems: 'center',
              flexWrap: 'wrap',
              gap: 12,
              fontSize: '0.6875rem',
              color: 'var(--text-dimmed)',
            }}
          >
            {item.calories ? <span>{item.calories} kcal</span> : null}
            {item.preparation_time_mins ? <span>{item.preparation_time_mins} min prep</span> : null}
            {Number(item.rating) > 0 ? <span style={{ color: 'var(--gold)' }}>★ {Number(item.rating).toFixed(1)}</span> : null}
            {Array.isArray(item.dietary_tags) &&
              item.dietary_tags.map((tag) => (
                <span key={tag} className="d3-chip">
                  {tag}
                </span>
              ))}
          </div>

          <div style={{ display: 'flex', alignItems: 'center', flexWrap: 'wrap', gap: 8, marginTop: '0.25rem' }}>
            <button type="button" className="d3-btn-subtle" onClick={onClose}>
              Close
            </button>
            {modelUrlUsdz && (
              <a
                href={modelUrlUsdz}
                rel="ar"
                target="_blank"
                className="d3-btn-3d"
                style={{ textDecoration: 'none' }}
              >
                <CubeIcon size={10} />
                View in AR
              </a>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
