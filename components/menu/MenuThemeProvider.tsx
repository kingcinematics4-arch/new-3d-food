'use client';

import React, { createContext, useContext, ReactNode } from 'react';
import { getMenuTheme, menuThemeClass, type MenuTheme, type MenuThemeId } from '@/lib/menuThemes';
import { customThemeToCssVars, type CustomThemeConfig } from '@/lib/customTheme';

export interface MenuThemeContextValue {
  theme: MenuTheme;
  themeId: MenuThemeId;
  layout: MenuTheme['layout'];
  customConfig?: CustomThemeConfig | null;
}

export const MenuThemeContext = createContext<MenuThemeContextValue | undefined>(undefined);

interface MenuThemeProviderProps {
  /** The theme ID stored on the hotel row (may be null/undefined). */
  themeId?: string | null;
  /** Active custom theme config (used when themeId is 'custom'). */
  customConfig?: CustomThemeConfig | null;
  children: ReactNode;
  /** Optional className to merge onto the wrapper. */
  className?: string;
  /** Optional inline style to merge onto the wrapper. */
  style?: React.CSSProperties;
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

/**
 * Applies the correct `.d3-theme-<id>` class to its root element and
 * provides the resolved theme (including layout flags) to all descendants.
 *
 * The theme class overrides CSS custom properties in :root, so every
 * `var(--bg-primary)` / `var(--gold)` etc. reference inside the menu
 * automatically picks up the theme's colours. Layout-specific flags
 * (cardVariant, header style, category nav, image ratio, etc.) are
 * available via `useMenuTheme()` for conditional rendering.
 */
export function MenuThemeProvider({ themeId, customConfig, children, className, style }: MenuThemeProviderProps) {
  const theme = getMenuTheme(themeId);

  const contextValue: MenuThemeContextValue = {
    theme,
    themeId: theme.id,
    layout: theme.layout,
    customConfig: customConfig ?? null,
  };

  const mergedClassName = className
    ? `${menuThemeClass(themeId)} ${className}`
    : menuThemeClass(themeId);

  return (
    <MenuThemeContext.Provider value={contextValue}>
      <div className={mergedClassName} style={resolveThemeStyle(themeId, customConfig, style)}>
        {children}
      </div>
    </MenuThemeContext.Provider>
  );
}

/**
 * Bare context provider — does NOT render a wrapper div.
 * Use this when you want to apply the theme class yourself (e.g. on an
 * existing root element) but still need layout flags in children.
 */
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
  return (
    <MenuThemeContext.Provider value={{ theme, themeId: theme.id, layout: theme.layout, customConfig: customConfig ?? null }}>
      {children}
    </MenuThemeContext.Provider>
  );
}

/** Hook to read the active menu theme inside a MenuThemeProvider tree. */
export function useMenuTheme(): MenuThemeContextValue {
  const ctx = useContext(MenuThemeContext);
  if (!ctx) {
    const fallback = getMenuTheme(undefined);
    return { theme: fallback, themeId: fallback.id, layout: fallback.layout, customConfig: null };
  }
  return ctx;
}
