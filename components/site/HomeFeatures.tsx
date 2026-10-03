// components/site/HomeFeatures.tsx
//
// Feature card grid, rendered from published content.
// A Server Component: the grid needs no interactivity, and the card hover state
// comes from the existing `d3-card` CSS.

import React from 'react';
import type { Features } from '@/lib/siteContent';
import FeatureIcon from './FeatureIcon';

export default function HomeFeatures({ features }: { features: Features }) {
  if (!features.enabled) return null;

  const items = features.items.filter((item) => item.enabled);

  return (
    <section id="features" className="d3-section relative" style={{ background: 'var(--bg-secondary)' }}>
      <div className="d3-divider" />

      <div className="d3-container">
        {(features.heading || features.eyebrow) && (
          <div className="text-center mb-20" style={{ maxWidth: 560, margin: '0 auto 5rem' }}>
            {features.eyebrow ? <span className="d3-eyebrow block mb-4">{features.eyebrow}</span> : null}
            <h2 className="d3-display-md" style={{ marginBottom: '1.25rem' }}>
              {features.heading}
              {features.headingAccent ? (
                <>
                  <br />
                  <em style={{ color: 'var(--gold)', fontStyle: 'italic', fontWeight: 300 }}>
                    {features.headingAccent}
                  </em>
                </>
              ) : null}
            </h2>
            {features.body ? <p className="d3-body">{features.body}</p> : null}
          </div>
        )}

        {items.length === 0 ? (
          <div className="flex flex-col items-center gap-2 text-center" style={{ padding: '4rem 0' }}>
            <span style={{ fontSize: '0.875rem', color: 'var(--text-dimmed)' }}>
              No features have been published yet.
            </span>
          </div>
        ) : (
          <div
            className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-px"
            style={{
              border: '1px solid var(--border-subtle)',
              borderRadius: 16,
              overflow: 'hidden',
            }}
          >
            {items.map((item, i) => (
              <div
                key={item.id}
                className="d3-card group"
                style={{
                  padding: '2.5rem 2rem',
                  borderRadius: 0,
                  border: 'none',
                  borderRight: i % 3 !== 2 ? '1px solid var(--border-subtle)' : 'none',
                  borderBottom: i < 3 ? '1px solid var(--border-subtle)' : 'none',
                  background: 'var(--bg-surface)',
                }}
              >
                <div
                  style={{
                    width: 44,
                    height: 44,
                    borderRadius: 10,
                    background: 'rgba(201,169,110,0.08)',
                    border: '1px solid rgba(201,169,110,0.15)',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    color: 'var(--gold)',
                    marginBottom: '1.5rem',
                  }}
                >
                  <FeatureIcon name={item.icon} />
                </div>

                {item.eyebrow ? (
                  <span
                    className="d3-eyebrow block mb-3"
                    style={{ color: 'var(--gold-dim)', fontSize: '0.5625rem' }}
                  >
                    {item.eyebrow}
                  </span>
                ) : null}

                {item.title ? (
                  <h3
                    style={{
                      fontFamily: 'var(--font-display)',
                      fontSize: '1.25rem',
                      fontWeight: 500,
                      color: 'var(--text-primary)',
                      letterSpacing: '-0.01em',
                      marginBottom: '0.75rem',
                      lineHeight: 1.3,
                    }}
                  >
                    {item.title}
                  </h3>
                ) : null}

                {item.description ? <p className="d3-body-sm">{item.description}</p> : null}
              </div>
            ))}
          </div>
        )}
      </div>
    </section>
  );
}