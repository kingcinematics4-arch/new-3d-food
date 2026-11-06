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
    const deny = async () => {
      try { await fetch('/api/dashboard-admin/auth/logout', { method: 'POST', keepalive: true, cache: 'no-store' }); } catch {}
      if (typeof window !== 'undefined') window.dispatchEvent(new Event('dashboard-admin-session'));
      if (alive) router.replace(`/dashboard/admin?next=${encodeURIComponent(pathname || '/dashboard/admin')}`);
    };
    (async () => {
      try {
        const r = await fetch('/api/dashboard-admin/auth/session', { cache: 'no-store' });
        const j = await r.json().catch(() => ({}));
        if (!alive) return;
        if (j.authenticated) setOk(true);
        else await deny();
      } catch {
        if (alive) await deny();
      } finally {
        if (alive) setChecking(false);
      }
    })();
    const on = () => { if (!alive) return; fetch('/api/dashboard-admin/auth/session', { cache: 'no-store' }).then(r=>r.json()).then(j=>{ if(!j.authenticated) deny(); else setOk(true); }).catch(()=>{ deny(); }); };
    window.addEventListener('dashboard-admin-session', on);
    return () => { alive = false; window.removeEventListener('dashboard-admin-session', on); };
  }, [pathname, router]);

  if (checking || !ok) return <p style={{ color: 'var(--text-muted)', fontSize: '0.875rem' }}>Loading…</p>;
  return <>{children}</>;
}
