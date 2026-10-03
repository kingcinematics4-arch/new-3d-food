'use client';

// app/admin/(panel)/hero/page.tsx
//
// HERO SECTION EDITOR
//
// Every visible element of the first screen: headline, supporting copy, both
// calls to action and their destinations, the hero image, the 3D viewer and
// the credential strip — plus per-element visibility switches.

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
  AdminEmpty,
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
              checked={hero.showEyebrow}
              onChange={(v) => set('showEyebrow', v)}
              label="Show the small label above the headline"
              description="The DINE3D wordmark line."
            />
            <AdminToggle
              checked={hero.showSecondaryCta}
              onChange={(v) => set('showSecondaryCta', v)}
              label="Show the second button"
              description="Usually a quieter link such as “See how it works”."
            />
            <AdminToggle
              checked={hero.showStats}
              onChange={(v) => set('showStats', v)}
              label="Show the credential strip"
              description="The row of short figures beneath the buttons. Leave values blank to show nothing."
            />
            <AdminToggle
              checked={hero.showViewer}
              onChange={(v) => set('showViewer', v)}
              label="Show the 3D viewer panel"
              description="The interactive model preview beside the headline."
            />
          </div>
        </AdminPanel>

        <AdminPanel title="Headline and copy">
          <div className="flex flex-col gap-5">
            <AdminField label="Small label" hint="Short, uppercase. Shown above the headline.">
              <AdminInput value={hero.eyebrow} onChange={(v) => set('eyebrow', v)} placeholder="DINE3D" />
            </AdminField>

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

        <AdminPanel
          title="Viewer panel"
          description="The card beside the headline that shows the interactive 3D model."
        >
          <div className="flex flex-col gap-5">
            <AdminField label="Panel title">
              <AdminInput
                value={hero.viewerTitle}
                onChange={(v) => set('viewerTitle', v)}
                placeholder="Upload your own GLB"
              />
            </AdminField>
            <AdminField label="Panel caption">
              <AdminInput
                value={hero.viewerCaption}
                onChange={(v) => set('viewerCaption', v)}
                placeholder="Menus, prices and 3D models come from your data"
              />
            </AdminField>

            <div className="d3-rule" />

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

        <AdminPanel
          title="Credential strip"
          description="The short figures under the buttons. These are product facts — only fill in what is true."
          aside={
            <button
              type="button"
              className="d3-btn-inline"
              onClick={() =>
                set('stats', [
                  ...hero.stats,
                  { id: `stat-${Date.now()}`, value: '', label: '' },
                ])
              }
            >
              + Add
            </button>
          }
        >
          {hero.stats.length === 0 ? (
            <AdminEmpty
              title="No figures configured"
              body="Nothing is shown under the buttons right now. Add one only if you have a real fact to state."
            />
          ) : (
            <div className="flex flex-col">
              {hero.stats.map((stat, index) => (
                <div
                  key={stat.id}
                  className="flex flex-wrap items-end gap-3 py-4"
                  style={{ borderTop: index === 0 ? 'none' : '1px solid var(--border-warm)' }}
                >
                  <AdminField label="Value" className="flex-1" >
                    <AdminInput
                      value={stat.value}
                      onChange={(v) =>
                        set(
                          'stats',
                          hero.stats.map((s) => (s.id === stat.id ? { ...s, value: v } : s))
                        )
                      }
                      placeholder="360°"
                    />
                  </AdminField>

                  <AdminField label="Label" className="flex-1">
                    <AdminInput
                      value={stat.label}
                      onChange={(v) =>
                        set(
                          'stats',
                          hero.stats.map((s) => (s.id === stat.id ? { ...s, label: v } : s))
                        )
                      }
                      placeholder="3D MENU VIEWER"
                    />
                  </AdminField>

                  <button
                    type="button"
                    className="d3-btn-inline"
                    disabled={index === 0}
                    onClick={() =>
                      set('stats', [
                        ...hero.stats.slice(0, index - 1),
                        hero.stats[index],
                        hero.stats[index - 1],
                      ])
                    }
                    style={{ opacity: index === 0 ? 0.35 : 1 }}
                    aria-label="Move up"
                  >
                    ↑
                  </button>
                  <button
                    type="button"
                    className="d3-btn-inline"
                    disabled={index === hero.stats.length - 1}
                    onClick={() =>
                      set('stats', [
                        ...hero.stats.slice(0, index),
                        hero.stats[index + 1],
                        hero.stats[index],
                      ])
                    }
                    style={{ opacity: index === hero.stats.length - 1 ? 0.35 : 1 }}
                    aria-label="Move down"
                  >
                    ↓
                  </button>
                  <button
                    type="button"
                    className="d3-btn-inline d3-btn-danger"
                    onClick={() => set('stats', hero.stats.filter((s) => s.id !== stat.id))}
                    aria-label="Remove"
                  >
                    Remove
                  </button>
                </div>
              ))}
            </div>
          )}
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