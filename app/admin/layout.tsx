// app/admin/layout.tsx
//
// Root layout for the admin area.
//
// Intentionally does NOT authenticate: `/admin/login` lives beneath it and has
// to be reachable while signed out. Authorization is applied by the
// `(panel)` route group layout, which wraps every protected page.

import type { Metadata } from 'next';

export const metadata: Metadata = {
  title: {
    default: 'Dine3D Admin',
    template: '%s — Dine3D Admin',
  },
  // The admin panel must never be indexed.
  robots: { index: false, follow: false, nocache: true },
};

export default function AdminRootLayout({ children }: { children: React.ReactNode }) {
  return <>{children}</>;
}