'use client';

export const dynamic = 'force-dynamic';

import React, { useState, useCallback, useEffect, useRef } from 'react';
import { useHotel } from '@/lib/useHotel';
import { useDashboardDialogs } from '@/components/dashboard/DashboardDialogs';

export default function ReviewsDashboardPage() {
  const { hotel, loading: hotelLoading, refetch } = useHotel();
  const { confirm } = useDashboardDialogs();
  // Local input state is seeded from the cached hotel row. It is the only
  // source of truth for what is typed; the badge below is derived from the
  // saved value so it reflects the database, not the text box.
  const [googleReviewUrl, setGoogleReviewUrl] = useState(hotel?.google_review_url || '');
  const [saving, setSaving] = useState(false);
  const [status, setStatus] = useState<'idle' | 'saved' | 'error'>('idle');
  const [statusMessage, setStatusMessage] = useState('');
  const [savedUrl, setSavedUrl] = useState<string | null>(hotel?.google_review_url || null);

  // After a successful save the shared `hotel` cache is still stale (the
  // background refetch has not resolved yet). The sync effect below would
  // otherwise overwrite the just-persisted URL with that stale null and the
  // field would appear empty — the URL "disappearing" bug. This flag skips
  // exactly one sync cycle after a save so the server's response wins.
  const justSavedRef = useRef(false);

  // Keep the local input in sync if the cached hotel row changes (e.g. after
  // a refetch, or after switching accounts). Never overwrite a value the user
  // just saved — the justSavedRef guard handles that.
  useEffect(() => {
    if (justSavedRef.current) {
      justSavedRef.current = false;
      return;
    }
    if (saving) return;
    const cached = hotel?.google_review_url || null;
    setSavedUrl(cached);
    setGoogleReviewUrl(cached || '');
  }, [hotel?.google_review_url, saving]);

  // Persist a URL (or clear it) to the database. This is the ONLY function
  // that writes `google_review_url`. A normal SAVE with a non-empty input
  // always reports "saved"; an explicit REMOVE action is what reports
  // "removed". An empty input on SAVE is treated as "no change intended"
  // and the existing database value is preserved — it is never interpreted
  // as a deletion.
  const persistUrl = useCallback(async (url: string | null, explicitRemove: boolean) => {
    if (!hotel?.id) return;
    const trimmed = (url || '').trim();

    // Validate URL when non-empty
    if (trimmed && !isValidUrl(trimmed)) {
      setStatus('error');
      setStatusMessage('Enter a valid Google Review URL (e.g. https://g.page/r/... or https://maps.google.com/...)');
      return;
    }

    setSaving(true);
    setStatus('idle');
    setStatusMessage('');

    try {
      const res = await fetch('/api/hotel/update', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ hotel_id: hotel.id, google_review_url: trimmed || null }),
      });
      const json = await res.json();
      if (!res.ok || !json.success) throw new Error(json.error || 'Failed to save');

      // The server returns the persisted hotel row. Use its
      // google_review_url (the exact pasted value, never a generated one)
      // so the badge and input update immediately and survive the stale
      // cache. Mark justSaved so the sync effect does not clear it.
      const persistedUrl = json?.hotel?.google_review_url || null;
      setSavedUrl(persistedUrl);
      setGoogleReviewUrl(persistedUrl || '');
      justSavedRef.current = true;

      if (explicitRemove) {
        setStatus('saved');
        setStatusMessage('Google Review URL removed.');
      } else {
        setStatus('saved');
        setStatusMessage(persistedUrl ? 'Google Review URL saved.' : 'Google Review URL saved.');
      }
      // Refresh the shared cache so other pages see the change too.
      try { await refetch(); } catch {}
      setTimeout(() => setStatus('idle'), 3000);
    } catch (err: any) {
      setStatus('error');
      setStatusMessage(err.message || 'Failed to save Google Review URL.');
    } finally {
      setSaving(false);
    }
  }, [hotel?.id, refetch]);

  // SAVE: only saves or updates the URL. Never deletes.
  const handleSave = useCallback(() => {
    persistUrl(googleReviewUrl, false);
  }, [googleReviewUrl, persistUrl]);

  // REMOVE URL: an explicit administrator action that deletes the URL.
  const handleRemove = useCallback(async () => {
    const ok = await confirm({
      title: 'Remove Google Review URL',
      body: 'Remove the Google Review URL? This action can be undone by saving a new URL.',
      confirmLabel: 'Remove URL',
      cancelLabel: 'Keep URL',
      tone: 'danger',
    });
    if (!ok) return;
    persistUrl('', true);
  }, [confirm, persistUrl]);

  const isValidUrl = (value: string): boolean => {
    try {
      const url = new URL(value);
      return url.protocol === 'https:' || url.protocol === 'http:';
    } catch {
      return false;
    }
  };

  // Badge reflects the saved value, not the cached hotel row.
  const hasUrl = Boolean(savedUrl || hotel?.google_review_url);

  if (hotelLoading) {
    return (
      <div className="flex flex-col items-center justify-center py-24 gap-4">
        <div style={{ width: 40, height: 40, borderRadius: '50%', border: '2px solid rgba(201,169,110,0.2)', borderTop: '2px solid var(--gold)', animation: 'spin 1s linear infinite' }} />
        <p style={{ color: 'var(--text-dimmed)', fontSize: '0.875rem' }}>Loading review settings…</p>
      </div>
    );
  }

  if (!hotel) {
    return (
      <div className="flex flex-col items-center justify-center py-24 gap-4">
        <p style={{ color: 'var(--text-muted)', fontSize: '0.875rem' }}>No hotel found for this account.</p>
      </div>
    );
  }

  return (
    <div className="flex flex-col gap-8" style={{ maxWidth: 1180 }}>
      <header>
        <span className="d3-eyebrow" style={{ fontSize: '0.5625rem' }}>
          Reviews
        </span>
        <h1
          style={{
            fontFamily: 'var(--font-display)',
            fontSize: 'clamp(2rem, 4vw, 2.75rem)',
            fontWeight: 500,
            color: 'var(--text-primary)',
            letterSpacing: '-0.025em',
            lineHeight: 1.1,
            margin: '0.5rem 0 0',
          }}
        >
          Google Review
        </h1>
        <p
          style={{
            margin: '0.5rem 0 0',
            fontSize: '0.875rem',
            lineHeight: 1.6,
            color: 'var(--text-muted)',
            maxWidth: '56ch',
          }}
        >
          Add your hotel's Google Review link. Once an order is marked Completed,
          guests are automatically redirected here to leave a review.
        </p>
      </header>

      <section className="d3-panel p-6 sm:p-8">
        <div className="flex flex-col gap-4">
          <label className="d3-label" style={{ fontWeight: 600, letterSpacing: '0.12em', textTransform: 'uppercase' }}>
            Google Review URL
          </label>
          <div style={{ position: 'relative' }}>
            <input
              type="url"
              value={googleReviewUrl}
              onChange={(e) => setGoogleReviewUrl(e.target.value)}
              placeholder="https://g.page/r/... or https://maps.google.com/..."
              disabled={saving}
              className="d3-input"
              style={{ paddingRight: 120 }}
            />
            <button
              type="button"
              onClick={handleSave}
              disabled={saving}
              className="d3-btn-primary"
              style={{
                position: 'absolute',
                right: 0,
                top: 0,
                bottom: 0,
                padding: '0 1rem',
                fontSize: '0.8125rem',
                fontWeight: 600,
              }}
            >
              {saving ? 'Saving…' : 'Save'}
            </button>
          </div>
          <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap', marginTop: 8 }}>
            <button
              type="button"
              onClick={handleRemove}
              disabled={saving || !savedUrl}
              className="d3-btn-ghost"
              style={{ fontSize: '0.75rem', fontWeight: 600, opacity: savedUrl ? 1 : 0.4 }}
            >
              Remove URL
            </button>
          </div>
          {status === 'saved' && (
            <p style={{ margin: 0, fontSize: '0.75rem', color: '#10b981', fontWeight: 500 }}>
              {statusMessage}
            </p>
          )}
          {status === 'error' && (
            <p style={{ margin: 0, fontSize: '0.75rem', color: '#C46658', fontWeight: 500 }}>
              {statusMessage}
            </p>
          )}
        </div>

        <div style={{ marginTop: '1.5rem', paddingTop: '1rem', borderTop: '1px solid var(--border-warm)', display: 'flex', alignItems: 'center', gap: 10, flexWrap: 'wrap' }}>
          <span style={{ fontSize: '0.75rem', color: 'var(--text-dimmed)', fontWeight: 600, letterSpacing: '0.1em', textTransform: 'uppercase' }}>
            Status
          </span>
          <span
            style={{
              display: 'inline-flex', alignItems: 'center', gap: 6,
              padding: '0.2rem 0.65rem', borderRadius: 100, fontSize: '0.625rem', fontWeight: 700,
              letterSpacing: '0.1em', textTransform: 'uppercase' as const,
              background: hasUrl ? 'rgba(16,185,129,0.08)' : 'rgba(184,164,122,0.08)',
              border: `1px solid ${hasUrl ? 'rgba(16,185,129,0.22)' : 'rgba(184,164,122,0.18)'}`,
              color: hasUrl ? '#10b981' : 'var(--text-dimmed)',
            }}
          >
            {hasUrl ? 'Configured' : 'Not configured'}
          </span>
        </div>
      </section>
    </div>
  );
}
