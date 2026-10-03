'use client';

// app/admin/(panel)/branding/page.tsx
//
// BRANDING
//
// The official Dine3D logo is a fixed asset and is never redrawn or replaced by
// this panel. What can be changed here is where it points, its accessible
// description, the favicon, the typographic pairing and the colour identity.
//
// The default palette is deliberately near-black with warm ivory type and a
// muted champagne accent. No bright yellow, orange, blue or neon values are
// offered as presets.

import React from 'react';
import Image from 'next/image';
import { useSiteContent } from '@/components/admin/SiteContentProvider';
import {
  AdminPageHeader,
  AdminPanel,
  AdminField,
  AdminInput,
  AdminOptionRow,
  AdminColorField,
  AdminNote,
} from '@/components/admin/ui';
import { TYPOGRAPHY_OPTIONS, BUTTON_STYLE_OPTIONS, ACCENT_PRESETS, BACKGROUND_PRESETS } from '@/lib/siteContent';

export default function AdminBrandingPage() {
  const { draft, update, loading } = useSiteContent();
  const branding = draft.branding;

  const set = <K extends keyof typeof branding>(key: K, value: (typeof branding)[K]) =>
    update((current) => ({ ...current, branding: { ...current.branding, [key]: value } }));

  if (loading) {
    return (
      <>
        <AdminPageHeader eyebrow="BRANDING" title="Brand identity" />
        <div className="d3-panel p-8" style={{ color: 'var(--text-dimmed)', fontSize: '0.875rem' }}>
          Loading…
        </div>
      </>
    );
  }

  return (
    <>
      <AdminPageHeader
        eyebrow="BRANDING"
        title="Brand identity"
        description="Typography and colour for the public website. The Dine3D logo itself is a fixed asset and is never altered by this panel."
      />

      <div className="flex flex-col gap-6">
        {/* ---------------------------------------------- LOGO */}
        <AdminPanel title="Logo">
          <div className="flex flex-col gap-5">
            <div className="flex flex-wrap gap-6">
              {/* Live preview of the actual asset, unmodified */}
              <div
                className="flex items-center justify-center"
                style={{
                  minWidth: 220,
                  padding: '1.25rem 1.75rem',
                  background: 'var(--bg-secondary)',
                  border: '1px solid var(--border-warm)',
                  borderRadius: 8,
                }}
              >
                <Image
                  src="/images/dine3d-logo.jpg"
                  alt="Dine3D logo"
                  width={160}
                  height={40}
                  className="object-contain"
                  style={{ height: 40, width: 'auto' }}
                />
              </div>

              <div
                className="flex items-center justify-center"
                style={{
                  minWidth: 220,
                  padding: '1.25rem 1.75rem',
                  background: '#F3EFE7',
                  borderRadius: 8,
                }}
              >
                <Image
                  src="/images/dine3d-logo.jpg"
                  alt="Dine3D logo on light background"
                  width={160}
                  height={40}
                  className="object-contain"
                  style={{ height: 40, width: 'auto' }}
                />
              </div>
            </div>

            <AdminNote>
              This is the official Dine3D logo file, displayed exactly as supplied. It is never
              redrawn, stretched or substituted. If you need a different asset, replace{' '}
              <code>public/images/dine3d-logo.jpg</code> and redeploy.
            </AdminNote>

            <AdminField
              label="Logo image path"
              hint="Leave as-is to use the shipped asset. Only change this if you have moved the file."
            >
              <AdminInput
                value={branding.logoUrl}
                onChange={(v) => set('logoUrl', v)}
                placeholder="/images/dine3d-logo.jpg"
              />
            </AdminField>

            <AdminField label="Logo description" hint="Read aloud by screen readers.">
              <AdminInput value={branding.logoAlt} onChange={(v) => set('logoAlt', v)} placeholder="Dine3D" />
            </AdminField>
          </div>
        </AdminPanel>

        {/* ---------------------------------------------- FAVICON */}
        <AdminPanel title="Favicon" description="The small icon browsers show in the tab.">
          <AdminField
            label="Favicon path"
            hint="Leave empty to use the default. Accepts a site path such as /favicon.ico or an https URL."
          >
            <AdminInput
              value={branding.faviconUrl}
              onChange={(v) => set('faviconUrl', v)}
              placeholder="Leave empty for the default"
            />
          </AdminField>
        </AdminPanel>

        {/* ---------------------------------------------- TYPOGRAPHY */}
        <AdminPanel title="Typography">
          <div className="flex flex-col gap-5">
            <AdminField label="Typographic pairing">
              <AdminOptionRow
                options={TYPOGRAPHY_OPTIONS}
                value={branding.typography}
                onChange={(v) => set('typography', v)}
              />
            </AdminField>

            <div
              className="flex flex-col gap-3"
              style={{
                padding: '1.5rem',
                background: 'var(--bg-secondary)',
                border: '1px solid var(--border-warm)',
                borderRadius: 8,
              }}
            >
              <span
                style={{
                  fontFamily:
                    branding.typography === 'modern'
                      ? "'Inter', system-ui, sans-serif"
                      : "'Cormorant Garamond', Georgia, serif",
                  fontSize: '2rem',
                  letterSpacing: '-0.02em',
                  color: 'var(--text-primary)',
                }}
              >
                Editorial dining, rendered in 3D
              </span>
              <span style={{ fontSize: '0.875rem', color: 'var(--text-secondary)', maxWidth: '54ch' }}>
                Body copy preview. This pairing is applied across headings and body text on the public
                website.
              </span>
            </div>
          </div>
        </AdminPanel>

        {/* ---------------------------------------------- COLOUR */}
        <AdminPanel title="Colour">
          <div className="grid gap-6" style={{ gridTemplateColumns: 'repeat(auto-fit, minmax(260px, 1fr))' }}>
            <AdminColorField
              label="Accent colour"
              value={branding.accentColor}
              onChange={(v) => set('accentColor', v)}
              presets={ACCENT_PRESETS}
            />
            <AdminColorField
              label="Background colour"
              value={branding.backgroundColor}
              onChange={(v) => set('backgroundColor', v)}
              presets={BACKGROUND_PRESETS}
            />
          </div>

          {/* Live preview using the real design tokens */}
          <div
            className="mt-6 flex flex-col gap-5"
            style={{
              padding: '1.75rem',
              background: branding.backgroundColor,
              border: '1px solid var(--border-warm)',
              borderRadius: 10,
            }}
          >
            <div className="flex flex-col gap-2">
              <span
                className="d3-eyebrow"
                style={{ color: branding.accentColor, fontSize: '0.625rem' }}
              >
                PREVIEW
              </span>
              <span
                style={{
                  fontFamily:
                    branding.typography === 'modern'
                      ? "'Inter', system-ui, sans-serif"
                      : "'Cormorant Garamond', Georgia, serif",
                  fontSize: '1.75rem',
                  lineHeight: 1.15,
                  color: '#F3EFE7',
                }}
              >
                Fine dining meets advanced 3D
              </span>
              <span style={{ fontSize: '0.875rem', color: '#C2BCB0', maxWidth: '46ch' }}>
                Accent <code style={{ color: branding.accentColor }}>{branding.accentColor}</code> on
                background <code style={{ color: '#C2BCB0' }}>{branding.backgroundColor}</code>. Ivory body
                copy stays warm, never pure white.
              </span>
            </div>

            <div className="flex flex-wrap gap-2">
              <button
                type="button"
                className="d3-btn-quiet"
                style={{ borderColor: branding.accentColor, color: branding.accentColor }}
              >
                {branding.buttonStyle === 'solid' ? 'Solid button' : 'Primary action'}
              </button>
              <button
                type="button"
                className="d3-btn-subtle"
                style={{ borderColor: 'rgba(243,239,231,0.15)', color: '#C2BCB0' }}
              >
                Secondary
              </button>
            </div>
          </div>
        </AdminPanel>

        {/* ---------------------------------------------- BUTTONS */}
        <AdminPanel title="Button style" description="How call-to-action buttons are drawn across the site.">
          <AdminOptionRow
            options={BUTTON_STYLE_OPTIONS}
            value={branding.buttonStyle}
            onChange={(v) => set('buttonStyle', v)}
          />
        </AdminPanel>
      </div>
    </>
  );
}