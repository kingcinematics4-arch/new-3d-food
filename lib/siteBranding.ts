// lib/siteBranding.ts
//
// Translates the branding settings chosen in the admin panel into the CSS
// custom properties the Dine3D design system already reads (`--gold`,
// `--bg-primary`, the font stacks, and the button treatment).
//
// Because the existing `d3-*` classes resolve their colours from variables,
// publishing new branding restyles the whole public site without shipping any
// new stylesheet. Client-safe: no server imports.

import type { Branding } from './siteContent';

const TYPOGRAPHY_STACKS = {
  editorial: {
    display: "'Cormorant Garamond', Georgia, serif",
    body: "'Inter', 'Manrope', system-ui, sans-serif",
  },
  modern: {
    display: "'Inter', 'Manrope', system-ui, sans-serif",
    body: "'Inter', 'Manrope', system-ui, sans-serif",
  },
  classic: {
    display: "'Cormorant Garamond', Georgia, serif",
    body: "'Cormorant Garamond', Georgia, serif",
  },
} as const;

/** Builds the inline style object applied to the public site root. */
export function brandingToCssVars(branding: Branding): React.CSSProperties {
  const stacks = TYPOGRAPHY_STACKS[branding.typography] ?? TYPOGRAPHY_STACKS.editorial;
  const accent = branding.accentColor;

  return {
    // Brand identity
    '--gold': accent,
    '--gold-bright': lighten(accent, 14),
    '--gold-pale': lighten(accent, 22),
    '--gold-dim': darken(accent, 34),
    '--gold-deep': darken(accent, 18),

    // Surfaces
    '--bg-primary': branding.backgroundColor,

    // Type
    '--font-display': stacks.display,
    '--font-body': stacks.body,

    // Accent-tinted borders follow the accent so hairlines stay coherent
    '--border-subtle': withAlpha(accent, 0.1),
    '--border-light': withAlpha(accent, 0.18),
    '--border-medium': withAlpha(accent, 0.28),
  } as React.CSSProperties;
}

/** Class applied to the site root so button treatment can be switched globally. */
export function brandingButtonClass(branding: Branding): string {
  return `d3-btn-variant-${branding.buttonStyle}`;
}

function clamp(value: number): number {
  return Math.max(0, Math.min(255, Math.round(value)));
}

function toRgb(hex: string): [number, number, number] {
  const normalized = hex.replace('#', '');
  const full =
    normalized.length === 3
      ? normalized
          .split('')
          .map((c) => c + c)
          .join('')
      : normalized;

  const int = parseInt(full, 16);
  return [(int >> 16) & 255, (int >> 8) & 255, int & 255];
}

function fromRgb(r: number, g: number, b: number): string {
  return `#${[r, g, b].map((v) => clamp(v).toString(16).padStart(2, '0')).join('')}`;
}

function lighten(hex: string, amount: number): string {
  const [r, g, b] = toRgb(hex);
  return fromRgb(r + amount, g + amount, b + amount);
}

function darken(hex: string, amount: number): string {
  const [r, g, b] = toRgb(hex);
  return fromRgb(r - amount, g - amount, b - amount);
}

function withAlpha(hex: string, alpha: number): string {
  const [r, g, b] = toRgb(hex);
  return `rgba(${r}, ${g}, ${b}, ${alpha})`;
}