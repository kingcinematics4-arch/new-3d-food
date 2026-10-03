'use client';

// app/admin/(panel)/media/page.tsx
//
// MEDIA
//
// The asset library for the public website, grouped by purpose.
//
// This panel manages REFERENCES, not uploads: it lists the official logo and
// every image path currently used across the hero, sections, feature cards and
// the footer. Actual file storage stays where it already lives (the project's
// public folder, or a Supabase Storage bucket); the panel records which asset
// belongs where so nothing is duplicated or replaced by a lookalike.

import React from 'react';
import Image from 'next/image';
import { useSiteContent } from '@/components/admin/SiteContentProvider';
import {
  AdminPageHeader,
  AdminPanel,
  AdminField,
  AdminInput,
  AdminEmpty,
  AdminNote,
  AdminIconButton,
} from '@/components/admin/ui';
import { SECTION_LABELS } from '@/lib/siteContent';
import type { EditorialSection, SiteContent } from '@/lib/siteContent';
import Dine3DLogo, { LOGO_SRC } from '@/components/Dine3DLogo';

interface MediaEntry {
  id: string;
  label: string;
  group: string;
  value: string;
  editable: boolean;
  onChange?: (value: string) => void;
}

export default function AdminMediaPage() {
  const { draft, update, loading } = useSiteContent();

  const setBranding = (key: 'logoUrl' | 'logoAlt' | 'faviconUrl', value: string) =>
    update((current) => ({ ...current, branding: { ...current.branding, [key]: value } }));

  const setEditorial = (key: keyof SiteContent, field: keyof EditorialSection, value: string) =>
    update((current) => {
      const section = current[key] as EditorialSection;
      return { ...current, [key]: { ...section, [field]: value } };
    });

  const setFeatureImage = (featureId: string, value: string) =>
    update((current) => ({
      ...current,
      features: {
        ...current.features,
        items: current.features.items.map((item) =>
          item.id === featureId ? { ...item, imageUrl: value } : item
        ),
      },
    }));

  if (loading) {
    return (
      <>
        <AdminPageHeader eyebrow="MEDIA" title="Media" />
        <div className="d3-panel p-8" style={{ color: 'var(--text-dimmed)', fontSize: '0.875rem' }}>
          Loading…
        </div>
      </>
    );
  }

  const logoEntries: MediaEntry[] = [
    {
      id: 'brand-logo',
      label: 'Primary logo',
      group: 'Branding',
      value: draft.branding.logoUrl,
      editable: true,
      onChange: (v) => setBranding('logoUrl', v),
    },
    {
      id: 'brand-favicon',
      label: 'Favicon',
      group: 'Branding',
      value: draft.branding.faviconUrl,
      editable: true,
      onChange: (v) => setBranding('faviconUrl', v),
    },
    {
      id: 'brand-logo-alt',
      label: 'Logo description',
      group: 'Branding',
      value: draft.branding.logoAlt,
      editable: true,
      onChange: (v) => setBranding('logoAlt', v),
    },
  ];

  const siteImages: MediaEntry[] = [
    {
      id: 'hero-image',
      label: 'Hero background',
      group: SECTION_LABELS.hero,
      value: draft.hero.imageUrl,
      editable: true,
      onChange: (v) =>
        update((current) => ({ ...current, hero: { ...current.hero, imageUrl: v } })),
    },
  ];

  const editorialKeys = ['about', 'menu3d', 'ar', 'qr', 'dashboard', 'analytics', 'contact'] as const;
  for (const key of editorialKeys) {
    const section = draft[key] as EditorialSection;
    siteImages.push({
      id: `section-${key}`,
      label: `${SECTION_LABELS[key]} image`,
      group: SECTION_LABELS[key],
      value: section.imageUrl,
      editable: true,
      onChange: (v) => setEditorial(key, 'imageUrl', v),
    });
  }

  const featureImages: MediaEntry[] = draft.features.items.map((item) => ({
    id: `feature-${item.id}`,
    label: item.title || 'Untitled feature',
    group: 'Feature cards',
    value: item.imageUrl,
    editable: true,
    onChange: (v) => setFeatureImage(item.id, v),
  }));

  const configuredCount =
    [...logoEntries, ...siteImages, ...featureImages].filter((entry) => entry.value).length;

  return (
    <>
      <AdminPageHeader
        eyebrow="MEDIA"
        title="Media"
        description="Every image referenced by the public website, grouped by purpose. Leave a field empty and that image simply does not appear."
      />

      <div className="flex flex-col gap-6">
        {/* ------------------------------------------------ LOGO */}
        <AdminPanel
          title="Logo"
          description="The official Dine3D mark. Fixed asset — used as supplied, never redrawn."
        >
          <div className="flex flex-wrap gap-6">
            <div
              className="flex flex-col gap-3"
              style={{
                padding: '1.5rem',
                background: 'var(--bg-secondary)',
                border: '1px solid var(--border-warm)',
                borderRadius: 8,
              }}
            >
              <Dine3DLogo size="lg" href={null} />
              <span style={{ fontSize: '0.6875rem', color: 'var(--text-dimmed)' }}>
                public/images/dine3d-logo.jpg
              </span>
            </div>

            <div className="flex flex-1 flex-col gap-4" style={{ minWidth: 260 }}>
              <AdminField label="Logo path used on the site">
                <AdminInput
                  value={draft.branding.logoUrl}
                  onChange={(v) => setBranding('logoUrl', v)}
                  placeholder={LOGO_SRC}
                />
              </AdminField>
              <AdminField label="Logo description" hint="Read aloud by screen readers.">
                <AdminInput
                  value={draft.branding.logoAlt}
                  onChange={(v) => setBranding('logoAlt', v)}
                  placeholder="Dine3D"
                />
              </AdminField>
              <AdminField label="Favicon path" hint="Leave empty for the browser default.">
                <AdminInput
                  value={draft.branding.faviconUrl}
                  onChange={(v) => setBranding('faviconUrl', v)}
                  placeholder="Leave empty for the default"
                />
              </AdminField>
            </div>
          </div>
        </AdminPanel>

        {/* ------------------------------------------------ SUMMARY */}
        <AdminPanel title="Asset summary">
          <div className="flex flex-wrap gap-6">
            <Stat label="Images in use" value={configuredCount} />
            <Stat label="Feature cards" value={draft.features.items.length} />
            <Stat
              label="Sections with an image"
              value={siteImages.filter((entry) => entry.value).length}
            />
          </div>
        </AdminPanel>

        {/* ------------------------------------------------ WEBSITE IMAGES */}
        <MediaGroup
          title="Website images"
          description="Backgrounds and section imagery across the public site."
          entries={siteImages}
          emptyBody="No section images are configured yet."
        />

        {/* ------------------------------------------------ FEATURE IMAGES */}
        <MediaGroup
          title="Food and feature images"
          description="Imagery attached to individual capability cards."
          entries={featureImages}
          emptyBody="No feature cards exist yet, so there are no feature images."
        />

        <AdminNote>
          This panel records which asset is used where. To add a new file, place it in{' '}
          <code>public/images/</code> (or your image host) and reference it by path. Dish imagery for
          real restaurants lives in the restaurant dashboard and is entirely separate from this
          website content.
        </AdminNote>
      </div>
    </>
  );
}

function MediaGroup({
  title,
  description,
  entries,
  emptyBody,
}: {
  title: string;
  description: string;
  entries: MediaEntry[];
  emptyBody: string;
}) {
  const used = entries.filter((entry) => entry.value);

  return (
    <AdminPanel
      title={title}
      description={description}
      aside={
        <span style={{ fontSize: '0.6875rem', color: 'var(--text-dimmed)' }}>
          {used.length} of {entries.length} in use
        </span>
      }
    >
      {entries.length === 0 ? (
        <AdminEmpty title="Nothing here yet" body={emptyBody} />
      ) : (
        <div className="flex flex-col gap-4">
          {entries.map((entry) => (
            <div key={entry.id} className="flex flex-col gap-2.5">
              <div className="flex flex-wrap items-center justify-between gap-2">
                <div className="flex items-center gap-2">
                  <span style={{ fontSize: '0.8125rem', color: 'var(--text-primary)' }}>{entry.label}</span>
                  <span className="d3-chip">{entry.group}</span>
                </div>

                {entry.value ? (
                  <AdminIconButton label="Clear" onClick={() => entry.onChange?.('')}>
                    Clear
                  </AdminIconButton>
                ) : null}
              </div>

              <AdminInput
                value={entry.value}
                onChange={(v) => entry.onChange?.(v)}
                placeholder="No image set — enter a path or https URL"
              />

              {entry.value ? <ImagePreview src={entry.value} /> : null}
            </div>
          ))}
        </div>
      )}
    </AdminPanel>
  );
}

/**
 * Visual check for a referenced asset.
 * Uses a plain <img> rather than next/image so an arbitrary owner-supplied URL
 * is not pushed through the image optimiser (and cannot fail the build).
 */
function ImagePreview({ src }: { src: string }) {
  return (
    <div
      className="flex items-center justify-center overflow-hidden"
      style={{
        height: 120,
        background: 'var(--bg-primary)',
        border: '1px solid var(--border-warm)',
        borderRadius: 6,
      }}
    >
      {/* eslint-disable-next-line @next/next/no-img-element */}
      <img
        src={src}
        alt=""
        style={{ maxHeight: '100%', maxWidth: '100%', objectFit: 'contain' }}
      />
    </div>
  );
}

function Stat({ label, value }: { label: string; value: number }) {
  return (
    <div className="flex flex-col gap-1">
      <span className="d3-label" style={{ marginBottom: 0 }}>
        {label}
      </span>
      <span className="d3-figure" style={{ fontSize: '1.75rem' }}>
        {value}
      </span>
    </div>
  );
}