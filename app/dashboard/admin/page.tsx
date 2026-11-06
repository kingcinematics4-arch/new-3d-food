'use client';

export const dynamic = 'force-dynamic';

import React, { useEffect, useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';

const SUB = [
  { label: 'Menu Design', href: '/dashboard/customize', desc: 'Palette, typography, layout, and guest-facing menu styling.' },
  { label: 'Menu Themes', href: '/dashboard/menu-theme', desc: 'Choose a built-in theme or open the theme gallery.' },
  { label: 'Custom Themes', href: '/dashboard/custom-themes', desc: 'Build and manage saved custom menu themes.' },
];

export default function DashboardAdminLanding() {
  const router = useRouter();
  const [checking, setChecking] = useState(true);
  const [ok, setOk] = useState(false);
  const [pw, setPw] = useState('');
  const [show, setShow] = useState(false);
  const [err, setErr] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);

  async function refresh() {
    try {
      const r = await fetch('/api/dashboard-admin/auth/session', { cache: 'no-store' });
      const j = await r.json().catch(() => ({}));
      setOk(!!j.authenticated);
      if (j.authenticated && typeof window !== 'undefined') window.dispatchEvent(new Event('dashboard-admin-session')); const next = new URLSearchParams(window.location.search).get('next'); if(next && next.startsWith('/dashboard/')) { router.replace(next); return; }
    } catch { setOk(false); } finally { setChecking(false); }
  }
  useEffect(() => { refresh(); }, []);

  async function unlock(e: React.FormEvent) {
    e.preventDefault(); setBusy(true); setErr(null);
    try {
      const r = await fetch('/api/dashboard-admin/auth/login', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ password: pw }) });
      const j = await r.json().catch(() => ({}));
      if (!r.ok || !j.success) { setErr(j.error || 'Incorrect password.'); return; }
      setPw(''); setOk(true); window.dispatchEvent(new Event('dashboard-admin-session')); const next = new URLSearchParams(window.location.search).get('next'); if(next && next.startsWith('/dashboard/')) { router.replace(next); return; }
    } catch (e: any) { setErr(e.message || 'Unable to verify.'); } finally { setBusy(false); }
  }

  async function logout() {
    await fetch('/api/dashboard-admin/auth/logout', { method: 'POST' }).catch(() => {});
    setOk(false); window.dispatchEvent(new Event('dashboard-admin-session')); const next = new URLSearchParams(window.location.search).get('next'); if(next && next.startsWith('/dashboard/')) { router.replace(next); return; } router.refresh();
  }

  if (checking) return <p style={{ color: 'var(--text-muted)', fontSize: '0.875rem' }}>Loading…</p>;

  if (!ok) {
    return (
      <div style={{ maxWidth: 560 }}>
        <span className="d3-eyebrow" style={{ fontSize: '0.5625rem' }}>Admin Access</span>
        <h1 style={{ fontFamily: 'var(--font-display)', fontSize: 'clamp(1.9rem,3.5vw,2.6rem)', fontWeight: 500, color: 'var(--text-primary)', margin: '0.5rem 0 0', letterSpacing: '-0.025em' }}>Admin</h1>
        <p style={{ color: 'var(--text-muted)', fontSize: '0.9375rem', lineHeight: 1.65, marginTop: '0.625rem', maxWidth: '56ch' }}>Enter the admin password to unlock Menu Design, Menu Themes, and Custom Themes. This is the only place you’ll be asked to authenticate.</p>
        <form onSubmit={unlock} className="d3-panel" style={{ marginTop: '1.75rem', padding: '1.5rem', display: 'flex', flexDirection: 'column', gap: 14, border: '1px solid rgba(201,169,110,0.16)', boxShadow: '0 24px 64px rgba(0,0,0,0.28)' }}>
          <label className="d3-label" htmlFor="admin-landing-pw">Admin password</label>
          <div style={{ display: 'flex', gap: 8 }}>
            <input id="admin-landing-pw" type={show ? 'text' : 'password'} value={pw} onChange={(e) => setPw(e.target.value)} className="d3-input" style={{ flex: 1 }} autoComplete="current-password" autoFocus />
            <button type="button" className="d3-btn-ghost" onClick={() => setShow((v) => !v)} style={{ whiteSpace: 'nowrap' }}>{show ? 'Hide' : 'Show'}</button>
          </div>
          {err ? <p style={{ color: '#D9A79E', fontSize: '0.8125rem', margin: 0 }}>{err}</p> : null}
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 12, flexWrap: 'wrap' }}>
            <p style={{ margin: 0, fontSize: '0.6875rem', color: 'var(--text-dimmed)', lineHeight: 1.5 }}>Verified server-side · HTTP-only session</p>
            <button type="submit" className="d3-btn-primary" disabled={busy || !pw}>{busy ? 'Verifying…' : 'Unlock Admin'}</button>
          </div>
        </form>
      </div>
    );
  }

  return (
    <div style={{ maxWidth: 980, display: 'flex', flexDirection: 'column', gap: 20 }}>
      <header style={{ display: 'flex', alignItems: 'flex-end', justifyContent: 'space-between', gap: 16, flexWrap: 'wrap' }}>
        <div>
          <span className="d3-eyebrow" style={{ fontSize: '0.5625rem', color: 'var(--gold-dim)' }}>Authenticated</span>
          <h1 style={{ fontFamily: 'var(--font-display)', fontSize: 'clamp(1.9rem,3.5vw,2.6rem)', fontWeight: 500, color: 'var(--text-primary)', margin: '0.5rem 0 0', letterSpacing: '-0.025em' }}>Admin</h1>
          <p style={{ color: 'var(--text-muted)', fontSize: '0.9375rem', marginTop: '0.5rem', maxWidth: '60ch' }}>Admin access is unlocked while you stay in the Admin section. Leaving Admin will lock it automatically.</p>
        </div>
        <button type="button" className="d3-btn-ghost" onClick={logout}>Lock Admin</button>
      </header>
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(260px, 1fr))', gap: 14 }}>
        {SUB.map((s) => (
          <Link key={s.href} href={s.href} className="d3-panel" style={{ padding: '1.25rem', textDecoration: 'none', display: 'flex', flexDirection: 'column', gap: 8, border: '1px solid var(--border-warm)', transition: 'border-color 200ms, transform 200ms' }}>
            <span className="d3-eyebrow" style={{ fontSize: '0.5rem', color: 'var(--gold-dim)' }}>Admin section</span>
            <span style={{ fontFamily: 'var(--font-display)', fontSize: '1.25rem', color: 'var(--text-primary)' }}>{s.label}</span>
            <span style={{ fontSize: '0.8125rem', color: 'var(--text-muted)', lineHeight: 1.55 }}>{s.desc}</span>
            <span style={{ marginTop: 'auto', fontSize: '0.75rem', color: 'var(--gold)' }}>Open →</span>
          </Link>
        ))}
      </div>
    </div>
  );
}
