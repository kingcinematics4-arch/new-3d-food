'use client';

import React, { createContext, useContext, ReactNode } from 'react';
import { getMenuTheme, menuThemeClass, type MenuTheme, type MenuThemeId } from '@/lib/menuThemes';
import { cloneCustomThemeConfig, getReadableTextColor, mixHex, type CustomThemeConfig } from '@/lib/customTheme';
import { CustomThemeFontLoader } from './CustomThemeFontLoader';

export interface MenuThemeContextValue {
  theme: MenuTheme;
  themeId: MenuThemeId;
  layout: MenuTheme['layout'];
  customConfig?: CustomThemeConfig | null;
}

export const MenuThemeContext = createContext<MenuThemeContextValue | undefined>(undefined);

interface MenuThemeProviderProps {
  themeId?: string | null;
  customConfig?: CustomThemeConfig | null;
  children: ReactNode;
  className?: string;
  style?: React.CSSProperties;
}

function withAlpha(hex: string, alpha: number): string {
  const n = (hex || '#000000').replace('#', '');
  const full = n.length === 3 ? n.split('').map((c) => c + c).join('') : n.padEnd(6, '0').slice(0, 6);
  const r = parseInt(full.slice(0, 2), 16);
  const g = parseInt(full.slice(2, 4), 16);
  const b = parseInt(full.slice(4, 6), 16);
  return `rgba(${r}, ${g}, ${b}, ${alpha})`;
}

function shadowValue(strength: CustomThemeConfig['shadowStrength']): string {
  switch (strength) {
    case 'none': return 'none';
    case 'soft': return '0 4px 14px rgba(0,0,0,0.10)';
    case 'strong': return '0 18px 48px rgba(0,0,0,0.28)';
    default: return '0 10px 28px rgba(0,0,0,0.18)';
  }
}

function borderValue(style: CustomThemeConfig['borderStyle'], primary: string): string {
  switch (style) {
    case 'none': return '1px solid transparent';
    case 'defined': return `1px solid ${withAlpha(primary, 0.28)}`;
    case 'accent': return `1px solid ${withAlpha(primary, 0.55)}`;
    default: return `1px solid ${withAlpha(primary, 0.16)}`;
  }
}

function spacingValue(spacing: CustomThemeConfig['spacing']) {
  switch (spacing) {
    case 'compact': return { cardPad: '0.875rem', sectionGap: '1rem', gridGap: '0.75rem' };
    case 'spacious': return { cardPad: '1.375rem', sectionGap: '2rem', gridGap: '1.25rem' };
    default: return { cardPad: '1.125rem', sectionGap: '1.5rem', gridGap: '1rem' };
  }
}

export function customThemeToCssVars(config: CustomThemeConfig): Record<string, string> {
  const c = cloneCustomThemeConfig(config);
  const primary = c.primaryColor;
  const onPrimary = getReadableTextColor(primary);
  const surface2 = mixHex(c.cardBg, c.pageBg, 0.35);
  const spacing = spacingValue(c.spacing);
  const btnPad = c.buttonSize === 'sm' ? '0.5rem 0.75rem' : c.buttonSize === 'lg' ? '0.875rem 1.25rem' : '0.6875rem 1rem';
  const btnFont = c.buttonSize === 'sm' ? '0.75rem' : c.buttonSize === 'lg' ? '0.9375rem' : '0.8125rem';
  return {
    '--bg-primary': c.pageBg,
    '--bg-secondary': mixHex(c.pageBg, c.cardBg, 0.35),
    '--bg-surface': c.cardBg,
    '--bg-surface-2': surface2,
    '--bg-surface-3': mixHex(c.cardBg, c.textColor, 0.06),
    '--gold': primary,
    '--gold-light': mixHex(primary, '#ffffff', 0.22),
    '--gold-dim': mixHex(primary, '#000000', 0.25),
    '--gold-pale': withAlpha(primary, 0.14),
    '--gold-muted': withAlpha(primary, 0.55),
    '--text-primary': c.textColor,
    '--text-secondary': mixHex(c.textColor, c.mutedTextColor, 0.35),
    '--text-muted': c.mutedTextColor,
    '--text-dimmed': mixHex(c.mutedTextColor, c.pageBg, 0.25),
    '--border-subtle': borderValue(c.borderStyle, primary) === '1px solid transparent' ? withAlpha(primary, 0.08) : withAlpha(primary, c.borderStyle === 'subtle' ? 0.12 : c.borderStyle === 'accent' ? 0.4 : 0.22),
    '--border-warm': withAlpha(primary, c.borderStyle === 'accent' ? 0.35 : 0.14),
    '--border-light': withAlpha(primary, 0.2),
    '--border-medium': withAlpha(primary, 0.3),
    '--border-accent': withAlpha(primary, 0.5),
    '--font-display': `"${c.headingFont}", serif`,
    '--font-body': `"${c.bodyFont}", sans-serif`,
    '--font-price': `"${c.priceFont}", sans-serif`,
    '--d3-btn-radius': c.buttonRadius,
    '--d3-input-radius': c.buttonRadius,
    '--d3-modal-radius': c.borderRadius,
    '--d3-modal-image-radius': `${c.imageRadius} ${c.imageRadius} 0 0`,
    '--d3-image-height': c.spacing === 'compact' ? '180px' : c.spacing === 'spacious' ? '260px' : '220px',
    '--d3-card-padding': spacing.cardPad,
    '--d3-container-max': '80rem',
    '--d3-section-gap': spacing.sectionGap,
    '--d3-grid-gap': spacing.gridGap,
    '--ct-primary': primary,
    '--ct-on-primary': onPrimary,
    '--ct-page-bg': c.pageBg,
    '--ct-card-bg': c.cardBg,
    '--ct-text': c.textColor,
    '--ct-muted': c.mutedTextColor,
    '--ct-card-radius': c.borderRadius,
    '--ct-image-radius': c.imageRadius,
    '--ct-button-radius': c.buttonRadius,
    '--ct-badge-radius': c.badgeRadius,
    '--ct-card-shadow': shadowValue(c.shadowStrength),
    '--ct-card-border': borderValue(c.borderStyle, primary),
    '--ct-button-pad': btnPad,
    '--ct-button-font-size': btnFont,
    '--ct-button-font-weight': c.typography.buttonTextWeight,
    '--ct-heading-size': `${c.typography.headingSize}px`,
    '--ct-body-size': `${c.typography.bodySize}px`,
    '--ct-price-size': `${c.typography.priceSize}px`,
    '--ct-heading-weight': c.typography.headingWeight,
    '--ct-body-weight': c.typography.bodyWeight,
    '--ct-badge-style': c.badgeStyle,
    '--ct-card-style': c.cardStyle,
    '--ct-button-style': c.buttonStyle,
  };
}

function resolveThemeStyle(
  themeId?: string | null,
  customConfig?: CustomThemeConfig | null,
  style?: React.CSSProperties
): React.CSSProperties | undefined {
  if (themeId !== 'custom' || !customConfig) return style;
  const vars = customThemeToCssVars(customConfig);
  return style ? { ...vars, ...style } : (vars as React.CSSProperties);
}

export function MenuThemeProvider({ themeId, customConfig, children, className, style }: MenuThemeProviderProps) {
  const theme = getMenuTheme(themeId);
  const normalized = themeId === 'custom' && customConfig ? cloneCustomThemeConfig(customConfig) : null;
  const contextValue: MenuThemeContextValue = {
    theme,
    themeId: theme.id,
    layout: theme.layout,
    customConfig: normalized,
  };
  const mergedClassName = className ? `${menuThemeClass(themeId)} ${className}` : menuThemeClass(themeId);
  return (
    <MenuThemeContext.Provider value={contextValue}>
      <div className={mergedClassName} style={resolveThemeStyle(themeId, normalized, style)}>
        {normalized && <CustomThemeFontLoader fonts={[normalized.headingFont, normalized.bodyFont, normalized.priceFont]} />}
        {children}
      </div>
    </MenuThemeContext.Provider>
  );
}

export function MenuThemeProviderContext({
  themeId,
  customConfig,
  children,
}: {
  themeId?: string | null;
  customConfig?: CustomThemeConfig | null;
  children: ReactNode;
}) {
  const theme = getMenuTheme(themeId);
  const normalized = themeId === 'custom' && customConfig ? cloneCustomThemeConfig(customConfig) : null;
  return (
    <MenuThemeContext.Provider value={{ theme, themeId: theme.id, layout: theme.layout, customConfig: normalized }}>
      {normalized && <CustomThemeFontLoader fonts={[normalized.headingFont, normalized.bodyFont, normalized.priceFont]} />}
      {children}
    </MenuThemeContext.Provider>
  );
}

export function useMenuTheme(): MenuThemeContextValue {
  const ctx = useContext(MenuThemeContext);
  if (!ctx) {
    const fallback = getMenuTheme(undefined);
    return { theme: fallback, themeId: fallback.id, layout: fallback.layout, customConfig: null };
  }
  return ctx;
}
