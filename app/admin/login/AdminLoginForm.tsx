'use client';

// app/admin/login/AdminLoginForm.tsx
//
// Posts the candidate password to a server route. The password is compared
// server-side only; this component holds it in a local React state variable for
// the duration of the form and never sends it anywhere else.
//
// No `NEXT_PUBLIC_` variable, no bundled secret, no client-side comparison.

import React, { useState } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import Dine3DLogo from '@/components/Dine3DLogo';

export default function AdminLoginForm({ configured }: { configured: boolean }) {
  const router = useRouter();
  const searchParams = useSearchParams();

  const [password, setPassword] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);

  async function handleSubmit(event: React.FormEvent) {
    event.preventDefault();

    if (!password || busy) return;

    setBusy(true);
    setError(null);

    try {
      const response = await fetch('/api/admin/auth/login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ password }),
      });

      const payload = await response.json();

      if (!response.ok) {
        setError(payload?.error ?? 'Sign in failed.');
        setPassword('');
        return;
      }

      // Only accept a redirect target inside this panel.
      const requested = searchParams.get('from');
      const destination =
        requested && requested.startsWith('/admin') && !requested.startsWith('/admin/login')
          ? requested
          : '/admin';

      router.replace(destination);
      router.refresh();
    } catch {
      setError('Could not reach the server. Please try again.');
    } finally {
      setBusy(false);
    }
  }

  return (
    <div className="flex flex-col gap-8">
      <div className="flex flex-col items-center gap-4 text-center">
        {/* Official Dine3D logo asset, used exactly as supplied */}
        <Dine3DLogo size="md" href="/" priority />

        <div className="flex flex-col gap-2">
          <span className="d3-eyebrow" style={{ color: 'var(--gold-dim)' }}>
            OWNER ACCESS
          </span>
          <h1
            className="d3-display-sm"
            style={{ fontSize: '1.75rem', margin: 0 }}
          >
            Sign in to the admin panel
          </h1>
          <p className="d3-body-sm" style={{ margin: 0, color: 'var(--text-dimmed)' }}>
            Manage the public Dine3D website.
          </p>
        </div>
      </div>

      {!configured ? (
        <div className="d3-note d3-note-danger">
          <svg width="14" height="14" viewBox="0 0 14 14" fill="none" style={{ flexShrink: 0, marginTop: 3 }}>
            <circle cx="7" cy="7" r="6" stroke="currentColor" strokeWidth="1" />
            <path d="M7 4.2V7.6M7 9.6H7.01" stroke="currentColor" strokeWidth="1.2" strokeLinecap="round" />
          </svg>
          <span>
            Admin access is not configured. Set <code>DINE3D_ADMIN_PASSWORD</code> in the server
            environment and restart the app.
          </span>
        </div>
      ) : (
        <form onSubmit={handleSubmit} className="flex flex-col gap-4">
          <label className="block">
            <span className="d3-label">Password</span>
            <input
              type="password"
              className="d3-input"
              value={password}
              autoComplete="current-password"
              autoFocus
              disabled={busy}
              onChange={(e) => setPassword(e.target.value)}
              placeholder="••••••••••"
            />
          </label>

          {error ? (
            <div className="d3-note d3-note-danger">
              <span>{error}</span>
            </div>
          ) : null}

          <button
            type="submit"
            className="d3-btn-quiet"
            disabled={busy || !password}
            style={{
              padding: '0.75rem 1.25rem',
              justifyContent: 'center',
              opacity: busy || !password ? 0.5 : 1,
              cursor: busy || !password ? 'not-allowed' : 'pointer',
            }}
          >
            {busy ? 'Signing in…' : 'Sign in'}
          </button>
        </form>
      )}

      <p className="text-center" style={{ fontSize: '0.6875rem', color: 'var(--text-dimmed)' }}>
        This panel is for the Dine3D owner. Restaurant owners sign in at{' '}
        <a href="/login" style={{ color: 'var(--gold)' }}>
          the restaurant dashboard
        </a>
        .
      </p>
    </div>
  );
}