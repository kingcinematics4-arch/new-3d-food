'use client';

import React from 'react';
import Link from 'next/link';
import Image from 'next/image';

interface Dine3DLogoProps {
  size?: 'sm' | 'md' | 'lg';
  showTagline?: boolean;
  href?: string;
  className?: string;
}

/**
 * Dine3D Brand Logo Component
 * Uses the actual Dine3D logo image — do not redraw or replace
 */
export default function Dine3DLogo({
  size = 'md',
  showTagline = false,
  href = '/',
  className = '',
}: Dine3DLogoProps) {
  const heights = {
    sm: 28,
    md: 36,
    lg: 48,
  };

  const widths = {
    sm: 112,
    md: 144,
    lg: 192,
  };

  const logoContent = (
    <div className={`flex flex-col ${showTagline ? 'gap-1' : ''} ${className}`}>
      {/* Logo image — preserved as-is */}
      <Image
        src="/images/dine3d-logo.jpg"
        alt="Dine3D"
        width={widths[size]}
        height={heights[size]}
        priority
        className="object-contain object-left"
        style={{ height: heights[size], width: 'auto' }}
      />
      {showTagline && (
        <span
          className="d3-eyebrow"
          style={{ color: 'var(--text-muted)', letterSpacing: '0.2em', fontSize: '0.55rem' }}
        >
          SEE IT. EXPERIENCE IT. DINE IT.
        </span>
      )}
    </div>
  );

  if (href) {
    return (
      <Link href={href} className="inline-flex items-center" style={{ textDecoration: 'none' }}>
        {logoContent}
      </Link>
    );
  }

  return logoContent;
}

/**
 * Inline text-based Dine3D wordmark (fallback if image unavailable)
 */
export function Dine3DWordmark({ size = 'md', className = '' }: { size?: 'sm' | 'md' | 'lg'; className?: string }) {
  const textSizes = {
    sm: 'text-lg',
    md: 'text-xl',
    lg: 'text-3xl',
  };

  return (
    <span
      className={`font-serif font-medium tracking-tight ${textSizes[size]} ${className}`}
      style={{ fontFamily: 'var(--font-display)' }}
    >
      <span style={{ color: 'var(--text-primary)' }}>Dine</span>
      <span style={{ color: 'var(--gold)' }}>3D</span>
    </span>
  );
}
