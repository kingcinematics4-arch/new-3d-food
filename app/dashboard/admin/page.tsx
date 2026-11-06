'use client';

export const dynamic = 'force-dynamic';

import React, { useEffect, useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';

type Plan = 'BASIC' | 'PRO' | 'ULTRA' | 'CUSTOM';
type HotelRow = { id: string; name: string; hotel_public_id?: string | null; subscription_plan?: string | null; is_active?: boolean };
const PLANS: Plan[] = ['BASIC', 'PRO', 'ULTRA', 'CUSTOM'];
const normPlan = (v?: string | null): Plan => { const p = (v || '').trim().toUpperCase(); if (p === 'STARTER' || p === 'BASIC' || !p) return 'BASIC'; return (PLANS as string[]).includes(p) ? (p as Plan) : 'BASIC'; };
const planLabel = (p: Plan) => p === 'BASIC' ? 'Basic' : p === 'PRO' ? 'Pro' : p === 'ULTRA' ? 'Ultra' : 'Custom';

const SUB = [
  { label: 'Hotels & Plans', href: '/dashboard/hotels', desc: 'View registered hotels and subscription plan badges on hotel cards.' },
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
  const [hotels, setHotels] = useState<HotelRow[]>([]);
  const [planBusy, setPlanBusy] = useState<string | null>(null);
  const [notice, setNotice] = useState<string | null>(null);

  async function loadHotels() {
    try {
      const r = await fetch('/api/dashboard-admin/hotels', { cache: 'no-store' });
      const j = await r.json().catch(() => ({}));
      if (r.ok && j.success && Array.isArray(j.hotels)) setHotels(j.hotels);
    } catch {}
  }

  async function refresh() {
    try {
      const r = await fetch('/api/dashboard-admin/auth/session', { cache: 'no-store' });
      const j = await r.json().catch(() => ({}));
      setOk(!!j.authenticated);
      if (j.authenticated && typeof window !== 'undefined') {
        window.dispatchEvent(new Event('dashboard-admin-session'));
        loadHotels();
        const next = new URLSearchParams(window.location.search).get('next');
        if (next && next.startsWith('/dashboard/')) { router.replace(next); return; }
      }
    } catch { setOk(false); } finally { setChecking(false); }
  }
  useEffect(() => { refresh(); }, []);
  useEffect(() => { if (!notice) return; const t = setTimeout(() => setNotice(null), 3200); return () => clearTimeout(t); }, [notice]);

  async function unlock(e: React.FormEvent) {
    e.preventDefault(); setBusy(true); setErr(null);
    try {
      const r = await fetch('/api/dashboard-admin/auth/login', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ password: pw }) });
      const j = await r.json().catch(() => ({}));
      if (!r.ok || !j.success) { setErr(j.error || 'Incorrect password.'); return; }
      setPw(''); setOk(true); window.dispatchEvent(new Event('dashboard-admin-session')); loadHotels();
      const next = new URLSearchParams(window.location.search).get('next');
      if (next && next.startsWith('/dashboard/')) { router.replace(next); return; }
    } catch (e: any) { setErr(e.message || 'Unable to verify.'); } finally { setBusy(false); }
  }

  async function logout() {
    await fetch('/api/dashboard-admin/auth/logout', { method: 'POST' }).catch(() => {});
    setOk(false); window.dispatchEvent(new Event('dashboard-admin-session')); router.refresh();
  }

  async function setPlan(id: string, subscriptionPlan: Plan, name?: string | null) {
    setPlanBusy(id); setErr(null);
    try {
      const r = await fetch(`/api/dashboard-admin/hotels/${id}`, { method: 'PATCH', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ subscriptionPlan }) });
      const j = await r.json().catch(() => ({}));
      if (!r.ok || !j.success) throw new Error(j.error || 'Plan update failed');
      const saved = normPlan(j.hotel?.subscription_plan ?? subscriptionPlan);
      setHotels((hs) => hs.map((h) => h.id === id ? { ...h, subscription_plan: saved } : h));
      setNotice(`${name || 'Hotel'} plan updated to ${planLabel(saved)}. Hotel cards will show the new plan.`);
    } catch (e: any) { setErr(e.message || 'Plan update failed'); } finally { setPlanBusy(null); }
  }

  if (checking) return <p style={{ color: 'var(--text-muted)', fontSize: '0.875rem' }}>Loading…</p>;

  if (!ok) {
    return (
      <div style={{ maxWidth: 560 }}>
        <span className="d3-eyebrow" style={{ fontSize: '0.5625rem' }}>Admin Access</span>
        <h1 style={{ fontFamily: 'var(--font-display)', fontSize: 'clamp(1.9rem,3.5vw,2.6rem)', fontWeight: 500, color: 'var(--text-primary)', margin: '0.5rem 0 0', letterSpacing: '-0.025em' }}>Admin</h1>
        <p style={{ color: 'var(--text-muted)', fontSize: '0.9375rem', lineHeight: 1.65, marginTop: '0.625rem', maxWidth: '56ch' }}>Enter your hotel admin password to unlock Menu Design, Menu Themes, and Custom Themes. Use: King.0001 + your Hotel ID (e.g. King.0001AA11bb123). Passwords are verified server-side.</p>
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
      {notice ? <div className="d3-note" style={{ borderColor: 'rgba(201,169,110,0.22)', color: 'var(--gold)' }}>{notice}</div> : null}
      {err ? <div className="d3-note" style={{ borderColor: 'rgba(196,102,88,0.25)', color: '#D9A79E' }}>{err}</div> : null}

      <section className="d3-panel" style={{ padding: '1.25rem', display: 'flex', flexDirection: 'column', gap: 12 }}>
        <div>
          <span className="d3-eyebrow" style={{ fontSize: '0.5rem', color: 'var(--gold-dim)' }}>Subscription plans</span>
          <h2 style={{ fontFamily: 'var(--font-display)', fontSize: '1.2rem', color: 'var(--text-primary)', margin: '0.25rem 0 0' }}>Manage hotel plans</h2>
          <p style={{ margin: '0.25rem 0 0', fontSize: '0.8125rem', color: 'var(--text-muted)' }}>View and change each hotel’s plan (Basic, Pro, Ultra, Custom). Saved to the database; hotel cards update after refresh/navigation.</p>
        </div>
        <div style={{ display: 'flex', flexDirection: 'column', gap: 0 }}>
          {hotels.map((h) => {
            const plan = normPlan(h.subscription_plan);
            return (
              <div key={h.id} style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 12, padding: '0.75rem 0', borderTop: '1px solid var(--border-subtle)', flexWrap: 'wrap' }}>
                <div style={{ minWidth: 0 }}>
                  <div style={{ color: 'var(--text-primary)', fontWeight: 500, fontSize: '0.9375rem' }}>{h.name || 'Hotel'}</div>
                  <div style={{ color: 'var(--text-dimmed)', fontSize: '0.75rem' }}>ID {h.hotel_public_id || '—'} · Current: {planLabel(plan)}{planBusy === h.id ? ' · Saving…' : ''}</div>
                </div>
                <select className="d3-input" value={plan} disabled={planBusy === h.id} onChange={(e) => setPlan(h.id, normPlan(e.target.value), h.name)} style={{ width: 140, padding: '0.4rem 0.55rem' }} aria-label={`Plan for ${h.name || 'hotel'}`}>
                  {PLANS.map((p) => <option key={p} value={p}>{planLabel(p)}</option>)}
                </select>
              </div>
            );
          })}
          {hotels.length === 0 ? <p style={{ margin: '0.5rem 0 0', color: 'var(--text-dimmed)', fontSize: '0.8125rem' }}>No hotels loaded.</p> : null}
        </div>
      </section>

      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(240px, 1fr))', gap: 14 }}>
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
