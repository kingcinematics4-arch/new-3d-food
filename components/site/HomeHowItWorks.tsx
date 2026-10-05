// components/site/HomeHowItWorks.tsx
//
// The numbered walkthrough. Server Component — no interactivity required.

import React from 'react';
import type { HowItWorks } from '@/lib/siteContent';

export default function HomeHowItWorks({ howItWorks }: { howItWorks: HowItWorks }) {
  if (!howItWorks.enabled) return null;

  const steps = howItWorks.steps.filter((step) => step.enabled && (step.label || step.description));

  return (
    <section id="how-it-works" className="d3-section" style={{ background: 'var(--bg-primary)' }}>
      <div className="d3-container">
        {howItWorks.heading ? (
          <div style={{ maxWidth: 480, marginBottom: '4rem' }}>
            <h2 className="d3-display-md">
              {howItWorks.heading}
              {howItWorks.headingAccent ? (
                <>
                  <br />
                  <em style={{ color: 'var(--gold)', fontStyle: 'italic', fontWeight: 300 }}>
                    {howItWorks.headingAccent}
                  </em>
                </>
              ) : null}
            </h2>
            {howItWorks.body ? <p className="d3-body mt-6">{howItWorks.body}</p> : null}
          </div>
        ) : null}

        {steps.length === 0 ? (
          <div className="flex flex-col items-center gap-2 text-center" style={{ padding: '4rem 0' }}>
            <span style={{ fontSize: '0.875rem', color: 'var(--text-dimmed)' }}>
              No steps have been published yet.
            </span>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-12">
            {steps.map((step, i) => (
              <div key={step.id} className="flex flex-col gap-4">
                <div className="flex items-center gap-4">
                  <span
                    style={{
                      fontFamily: 'var(--font-display)',
                      fontSize: '4rem',
                      fontWeight: 300,
                      color: 'rgba(201,169,110,0.15)',
                      lineHeight: 1,
                      letterSpacing: '-0.04em',
                    }}
                  >
                    {String(i + 1).padStart(2, '0')}
                  </span>
                  <div style={{ flex: 1, height: 1, background: 'var(--border-subtle)' }} />
                </div>

                {step.label ? (
                  <h3
                    style={{
                      fontFamily: 'var(--font-display)',
                      fontSize: '1.5rem',
                      fontWeight: 500,
                      color: 'var(--text-primary)',
                      letterSpacing: '-0.01em',
                    }}
                  >
                    {step.label}
                  </h3>
                ) : null}

                {step.description ? <p className="d3-body-sm">{step.description}</p> : null}
              </div>
            ))}
          </div>
        )}
      </div>
    </section>
  );
}