'use client';

import React, { useState } from 'react';
import Link from 'next/link';
import { useHotel } from '@/lib/useHotel';
import { MENU_THEMES, getMenuTheme, type MenuThemeId, type MenuTheme } from '@/lib/menuThemes';

/* ============================================================
   MENU THEME SELECTOR
   Choose one of five built-in menu templates. Each template
   controls the public customer-facing menu's visuals and
   layout (background, typography, accent, cards, category
   nav, buttons, spacing, borders, shadows, header).
   ============================================================ */

export default function MenuThemePage() {
  const { hotel, loading: hotelLoading } = useHotel();
  const [selectedTheme, setSelectedTheme] = useState<MenuThemeId | null>(null);
  const [saving, setSaving] = useState(false);
  const [savedSuccess, setSavedSuccess] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const currentThemeId = (hotel?.menu_theme as MenuThemeId) || 'classic-luxury';

  const handleSelect = (themeId: MenuThemeId) => {
    setSelectedTheme(themeId);
  };

  const handleSave = async () => {
    if (!hotel || !selectedTheme) return;
    setSaving(true);
    setError(null);

    try {
      const res = await fetch('/api/hotel/update', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          hotel_id: hotel.id,
          menu_theme: selectedTheme,
        }),
      });
      const json = await res.json();

      if (!json.success) {
        throw new Error(json.error || 'Failed to save theme');
      }

      setSavedSuccess(true);
      setTimeout(() => setSavedSuccess(false), 3000);
    } catch (err: any) {
      setError(err.message || 'Failed to save theme');
    } finally {
      setSaving(false);
    }
  };

  if (hotelLoading) {
    return (
      <p style={{ color: 'var(--text-muted)', fontSize: '0.875rem' }}>
        Loading menu themes…
      </p>
    );
  }

  return (
    <div className="flex flex-col gap-10" style={{ maxWidth: 1180 }}>
      {/* ================= Page header ================= */}
      <header className="flex flex-col sm:flex-row items-start sm:items-end justify-between gap-5">
        <div>
          <span className="d3-eyebrow" style={{ fontSize: '0.5625rem' }}>
            Menu Design
          </span>
          <h1
            style={{
              fontFamily: 'var(--font-display)',
              fontSize: 'clamp(2rem, 4vw, 2.75rem)',
              fontWeight: 500,
              color: 'var(--text-primary)',
              letterSpacing: '-0.025em',
              lineHeight: 1.1,
              margin: '0.5rem 0 0',
            }}
          >
            Menu Themes
          </h1>
          <p
            style={{
              margin: '0.5rem 0 0',
              fontSize: '0.875rem',
              lineHeight: 1.6,
              color: 'var(--text-muted)',
              maxWidth: '54ch',
            }}
          >
            Five hand-crafted templates control the look and layout of your guest-facing menu. Each
            theme sets colours, typography, card shapes, category navigation, and spacing as a
            complete system — not just a colour swap.
          </p>
        </div>

        {hotel?.slug && (
          <Link
            href={`/menu/${hotel.slug}`}
            target="_blank"
            className="d3-btn-ghost"
            style={{ flexShrink: 0 }}
          >
            Open Live Menu
            <svg width="11" height="11" viewBox="0 0 12 12" fill="none" aria-hidden="true">
              <path
                d="M2.5 9.5L9.5 2.5M4.5 2.5H9.5V7.5"
                stroke="currentColor"
                strokeWidth="1.2"
                strokeLinecap="round"
                strokeLinejoin="round"
              />
            </svg>
          </Link>
        )}
      </header>

      {savedSuccess && (
        <div className="d3-note d3-note-accent">
          <svg width="14" height="14" viewBox="0 0 14 14" fill="none" style={{ flexShrink: 0, marginTop: 2 }} aria-hidden="true">
            <path d="M2 7L5.5 10.5L12 3.5" stroke="currentColor" strokeWidth="1.4" strokeLinecap="round" strokeLinejoin="round" />
          </svg>
          <span>
            Your menu theme has been published. Your guest menu now reflects this template.
          </span>
        </div>
      )}

      {error && (
        <div className="d3-note d3-note-danger">
          <svg width="14" height="14" viewBox="0 0 14 14" fill="none" style={{ flexShrink: 0, marginTop: 2 }} aria-hidden="true">
            <path d="M4 4L10 10M10 4L4 10" stroke="currentColor" strokeWidth="1.4" strokeLinecap="round" />
          </svg>
          <span>{error}</span>
        </div>
      )}

      {/* ================= Theme picker ================= */}
      <section>
        <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-6">
          {MENU_THEMES.map((theme) => (
            <ThemeCard
              key={theme.id}
              theme={theme}
              isSelected={selectedTheme === theme.id || (!selectedTheme && currentThemeId === theme.id)}
              isActive={currentThemeId === theme.id}
              onSelect={handleSelect}
            />
          ))}
        </div>
      </section>

      {/* ================= Save bar ================= */}
      <footer
        className="d3-panel"
        style={{
          padding: '1.25rem 1.5rem',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          gap: 16,
          border: '1px solid var(--border-warm)',
          borderRadius: 'var(--d3-panel-radius, 10px)',
        }}
      >
        <div style={{ fontSize: '0.8125rem', color: 'var(--text-secondary)' }}>
          {selectedTheme
            ? `Selected: ${getMenuTheme(selectedTheme).name}`
            : `Current theme: ${getMenuTheme(currentThemeId).name}`}
        </div>

        <div style={{ display: 'flex', gap: 10, alignItems: 'center' }}>
          <Link href="/dashboard/customize" className="d3-btn-ghost" style={{ padding: '0.5rem 1rem', fontSize: '0.75rem' }}>
            Back to Design
          </Link>

          <button
            onClick={handleSave}
            disabled={saving || !selectedTheme || selectedTheme === currentThemeId}
            className="d3-btn-primary"
            style={{ padding: '0.5625rem 1.25rem', fontSize: '0.8125rem' }}
          >
            {saving ? (
              <>
                <svg className="animate-spin" width="14" height="14" viewBox="0 0 14 14" fill="none">
                  <circle cx="7" cy="7" r="5" stroke="currentColor" strokeWidth="1.5" strokeOpacity="0.2" />
                  <path d="M7 2V7L11 9" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
                </svg>
                Saving…
              </>
            ) : 'Use This Theme'}
          </button>
        </div>
      </footer>
    </div>
  );
}

/* ============================================================
   THEME CARD — visual preview + select state
   ============================================================ */

interface ThemeCardProps {
  theme: MenuTheme;
  isSelected: boolean;
  isActive: boolean;
  onSelect: (id: MenuThemeId) => void;
}

function ThemeCard({ theme, isSelected, isActive, onSelect }: ThemeCardProps) {
  const accent = theme.css['--gold'];
  const bg = theme.css['--bg-primary'];
  const text = theme.css['--text-primary'];
  const cardBg = theme.css['--bg-surface'];
  const border = theme.css['--border-light'];

  return (
    <button
      onClick={() => onSelect(theme.id as MenuThemeId)}
      style={{
        display: 'block',
        width: '100%',
        textAlign: 'left',
        border: isSelected ? '2px solid var(--gold)' : '1px solid var(--border-warm)',
        borderRadius: 'var(--d3-card-radius)',
        background: cardBg,
        cursor: 'pointer',
        transition: 'all 200ms',
      }}
      onMouseEnter={(e) => {
        if (!isSelected) {
          e.currentTarget.style.borderColor = 'var(--border-light)';
          e.currentTarget.style.transform = 'translateY(-2px)';
        }
      }}
      onMouseLeave={(e) => {
        if (!isSelected) {
          e.currentTarget.style.borderColor = 'var(--border-warm)';
          e.currentTarget.style.transform = 'translateY(0)';
        }
      }}
    >
      {/* Visual preview strip */}
      <div
        className="relative"
        style={{
          height: 140,
          background: bg,
          borderTopLeftRadius: 'calc(var(--d3-card-radius) - 1px)',
          borderTopRightRadius: 'calc(var(--d3-card-radius) - 1px)',
          overflow: 'hidden',
          position: 'relative',
        }}
      >
        {/* Color swatch bar */}
        <div
          style={{
            position: 'absolute',
            top: 0,
            left: 0,
            right: 0,
            height: 6,
            background: `linear-gradient(90deg, ${bg} 0%, ${cardBg} 50%, ${accent} 100%)`,
          }}
        />

        {/* Simulated menu preview */}
        <div style={{ padding: '0.875rem 1rem', paddingBottom: 0 }}>
          <div
            style={{
              fontSize: '0.5625rem',
              letterSpacing: '0.2em',
              textTransform: 'uppercase',
              color: accent,
              marginBottom: '0.375rem',
            }}
          >
            {theme.id === 'classic-luxury'
              ? 'Classic'
              : theme.id === 'modern-dark'
              ? 'Modern'
              : theme.id === 'fresh-minimal'
              ? 'Fresh'
              : theme.id === 'indian-heritage'
              ? 'Heritage'
              : 'Contemporary'}
          </div>
          <div
            style={{
              fontFamily: 'var(--font-display)',
              fontSize: '0.9375rem',
              fontWeight: 500,
              color: text,
              marginBottom: '0.5rem',
            }}
          >
            {theme.name}
          </div>
          <div style={{ display: 'flex', gap: 6, flexWrap: 'wrap', marginBottom: '0.625rem' }}>
            <span
              style={{
                height: 14,
                width: 14,
                borderRadius: 'var(--d3-chip-radius)',
                border: `1px solid ${border}`,
                background: cardBg,
              }}
            />
            <span
              style={{
                height: 14,
                width: 14,
                borderRadius: 'var(--d3-chip-radius)',
                border: `1px solid ${border}`,
                background: cardBg,
              }}
            />
            <span
              style={{
                height: 14,
                width: 14,
                borderRadius: 'var(--d3-chip-radius)',
                border: `1px solid ${border}`,
                background: cardBg,
              }}
            />
          </div>
          <div style={{ display: 'flex', gap: '0.5rem', alignItems: 'baseline' }}>
            <div style={{ flex: 1, height: 4, background: text, opacity: 0.3, borderRadius: 2 }} />
            <div style={{ width: 32, height: 10, background: accent, borderRadius: 2, fontSize: '0.5625rem' }} />
          </div>
        </div>

        {/* Layout indicators */}
        <div style={{ position: 'absolute', bottom: 8, right: 8, display: 'flex', gap: 4, opacity: 0.5 }}>
          {Array.from({ length: 4 }).map((_, i) => (
            <div
              key={i}
              style={{
                width: 6,
                height: 6,
                borderRadius: '50%',
                background: text,
              }}
            />
          ))}
        </div>

        {/* Active dot */}
        {isActive && (
          <div
            style={{
              position: 'absolute',
              top: 8,
              right: 8,
              width: 8,
              height: 8,
              borderRadius: '50%',
              background: accent,
            }}
            aria-label="Active theme"
          />
        )}

        {/* Selected ring */}
        {isSelected && !isActive && (
          <div
            style={{
              position: 'absolute',
              top: 8,
              right: 8,
              width: 12,
              height: 12,
              borderRadius: '50%',
              border: `2px solid ${accent}`,
              background: 'transparent',
            }}
            aria-label="Selected theme"
          />
        )}
      </div>

      {/* Body */}
      <div style={{ padding: '1rem 1rem 1.25rem' }}>
        <div
          style={{
            fontFamily: 'var(--font-display)',
            fontSize: '1.125rem',
            fontWeight: 500,
            color: text,
            marginBottom: '0.25rem',
            display: 'flex',
            alignItems: 'center',
            gap: 8,
          }}
        >
          {theme.name}
          {isActive && (
            <span
              style={{
                fontSize: '0.625rem',
                fontWeight: 600,
                textTransform: 'uppercase',
                letterSpacing: '0.12em',
                color: accent,
              }}
            >
              Active
            </span>
          )}
        </div>

        <p
          style={{
            fontSize: '0.75rem',
            lineHeight: 1.5,
            color: theme.css['--text-muted'],
            margin: 0,
            marginBottom: '0.75rem',
          }}
        >
          {theme.description}
        </p>

        <div
          style={{
            display: 'flex',
            gap: 8,
            flexWrap: 'wrap',
            fontSize: '0.625rem',
            color: theme.css['--text-dimmed'],
          }}
        >
          <span style={{ padding: '0.1875rem 0.5rem', border: `1px solid ${border}`, borderRadius: 'var(--d3-chip-radius)' }}>
            Cards: {theme.layout.cardVariant}
          </span>
          <span style={{ padding: '0.1875rem 0.5rem', border: `1px solid ${border}`, borderRadius: 'var(--d3-chip-radius)' }}>
            Nav: {theme.layout.categoryNav}
          </span>
          <span style={{ padding: '0.1875rem 0.5rem', border: `1px solid ${border}`, borderRadius: 'var(--d3-chip-radius)' }}>
            Header: {theme.layout.header}
          </span>
        </div>
      </div>
    </button>
  );
}
