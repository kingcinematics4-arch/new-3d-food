'use client';

// app/admin/(panel)/sections/page.tsx
//
// WEBSITE SECTIONS
//
// Every section on the public site can be switched on or off, and the
// editorial sections (About, 3D Food Menu, AR, QR Ordering, Restaurant
// Dashboard, Analytics, Contact) can be written from here.
//
// Sections that do not exist yet start switched OFF with empty fields. Turning
// one on without writing copy renders an explicit "not configured yet" state on
// the public site rather than inventing a paragraph to fill the gap.

import React, { useState } from 'react';
import { useSiteContent } from '@/components/admin/SiteContentProvider';
import {
  AdminPageHeader,
  AdminPanel,
  AdminField,
  AdminInput,
  AdminTextarea,
  AdminToggle,
  AdminEmpty,
  AdminNote,
} from '@/components/admin/ui';
import { SECTION_KEYS, SECTION_LABELS, SECTION_DESCRIPTIONS } from '@/lib/siteContent';
import type { EditorialSection, Contact, SectionKey } from '@/lib/siteContent';

/**
 * Contact is an editorial section plus contact details, so the editor works
 * against the union of the two shapes.
 */
type EditableSection = EditorialSection & Partial<Pick<Contact, 'email' | 'phone' | 'address'>>;

const EDITORIAL_SECTIONS = [
  'about',
  'menu3d',
  'ar',
  'qr',
  'dashboard',
  'analytics',
  'contact',
] as const;

type EditorialKey = (typeof EDITORIAL_SECTIONS)[number];

const EMPTY_COPY_MESSAGE =
  'This section is switched on but has no content yet. Add copy below, or switch it off.';

export default function AdminSectionsPage() {
  const { draft, update, loading } = useSiteContent();
  const [active, setActive] = useState<EditorialKey>('about');

  const setSectionEnabled = (key: SectionKey, enabled: boolean) =>
    update((current) => {
      const section = current[key];
      return { ...current, [key]: { ...section, enabled } };
    });

  if (loading) {
    return (
      <>
        <AdminPageHeader eyebrow="SECTIONS" title="Website sections" />
        <div className="d3-panel p-8" style={{ color: 'var(--text-dimmed)', fontSize: '0.875rem' }}>
          Loading…
        </div>
      </>
    );
  }

  const section = draft[active] as EditableSection;
  const setEditorial = <K extends keyof EditableSection>(key: K, value: EditableSection[K]) =>
    update((current) => ({
      ...current,
      [active]: { ...(current[active] as EditableSection), [key]: value },
    }));

  const enabledCount = SECTION_KEYS.filter((key) => draft[key].enabled).length;

  return (
    <>
      <AdminPageHeader
        eyebrow="SECTIONS"
        title="Website sections"
        description={`${enabledCount} of ${SECTION_KEYS.length} sections are currently live. Switch a section off to hide it from visitors without deleting the content.`}
      />

      <div className="flex flex-col gap-6">
        <AdminPanel title="Visibility" description="The order below is the order visitors see.">
          <div className="flex flex-col">
            {SECTION_KEYS.map((key, index) => (
              <div
                key={key}
                className="flex flex-col gap-3 py-4"
                style={{ borderTop: index === 0 ? 'none' : '1px solid var(--border-warm)' }}
              >
                <AdminToggle
                  checked={draft[key].enabled}
                  onChange={(v) => setSectionEnabled(key, v)}
                  label={SECTION_LABELS[key]}
                  description={SECTION_DESCRIPTIONS[key]}
                />

                {EDITORIAL_SECTIONS.includes(key as EditorialKey) ? (
                  <div className="flex flex-wrap items-center gap-2" style={{ paddingLeft: 46 }}>
                    {draft[key].enabled && (draft[key] as EditorialSection).enabled ? (
                      <span style={{ fontSize: '0.6875rem', color: 'var(--text-dimmed)' }}>
                        Live with {(draft[key] as EditorialSection).heading ? 'content' : 'no content yet'}
                      </span>
                    ) : null}

                    <button
                      type="button"
                      className="d3-btn-inline"
                      onClick={() => setActive(key as EditorialKey)}
                    >
                      {active === key ? 'Editing below' : 'Edit content'}
                    </button>
                  </div>
                ) : null}
              </div>
            ))}
          </div>
        </AdminPanel>

        <AdminPanel
          title={`Edit: ${SECTION_LABELS[active]}`}
          description={SECTION_DESCRIPTIONS[active]}
          aside={
            <div className="d3-segment">
              {EDITORIAL_SECTIONS.map((key) => (
                <button
                  key={key}
                  type="button"
                  className="d3-segment-item"
                  data-active={active === key}
                  onClick={() => setActive(key)}
                >
                  {SECTION_LABELS[key]}
                </button>
              ))}
            </div>
          }
        >
          <div className="flex flex-col gap-5">
            {section.enabled && !section.heading && !section.body ? (
              <AdminNote tone="accent">{EMPTY_COPY_MESSAGE}</AdminNote>
            ) : null}

            <div className="grid gap-5" style={{ gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))' }}>
              <AdminField label="Small label">
                <AdminInput
                  value={section.eyebrow}
                  onChange={(v) => setEditorial('eyebrow', v)}
                  placeholder="Optional"
                />
              </AdminField>

              <AdminField label="Heading">
                <AdminInput
                  value={section.heading}
                  onChange={(v) => setEditorial('heading', v)}
                  placeholder="Section heading"
                />
              </AdminField>

              <AdminField label="Heading second line" hint="Rendered in the accent italic treatment.">
                <AdminInput
                  value={section.headingAccent}
                  onChange={(v) => setEditorial('headingAccent', v)}
                  placeholder="Optional"
                />
              </AdminField>
            </div>

            <AdminField label="Body copy">
              <AdminTextarea
                value={section.body}
                onChange={(v) => setEditorial('body', v)}
                rows={5}
                placeholder="Explain this part of the product."
              />
            </AdminField>

            <div className="d3-rule" />

            <div className="grid gap-5" style={{ gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))' }}>
              <AdminField label="Image path" hint="Optional. A site path or an https URL.">
                <AdminInput
                  value={section.imageUrl}
                  onChange={(v) => setEditorial('imageUrl', v)}
                  placeholder="Leave empty for no image"
                />
              </AdminField>

              <AdminField label="Image description">
                <AdminInput
                  value={section.imageAlt}
                  onChange={(v) => setEditorial('imageAlt', v)}
                  placeholder="Describe the image"
                />
              </AdminField>

              <AdminField label="Button text">
                <AdminInput
                  value={section.primaryCtaText}
                  onChange={(v) => setEditorial('primaryCtaText', v)}
                  placeholder="Optional"
                />
              </AdminField>

              <AdminField label="Button destination">
                <AdminInput
                  value={section.primaryCtaHref}
                  onChange={(v) => setEditorial('primaryCtaHref', v)}
                  placeholder="/signup"
                />
              </AdminField>
            </div>

            {active === 'contact' ? (
              <>
                <div className="d3-rule" />
                <div className="grid gap-5" style={{ gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))' }}>
                  <AdminField label="Email">
                    <AdminInput
                      type="email"
                      value={section.email ?? ''}
                      onChange={(v) => setEditorial('email', v)}
                      placeholder="hello@example.com"
                    />
                  </AdminField>
                  <AdminField label="Phone">
                    <AdminInput
                      value={section.phone ?? ''}
                      onChange={(v) => setEditorial('phone', v)}
                      placeholder="Optional"
                    />
                  </AdminField>
                  <AdminField label="Address">
                    <AdminInput
                      value={section.address ?? ''}
                      onChange={(v) => setEditorial('address', v)}
                      placeholder="Optional"
                    />
                  </AdminField>
                </div>
              </>
            ) : null}
          </div>
        </AdminPanel>

        <AdminNote>
          Sections you have not written yet are hidden from visitors. Nothing is auto-filled: the
          website will not invent copy, figures or customer details for an empty section.
        </AdminNote>
      </div>
    </>
  );
}