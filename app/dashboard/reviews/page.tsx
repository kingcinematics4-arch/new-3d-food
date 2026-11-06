'use client';

export const dynamic = 'force-dynamic';

import React, { useState, useCallback } from 'react';
import { useHotel } from '@/lib/useHotel';

export default function ReviewsDashboardPage() {
  const { hotel, loading: hotelLoading } = useHotel();
  const [googleReviewUrl, setGoogleReviewUrl] = useState(hotel?.google_review_url || '');
  const [saving, setSaving] = useState(false);
  const [status, setStatus] = useState<'idle' | 'saved' | 'error'>('idle');
  const [statusMessage, setStatusMessage] = useState('');

  const handleSave = useCallback(async () => {
    if (!hotel?.id) return;
    const trimmed = googleReviewUrl.trim();

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
      setStatus('saved');
      setStatusMessage('Google Review URL saved.');
      setTimeout(() => setStatus('idle'), 3000);
    } catch (err: any) {
      setStatus('error');
      setStatusMessage(err.message || 'Failed to save Google Review URL.');
    } finally {
      setSaving(false);
    }
  }, [hotel?.id, googleReviewUrl]);

  const isValidUrl = (value: string): boolean => {
    try {
      const url = new URL(value);
      return url.protocol === 'https:' || url.protocol === 'http:';
    } catch {
      return false;
    }
  };

  const hasUrl = Boolean(hotel?.google_review_url);

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
