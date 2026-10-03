'use client';

// app/admin/(panel)/page.tsx
//
// WEBSITE OVERVIEW
//
// Shows the real state of the public website: whether it has ever been
// published, when it was last published or edited, which sections are live,
// and shortcuts into each editor.
//
// Every figure here is derived from stored content. There are no placeholder
// numbers, no invented traffic stats and no fabricated activity.

import React from 'react';
import Link from 'next/link';
import { useSiteContent, formatTimestamp } from '@/components/admin/SiteContentProvider';
import { AdminPageHeader, AdminPanel, AdminEmpty, AdminNote } from '@/components/admin/ui';
import { SECTION_KEYS, SECTION_LABELS } from '@/lib/siteContent';

const QUICK_EDITS = [
  { href: '/admin/hero', label: 'Hero headline', section: 'hero' },
  { href: '/admin/features', label: 'Feature cards', section: 'features' },
  { href: '/admin/pricing', label: 'Pricing plans', section: 'pricing' },
  { href: '/admin/branding', label: 'Branding', section: null },
  { href: '/admin/sections', label: 'Section visibility', section: null },
  { href: '/admin/media', label: 'Media', section: null },
] as const;

export default function AdminOverviewPage() {
  const { draft, published, loading, hasEverPublished, publishedAt, updatedAt } = useSiteContent();

  if (loading) {
    return (
      <>
        <AdminPageHeader eyebrow="OVERVIEW" title="Website" />
        <div className="d3-panel p-8" style={{ color: 'var(--text-dimmed)', fontSize: '0.875rem' }}>
          Loading content…
        </div>
      </>
    );
  }

  const enabledSections = SECTION_KEYS.filter((key) => draft[key].enabled);
  const disabledSections = SECTION_KEYS.filter((key) => !draft[key].enabled);

  return (
    <>
      <AdminPageHeader
        eyebrow="OVERVIEW"
        title="Website"
        description="Control every part of the public Dine3D website from here. Edits are saved as a draft and only reach visitors when you publish."
      />

      <div className="flex flex-col gap-6">
        {/* ------------------------------------------------ STATUS */}
        <AdminPanel title="Public website status">
          <div className="flex flex-col gap-5">
            <div className="flex flex-wrap items-center gap-3">
              <span className={hasEverPublished ? 'd3-badge d3-badge-gold' : 'd3-badge d3-badge-warm'}>
                {hasEverPublished ? 'PUBLISHED' : 'NOT PUBLISHED'}
              </span>
              <span style={{ fontSize: '0.875rem', color: 'var(--text-secondary)' }}>
                {hasEverPublished
                  ? 'Your published content is live on the public website.'
                  : 'Nothing has been published yet. The website is currently showing its default content.'}
              </span>
            </div>

            <div className="grid gap-5" style={{ gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))' }}>
              <div className="flex flex-col gap-1">
                <span className="d3-label" style={{ marginBottom: 0 }}>
                  Last published
                </span>
                <span style={{ fontSize: '0.875rem', color: hasEverPublished ? 'var(--text-primary)' : 'var(--text-dimmed)' }}>
                  {hasEverPublished ? formatTimestamp(publishedAt) : 'Never'}
                </span>
              </div>

              <div className="flex flex-col gap-1">
                <span className="d3-label" style={{ marginBottom: 0 }}>
                  Last edited
                </span>
                <span style={{ fontSize: '0.875rem', color: updatedAt ? 'var(--text-primary)' : 'var(--text-dimmed)' }}>
                  {formatTimestamp(updatedAt)}
                </span>
              </div>

              <div className="flex flex-col gap-1">
                <span className="d3-label" style={{ marginBottom: 0 }}>
                  Sections live
                </span>
                <span style={{ fontSize: '0.875rem', color: 'var(--text-primary)' }}>
                  {enabledSections.length} of {SECTION_KEYS.length}
                </span>
              </div>

              <div className="flex flex-col gap-1">
                <span className="d3-label" style={{ marginBottom: 0 }}>
                  Draft changes
                </span>
                <span style={{ fontSize: '0.875rem', color: 'var(--text-primary)' }}>
                  {hasEverPublished ? 'Tracked in the footer' : 'Save, then publish to go live'}
                </span>
              </div>
            </div>

            <div className="flex flex-wrap gap-2">
              <a href="/" target="_blank" rel="noopener noreferrer" className="d3-btn-quiet">
                Preview Website
              </a>
              <Link href="/admin/sections" className="d3-btn-subtle">
                Manage sections
              </Link>
            </div>
          </div>
        </AdminPanel>

        {/* ------------------------------------------------ QUICK EDITS */}
        <AdminPanel
          title="Quick edit"
          description="Jump straight to an editor."
        >
          <div className="grid gap-2" style={{ gridTemplateColumns: 'repeat(auto-fit, minmax(210px, 1fr))' }}>
            {QUICK_EDITS.map((item) => (
              <Link
                key={item.href}
                href={item.href}
                className="d3-option"
                style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 8 }}
              >
                <span style={{ color: 'var(--text-primary)' }}>{item.label}</span>
                <span style={{ color: 'var(--text-dimmed)', fontSize: '0.6875rem' }}>→</span>
              </Link>
            ))}
          </div>
        </AdminPanel>

        {/* ------------------------------------------------ SECTIONS */}
        <AdminPanel title="Sections" description="What visitors can see right now.">
          {enabledSections.length === 0 ? (
            <AdminEmpty
              title="No sections are enabled"
              body="Every section on the website is currently switched off. Turn at least one on so the site has something to show."
              action={
                <Link href="/admin/sections" className="d3-btn-quiet">
                  Enable sections
                </Link>
              }
            />
          ) : (
            <div className="flex flex-wrap gap-2">
              {SECTION_KEYS.map((key) => {
                const live = draft[key].enabled;
                return (
                  <span
                    key={key}
                    className={live ? 'd3-badge d3-badge-gold' : 'd3-badge d3-badge-warm'}
                    style={{ opacity: live ? 1 : 0.55 }}
                  >
                    {SECTION_LABELS[key]}
                  </span>
                );
              })}
            </div>
          )}

          {disabledSections.length > 0 ? (
            <div className="mt-5">
              <AdminNote>
                {disabledSections.length} section{disabledSections.length === 1 ? ' is' : 's are'} hidden:{' '}
                {disabledSections.map((key) => SECTION_LABELS[key]).join(', ')}.
              </AdminNote>
            </div>
          ) : null}
        </AdminPanel>

        {/* ------------------------------------------------ PUBLISHED SNAPSHOT */}
        <AdminPanel
          title="Live content"
          description="A quick read of what is published right now, as opposed to your draft."
        >
          <div className="flex flex-col gap-4">
            <SnapshotRow
              label="Hero heading"
              value={[published.hero.heading, published.hero.headingAccent].filter(Boolean).join(' ')}
            />
            <SnapshotRow label="Hero call to action" value={published.hero.ctaText} />
            <SnapshotRow
              label="Feature cards"
              value={
                published.features.enabled
                  ? `${published.features.items.filter((f) => f.enabled && f.title).length} live`
                  : 'Section hidden'
              }
            />
            <SnapshotRow
              label="Pricing plans"
              value={
                published.pricing.enabled
                  ? `${published.pricing.plans.filter((p) => p.enabled && p.name).length} live`
                  : 'Section hidden'
              }
            />
            <SnapshotRow
              label="FAQ entries"
              value={
                published.faq.enabled
                  ? `${published.faq.items.filter((f) => f.question).length} live`
                  : 'Section hidden'
              }
            />
            <SnapshotRow
              label="Accent colour"
              value={published.branding.accentColor.toUpperCase()}
            />
          </div>
        </AdminPanel>
      </div>
    </>
  );
}

function SnapshotRow({ label, value }: { label: string; value: string }) {
  return (
    <div
      className="flex flex-wrap items-center justify-between gap-3 py-3"
      style={{ borderTop: '1px solid var(--border-warm)' }}
    >
      <span className="d3-label" style={{ marginBottom: 0 }}>
        {label}
      </span>
      <span
        style={{
          fontSize: '0.8125rem',
          color: value ? 'var(--text-primary)' : 'var(--text-dimmed)',
          textAlign: 'right',
        }}
      >
        {value || 'Not set'}
      </span>
    </div>
  );
}