'use client';

import React from 'react';
import type { MenuItem } from '@/lib/useHotel';

/* ============================================================
   ICONS — small, hairline, monochrome
   ============================================================ */

export function CubeIcon({ size = 11 }: { size?: number }) {
  return (
    <svg width={size} height={size} viewBox="0 0 16 16" fill="none" aria-hidden="true">
      <path
        d="M8 1.5L14 5v6L8 14.5L2 11V5L8 1.5Z"
        stroke="currentColor"
        strokeWidth="1.2"
        strokeLinejoin="round"
      />
      <path
        d="M8 1.5V14.5M2 5L8 8.5L14 5"
        stroke="currentColor"
        strokeWidth="0.9"
        strokeOpacity="0.55"
        strokeLinejoin="round"
      />
    </svg>
  );
}

function StarIcon({ filled }: { filled: boolean }) {
  return (
    <svg width="10" height="10" viewBox="0 0 12 12" fill="none" aria-hidden="true">
      <path
        d="M6 1L7.4 4.3L11 4.6L8.4 7L9.2 10.5L6 8.8L2.8 10.5L3.6 7L1 4.6L4.6 4.3L6 1Z"
        fill={filled ? 'var(--gold)' : 'transparent'}
        stroke={filled ? 'var(--gold)' : 'var(--text-dimmed)'}
        strokeWidth="1"
        strokeLinejoin="round"
        opacity={filled ? 0.9 : 0.45}
      />
    </svg>
  );
}

function PencilIcon() {
  return (
    <svg width="12" height="12" viewBox="0 0 14 14" fill="none" aria-hidden="true">
      <path
        d="M9.5 2.5L11.5 4.5M2 12L3 9L10 2L12 4L5 11L2 12Z"
        stroke="currentColor"
        strokeWidth="1.1"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </svg>
  );
}

function TrashIcon() {
  return (
    <svg width="12" height="12" viewBox="0 0 14 14" fill="none" aria-hidden="true">
      <path
        d="M2.5 3.5H11.5M5.5 3.5V2.5H8.5V3.5M3.5 3.5L4.2 11.5H9.8L10.5 3.5"
        stroke="currentColor"
        strokeWidth="1.1"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </svg>
  );
}

function ClockIcon() {
  return (
    <svg width="11" height="11" viewBox="0 0 12 12" fill="none" aria-hidden="true">
      <circle cx="6" cy="6" r="4.5" stroke="currentColor" strokeWidth="1" />
      <path d="M6 3.5V6L8 7.5" stroke="currentColor" strokeWidth="1" strokeLinecap="round" />
    </svg>
  );
}

function FlameIcon() {
  return (
    <svg width="11" height="11" viewBox="0 0 12 12" fill="none" aria-hidden="true">
      <path
        d="M6 1.5C6 1.5 3 3 2.5 6C2.9 8.4 4.3 10 6 10C7.7 10 9.1 8.4 9.5 6C9 3 6 1.5 6 1.5Z"
        stroke="currentColor"
        strokeWidth="1"
        strokeLinejoin="round"
      />
    </svg>
  );
}

function PhotoPlaceholder() {
  return (
    <div
      style={{
        position: 'absolute',
        inset: 0,
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        justifyContent: 'center',
        gap: 10,
        background:
          'linear-gradient(160deg, var(--bg-surface-2) 0%, var(--bg-secondary) 100%)',
        color: 'var(--text-dimmed)',
      }}
    >
      <svg width="30" height="30" viewBox="0 0 32 32" fill="none" style={{ opacity: 0.5 }} aria-hidden="true">
        <rect x="4.5" y="6.5" width="23" height="19" rx="3" stroke="currentColor" strokeWidth="1.1" />
        <circle cx="12" cy="13" r="2.2" stroke="currentColor" strokeWidth="1.1" />
        <path
          d="M5.5 22L12 16.5L17 20.5L21.5 17L27 22"
          stroke="currentColor"
          strokeWidth="1.1"
          strokeLinecap="round"
          strokeLinejoin="round"
        />
      </svg>
      <span
        style={{
          fontSize: '0.5625rem',
          fontWeight: 600,
          letterSpacing: '0.16em',
          textTransform: 'uppercase',
        }}
      >
        No photo yet
      </span>
    </div>
  );
}

/* ============================================================
   DISH CARD
   The food photograph is the hero. 3D is an optional,
   clearly-labelled enhancement — never the primary visual.
   ============================================================ */

interface DishCardProps {
  item: MenuItem;
  categoryName: string;
  priceLabel: string;
  onEdit: (item: MenuItem) => void;
  onDelete: (item: MenuItem) => void;
  onToggleAvailable: (item: MenuItem) => void;
  onToggleFeatured: (item: MenuItem) => void;
  onView3D: (item: MenuItem) => void;
}

export default function DishCard({
  item,
  categoryName,
  priceLabel,
  onEdit,
  onDelete,
  onToggleAvailable,
  onToggleFeatured,
  onView3D,
}: DishCardProps) {
  const photo = item.image_url?.trim() || '';
  const has3D = Boolean(item.model_url_glb?.trim() || item.model_url_usdz?.trim());
  const rating = Number(item.rating) || 0;
  const dietaryTags = Array.isArray(item.dietary_tags) ? item.dietary_tags : [];

  return (
    <article className="d3-dish-card">
      {/* ---------- Food photography ---------- */}
      <div
        style={{
          position: 'relative',
          width: '100%',
          aspectRatio: '4 / 3',
          background: 'var(--bg-secondary)',
          overflow: 'hidden',
        }}
      >
        {photo ? (
          <img
            src={photo}
            alt={item.name}
            loading="lazy"
            className="d3-dish-photo"
            style={{ width: '100%', height: '100%', objectFit: 'cover', display: 'block' }}
          />
        ) : (
          <PhotoPlaceholder />
        )}

        {/* Sold-out veil */}
        {!item.is_available && (
          <div
            style={{
              position: 'absolute',
              inset: 0,
              background: 'rgba(11,10,8,0.62)',
              backdropFilter: 'grayscale(0.6)',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
            }}
          >
            <span
              style={{
                padding: '0.3125rem 0.875rem',
                borderRadius: 6,
                border: '1px solid var(--border-medium)',
                background: 'rgba(11,10,8,0.75)',
                color: 'var(--text-secondary)',
                fontSize: '0.5625rem',
                fontWeight: 600,
                letterSpacing: '0.2em',
                textTransform: 'uppercase',
              }}
            >
              Sold Out
            </span>
          </div>
        )}

        {/* Top-left: status markers */}
        <div
          style={{
            position: 'absolute',
            top: 10,
            left: 10,
            display: 'flex',
            alignItems: 'center',
            gap: 6,
            flexWrap: 'wrap',
            maxWidth: '70%',
          }}
        >
          {item.is_featured && (
            <span className="d3-chip d3-chip-3d">Featured</span>
          )}
          {item.is_popular && !item.is_featured && <span className="d3-chip">Popular</span>}
        </div>

        {/* Top-right: 3D availability — only when a model exists */}
        {has3D && (
          <div style={{ position: 'absolute', top: 10, right: 10 }}>
            <span className="d3-chip d3-chip-3d" style={{ background: 'rgba(11,10,8,0.72)', backdropFilter: 'blur(6px)' }}>
              <CubeIcon size={10} />
              3D
            </span>
          </div>
        )}
      </div>

      {/* ---------- Details ---------- */}
      <div
        style={{
          padding: '1.125rem 1.25rem 1rem',
          display: 'flex',
          flexDirection: 'column',
          gap: '0.75rem',
          flex: 1,
        }}
      >
        {/* Category eyebrow + veg indicator */}
        <div style={{ display: 'flex', alignItems: 'center', gap: 8, minHeight: 14 }}>
          {categoryName ? (
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
          ) : (
            <span
              style={{
                fontSize: '0.5625rem',
                fontWeight: 600,
                letterSpacing: '0.18em',
                textTransform: 'uppercase',
                color: 'var(--text-dimmed)',
              }}
            >
              Uncategorised
            </span>
          )}
          {/* Veg / non-veg marker — outlined square, monochrome */}
          <span
            title={item.is_veg ? 'Vegetarian' : 'Non-vegetarian'}
            aria-label={item.is_veg ? 'Vegetarian' : 'Non-vegetarian'}
            style={{
              width: 8,
              height: 8,
              borderRadius: 2,
              flexShrink: 0,
              border: `1px solid ${item.is_veg ? 'var(--gold-dim)' : 'var(--text-dimmed)'}`,
              background: item.is_veg ? 'transparent' : 'var(--text-dimmed)',
            }}
          />
        </div>

        {/* Name + price */}
        <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', gap: 12 }}>
          <h3
            style={{
              fontFamily: 'var(--font-display)',
              fontSize: '1.3125rem',
              fontWeight: 500,
              color: 'var(--text-primary)',
              letterSpacing: '-0.015em',
              lineHeight: 1.25,
              margin: 0,
              minWidth: 0,
            }}
          >
            {item.name}
          </h3>
          <span
            style={{
              fontFamily: 'var(--font-display)',
              fontSize: '1.1875rem',
              fontWeight: 500,
              color: 'var(--gold)',
              letterSpacing: '-0.02em',
              flexShrink: 0,
              lineHeight: 1.3,
            }}
          >
            {priceLabel}
          </span>
        </div>

        {/* Description */}
        {item.description ? (
          <p
            style={{
              margin: 0,
              fontSize: '0.8125rem',
              lineHeight: 1.6,
              color: 'var(--text-muted)',
              display: '-webkit-box',
              WebkitLineClamp: 2,
              WebkitBoxOrient: 'vertical',
              overflow: 'hidden',
            }}
          >
            {item.description}
          </p>
        ) : null}

        {/* Dietary badges */}
        {dietaryTags.length > 0 && (
          <div style={{ display: 'flex', flexWrap: 'wrap', gap: 5 }}>
            {dietaryTags.slice(0, 3).map((tag) => (
              <span key={tag} className="d3-chip">
                {tag}
              </span>
            ))}
            {dietaryTags.length > 3 && (
              <span className="d3-chip" style={{ letterSpacing: '0.06em' }}>
                +{dietaryTags.length - 3}
              </span>
            )}
          </div>
        )}

        {/* Nutrition / prep meta */}
        <div
          style={{
            display: 'flex',
            alignItems: 'center',
            flexWrap: 'wrap',
            gap: 14,
            paddingTop: '0.75rem',
            borderTop: '1px solid var(--border-warm)',
            fontSize: '0.6875rem',
            color: 'var(--text-dimmed)',
          }}
        >
          {item.calories ? (
            <span style={{ display: 'inline-flex', alignItems: 'center', gap: 5 }}>
              <FlameIcon />
              {item.calories} kcal
            </span>
          ) : null}
          {item.preparation_time_mins ? (
            <span style={{ display: 'inline-flex', alignItems: 'center', gap: 5 }}>
              <ClockIcon />
              {item.preparation_time_mins} min
            </span>
          ) : null}
          {rating > 0 && (
            <span style={{ display: 'inline-flex', alignItems: 'center', gap: 5 }}>
              <span style={{ display: 'inline-flex', gap: 1.5 }}>
                {[0, 1, 2, 3, 4].map((i) => (
                  <StarIcon key={i} filled={i < Math.round(rating)} />
                ))}
              </span>
              <span style={{ color: 'var(--text-muted)' }}>{rating.toFixed(1)}</span>
            </span>
          )}
        </div>

        {/* Availability toggle */}
        <button
          type="button"
          onClick={() => onToggleAvailable(item)}
          title={item.is_available ? 'Mark as sold out' : 'Mark as available'}
          style={{
            display: 'inline-flex',
            alignItems: 'center',
            gap: 7,
            alignSelf: 'flex-start',
            padding: 0,
            background: 'none',
            border: 'none',
            cursor: 'pointer',
            fontSize: '0.6875rem',
            fontWeight: 500,
            letterSpacing: '0.08em',
            textTransform: 'uppercase',
            color: item.is_available ? 'var(--text-muted)' : 'var(--text-dimmed)',
          }}
        >
          <span
            style={{
              width: 6,
              height: 6,
              borderRadius: '50%',
              background: item.is_available ? 'var(--gold)' : 'transparent',
              border: item.is_available ? 'none' : '1px solid var(--text-dimmed)',
            }}
          />
          {item.is_available ? 'Available' : 'Sold Out'}
        </button>

        {/* Actions — View in 3D only when a model exists */}
        <div
          style={{
            display: 'flex',
            alignItems: 'center',
            flexWrap: 'wrap',
            gap: 7,
            marginTop: 'auto',
            paddingTop: '0.875rem',
            borderTop: '1px solid var(--border-warm)',
          }}
        >
          {has3D && (
            <button type="button" className="d3-btn-3d" onClick={() => onView3D(item)}>
              <CubeIcon size={10} />
              View in 3D
            </button>
          )}

          <button type="button" className="d3-btn-inline" onClick={() => onEdit(item)}>
            <PencilIcon />
            Edit
          </button>

          <button
            type="button"
            className="d3-btn-inline d3-btn-danger"
            onClick={() => onDelete(item)}
            title={`Delete ${item.name}`}
          >
            <TrashIcon />
          </button>

          <button
            type="button"
            className="d3-btn-inline"
            style={{ marginLeft: 'auto' }}
            onClick={() => onToggleFeatured(item)}
            title={item.is_featured ? 'Remove from featured' : 'Mark as featured'}
            aria-pressed={item.is_featured}
          >
            <span style={{ color: item.is_featured ? 'var(--gold)' : 'inherit' }}>
              {item.is_featured ? '★' : '☆'}
            </span>
          </button>
        </div>
      </div>
    </article>
  );
}
