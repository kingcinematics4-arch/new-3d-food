'use client';
import React, { useEffect, useState } from 'react';
import { usePathname, useRouter } from 'next/navigation';

export default function DashboardAdminGate({ children }: { children: React.ReactNode; title?: string }) {
  const router = useRouter();
  const pathname = usePathname();
  const [checking, setChecking] = useState(true);
  const [ok, setOk] = useState(false);

  useEffect(() => {
    let alive = true;
    (async () => {
      try {
        const r = await fetch('/api/dashboard-admin/auth/session', { cache: 'no-store' });
        const j = await r.json().catch(() => ({}));
        if (!alive) return;
        if (j.authenticated) setOk(true);
        else router.replace(`/dashboard/admin?next=${encodeURIComponent(pathname || '/dashboard/admin')}`);
      } catch {
        if (alive) router.replace(`/dashboard/admin?next=${encodeURIComponent(pathname || '/dashboard/admin')}`);
      } finally {
        if (alive) setChecking(false);
      }
    })();
    const on = () => { if (!alive) return; fetch('/api/dashboard-admin/auth/session', { cache: 'no-store' }).then(r=>r.json()).then(j=>{ if(!j.authenticated) router.replace('/dashboard/admin'); else setOk(true); }).catch(()=>{}); };
    window.addEventListener('dashboard-admin-session', on);
    return () => { alive = false; window.removeEventListener('dashboard-admin-session', on); };
  }, [pathname, router]);

  if (checking || !ok) return <p style={{ color: 'var(--text-muted)', fontSize: '0.875rem' }}>Loading…</p>;
  return <>{children}</>;
}
