'use client';

// components/site/BrandDivider.tsx
//
// A single quiet moment of brand between two major sections.
//
// Used once on the landing page, on purpose: repetition is what turns a brand
// mark into wallpaper. The reveal is a slow opacity and scale fade driven by one
// IntersectionObserver with no library, and the transition is transform/opacity
// only, so scrolling stays cheap.
//
// Under `prefers-reduced-motion` the CSS drops the movement and keeps the fade,
// and this component skips the observer entirely rather than waiting to be told
// the element is already visible.

import React, { useEffect, useRef, useState } from 'react';
import Dine3DLogo from '@/components/Dine3DLogo';

export default function BrandDivider() {
  const ref = useRef<HTMLDivElement | null>(null);
  const [visible, setVisible] = useState(false);

  useEffect(() => {
    const node = ref.current;
    if (!node) return;

    // No observer support, or reduced motion: show the mark immediately rather
    // than leaving it stranded at opacity 0.
    if (typeof IntersectionObserver === 'undefined') {
      setVisible(true);
      return;
    }

    const prefersReducedMotion =
      typeof window.matchMedia === 'function' &&
      window.matchMedia('(prefers-reduced-motion: reduce)').matches;

    if (prefersReducedMotion) {
      setVisible(true);
      return;
    }

    const observer = new IntersectionObserver(
      (entries) => {
        for (const entry of entries) {
          if (!entry.isIntersecting) continue;
          setVisible(true);
          observer.disconnect();
        }
      },
      // Reveal once the mark is meaningfully on screen, then stop watching.
      { threshold: 0.35 }
    );

    observer.observe(node);
    return () => observer.disconnect();
  }, []);

  return (
    <div
      ref={ref}
      className="d3-brand-divider"
      data-visible={visible ? 'true' : 'false'}
      aria-hidden="true"
    >
      <span className="d3-brand-divider__rule" />
      <Dine3DLogo size="xs" href={null} alt="" className="d3-logo--divider" />
      <span className="d3-brand-divider__rule" />
    </div>
  );
}