'use client';

// app/admin/(panel)/hero/page.tsx
//
// HERO SECTION EDITOR
//
// Every visible element of the first screen: headline, supporting copy, both
// calls to action and their destinations, the optional background image and the
// 3D dish demonstration — plus per-element visibility switches.

import React from 'react';
import { useSiteContent } from '@/components/admin/SiteContentProvider';
import {
  AdminPageHeader,
  AdminPanel,
  AdminField,
  AdminInput,
  AdminTextarea,
  AdminToggle,
  AdminNote,
} from '@/components/admin/ui';

export default function AdminHeroPage() {
  const { draft, update, loading } = useSiteContent();
  const hero = draft.hero;

  const set = <K extends keyof typeof hero>(key: K, value: (typeof hero)[K]) =>
    update((current) => ({ ...current, hero: { ...current.hero, [key]: value } }));

  if (loading) {
    return (
      <>
        <AdminPageHeader eyebrow="HERO" title="Hero section" />
        <div className="d3-panel p-8" style={{ color: 'var(--text-dimmed)', fontSize: '0.875rem' }}>
          Loading…
        </div>
      </>
    );
  }

  const hasContent = Boolean(hero.heading || hero.subheading || hero.ctaText);

  return (
    <>
      <AdminPageHeader
        eyebrow="HERO"
        title="Hero section"
        description="The first thing a visitor sees. Write the headline, supporting copy and where each button should take people."
      />

      <div className="flex flex-col gap-6">
        <AdminPanel title="Visibility">
          <div className="flex flex-col gap-4">
            <AdminToggle
              checked={hero.enabled}
              onChange={(v) => set('enabled', v)}
              label="Show the hero section"
              description="When off, the website opens straight into the next section."
            />
            <div className="d3-rule" />
            <AdminToggle
              checked={hero.showSecondaryCta}
              onChange={(v) => set('showSecondaryCta', v)}
              label="Show the second button"
              description="Usually a quieter link such as “See how it works”."
            />
            <AdminToggle
              checked={hero.showViewer}
              onChange={(v) => set('showViewer', v)}
              label="Show the 3D model"
              description="The interactive dish preview beside the headline."
            />
          </div>
        </AdminPanel>

        <AdminPanel title="Headline and copy">
          <div className="flex flex-col gap-5">
            <AdminField label="Headline" hint="First line. Keep it short — it sets the display size.">
              <AdminInput value={hero.heading} onChange={(v) => set('heading', v)} placeholder="See your meal" />
            </AdminField>

            <AdminField
              label="Headline second line"
              hint="Rendered in the champagne italic treatment."
            >
              <AdminInput
                value={hero.headingAccent}
                onChange={(v) => set('headingAccent', v)}
                placeholder="before you order."
              />
            </AdminField>

            <AdminField label="Subheading" hint="One sentence that explains the offer.">
              <AdminTextarea
                value={hero.subheading}
                onChange={(v) => set('subheading', v)}
                rows={3}
                placeholder="Turn your restaurant menu into an interactive 3D dining experience."
              />
            </AdminField>

            <AdminField label="Supporting text" hint="Optional second paragraph.">
              <AdminTextarea
                value={hero.secondaryText}
                onChange={(v) => set('secondaryText', v)}
                rows={2}
                placeholder="Scan a QR code. Explore dishes in 3D."
              />
            </AdminField>
          </div>
        </AdminPanel>

        <AdminPanel title="Calls to action">
          <div className="grid gap-5" style={{ gridTemplateColumns: 'repeat(auto-fit, minmax(260px, 1fr))' }}>
            <div className="flex flex-col gap-4">
              <span className="d3-eyebrow" style={{ color: 'var(--gold-dim)' }}>
                PRIMARY
              </span>
              <AdminField label="Button text">
                <AdminInput value={hero.ctaText} onChange={(v) => set('ctaText', v)} placeholder="Start Free" />
              </AdminField>
              <AdminField label="Destination" hint="A site path such as /signup, or a full https:// URL.">
                <AdminInput value={hero.ctaHref} onChange={(v) => set('ctaHref', v)} placeholder="/signup" />
              </AdminField>
            </div>

            <div className="flex flex-col gap-4">
              <span className="d3-eyebrow" style={{ color: 'var(--gold-dim)' }}>
                SECONDARY
              </span>
              <AdminField label="Button text">
                <AdminInput
                  value={hero.secondaryCtaText}
                  onChange={(v) => set('secondaryCtaText', v)}
                  placeholder="See How It Works"
                />
              </AdminField>
              <AdminField label="Destination">
                <AdminInput
                  value={hero.secondaryCtaHref}
                  onChange={(v) => set('secondaryCtaHref', v)}
                  placeholder="/#how-it-works"
                />
              </AdminField>
            </div>
          </div>
        </AdminPanel>

        <AdminPanel title="Background image">
          <div className="flex flex-col gap-5">
            <AdminField
              label="Hero image"
              hint="Optional. Leave empty to keep the current background treatment. Accepts a site path or an https URL."
            >
              <AdminInput
                value={hero.imageUrl}
                onChange={(v) => set('imageUrl', v)}
                placeholder="Leave empty for the current look"
              />
            </AdminField>

            <AdminField label="Image description" hint="Read aloud by screen readers. Describe the image.">
              <AdminInput
                value={hero.imageAlt}
                onChange={(v) => set('imageAlt', v)}
                placeholder="Describe the hero image"
              />
            </AdminField>
          </div>
        </AdminPanel>

        {!hasContent && hero.enabled ? (
          <AdminNote tone="accent">
            The hero is switched on but has no copy yet. Add a headline and supporting text, then publish.
          </AdminNote>
        ) : null}
      </div>
    </>
  );
}