'use client';

import React, { useState } from 'react';
import Link from 'next/link';
import { useHotel, useHotelCustomization, useMenuItems } from '@/lib/useHotel';
import type { MenuItem } from '@/lib/useHotel';
import { formatPrice } from '@/lib/menu';

/* ============================================================
   MENU DESIGN STUDIO
   Left  — the design controls, set like a print studio
   Right — the live guest-facing menu, rendered as an actual
           luxury restaurant menu would look on a phone
   ============================================================ */

const MENU_STYLES = [
  { id: 'cards', label: 'Cards', note: 'Photograph-led, generous spacing' },
  { id: 'grid', label: 'Grid', note: 'Denser, two-up on small screens' },
  { id: 'list', label: 'List', note: 'Text-forward editorial index' },
];

const CARD_STYLES = [
  { id: 'minimal', label: 'Minimal', note: 'Hairline frame, no fill' },
  { id: 'bordered', label: 'Bordered', note: 'Champagne edge, stronger frame' },
  { id: 'glassmorphic', label: 'Soft', note: 'Frosted charcoal veil' },
];

const TYPOGRAPHY = [
  { value: 'Inter', label: 'Modern Sans' },
  { value: 'Outfit', label: 'Contemporary' },
  { value: 'Playfair Display', label: 'Editorial Serif' },
  { value: 'Roboto', label: 'Neutral Grotesk' },
];

export default function CustomizeMenuPage() {
  const { hotel, loading: hotelLoading } = useHotel();
  const {
    customization,
    loading: customizationLoading,
    saveCustomization,
    setCustomization,
  } = useHotelCustomization(hotel?.id || null);
  const [savedSuccess, setSavedSuccess] = useState(false);
  const { items: menuItems } = useMenuItems(hotel?.id || null);

  const hotelSlug = hotel?.slug || '';
  const menuHref = hotelSlug ? `/menu/${hotelSlug}` : '/dashboard/settings';
  const hotelName = hotel?.name || 'Your Restaurant';

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    await saveCustomization(customization);
    setSavedSuccess(true);
    setTimeout(() => setSavedSuccess(false), 3000);
  };

  const patch = (next: Partial<typeof customization>) =>
    setCustomization({ ...customization, ...next });

  if (hotelLoading || customizationLoading) {
    return (
      <p style={{ color: 'var(--text-muted)', fontSize: '0.875rem' }}>
        Loading the design studio…
      </p>
    );
  }

  return (
    <div className="flex flex-col gap-10" style={{ maxWidth: 1180 }}>
      {/* ================= Page header ================= */}
      <header
        className="flex flex-col sm:flex-row items-start sm:items-end justify-between gap-5"
      >
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
            Design Studio
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
            Art-direct the guest-facing menu — palette, typography and layout. Every
            change is reflected in the preview beside you before it is published.
          </p>
        </div>

        {hotelSlug && (
          <Link
            href={menuHref}
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
            Design published.{' '}
            {hotelSlug ? (
              <>
                Your guest menu at{' '}
                <span style={{ color: 'var(--gold)' }}>/menu/{hotelSlug}</span>{' '}
                now reflects these settings.
              </>
            ) : (
              'These settings are saved to your restaurant profile.'
            )}
          </span>
        </div>
      )}

      {/* ================= Two-column studio ================= */}
      <form
        onSubmit={handleSave}
        className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start"
      >
        {/* ---------- Controls ---------- */}
        <div className="lg:col-span-7 flex flex-col gap-8">

          {/* Palette */}
          <section className="d3-panel p-6 sm:p-7">
            <div className="flex items-baseline justify-between gap-4 pb-4 mb-5" style={{ borderBottom: '1px solid var(--border-warm)' }}>
              <h2 className="d3-panel-title">Palette</h2>
              <span className="d3-eyebrow" style={{ fontSize: '0.5rem', color: 'var(--text-dimmed)' }}>
                01
              </span>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-5">
              <div>
                <label className="d3-label" htmlFor="primary-color">
                  Primary Accent
                </label>
                <div className="d3-swatch">
                  <input
                    id="primary-color"
                    type="color"
                    value={customization.primary_color}
                    onChange={(e) => patch({ primary_color: e.target.value })}
                    aria-label="Primary accent colour"
                  />
                  <code>{customization.primary_color}</code>
                </div>
              </div>

              <div>
                <label className="d3-label" htmlFor="secondary-color">
                  Secondary Accent
                </label>
                <div className="d3-swatch">
                  <input
                    id="secondary-color"
                    type="color"
                    value={customization.secondary_color}
                    onChange={(e) => patch({ secondary_color: e.target.value })}
                    aria-label="Secondary accent colour"
                  />
                  <code>{customization.secondary_color}</code>
                </div>
              </div>
            </div>

            <div className="d3-rule mt-6 mb-5" />

            <label className="d3-label" htmlFor="base-mode">
              Base Theme
            </label>
            <div className="d3-segment" id="base-mode" role="group" aria-label="Base theme mode">
              {[
                { id: true, label: 'Dark' },
                { id: false, label: 'Light' },
              ].map((mode) => (
                <button
                  key={String(mode.id)}
                  type="button"
                  className="d3-segment-item"
                  data-active={customization.dark_mode === mode.id}
                  onClick={() => patch({ dark_mode: mode.id as boolean })}
                >
                  {mode.label}
                </button>
              ))}
            </div>
          </section>

          {/* Layout */}
          <section className="d3-panel p-6 sm:p-7">
            <div className="flex items-baseline justify-between gap-4 pb-4 mb-5" style={{ borderBottom: '1px solid var(--border-warm)' }}>
              <h2 className="d3-panel-title">Layout &amp; Surfaces</h2>
              <span className="d3-eyebrow" style={{ fontSize: '0.5rem', color: 'var(--text-dimmed)' }}>
                02
              </span>
            </div>

            <div className="flex flex-col gap-6">
              <div>
                <span className="d3-label">Menu Layout</span>
                <div className="grid grid-cols-1 sm:grid-cols-3 gap-2">
                  {MENU_STYLES.map((opt) => (
                    <button
                      key={opt.id}
                      type="button"
                      className="d3-option"
                      data-active={customization.menu_style === opt.id}
                      aria-pressed={customization.menu_style === opt.id}
                      onClick={() => patch({ menu_style: opt.id as any })}
                    >
                      <span style={{ display: 'block', color: 'inherit' }}>{opt.label}</span>
                      <span style={{ display: 'block', fontSize: '0.6875rem', color: 'var(--text-dimmed)', marginTop: 3, fontWeight: 400 }}>
                        {opt.note}
                      </span>
                    </button>
                  ))}
                </div>
              </div>

              <div>
                <span className="d3-label">Card Surface</span>
                <div className="grid grid-cols-1 sm:grid-cols-3 gap-2">
                  {CARD_STYLES.map((opt) => (
                    <button
                      key={opt.id}
                      type="button"
                      className="d3-option"
                      data-active={customization.card_style === opt.id}
                      aria-pressed={customization.card_style === opt.id}
                      onClick={() => patch({ card_style: opt.id as any })}
                    >
                      <span style={{ display: 'block', color: 'inherit' }}>{opt.label}</span>
                      <span style={{ display: 'block', fontSize: '0.6875rem', color: 'var(--text-dimmed)', marginTop: 3, fontWeight: 400 }}>
                        {opt.note}
                      </span>
                    </button>
                  ))}
                </div>
              </div>

              <div>
                <label className="d3-label" htmlFor="typography">
                  Typography
                </label>
                <select
                  id="typography"
                  value={customization.typography}
                  onChange={(e) => patch({ typography: e.target.value as any })}
                  className="d3-input"
                >
                  {TYPOGRAPHY.map((t) => (
                    <option key={t.value} value={t.value}>
                      {t.label} — {t.value}
                    </option>
                  ))}
                </select>
              </div>
            </div>
          </section>

          {/* Copy */}
          <section className="d3-panel p-6 sm:p-7">
            <div className="flex items-baseline justify-between gap-4 pb-4 mb-5" style={{ borderBottom: '1px solid var(--border-warm)' }}>
              <h2 className="d3-panel-title">Guest Copy</h2>
              <span className="d3-eyebrow" style={{ fontSize: '0.5rem', color: 'var(--text-dimmed)' }}>
                03
              </span>
            </div>

            <label className="d3-label" htmlFor="welcome-banner">
              Welcome Banner
            </label>
            <input
              id="welcome-banner"
              type="text"
              value={customization.welcome_banner}
              onChange={(e) => patch({ welcome_banner: e.target.value })}
              placeholder="A seasonal menu, composed daily"
              className="d3-input"
            />

            <div style={{ marginTop: '1.75rem', display: 'flex', justifyContent: 'flex-end' }}>
              <button type="submit" className="d3-btn-primary">
                Publish Design
              </button>
            </div>
          </section>
        </div>

        {/* ---------- Live guest menu preview ---------- */}
        <div className="lg:col-span-5 lg:sticky lg:top-0">
          <div className="flex items-center justify-between gap-4 pb-4 mb-5" style={{ borderBottom: '1px solid var(--border-warm)' }}>
            <div>
              <span className="d3-eyebrow" style={{ fontSize: '0.5rem', color: 'var(--text-dimmed)' }}>
                Preview
              </span>
              <h2 className="d3-panel-title" style={{ fontSize: '1.125rem', marginTop: 4 }}>
                As your guests see it
              </h2>
            </div>
            <span className="d3-chip">Unsaved draft</span>
          </div>

          <MenuPreview
            hotelName={hotelName}
            currency={hotel?.currency ?? null}
            items={menuItems}
            primary={customization.primary_color}
            secondary={customization.secondary_color}
            typography={customization.typography}
            welcome={customization.welcome_banner}
            menuStyle={customization.menu_style}
            cardStyle={customization.card_style}
            darkMode={customization.dark_mode}
          />

          <p
            style={{
              marginTop: '1.25rem',
              fontSize: '0.6875rem',
              lineHeight: 1.7,
              color: 'var(--text-dimmed)',
            }}
          >
            Layout {customization.menu_style} · Surface {customization.card_style} · Type{' '}
            {customization.typography}
          </p>
        </div>
      </form>
    </div>
  );
}

/* ============================================================
   LIVE PREVIEW — an actual luxury restaurant digital menu
   ============================================================ */

function MenuPreview({
  hotelName,
  currency,
  items,
  primary,
  secondary,
  typography,
  welcome,
  menuStyle,
  cardStyle,
  darkMode,
}: {
  hotelName: string;
  currency: string | null;
  items: MenuItem[];
  primary: string;
  secondary: string;
  typography: string;
  welcome: string;
  menuStyle: string;
  cardStyle: string;
  darkMode: boolean;
}) {
  const pageBg = darkMode ? '#0B0B0A' : '#F4F1EA';
  const pageInk = darkMode ? '#F3EFE7' : '#14140F';
  const pageMuted = darkMode ? '#9B968C' : '#6B675F';
  const pageLine = darkMode ? 'rgba(243,239,231,0.10)' : 'rgba(20,20,15,0.12)';

  const serif = typography === 'Playfair Display';
  const face = serif
    ? "'Playfair Display', Georgia, serif"
    : `'${typography}', 'Inter', system-ui, sans-serif`;

  const cardSurface =
    cardStyle === 'glassmorphic'
      ? darkMode
        ? 'rgba(243,239,231,0.045)'
        : 'rgba(255,255,255,0.7)'
      : cardStyle === 'bordered'
      ? 'transparent'
      : 'transparent';

  const cardBorder =
    cardStyle === 'bordered' ? primary : cardStyle === 'glassmorphic' ? pageLine : pageLine;

  const columns = menuStyle === 'grid' ? '1fr 1fr' : menuStyle === 'list' ? '1fr' : '1fr';

  // The preview is a rehearsal of the real menu: it shows the dishes this
  // restaurant has actually saved, and says so plainly when there are none.
  const dishes = items.slice(0, 4);

  return (
    <div
      style={{
        borderRadius: 10,
        border: `1px solid ${pageLine}`,
        background: pageBg,
        overflow: 'hidden',
        boxShadow: '0 24px 64px rgba(0,0,0,0.45)',
      }}
    >
      {/* Masthead */}
      <div
        style={{
          padding: '1.75rem 1.5rem 1.5rem',
          borderBottom: `1px solid ${pageLine}`,
          textAlign: 'center',
        }}
      >
        <p
          style={{
            fontSize: '0.5rem',
            letterSpacing: '0.28em',
            textTransform: 'uppercase',
            color: primary,
            margin: 0,
          }}
        >
          Est. Menu
        </p>
        <h3
          style={{
            fontFamily: face,
            fontSize: '1.5rem',
            fontWeight: serif ? 500 : 300,
            letterSpacing: serif ? '-0.01em' : '0.14em',
            textTransform: serif ? 'none' : 'uppercase',
            color: pageInk,
            margin: '0.5rem 0 0',
            lineHeight: 1.2,
          }}
        >
          {hotelName}
        </h3>
        <p
          style={{
            fontSize: '0.6875rem',
            lineHeight: 1.7,
            color: pageMuted,
            margin: '0.625rem 0 0',
            maxWidth: '30ch',
            marginLeft: 'auto',
            marginRight: 'auto',
          }}
        >
          {welcome}
        </p>
      </div>

      {/* Section label */}
      <div style={{ padding: '1.125rem 1.5rem 0' }}>
        <p
          style={{
            fontSize: '0.5rem',
            letterSpacing: '0.24em',
            textTransform: 'uppercase',
            color: pageMuted,
            margin: 0,
            paddingBottom: 10,
            borderBottom: `1px solid ${pageLine}`,
          }}
        >
          From the Kitchen
        </p>
      </div>

      {/* Dishes */}
      <div
        style={{
          display: 'grid',
          gridTemplateColumns: columns,
          gap: menuStyle === 'list' ? 0 : 14,
          padding: menuStyle === 'list' ? '0 1.5rem 1.5rem' : '1.25rem 1.5rem 1.75rem',
        }}
      >
        {dishes.length === 0 ? (
          <div
            style={{
              display: 'flex',
              flexDirection: 'column',
              alignItems: 'center',
              gap: 8,
              padding: '2.75rem 1.5rem 3rem',
              textAlign: 'center',
            }}
          >
            <svg width="34" height="34" viewBox="0 0 34 34" fill="none" style={{ color: pageMuted, opacity: 0.55 }} aria-hidden="true">
              <path d="M17 3L30 10.5V24L17 31.5L4 24V10.5L17 3Z" stroke="currentColor" strokeWidth="1.1" strokeLinejoin="round" />
              <path d="M17 3V31.5M4 10.5L17 18L30 10.5" stroke="currentColor" strokeWidth="0.9" strokeOpacity="0.5" strokeLinejoin="round" />
            </svg>
            <p style={{ margin: 0, fontFamily: face, fontSize: '0.875rem', color: pageInk }}>
              No menu items yet
            </p>
            <p style={{ margin: 0, fontSize: '0.6875rem', color: pageMuted, lineHeight: 1.6, maxWidth: '26ch' }}>
              Add a dish and it appears here, styled exactly as your guests will see it.
            </p>
          </div>
        ) : (
dishes.map((dish, i) => {
          const isList = menuStyle === 'list';
          const note = dish.description || (dish.category ? dish.category : '');

          return (
            <div
              key={dish.id}
              style={
                isList
                  ? { padding: '1rem 0', borderTop: `1px solid ${pageLine}` }
                  : {
                      padding: '0.875rem',
                      borderRadius: cardStyle === 'minimal' ? 2 : 6,
                      border: `1px solid ${cardBorder}`,
                      background: cardSurface,
                    }
              }
            >
              {!isList && (
                <div
                  style={{
                    aspectRatio: menuStyle === 'grid' ? '1 / 1' : '16 / 10',
                    borderRadius: 3,
                    border: `1px solid ${pageLine}`,
                    background: darkMode ? 'rgba(243,239,231,0.03)' : 'rgba(20,20,15,0.04)',
                    marginBottom: '0.875rem',
                  }}
                />
              )}
            <div style={{ display: 'flex', alignItems: 'baseline', justifyContent: 'space-between', gap: 12 }}>
              <span
                style={{
                  fontFamily: face,
                  fontSize: '0.9375rem',
                  color: pageInk,
                  letterSpacing: serif ? '-0.005em' : '0.01em',
                }}
              >
                {dish.name}
              </span>
              <span
                style={{
                  fontFamily: face,
                  fontSize: '0.9375rem',
                  color: primary,
                  whiteSpace: 'nowrap',
                }}
              >
                {formatPrice(Number(dish.price) || 0, currency)}
              </span>
            </div>
            {note ? (
            <p
              style={{
                fontSize: '0.6875rem',
                color: pageMuted,
                margin: '0.375rem 0 0',
                lineHeight: 1.6,
              }}
            >
              {note}
            </p>
            ) : null}
            {isList && (
              <div
                style={{
                  marginTop: 10,
                  height: 1,
                  width: 28,
                  background: i === 0 ? primary : secondary,
                  opacity: 0.6,
                }}
              />
            )}
            </div>
          );
        })
        )}
      </div>

      {/* Footer note */}
      <div
        style={{
          padding: '1rem 1.5rem',
          borderTop: `1px solid ${pageLine}`,
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          gap: 12,
        }}
      >
        <span style={{ fontSize: '0.5625rem', letterSpacing: '0.2em', textTransform: 'uppercase', color: pageMuted }}>
          Powered by Dine3D
        </span>
        <span
          style={{
            fontSize: '0.5625rem',
            letterSpacing: '0.2em',
            textTransform: 'uppercase',
            color: primary,
          }}
        >
          {items.length} item{items.length === 1 ? '' : 's'} live
        </span>
      </div>
    </div>
  );
}