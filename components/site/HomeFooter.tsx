// components/site/HomeFooter.tsx
//
// Closing call to action and site footer, rendered from published content.
// Server Component.
//
// The brand mark is the official Dine3D logo asset, used exactly as supplied —
// it is not redrawn as inline SVG.

import React from 'react';
import Link from 'next/link';
import Image from 'next/image';
import type { Footer, Branding } from '@/lib/siteContent';
import Dine3DLogo, { LOGO_SRC, LOGO_INTRINSIC } from '@/components/Dine3DLogo';

export default function HomeFooter({ footer, branding }: { footer: Footer; branding: Branding }) {
  if (!footer.enabled) return null;

  const currentYear = new Date().getFullYear();
  const columns = footer.columns.filter((column) => column.links.some((link) => link.label));

  return (
    <>
      {/* ---------------------------------------------- CLOSING CTA */}
      {footer.closingHeading || footer.closingCtaText ? (
        <section
          className="relative overflow-hidden"
          style={{
            background: 'var(--bg-surface)',
            borderTop: '1px solid var(--border-subtle)',
            borderBottom: '1px solid var(--border-subtle)',
            padding: '6rem 0',
          }}
        >
          <div
            className="absolute inset-0"
            style={{
              background: 'radial-gradient(ellipse at 50% 50%, rgba(201,169,110,0.06) 0%, transparent 70%)',
              pointerEvents: 'none',
            }}
          />

          <div className="d3-container relative z-10 text-center flex flex-col items-center gap-8">
            <span className="d3-eyebrow">READY TO BEGIN</span>

            <h2 className="d3-display-lg" style={{ maxWidth: 600 }}>
              {footer.closingHeading}
              {footer.closingAccent ? (
                <>
                  <br />
                  <em style={{ color: 'var(--gold)', fontStyle: 'italic', fontWeight: 300 }}>
                    {footer.closingAccent}
                  </em>
                </>
              ) : null}
            </h2>

            {footer.closingBody ? (
              <p className="d3-body" style={{ maxWidth: 440 }}>
                {footer.closingBody}
              </p>
            ) : null}

            {footer.closingCtaText || footer.closingSecondaryCtaText ? (
              <div className="flex flex-wrap gap-4 justify-center">
                {footer.closingCtaText && footer.closingCtaHref ? (
                  <Link
                    href={footer.closingCtaHref}
                    className="d3-btn-primary"
                    style={{ padding: '0.875rem 2.25rem', fontSize: '0.9375rem' }}
                  >
                    {footer.closingCtaText} →
                  </Link>
                ) : null}

                {footer.closingSecondaryCtaText && footer.closingSecondaryCtaHref ? (
                  <Link
                    href={footer.closingSecondaryCtaHref}
                    className="d3-btn-ghost"
                    style={{ padding: '0.875rem 2.25rem', fontSize: '0.9375rem' }}
                  >
                    {footer.closingSecondaryCtaText}
                  </Link>
                ) : null}
              </div>
            ) : null}
          </div>
        </section>
      ) : null}

      {/* ---------------------------------------------- FOOTER */}
      <footer
        style={{
          background: 'var(--bg-primary)',
          borderTop: '1px solid var(--border-subtle)',
          padding: '5rem 0 3rem',
        }}
      >
        <div className="d3-container">
          <div
            className="grid grid-cols-1 md:grid-cols-2 gap-12 mb-16"
            style={{
              gridTemplateColumns: columns.length
                ? `repeat(auto-fit, minmax(160px, 1fr))`
                : '1fr',
            }}
          >
            {/* Brand column */}
            <div className="flex flex-col gap-5" style={{ gridColumn: columns.length ? 'span 2' : undefined }}>
              {/* Official logo. Falls back to the single source asset; the owner can
                  point branding.logoUrl elsewhere from the admin panel. */}
              {branding.logoUrl && branding.logoUrl !== LOGO_SRC ? (
                <Image
                  src={branding.logoUrl}
                  alt={branding.logoAlt || 'Dine3D'}
                  width={LOGO_INTRINSIC.width}
                  height={LOGO_INTRINSIC.height}
                  className="object-contain object-left"
                  style={{ width: 'auto', height: 'auto', maxWidth: 148, maxHeight: 46 }}
                />
              ) : (
                <Dine3DLogo size="md" href={null} alt={branding.logoAlt || 'Dine3D'} />
              )}

              {footer.tagline ? (
                <p
                  className="d3-eyebrow"
                  style={{ color: 'var(--text-dimmed)', letterSpacing: '0.15em', fontSize: '0.5625rem' }}
                >
                  {footer.tagline}
                </p>
              ) : null}

              {footer.description ? (
                <p className="d3-body-sm" style={{ maxWidth: 260 }}>
                  {footer.description}
                </p>
              ) : null}
            </div>

            {/* Link columns */}
            {columns.map((column) => (
              <div key={column.id} className="flex flex-col gap-4">
                {column.title ? (
                  <span
                    className="d3-eyebrow"
                    style={{ color: 'var(--text-dimmed)', fontSize: '0.5625rem' }}
                  >
                    {column.title}
                  </span>
                ) : null}

                {column.links
                  .filter((link) => link.label)
                  .map((link) => (
                    <Link
                      key={link.id}
                      href={link.href || '#'}
                      className="d3-btn-text"
                      style={{ fontSize: '0.875rem' }}
                    >
                      {link.label}
                    </Link>
                  ))}
              </div>
            ))}
          </div>

          <div
            className="pt-8 flex flex-col sm:flex-row items-center justify-between gap-4"
            style={{ borderTop: '1px solid var(--border-subtle)' }}
          >
            <p style={{ fontSize: '0.75rem', color: 'var(--text-dimmed)' }}>
              {footer.copyrightText?.includes('©')
                ? footer.copyrightText
                : `© ${currentYear} ${footer.copyrightText || 'Dine3D. All rights reserved.'}`}
            </p>
            <p
              className="d3-eyebrow"
              style={{ color: 'var(--text-dimmed)', fontSize: '0.5rem', letterSpacing: '0.15em' }}
            >
              PREMIUM 3D RESTAURANT TECHNOLOGY
            </p>
          </div>
        </div>
      </footer>
    </>
  );
}