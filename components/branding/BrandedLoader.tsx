'use client';

// components/branding/BrandedLoader.tsx
//
// The one branded loading state in the app.
//
// It is deliberately the smallest thing that could possibly be a loader: the
// official logo and, optionally, one quiet line of text. There is no spinner, no
// progress bar and no JavaScript timer, so it adds no work between a route
// request and the content that replaces it.
//
// The animation is a CSS opacity pulse on the logo alone, so it costs one
// compositor-only property and is switched off entirely under
// `prefers-reduced-motion`.

import React from 'react';
import Dine3DLogo from '@/components/Dine3DLogo';

interface BrandedLoaderProps {
  /**
   * Visible status line. Omit it for a bare mark; assistive technology always
   * receives an announcement either way.
   */
  label?: string | null;
  /** Reserves vertical space so the page does not jump when content arrives. */
  minHeight?: number;
}

export default function BrandedLoader({ label = null, minHeight }: BrandedLoaderProps) {
  return (
    <div
      role="status"
      aria-live="polite"
      className="w-full flex flex-col items-center justify-center gap-5"
      style={minHeight ? { minHeight } : undefined}
    >
      {/* Decorative: the surrounding status text carries the meaning. */}
      <Dine3DLogo size="sm" href={null} alt="" className="d3-logo--loader" />

      <span className={label ? 'd3-eyebrow' : 'sr-only'} style={{ color: 'var(--text-dimmed)' }}>
        {label ?? 'Loading'}
      </span>
    </div>
  );
}