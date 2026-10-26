// lib/customThemePreview.ts
//
// Render a tiny live preview of a CustomThemeConfig inside the dashboard.
// Pure function — no React, no side effects — so it can be used by both
// server and client code and is trivially testable.

import type { CustomThemeConfig } from './customTheme';

export interface ThemePreviewStyle {
  background: string;
  color: string;
  fontFamily: string;
  borderRadius: string;
  border: string;
  boxShadow: string;
}

function hexToRgba(hex: string, alpha: number): string {
  const h = hex.replace('#', '');
  if (h.length === 3) {
    const r = parseInt(h[0] + h[0], 16);
    const g = parseInt(h[1] + h[1], 16);
    const b = parseInt(h[2] + h[2], 16);
    return `rgba(${r},${g},${b},${alpha})`;
  }
  if (h.length >= 6) {
    const r = parseInt(h.slice(0, 2), 16);
    const g = parseInt(h.slice(2, 4), 16);
    const b = parseInt(h.slice(4, 6), 16);
    return `rgba(${r},${g},${b},${alpha})`;
  }
  return hex;
}

/** Map a card style to a CSS preview representation. */
function cardBorder(config: CustomThemeConfig): string {
  switch (config.cardStyle) {
    case 'bordered':
      return `1px solid ${config.primaryColor}`;
    case 'elevated':
      return `0 4px 16px ${hexToRgba(config.primaryColor, 0.18)}`;
    case 'glassmorphic':
      return `1px solid ${hexToRgba(config.primaryColor, 0.25)}, 0 8px 24px ${hexToRgba(config.primaryColor, 0.18)}`;
    default:
      return 'none';
  }
}

/** Map a button style to a CSS preview representation. */
function buttonStyle(config: CustomThemeConfig): { background: string; border: string; color: string } {
  switch (config.buttonStyle) {
    case 'outline':
      return { background: 'transparent', border: `1px solid ${config.primaryColor}`, color: config.primaryColor };
    case 'soft':
      return { background: hexToRgba(config.primaryColor, 0.15), border: `1px solid ${hexToRgba(config.primaryColor, 0.3)}`, color: config.primaryColor };
    case 'pill':
      return { background: config.primaryColor, border: 'none', color: '#FFFFFF', borderRadius: '999px' };
    default:
      return { background: config.primaryColor, border: 'none', color: '#FFFFFF' };
  }
}

/** Build the inline style for a theme preview card. */
export function buildThemePreviewStyle(config: CustomThemeConfig): ThemePreviewStyle {
  return {
    background: config.pageBg,
    color: config.textColor,
    fontFamily: config.bodyFont,
    borderRadius: config.borderRadius,
    border: cardBorder(config),
    boxShadow: config.cardStyle === 'elevated' ? `0 6px 20px ${hexToRgba(config.primaryColor, 0.22)}` : 'none',
  };
}

export function buildThemePreviewButtonStyle(config: CustomThemeConfig) {
  return buttonStyle(config);
}

/** Compose a compact preview string for accessibility labels. */
export function themePreviewLabel(config: CustomThemeConfig): string {
  return `${config.menuLayout} layout, ${config.cardStyle} cards, ${config.buttonStyle} buttons, ${config.headingFont} headings`;
}