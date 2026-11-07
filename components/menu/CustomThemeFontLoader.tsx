"use client";
import { useEffect } from 'react';
import { googleFontHref } from '@/lib/customTheme';

const loaded = new Set<string>();

export function CustomThemeFontLoader({ fonts }: { fonts: string[] }) {
  const href = googleFontHref(fonts);
  useEffect(() => {
    if (!href || typeof document === 'undefined' || loaded.has(href)) return;
    const existing = document.querySelector(`link[data-ct-fonts="${CSS.escape(href)}"]`) || Array.from(document.querySelectorAll('link[rel="stylesheet"]')).find((l) => (l as HTMLLinkElement).href === href);
    if (existing) { loaded.add(href); return; }
    const link = document.createElement('link');
    link.rel = 'stylesheet';
    link.href = href;
    link.setAttribute('data-ct-fonts', href);
    document.head.appendChild(link);
    loaded.add(href);
  }, [href]);
  return null;
}
