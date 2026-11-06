'use client';

export const dynamic = 'force-dynamic';

import React, { useEffect, useState } from 'react';
import Link from 'next/link';

type HotelRow = {
  id: string; name: string; slug?: string | null; logo_url?: string | null; city?: string | null;
  owner_name?: string | null; email?: string | null; phone?: string | null; is_active?: boolean;
  created_at?: string | null; hotel_public_id?: string | null;
};

function fmtDate(s?: string | null) {
  if (!s) return '—';
  try { return new Date(s).toLocaleDateString(undefined, { year: 'numeric', month: 'short', day: 'numeric' }); } catch { return '—'; }
}

export default function HotelsPage() {
  const [checking, setChecking] = useState(true);
  const [authorized, setAuthorized] = useState(false);
  const [password, setPassword] = useState('');
  const [showPw, setShowPw] = useState(false);
  const [authError, setAuthError] = useState<string | null>(null);
  const [authBusy, setAuthBusy] = useState(false);
  const [hotels, setHotels] = useState<HotelRow[]>([]);
  const [loadError, setLoadError] = useState<string | null>(null);
  const [busyId, setBusyId] = useState<string | null>(null);

  async function loadHotels() {
    const r = await fetch('/api/dashboard-admin/hotels', { cache: 'no-store' });
    if (r.status === 401) { setAuthorized(false); return; }
    const j = await r.json().catch(() => ({}));
    if (!r.ok || !j.success) throw new Error(j.error || 'Failed to load hotels');
    setHotels(Array.isArray(j.hotels) ? j.hotels : []);
  }

  useEffect(() => {
    (async () => {
      try {
        const r = await fetch('/api/dashboard-admin/auth/session', { cache: 'no-store' });
        const j = await r.json().catch(() => ({}));
        if (j.authenticated) { setAuthorized(true); await loadHotels(); } else setAuthorized(false);
      } catch { setAuthorized(false); } finally { setChecking(false); }
    })();
  }, []);

  async function onUnlock(e: React.FormEvent) {
    e.preventDefault(); setAuthBusy(true); setAuthError(null);
    try {
      const r = await fetch('/api/dashboard-admin/auth/login', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ password }) });
      const j = await r.json().catch(() => ({}));
      if (!r.ok || !j.success) { setAuthError(j.error || 'Incorrect password.'); return; }
      setPassword(''); setAuthorized(true); await loadHotels();
    } catch (err: any) { setAuthError(err.message || 'Unable to verify.'); } finally { setAuthBusy(false); }
  }

  async function setActive(id: string, is_active: boolean) {
    setBusyId(id); setLoadError(null);
    try {
      const r = await fetch(`/api/dashboard-admin/hotels/${id}`, { method: 'PATCH', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ is_active }) });
      const j = await r.json().catch(() => ({}));
      if (!r.ok || !j.success) throw new Error(j.error || 'Update failed');
      setHotels((hs) => hs.map((h) => (h.id === id ? { ...h, is_active } : h)));
    } catch (e: any) { setLoadError(e.message || 'Update failed'); } finally { setBusyId(null); }
  }

  if (checking) return <p style={{ color: 'var(--text-muted)', fontSize: '0.875rem' }}>Loading…</p>;
  if (!authorized) return <div style={{ maxWidth: 520 }}><p style={{ color: 'var(--text-muted)' }}>Admin access required. <Link href='/dashboard/admin?next=%2Fdashboard%2Fhotels' style={{ color: 'var(--gold)' }}>Unlock Admin</Link></p></div>;

  return (
    <div style={{ maxWidth: 1180, display: 'flex', flexDirection: 'column', gap: 20 }}>
      <header style={{ display: 'flex', alignItems: 'flex-end', justifyContent: 'space-between', gap: 16, flexWrap: 'wrap' }}>
        <div>
          <span className="d3-eyebrow" style={{ fontSize: '0.5625rem' }}>Management</span>
          <h1 style={{ fontFamily: 'var(--font-display)', fontSize: 'clamp(1.75rem,3vw,2.25rem)', fontWeight: 500, color: 'var(--text-primary)', margin: '0.5rem 0 0', letterSpacing: '-0.02em' }}>Hotels</h1>
          <p style={{ color: 'var(--text-muted)', fontSize: '0.875rem', marginTop: '0.375rem' }}>Registered restaurants. Hotel IDs are permanent, server-generated, and shown only here.</p>
        </div>
        <Link href="/dashboard/customize" className="d3-btn-ghost">Open Menu Design</Link>
      </header>
      {loadError ? <div className="d3-note" style={{ borderColor: 'rgba(196,102,88,0.25)', color: '#D9A79E' }}>{loadError}</div> : null}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(320px, 1fr))', gap: 16 }}>
        {hotels.map((h) => {
          const active = h.is_active !== false;
          return (
            <article key={h.id} className="d3-panel" style={{ padding: '1.25rem', display: 'flex', flexDirection: 'column', gap: 14 }}>
              <div style={{ display: 'flex', gap: 12, alignItems: 'center' }}>
                <div style={{ width: 44, height: 44, borderRadius: 10, border: '1px solid var(--border-warm)', background: 'var(--bg-surface-2)', overflow: 'hidden', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
                  {h.logo_url ? <img src={h.logo_url} alt="" style={{ width: '100%', height: '100%', objectFit: 'cover' }} /> : <span style={{ color: 'var(--gold)', fontFamily: 'var(--font-display)', fontWeight: 600 }}>{(h.name || 'H').slice(0, 1).toUpperCase()}</span>}
                </div>
                <div style={{ minWidth: 0, flex: 1 }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 8, flexWrap: 'wrap' }}>
                    <h2 style={{ margin: 0, fontSize: '1rem', fontWeight: 600, color: 'var(--text-primary)' }}>{h.name || 'Unnamed hotel'}</h2>
                    <span className={active ? 'd3-badge d3-badge-gold' : 'd3-badge d3-badge-warm'}>{active ? 'Active' : 'Inactive'}</span>
                  </div>
                  <p style={{ margin: '2px 0 0', fontSize: '0.75rem', color: 'var(--text-dimmed)' }}>{h.city || '—'}{h.slug ? ` · /${h.slug}` : ''}</p>
                </div>
              </div>
              <div style={{ display: 'grid', gap: 8, fontSize: '0.8125rem' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', gap: 12 }}><span className="d3-label" style={{ margin: 0 }}>Hotel ID</span><code style={{ color: 'var(--gold)', fontSize: '0.8125rem' }}>{h.hotel_public_id || 'Pending migration/backfill'}</code></div>
                <div style={{ display: 'flex', justifyContent: 'space-between', gap: 12 }}><span className="d3-label" style={{ margin: 0 }}>Owner</span><span style={{ color: 'var(--text-secondary)', textAlign: 'right' }}>{h.owner_name || '—'}</span></div>
                <div style={{ display: 'flex', justifyContent: 'space-between', gap: 12 }}><span className="d3-label" style={{ margin: 0 }}>Contact</span><span style={{ color: 'var(--text-secondary)', textAlign: 'right', overflow: 'hidden', textOverflow: 'ellipsis' }}>{h.email || h.phone || '—'}</span></div>
                <div style={{ display: 'flex', justifyContent: 'space-between', gap: 12 }}><span className="d3-label" style={{ margin: 0 }}>Registered</span><span style={{ color: 'var(--text-secondary)' }}>{fmtDate(h.created_at)}</span></div>
              </div>
              <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap', marginTop: 'auto' }}>
                <button type="button" className="d3-btn-ghost" disabled={busyId === h.id} onClick={() => setActive(h.id, !active)}>{busyId === h.id ? 'Saving…' : active ? 'Set inactive' : 'Set active'}</button>
                {h.slug ? <a href={`/menu/${h.slug}`} target="_blank" rel="noopener noreferrer" className="d3-btn-subtle">View menu</a> : null}
              </div>
            </article>
          );
        })}
        {hotels.length === 0 ? <div className="d3-panel" style={{ padding: '1.5rem', color: 'var(--text-muted)' }}>No registered hotels found.</div> : null}
      </div>
    </div>
  );
}
