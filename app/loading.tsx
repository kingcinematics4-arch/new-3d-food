// app/loading.tsx
//
// The branded loading state for the whole site.
//
// This is the Suspense fallback Next.js renders while a route's server component
// is still resolving — most visibly on the landing page, whose content is read
// from the published document on every request. It is the exact Dine3D logo at a
// quiet size with a slow opacity pulse, and nothing else: no spinner, no
// progress bar and no client-side timer, so it never delays what it precedes.

import BrandedLoader from '@/components/branding/BrandedLoader';

export default function Loading() {
  return (
    <div
      className="flex items-center justify-center w-full"
      style={{ minHeight: '100vh', background: 'var(--bg-primary)' }}
    >
      <BrandedLoader label="Dine3D" minHeight={240} />
    </div>
  );
}