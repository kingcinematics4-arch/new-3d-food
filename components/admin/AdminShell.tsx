'use client';

// components/admin/AdminShell.tsx
//
// Chrome for the Dine3D admin panel: fixed sidebar, top bar and the
// save/publish footer.
//
// Design follows the Dine3D identity — near-black charcoal planes, warm ivory
// type, champagne hairlines, editorial serif headings, generous spacing and
// square-ish corners. There are no stats, no charts and no decorative numbers:
// the panel reports real state, never invented metrics.

import React, { useState } from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import Dine3DLogo from '@/components/Dine3DLogo';
import { AdminSaveBar } from './SiteContentProvider';

const NAV_ITEMS = [
  { href: '/admin', label: 'Overview', description: 'Status and quick actions', exact: true },
  { href: '/admin/hero', label: 'Hero', description: 'Headline and calls to action' },
  { href: '/admin/branding', label: 'Branding', description: 'Logo, type and colour' },
  { href: '/admin/sections', label: 'Sections', description: 'Show, hide and order' },
  { href: '/admin/features', label: 'Features', description: 'Feature cards' },
  { href: '/admin/pricing', label: 'Pricing', description: 'Plans and pricing' },
  { href: '/admin/media', label: 'Media', description: 'Logo and imagery' },
] as const;

export default function AdminShell({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();
  const [signingOut, setSigningOut] = useState(false);

  async function handleSignOut() {
    if (signingOut) return;
    setSigningOut(true);

    try {
      await fetch('/api/admin/auth/logout', { method: 'POST' });
      // Hard navigation so no cached RSC payload for a protected page survives.
      window.location.href = '/admin/login';
    } catch {
      setSigningOut(false);
    }
  }

  const isActive = (href: string, exact?: boolean) =>
    exact ? pathname === href : pathname === href || pathname.startsWith(`${href}/`);

  return (
    <div className="flex min-h-screen" style={{ background: 'var(--bg-primary)' }}>
      {/* ---------------------------------------------------- SIDEBAR */}
      <aside
        className="flex flex-col shrink-0"
        style={{
          width: 268,
          borderRight: '1px solid var(--border-warm)',
          background: 'var(--bg-secondary)',
          position: 'sticky',
          top: 0,
          height: '100vh',
        }}
      >
        <div className="px-6" style={{ padding: '1.75rem 0 1.5rem' }}>
          {/* Official Dine3D logo asset, used exactly as supplied */}
          <Dine3DLogo size="md" href="/" priority />
          <span
            className="d3-eyebrow block"
            style={{ color: 'var(--gold-dim)', marginTop: '0.75rem', fontSize: '0.5625rem' }}
          >
            WEBSITE ADMIN
          </span>
        </div>

        <div className="d3-rule" />

        <nav className="flex-1 overflow-y-auto" style={{ padding: '1rem 0' }}>
          {NAV_ITEMS.map((item) => {
            const active = isActive(item.href, 'exact' in item ? item.exact : false);

            return (
              <Link
                key={item.href}
                href={item.href}
                className="flex flex-col gap-0.5 transition-colors"
                style={{
                  padding: '0.625rem 1.5rem',
                  borderLeft: `2px solid ${active ? 'var(--gold)' : 'transparent'}`,
                  background: active ? 'rgba(184,164,122,0.05)' : 'transparent',
                }}
              >
                <span
                  style={{
                    fontSize: '0.8125rem',
                    fontWeight: 500,
                    color: active ? 'var(--text-primary)' : 'var(--text-muted)',
                  }}
                >
                  {item.label}
                </span>
                <span style={{ fontSize: '0.6875rem', color: 'var(--text-dimmed)' }}>{item.description}</span>
              </Link>
            );
          })}
        </nav>

        <div style={{ padding: '1.25rem 1.5rem', borderTop: '1px solid var(--border-warm)' }}>
          <div className="flex flex-col gap-2.5">
            <a
              href="/"
              target="_blank"
              rel="noopener noreferrer"
              className="d3-btn-subtle"
              style={{ justifyContent: 'center' }}
            >
              View Website
            </a>
            <button
              type="button"
              onClick={handleSignOut}
              disabled={signingOut}
              className="d3-btn-subtle"
              style={{ justifyContent: 'center', opacity: signingOut ? 0.5 : 1 }}
            >
              {signingOut ? 'Signing out…' : 'Sign out'}
            </button>
          </div>
        </div>
      </aside>

      {/* ---------------------------------------------------- CONTENT */}
      <div className="flex-1 flex flex-col min-w-0">
        <main className="flex-1" style={{ padding: '3rem', maxWidth: 1100 }}>
          {children}
        </main>

        <AdminSaveBar />
      </div>
    </div>
  );
}