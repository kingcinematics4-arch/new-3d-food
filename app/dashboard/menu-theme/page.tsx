'use client';

import React, { useState } from 'react';
import Link from 'next/link';
import { useHotel } from '@/lib/useHotel';
import { MENU_THEMES, getMenuTheme, type MenuThemeId, type MenuTheme } from '@/lib/menuThemes';
import CustomThemeBuilder from '@/components/menu/CustomThemeBuilder';

/* ============================================================
   MENU THEME SELECTOR & BUILDER
   Choose one of five built-in menu templates OR art-direct
   a fully personalized Custom Theme with real-time preview.
   ============================================================ */

export default function MenuThemePage() {
  const { hotel, loading: hotelLoading, refetch } = useHotel();
  const [selectedTheme, setSelectedTheme] = useState<MenuThemeId | null>(null);
  const [saving, setSaving] = useState(false);
  const [savedSuccess, setSavedSuccess] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [activeTab, setActiveTab] = useState<'gallery' | 'custom'>('gallery');

  const currentThemeId = (hotel?.menu_theme as MenuThemeId) || 'classic-luxury';

  const handleSelect = (themeId: MenuThemeId) => {
    setSelectedTheme(themeId);
    if (themeId === 'custom') {
      setActiveTab('custom');
    }
  };

  const handleSavePreset = async () => {
    if (!hotel || !selectedTheme || selectedTheme === 'custom') return;
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
        // A 503 here means the schema probe caught the missing columns — tell
        // the owner exactly what to run instead of a generic failure.
        if (res.status === 503) {
          throw new Error(
            json.error ||
              'The database is missing the theme columns. Run supabase/migrations/012_theme_columns_idempotent.sql in the Supabase SQL Editor, then save again.'
          );
        }
        throw new Error(json.error || 'Failed to save theme');
      }

      setSavedSuccess(true);
      if (refetch) refetch();
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
    <div className="flex flex-col gap-10" style={{ maxWidth: 1240 }}>
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
            Menu Themes &amp; Custom Builder
          </h1>
          <p
            style={{
              margin: '0.5rem 0 0',
              fontSize: '0.875rem',
              lineHeight: 1.6,
              color: 'var(--text-muted)',
              maxWidth: '60ch',
            }}
          >
            Select from five master templates or build a fully custom brand design.
            The active design directly powers your public customer-facing menu.
          </p>
        </div>

        <div className="flex items-center gap-3">
          {hotel?.slug && (
            <Link
              href={`/menu/${hotel.slug}`}
              target="_blank"
              className="d3-btn-ghost flex items-center gap-2"
              style={{ flexShrink: 0 }}
            >
              <span>Open Live Menu</span>
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
        </div>
      </header>

      {/* Tabs: Template Gallery vs Custom Builder */}
      <div className="flex border-b border-white/10 gap-6">
        <button
          onClick={() => setActiveTab('gallery')}
          className={`pb-3 text-sm font-semibold tracking-wide border-b-2 transition-all ${
            activeTab === 'gallery'
              ? 'border-[#B8A47A] text-[#F3EFE7]'
              : 'border-transparent text-neutral-400 hover:text-white'
          }`}
        >
          Theme Gallery (5 Templates + Custom)
        </button>

        <button
          onClick={() => {
            setActiveTab('custom');
            setSelectedTheme('custom');
          }}
          className={`pb-3 text-sm font-semibold tracking-wide border-b-2 flex items-center gap-2 transition-all ${
            activeTab === 'custom'
              ? 'border-[#B8A47A] text-[#F3EFE7]'
              : 'border-transparent text-neutral-400 hover:text-white'
          }`}
        >
          <span>Custom Theme Builder</span>
          {currentThemeId === 'custom' && (
            <span className="px-2 py-0.5 rounded-full text-[0.625rem] bg-[#B8A47A] text-black font-bold">
              Active
            </span>
          )}
        </button>
      </div>

      {savedSuccess && (
        <div className="d3-note d3-note-accent">
          <svg width="14" height="14" viewBox="0 0 14 14" fill="none" style={{ flexShrink: 0, marginTop: 2 }} aria-hidden="true">
            <path d="M2 7L5.5 10.5L12 3.5" stroke="currentColor" strokeWidth="1.4" strokeLinecap="round" strokeLinejoin="round" />
          </svg>
          <span>
            Your menu theme has been published. Your guest menu now reflects this design.
          </span>
        </div>
      )}

      {error && (
        <div className="d3-note d3-note-danger">
          <svg width="14" height="14" viewBox="0 0 14 14" fill="none" style={{ flexShrink: 0, marginTop: 2 }} aria-hidden="true">
            <path d="M4 4L10 10M10 4L4 10" stroke="currentColor" strokeWidth="1.4" strokeLinecap="round" strokeLinejoin="round" />
          </svg>
          <span>{error}</span>
        </div>
      )}

      {/* ================= TAB 1: THEME GALLERY ================= */}
      {activeTab === 'gallery' && (
        <div className="flex flex-col gap-10">
          <section>
            <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-6">
              {MENU_THEMES.map((theme) => (
                <ThemeCard
                  key={theme.id}
                  theme={theme}
                  isSelected={selectedTheme === theme.id || (!selectedTheme && currentThemeId === theme.id)}
                  isActive={currentThemeId === theme.id}
                  onSelect={handleSelect}
                  onOpenStudio={() => {
                    handleSelect('custom');
                    setActiveTab('custom');
                  }}
                />
              ))}
            </div>
          </section>

          {/* Save Bar for Preset Themes */}
          {selectedTheme && selectedTheme !== 'custom' && (
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
                Selected template: <strong className="text-white">{getMenuTheme(selectedTheme).name}</strong>
              </div>

              <div style={{ display: 'flex', gap: 10, alignItems: 'center' }}>
                <button
                  onClick={handleSavePreset}
                  disabled={saving || selectedTheme === currentThemeId}
                  className="d3-btn-primary"
                  style={{ padding: '0.5625rem 1.25rem', fontSize: '0.8125rem' }}
                >
                  {saving ? 'Publishing…' : selectedTheme === currentThemeId ? 'Current Active Theme' : 'Use This Theme'}
                </button>
              </div>
            </footer>
          )}

          {/* Quick jump to custom builder banner if custom theme is selected */}
          {selectedTheme === 'custom' && (
            <div className="p-6 rounded-2xl bg-neutral-900 border border-[#B8A47A]/40 flex flex-col sm:flex-row items-center justify-between gap-4">
              <div>
                <h3 className="text-base font-bold text-white mb-1">Custom Theme Selected</h3>
                <p className="text-xs text-neutral-400">
                  Open the Custom Theme Builder to configure your background, fonts, card styles, and see live mobile preview.
                </p>
              </div>
              <button
                onClick={() => setActiveTab('custom')}
                className="d3-btn-primary px-5 py-2.5 text-xs font-bold whitespace-nowrap"
              >
                Open Custom Builder →
              </button>
            </div>
          )}
        </div>
      )}

      {/* ================= TAB 2: CUSTOM THEME BUILDER ================= */}
      {activeTab === 'custom' && hotel && (
        <CustomThemeBuilder
          hotel={hotel}
          initialConfig={hotel.custom_theme_config}
          onSaved={() => {
            if (refetch) refetch();
          }}
        />
      )}
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
  onOpenStudio?: () => void;
}

function ThemeCard({ theme, isSelected, isActive, onSelect, onOpenStudio }: ThemeCardProps) {
  const accent = theme.css['--gold'] || '#E5A93C';
  const bg = theme.css['--bg-primary'] || '#121212';
  const text = theme.css['--text-primary'] || '#FFFFFF';
  const cardBg = theme.css['--bg-surface'] || '#1C1C1E';
  const border = theme.css['--border-light'] || 'rgba(255,255,255,0.15)';

  const isCustom = theme.id === 'custom';

  return (
    <div
      onClick={() => onSelect(theme.id as MenuThemeId)}
      className="group"
      style={{
        display: 'block',
        width: '100%',
        textAlign: 'left',
        border: isSelected ? '2px solid var(--gold)' : '1px solid var(--border-warm)',
        borderRadius: 'var(--d3-card-radius)',
        background: cardBg,
        cursor: 'pointer',
        transition: 'all 200ms',
        overflow: 'hidden',
      }}
    >
      {/* Visual preview strip */}
      <div
        className="relative"
        style={{
          height: 140,
          background: bg,
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
              : theme.id === 'contemporary-premium'
              ? 'Contemporary'
              : 'Custom Studio'}
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

        {/* Active Pill */}
        {isActive && (
          <span
            style={{
              position: 'absolute',
              top: 10,
              right: 10,
              fontSize: '0.625rem',
              fontWeight: 600,
              letterSpacing: '0.06em',
              textTransform: 'uppercase',
              background: 'var(--gold)',
              color: '#000',
              padding: '0.125rem 0.5rem',
              borderRadius: 9999,
            }}
          >
            Active
          </span>
        )}
      </div>

      {/* Card Info footer */}
      <div className="p-4 flex flex-col justify-between gap-3">
        <p className="text-xs text-neutral-400 line-clamp-2 leading-relaxed">
          {theme.description}
        </p>

        {isCustom && (
          <div className="pt-2 border-t border-white/10 flex items-center justify-between">
            <span className="text-[0.65rem] font-bold text-[#E5A93C] uppercase tracking-wider">
              ✦ 11 Custom Controls
            </span>
            <button
              type="button"
              onClick={(e) => {
                e.stopPropagation();
                if (onOpenStudio) onOpenStudio();
              }}
              className="text-xs font-bold text-[#E5A93C] hover:underline"
            >
              Open Builder →
            </button>
          </div>
        )}
      </div>
    </div>
  );
}
