'use client';

// components/site/HomeFaq.tsx
//
// FAQ accordion. The only genuinely interactive section, so it is the only one
// that needs to ship JavaScript.

import React, { useState } from 'react';
import type { Faq } from '@/lib/siteContent';

export default function HomeFaq({ faq }: { faq: Faq }) {
  const [openIndex, setOpenIndex] = useState<number | null>(null);

  const items = faq.items.filter((item) => item.question);

  if (items.length === 0) return null;

  return (
    <section id="faq" className="d3-section" style={{ background: 'var(--bg-primary)' }}>
      <div className="d3-container">
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-16 lg:gap-24">
          {/* Left */}
          <div className="flex flex-col gap-6">
            <h2 className="d3-display-md">
              {faq.heading}
              {faq.headingAccent ? (
                <>
                  <br />
                  <em style={{ color: 'var(--gold)', fontStyle: 'italic', fontWeight: 300 }}>
                    {faq.headingAccent}
                  </em>
                </>
              ) : null}
            </h2>

            {faq.body ? <p className="d3-body">{faq.body}</p> : null}
          </div>

          {/* Right — Accordion */}
          <div className="flex flex-col">
            {items.map((item, i) => (
              <div
                key={item.id}
                style={{
                  borderBottom: '1px solid var(--border-subtle)',
                  overflow: 'hidden',
                }}
              >
                <button
                  onClick={() => setOpenIndex(openIndex === i ? null : i)}
                  className="w-full flex items-center justify-between text-left py-5 gap-4"
                  aria-expanded={openIndex === i}
                  style={{
                    background: 'none',
                    border: 'none',
                    cursor: 'pointer',
                    color: 'var(--text-primary)',
                  }}
                >
                  <span
                    style={{
                      fontFamily: 'var(--font-body)',
                      fontSize: '0.9375rem',
                      fontWeight: 500,
                      letterSpacing: '-0.01em',
                      color: openIndex === i ? 'var(--gold)' : 'var(--text-primary)',
                      transition: 'color 200ms',
                    }}
                  >
                    {item.question}
                  </span>
                  <svg
                    width="16"
                    height="16"
                    viewBox="0 0 16 16"
                    fill="none"
                    style={{
                      flexShrink: 0,
                      color: 'var(--text-muted)',
                      transform: openIndex === i ? 'rotate(45deg)' : 'rotate(0deg)',
                      transition: 'transform 300ms',
                    }}
                  >
                    <path d="M8 2V14M2 8H14" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" />
                  </svg>
                </button>
                <div
                  style={{
                    maxHeight: openIndex === i ? 400 : 0,
                    overflow: 'hidden',
                    transition: 'max-height 400ms cubic-bezier(0.4, 0, 0.2, 1)',
                  }}
                >
                  <p className="d3-body-sm" style={{ paddingBottom: '1.25rem' }}>
                    {item.answer}
                  </p>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </section>
  );
}