// components/site/EditorialSection.tsx
//
// Renderer for the general-purpose content sections: About, 3D Food Menu, AR
// Experience, QR Ordering, Restaurant Dashboard, Analytics and Contact.
//
// One component covers all of them because they share a shape — a label, a
// two-line heading, body copy, optional image and one call to action. Each
// instance is driven entirely by published content.
//
// When a section is switched on but has nothing written yet, it renders an
// explicit "not published yet" block. It never invents a paragraph to fill the
// space.

import React from 'react';
import Link from 'next/link';
import type { EditorialSection, Contact } from '@/lib/siteContent';

/**
 * Contact sections carry email/phone/address instead of an image, so the
 * renderer accepts either shape and reads the fields it needs.
 */
type SectionContent = EditorialSection & Partial<Contact>;

interface EditorialSectionProps {
  id: string;
  content: EditorialSection | Contact;
  variant?: 'default' | 'contact';
  label: string;
}

export default function EditorialSection({
  id,
  content,
  variant = 'default',
  label,
}: EditorialSectionProps) {
  const section = content as SectionContent;

  if (!section.enabled) return null;

  const hasContent = Boolean(section.heading || section.headingAccent || section.body);

  return (
    <section id={id} className="d3-section" style={{ background: 'var(--bg-secondary)' }}>
      <div className="d3-divider" />

      <div className="d3-container">
        {!hasContent ? (
          // Honest empty state: the owner turned this on but has not written it.
          <div className="flex flex-col items-center gap-3 text-center" style={{ padding: '4rem 0' }}>
            <span className="d3-eyebrow" style={{ color: 'var(--text-dimmed)' }}>
              {section.eyebrow || label.toUpperCase()}
            </span>
            <span style={{ fontSize: '0.875rem', color: 'var(--text-dimmed)', maxWidth: '44ch' }}>
              This section has not been published yet.
            </span>
          </div>
        ) : (
          <div
            className={`grid gap-16 items-center ${
              section.imageUrl && variant === 'default' ? 'lg:grid-cols-2' : 'grid-cols-1'
            }`}
          >
            <div className="flex flex-col gap-6" style={{ maxWidth: 620 }}>
              {section.eyebrow ? <span className="d3-eyebrow">{section.eyebrow}</span> : null}

              <h2 className="d3-display-md">
                {section.heading}
                {section.headingAccent ? (
                  <>
                    <br />
                    <em style={{ color: 'var(--gold)', fontStyle: 'italic', fontWeight: 300 }}>
                      {section.headingAccent}
                    </em>
                  </>
                ) : null}
              </h2>

              {section.body ? <p className="d3-body">{section.body}</p> : null}

              {variant === 'contact' ? (
                <dl className="flex flex-col gap-3" style={{ margin: 0 }}>
                  {section.email ? (
                    <div className="flex items-baseline gap-3">
                      <dt
                        className="d3-eyebrow"
                        style={{ color: 'var(--text-dimmed)', minWidth: 72 }}
                      >
                        EMAIL
                      </dt>
                      <dd style={{ margin: 0 }}>
                        <a href={`mailto:${section.email}`} style={{ color: 'var(--gold)' }}>
                          {section.email}
                        </a>
                      </dd>
                    </div>
                  ) : null}
                  {section.phone ? (
                    <div className="flex items-baseline gap-3">
                      <dt
                        className="d3-eyebrow"
                        style={{ color: 'var(--text-dimmed)', minWidth: 72 }}
                      >
                        PHONE
                      </dt>
                      <dd style={{ margin: 0, color: 'var(--text-secondary)' }}>{section.phone}</dd>
                    </div>
                  ) : null}
                  {section.address ? (
                    <div className="flex items-baseline gap-3">
                      <dt
                        className="d3-eyebrow"
                        style={{ color: 'var(--text-dimmed)', minWidth: 72 }}
                      >
                        STUDIO
                      </dt>
                      <dd style={{ margin: 0, color: 'var(--text-secondary)' }}>{section.address}</dd>
                    </div>
                  ) : null}
                </dl>
              ) : null}

              {section.primaryCtaText && section.primaryCtaHref ? (
                <div className="pt-2">
                  <Link href={section.primaryCtaHref} className="d3-btn-primary">
                    {section.primaryCtaText}
                    <svg width="14" height="14" viewBox="0 0 14 14" fill="none">
                      <path
                        d="M2.5 7H11.5M8 3.5L11.5 7L8 10.5"
                        stroke="currentColor"
                        strokeWidth="1.5"
                        strokeLinecap="round"
                        strokeLinejoin="round"
                      />
                    </svg>
                  </Link>
                </div>
              ) : null}
            </div>

            {section.imageUrl && variant === 'default' ? (
              <div
                className="relative overflow-hidden"
                style={{
                  border: '1px solid var(--border-light)',
                  borderRadius: 14,
                  background: 'var(--bg-surface)',
                  minHeight: 320,
                }}
              >
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img
                  src={section.imageUrl}
                  alt={section.imageAlt || ''}
                  style={{ width: '100%', height: '100%', objectFit: 'cover', display: 'block' }}
                />
              </div>
            ) : null}
          </div>
        )}
      </div>
    </section>
  );
}