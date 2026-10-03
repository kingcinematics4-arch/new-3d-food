'use client';

// components/admin/SiteContentProvider.tsx
//
// Client-side editor state for the Dine3D admin panel.
//
// Holds the DRAFT document while the owner edits, and exposes Save Draft and
// Publish as two distinct, explicit actions. Editing never writes to the
// database by itself, and publishing is never a side effect of saving — that
// separation is the whole point of the draft/published model.

import React, {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useState,
} from 'react';
import type { SiteContent } from '@/lib/siteContent';
import { DEFAULT_SITE_CONTENT } from '@/lib/siteContent';

type Status = 'idle' | 'loading' | 'saving' | 'publishing' | 'error';

interface SiteContentContextValue {
  draft: SiteContent;
  /** Last state known to be live on the public site. */
  published: SiteContent;
  loading: boolean;
  dirty: boolean;
  status: Status;
  error: string | null;
  notice: string | null;
  updatedAt: string | null;
  publishedAt: string | null;
  hasEverPublished: boolean;

  /** Immutably updates a slice of the draft. */
  update: (mutator: (draft: SiteContent) => SiteContent) => void;
  /** Convenience setter for a single section. */
  setSection: <K extends keyof SiteContent>(key: K, value: SiteContent[K]) => void;

  saveDraft: () => Promise<void>;
  publish: () => Promise<void>;
  clearNotice: () => void;
}

const SiteContentContext = createContext<SiteContentContextValue | null>(null);

export function SiteContentProvider({ children }: { children: React.ReactNode }) {
  const [draft, setDraft] = useState<SiteContent>(DEFAULT_SITE_CONTENT);
  const [published, setPublished] = useState<SiteContent>(DEFAULT_SITE_CONTENT);
  const [savedSnapshot, setSavedSnapshot] = useState<string>(JSON.stringify(DEFAULT_SITE_CONTENT));

  const [loading, setLoading] = useState(true);
  const [status, setStatus] = useState<Status>('idle');
  const [error, setError] = useState<string | null>(null);
  const [notice, setNotice] = useState<string | null>(null);

  const [updatedAt, setUpdatedAt] = useState<string | null>(null);
  const [publishedAt, setPublishedAt] = useState<string | null>(null);
  const [hasEverPublished, setHasEverPublished] = useState(false);

  const load = useCallback(async () => {
    setLoading(true);
    try {
      const response = await fetch('/api/admin/site', { cache: 'no-store' });
      const payload = await response.json();

      if (!response.ok) {
        setError(payload?.error ?? 'Could not load site content.');
        // Fall back to the shipped defaults so the panel is still usable and
        // the owner can see what the site currently looks like.
        setDraft(DEFAULT_SITE_CONTENT);
        setPublished(DEFAULT_SITE_CONTENT);
        setSavedSnapshot(JSON.stringify(DEFAULT_SITE_CONTENT));
        return;
      }

      setDraft(payload.draft as SiteContent);
      setPublished(payload.published as SiteContent);
      setSavedSnapshot(JSON.stringify(payload.draft));
      setUpdatedAt(payload.updatedAt ?? null);
      setPublishedAt(payload.publishedAt ?? null);
      setHasEverPublished(Boolean(payload.hasEverPublished));
      setError(null);
    } catch {
      setError('Could not reach the server. Check your connection and reload.');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    void load();
  }, [load]);

  const update = useCallback((mutator: (current: SiteContent) => SiteContent) => {
    setDraft((current) => mutator(current));
    setNotice(null);
  }, []);

  const setSection = useCallback(<K extends keyof SiteContent>(key: K, value: SiteContent[K]) => {
    setDraft((current) => ({ ...current, [key]: value }));
    setNotice(null);
  }, []);

  const dirty = useMemo(() => JSON.stringify(draft) !== savedSnapshot, [draft, savedSnapshot]);

  const saveDraft = useCallback(async () => {
    setStatus('saving');
    setError(null);

    try {
      const response = await fetch('/api/admin/site', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(draft),
      });

      const payload = await response.json();

      if (!response.ok) {
        setError(payload?.error ?? 'Could not save the draft.');
        setStatus('error');
        return;
      }

      setSavedSnapshot(JSON.stringify(draft));
      setUpdatedAt(payload.updatedAt ?? new Date().toISOString());
      setNotice('Draft saved. The live website is unchanged.');
      setStatus('idle');
    } catch {
      setError('Could not reach the server. Your changes are still here — try saving again.');
      setStatus('error');
    }
  }, [draft]);

  const publish = useCallback(async () => {
    setStatus('publishing');
    setError(null);

    try {
      // Publishing promotes the stored draft, so save first when there are
      // unsaved edits. Otherwise "Publish" would silently drop them.
      if (dirty) {
        const saveResponse = await fetch('/api/admin/site', {
          method: 'PUT',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(draft),
        });

        const savePayload = await saveResponse.json();
        if (!saveResponse.ok) {
          setError(savePayload?.error ?? 'Could not save before publishing.');
          setStatus('error');
          return;
        }

        setSavedSnapshot(JSON.stringify(draft));
        setUpdatedAt(savePayload.updatedAt ?? new Date().toISOString());
      }

      const response = await fetch('/api/admin/site/publish', { method: 'POST' });
      const payload = await response.json();

      if (!response.ok) {
        setError(payload?.error ?? 'Could not publish.');
        setStatus('error');
        return;
      }

      setPublished(draft);
      setPublishedAt(payload.publishedAt ?? new Date().toISOString());
      setHasEverPublished(true);
      setNotice('Published. The live website now shows these changes.');
      setStatus('idle');
    } catch {
      setError('Could not reach the server. Your changes are still here — try again.');
      setStatus('error');
    }
  }, [draft, dirty]);

  const value = useMemo<SiteContentContextValue>(
    () => ({
      draft,
      published,
      loading,
      dirty,
      status,
      error,
      notice,
      updatedAt,
      publishedAt,
      hasEverPublished,
      update,
      setSection,
      saveDraft,
      publish,
      clearNotice: () => setNotice(null),
    }),
    [
      draft,
      published,
      loading,
      dirty,
      status,
      error,
      notice,
      updatedAt,
      publishedAt,
      hasEverPublished,
      update,
      setSection,
      saveDraft,
      publish,
    ]
  );

  return <SiteContentContext.Provider value={value}>{children}</SiteContentContext.Provider>;
}

export function useSiteContent(): SiteContentContextValue {
  const context = useContext(SiteContentContext);
  if (!context) throw new Error('useSiteContent must be used inside <SiteContentProvider>.');
  return context;
}

/* ============================================================
   SAVE / PUBLISH BAR
   ============================================================ */

export function AdminSaveBar() {
  const { dirty, status, saveDraft, publish, error, notice, publishedAt } = useSiteContent();

  const busy = status === 'saving' || status === 'publishing';

  return (
    <div
      className="sticky bottom-0 z-20"
      style={{
        background: 'var(--bg-secondary)',
        borderTop: '1px solid var(--border-warm)',
        margin: '3rem -3rem -3rem',
        padding: '1rem 3rem',
      }}
    >
      <div className="flex flex-wrap items-center justify-between gap-4">
        <div className="flex flex-col gap-1">
          <span style={{ fontSize: '0.8125rem', color: 'var(--text-secondary)' }}>
            {error ? (
              <span style={{ color: '#E7B4AC' }}>{error}</span>
            ) : notice ? (
              notice
            ) : dirty ? (
              'Unsaved changes. The live website is not affected until you publish.'
            ) : (
              'All changes saved.'
            )}
          </span>
          {publishedAt ? (
            <span style={{ fontSize: '0.6875rem', color: 'var(--text-dimmed)' }}>
              Last published {formatTimestamp(publishedAt)}
            </span>
          ) : (
            <span style={{ fontSize: '0.6875rem', color: 'var(--text-dimmed)' }}>
              Not published yet — the site is showing its default content.
            </span>
          )}
        </div>

        <div className="flex items-center gap-2">
          <button
            type="button"
            onClick={() => window.open('/', '_blank', 'noopener')}
            className="d3-btn-subtle"
          >
            Preview Website
          </button>

          <button
            type="button"
            onClick={() => void saveDraft()}
            disabled={busy || !dirty}
            className="d3-btn-subtle"
            style={{ opacity: busy || !dirty ? 0.45 : 1, cursor: busy || !dirty ? 'not-allowed' : 'pointer' }}
          >
            {status === 'saving' ? 'Saving…' : 'Save Draft'}
          </button>

          <button
            type="button"
            onClick={() => void publish()}
            disabled={busy}
            className="d3-btn-quiet"
            style={{ opacity: busy ? 0.45 : 1, cursor: busy ? 'not-allowed' : 'pointer' }}
          >
            {status === 'publishing' ? 'Publishing…' : 'Publish Changes'}
          </button>
        </div>
      </div>
    </div>
  );
}

export function formatTimestamp(iso: string | null): string {
  if (!iso) return 'never';

  const date = new Date(iso);
  if (Number.isNaN(date.getTime())) return 'unknown';

  return date.toLocaleString(undefined, {
    year: 'numeric',
    month: 'short',
    day: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
  });
}