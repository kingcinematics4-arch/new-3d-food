// components/site/HomePricing.tsx
//
// Plan cards from published pricing content. Server Component.

import React from 'react';
import Link from 'next/link';
import type { Pricing } from '@/lib/siteContent';

export default function HomePricing({ pricing }: { pricing: Pricing }) {
  if (!pricing.enabled) return null;

  const plans = pricing.plans.filter((plan) => plan.enabled);

  return (
    <section id="pricing" className="d3-section" style={{ background: 'var(--bg-secondary)' }}>
      <div className="d3-divider" />
      <div className="d3-container">
        {pricing.heading ? (
          <div className="text-center" style={{ marginBottom: '3.5rem' }}>
            <h2 className="d3-display-md">
              {pricing.heading}
              {pricing.headingAccent ? (
                <>
                  <br />
                  <em style={{ color: 'var(--gold)', fontStyle: 'italic', fontWeight: 300 }}>
                    {pricing.headingAccent}
                  </em>
                </>
              ) : null}
            </h2>
            {pricing.body ? <p className="d3-body mt-6">{pricing.body}</p> : null}
          </div>
        ) : null}

        {plans.length === 0 ? (
          <div className="flex flex-col items-center gap-2 text-center" style={{ padding: '4rem 0' }}>
            <span style={{ fontSize: '0.875rem', color: 'var(--text-dimmed)' }}>
              Pricing has not been published yet.
            </span>
          </div>
        ) : (
          <div
            className="grid grid-cols-1 md:grid-cols-3 gap-6 max-w-5xl mx-auto"
          >
            {plans.map((plan) => (
              <div
                key={plan.id}
                style={{
                  background: plan.featured ? 'var(--bg-elevated)' : 'var(--bg-surface)',
                  border: plan.featured ? '1px solid var(--border-medium)' : '1px solid var(--border-subtle)',
                  borderRadius: 16,
                  padding: '2rem',
                  display: 'flex',
                  flexDirection: 'column',
                  gap: '1.5rem',
                  position: 'relative',
                  overflow: 'hidden',
                }}
              >
                {plan.featured && (
                  <div
                    className="absolute top-0 right-0 left-0 h-px"
                    style={{ background: 'linear-gradient(to right, transparent, var(--gold), transparent)' }}
                  />
                )}

                <div>
                  {plan.name ? (
                    <h3
                      style={{
                        fontFamily: 'var(--font-display)',
                        fontSize: '1.375rem',
                        fontWeight: 500,
                        color: 'var(--text-primary)',
                        letterSpacing: '-0.01em',
                      }}
                    >
                      {plan.name}
                    </h3>
                  ) : null}

                  {/* Who the plan is for, in plain copy. Set as a small muted
                      sentence rather than an uppercase label: it carries real
                      information and does not need to shout to be read. */}
                  {plan.tagline ? (
                    <p style={{ fontSize: '0.8125rem', color: 'var(--text-muted)', marginTop: '0.375rem' }}>
                      {plan.tagline}
                    </p>
                  ) : null}
                </div>

                <div className="flex items-end gap-1">
                  <span
                    style={{
                      fontFamily: 'var(--font-display)',
                      fontSize: '3rem',
                      fontWeight: 400,
                      color: plan.featured ? 'var(--gold)' : 'var(--text-primary)',
                      letterSpacing: '-0.03em',
                      lineHeight: 1,
                    }}
                  >
                    {plan.price}
                  </span>
                  {plan.period ? (
                    <span style={{ color: 'var(--text-muted)', fontSize: '0.875rem', marginBottom: '0.25rem' }}>
                      {plan.period}
                    </span>
                  ) : null}
                </div>

                <div className="d3-divider" />

                {plan.features.filter(Boolean).length > 0 ? (
                  <ul className="flex flex-col gap-3">
                    {plan.features.filter(Boolean).map((line, j) => (
                      <li
                        key={j}
                        className="flex items-center gap-3"
                        style={{ fontSize: '0.875rem', color: 'var(--text-secondary)' }}
                      >
                        <svg
                          width="14"
                          height="14"
                          viewBox="0 0 14 14"
                          fill="none"
                          style={{ flexShrink: 0, color: 'var(--gold)' }}
                        >
                          <path
                            d="M2 7L5.5 10.5L12 3.5"
                            stroke="currentColor"
                            strokeWidth="1.5"
                            strokeLinecap="round"
                            strokeLinejoin="round"
                          />
                        </svg>
                        {line}
                      </li>
                    ))}
                  </ul>
                ) : null}

                {plan.ctaText && plan.ctaHref ? (
                  <Link
                    href={plan.ctaHref}
                    className={plan.featured ? 'd3-btn-primary' : 'd3-btn-ghost'}
                    style={{ justifyContent: 'center', marginTop: 'auto' }}
                  >
                    {plan.ctaText}
                  </Link>
                ) : null}
              </div>
            ))}
          </div>
        )}
      </div>
    </section>
  );
}