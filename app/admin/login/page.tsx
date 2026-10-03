// app/admin/login/page.tsx
//
// Login screen for the Dine3D owner panel.
//
// This page never receives, renders or validates the password. It only reports
// WHETHER one has been configured, which is not secret — the password itself is
// compared in a server route against a server-only environment variable.

import type { Metadata } from 'next';
import { Suspense } from 'react';
import { redirect } from 'next/navigation';
import { isAdminConfigured } from '@/lib/adminAuth';
import { getAdminSession } from '@/lib/adminSession.server';
import BrandedLoader from '@/components/branding/BrandedLoader';
import AdminLoginForm from './AdminLoginForm';

export const metadata: Metadata = {
  title: 'Dine3D Admin — Sign in',
  robots: { index: false, follow: false },
};

export const dynamic = 'force-dynamic';

export default async function AdminLoginPage() {
  // Already signed in: skip the form.
  if (await getAdminSession()) {
    redirect('/admin');
  }

  const configured = isAdminConfigured();

  return (
    <div
      className="flex items-center justify-center min-h-screen px-6"
      style={{ background: 'var(--bg-primary)', padding: '4rem 0' }}
    >
      <div className="w-full" style={{ maxWidth: 400 }}>
        {/* useSearchParams needs a boundary so the shell can stream. */}
        <Suspense fallback={<BrandedLoader label="Signing in" minHeight={320} />}>
          <AdminLoginForm configured={configured} />
        </Suspense>
      </div>
    </div>
  );
}