// app/admin/(panel)/layout.tsx
//
// Layout for every PROTECTED admin page.
//
// `requireAdminPage()` runs on the server before anything below is rendered, so
// an unauthenticated request is redirected to the login screen and never
// receives admin markup. This is a second line of defence behind the
// middleware check, and the one that also enforces post-logout revocation.

import { requireAdminPage } from '@/lib/adminSession.server';
import { SiteContentProvider } from '@/components/admin/SiteContentProvider';
import AdminShell from '@/components/admin/AdminShell';

export const dynamic = 'force-dynamic';

export default async function AdminPanelLayout({ children }: { children: React.ReactNode }) {
  await requireAdminPage();

  return (
    <SiteContentProvider>
      <AdminShell>{children}</AdminShell>
    </SiteContentProvider>
  );
}