'use client';

import React, { useCallback, useEffect, useRef, useState } from 'react';
import { useSiteContent } from '@/components/admin/SiteContentProvider';
import { AdminButton, AdminNote } from '@/components/admin/ui';
import {
  ACCEPTED_HERO_IMAGE_LABEL,
  HERO_IMAGE_FILE_ACCEPT,
  formatBytes,
  isAcceptableHeroImageFile,
  isManagedHeroImageUrl,
  MAX_HERO_IMAGE_BYTES,
} from '@/lib/heroImage';

type Phase = 'idle' | 'uploading' | 'removing';

interface PendingFile {
  file: File;
  previewUrl: string;
}

export default function HeroImageUploader() {
  const { draft, update } = useSiteContent();
  const hero = draft.hero;
  const imageUrl = hero.imageUrl;

  const inputRef = useRef<HTMLInputElement>(null);

  const [pending, setPending] = useState<PendingFile | null>(null);
  const [phase, setPhase] = useState<Phase>('idle');
  const [progress, setProgress] = useState(0);
  const [dragActive, setDragActive] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);
  const dragDepth = useRef(0);

  const isManaged = isManagedHeroImageUrl(imageUrl);
  const hasImage = Boolean(imageUrl);
  const busy = phase !== 'idle';

  useEffect(() => {
    return () => {
      if (pending) URL.revokeObjectURL(pending.previewUrl);
    };
  }, [pending]);

  const clearPending = useCallback(() => {
    setPending((current) => {
      if (current) URL.revokeObjectURL(current.previewUrl);
      return null;
    });
  }, []);

  const setHeroImageUrl = useCallback((url: string) => {
    update((current) => ({ ...current, hero: { ...current.hero, imageUrl: url } }));
  }, [update]);

  const selectFile = useCallback(async (file: File) => {
    setSuccess(null);

    const check = isAcceptableHeroImageFile(file);
    if (!check.ok) {
      setError(check.error);
      return;
    }

    setError(null);

    const previewUrl = URL.createObjectURL(file);
    setPending((current) => {
      if (current) URL.revokeObjectURL(current.previewUrl);
      return { file, previewUrl };
    });
  }, []);

  const onInputChange = useCallback(
    (event: React.ChangeEvent<HTMLInputElement>) => {
      const file = event.target.files?.[0];
      event.target.value = '';
      if (file) void selectFile(file);
    },
    [selectFile]
  );

  const onDrop = useCallback(
    (event: React.DragEvent<HTMLDivElement>) => {
      event.preventDefault();
      dragDepth.current = 0;
      setDragActive(false);
      if (busy) return;

      const file = event.dataTransfer.files?.[0];
      if (file) void selectFile(file);
    },
    [busy, selectFile]
  );

  const upload = useCallback(() => {
    if (!pending || busy) return;

    const form = new FormData();
    form.append('file', pending.file, pending.file.name);

    setError(null);
    setSuccess(null);
    setPhase('uploading');
    setProgress(0);

    const request = new XMLHttpRequest();
    request.open('POST', '/api/admin/hero-image');

    request.upload.onprogress = (event) => {
      if (event.lengthComputable && event.total > 0) {
        setProgress(Math.min(99, Math.round((event.loaded / event.total) * 100)));
      }
    };

    request.onload = () => {
      setPhase('idle');

      let payload: any = null;
      try {
        payload = JSON.parse(request.responseText);
      } catch {
        payload = null;
      }

      if (request.status === 401 || request.status === 403) {
        setError('Your admin session expired. Sign in again, then upload the image.');
        return;
      }

      if (request.status < 200 || request.status >= 300 || !payload?.success) {
        setError(payload?.error ?? 'The upload did not complete. Please try again.');
        return;
      }

      setProgress(100);

      const nextUrl = payload.imageUrl as string;
      setHeroImageUrl(nextUrl);
      clearPending();

      setSuccess(
        payload.removedPrevious
          ? 'Background image replaced. It is live on the site now.'
          : 'Background image uploaded. It is live on the site now.'
      );
    };

    request.onerror = () => {
      setPhase('idle');
      setError('Could not reach the server. Your file was not uploaded — check your connection.');
    };

    request.ontimeout = () => {
      setPhase('idle');
      setError('The upload timed out. Please try again.');
    };

    request.timeout = 120_000;
    request.send(form);
  }, [busy, clearPending, pending, setHeroImageUrl]);

  const remove = useCallback(async () => {
    if (busy) return;

    setError(null);
    setSuccess(null);
    setPhase('removing');

    try {
      const response = await fetch('/api/admin/hero-image', { method: 'DELETE', cache: 'no-store' });
      const payload = await response.json();

      if (!response.ok || !payload?.success) {
        setError(payload?.error ?? 'Could not remove the image.');
        return;
      }

      setHeroImageUrl(payload.imageUrl ?? '');
      setSuccess(
        payload.removedFile
          ? 'Background image removed. The site is using its default background again.'
          : 'Background image cleared.'
      );
    } catch {
      setError('Could not reach the server. The image was not removed.');
    } finally {
      setPhase('idle');
    }
  }, [busy, setHeroImageUrl]);

  const handleDragEnter = useCallback((event: React.DragEvent<HTMLDivElement>) => {
    event.preventDefault();
    dragDepth.current += 1;
    if (!busy) setDragActive(true);
  }, [busy]);

  const handleDragLeave = useCallback((event: React.DragEvent<HTMLDivElement>) => {
    event.preventDefault();
    dragDepth.current = Math.max(0, dragDepth.current - 1);
    if (dragDepth.current === 0) setDragActive(false);
  }, []);

  const handleDragOver = useCallback((event: React.DragEvent<HTMLDivElement>) => {
    event.preventDefault();
  }, []);

  return (
    <div className="flex flex-col gap-5">
      {(hasImage || pending) && (
        <div
          style={{
            borderRadius: 10,
            overflow: 'hidden',
            border: '1px solid var(--border-warm)',
            background: 'var(--bg-secondary)',
            maxWidth: '100%',
            maxHeight: 180,
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
          }}
        >
          <img
            src={pending ? pending.previewUrl : imageUrl}
            alt={pending ? pending.file.name : hero.imageAlt || 'Hero background image'}
            style={{
              maxWidth: '100%',
              maxHeight: 180,
              width: 'auto',
              height: 'auto',
              objectFit: 'contain',
            }}
          />
        </div>
      )}

      {pending ? (
        <div
          className="flex flex-wrap items-center gap-x-4 gap-y-1"
          style={{ fontSize: '0.75rem', color: 'var(--text-secondary)' }}
        >
          <span style={{ color: 'var(--text-primary)' }}>{pending.file.name}</span>
          <span>{formatBytes(pending.file.size)}</span>
          <span style={{ color: 'var(--text-dimmed)' }}>Not saved yet</span>
        </div>
      ) : null}

      <div
        role="button"
        tabIndex={busy ? -1 : 0}
        aria-label={`Upload a hero background image. Accepts ${ACCEPTED_HERO_IMAGE_LABEL} up to ${formatBytes(MAX_HERO_IMAGE_BYTES)}.`}
        aria-disabled={busy}
        onDragEnter={handleDragEnter}
        onDragOver={handleDragOver}
        onDragLeave={handleDragLeave}
        onDrop={onDrop}
        style={{
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'center',
          justifyContent: 'center',
          gap: '0.75rem',
          padding: '1.5rem 2rem',
          textAlign: 'center',
          cursor: busy ? 'not-allowed' : 'pointer',
          opacity: busy ? 0.55 : 1,
          background: dragActive ? 'var(--bg-elevated)' : 'var(--bg-surface)',
          border: dragActive ? '1px dashed var(--gold-dim)' : '1px dashed var(--border-warm)',
          borderRadius: 10,
          transition: 'background var(--transition-base), border-color var(--transition-base)',
        }}
      >
        <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '0.5rem' }}>
          <button
            type="button"
            onClick={() => !busy && inputRef.current?.click()}
            disabled={busy}
            style={{
              display: 'inline-flex',
              alignItems: 'center',
              justifyContent: 'center',
              gap: '0.5rem',
              padding: '0.625rem 1.25rem',
              fontSize: '0.8125rem',
              fontWeight: 500,
              color: 'var(--text-primary)',
              background: 'var(--bg-surface-2)',
              border: '1px solid var(--border-warm)',
              borderRadius: 8,
              cursor: busy ? 'not-allowed' : 'pointer',
              transition: 'background var(--transition-base), border-color var(--transition-base)',
              whiteSpace: 'nowrap',
            }}
            onMouseEnter={(e) => {
              if (!busy) e.currentTarget.style.background = 'var(--bg-surface-3)';
            }}
            onMouseLeave={(e) => {
              if (!busy) e.currentTarget.style.background = 'var(--bg-surface-2)';
            }}
          >
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" style={{ color: 'var(--text-muted)' }} aria-hidden="true">
              <path d="M12 16V4M12 4L8 8M12 4L16 8" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
              <path d="M4 15v3a2 2 0 002 2h12a2 2 0 002-2v-3" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" />
            </svg>
            Drag & Drop Image Here
          </button>

          <span style={{ fontSize: '0.6875rem', color: 'var(--text-dimmed)', fontWeight: 500 }}>or</span>

          <button
            type="button"
            onClick={() => !busy && inputRef.current?.click()}
            disabled={busy}
            style={{
              display: 'inline-flex',
              alignItems: 'center',
              justifyContent: 'center',
              gap: '0.5rem',
              padding: '0.625rem 1.25rem',
              fontSize: '0.8125rem',
              fontWeight: 500,
              color: 'var(--gold)',
              background: 'transparent',
              border: '1px solid var(--gold-dim)',
              borderRadius: 8,
              cursor: busy ? 'not-allowed' : 'pointer',
              transition: 'background var(--transition-base), border-color var(--transition-base)',
              whiteSpace: 'nowrap',
            }}
            onMouseEnter={(e) => {
              if (!busy) e.currentTarget.style.background = 'rgba(201,169,110,0.08)';
            }}
            onMouseLeave={(e) => {
              if (!busy) e.currentTarget.style.background = 'transparent';
            }}
          >
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" style={{ color: 'var(--gold)' }} aria-hidden="true">
              <path d="M21 15V5a2 2 0 00-2-2H5a2 2 0 00-2 2v14a2 2 0 002 2h14a2 2 0 002-2v-5" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
              <polyline points="17 8 12 3 7 8" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
              <line x1="12" y1="3" x2="12" y2="15" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
            </svg>
            Choose Image From PC
          </button>
        </div>

        <span style={{ fontSize: '0.6875rem', color: 'var(--text-dimmed)' }}>
          {ACCEPTED_HERO_IMAGE_LABEL} · up to {formatBytes(MAX_HERO_IMAGE_BYTES)}
        </span>

        <input
          ref={inputRef}
          type="file"
          accept={HERO_IMAGE_FILE_ACCEPT}
          onChange={onInputChange}
          className="hidden"
          tabIndex={-1}
          aria-hidden="true"
        />
      </div>

      {phase === 'uploading' ? (
        <div className="flex flex-col gap-1.5" aria-live="polite">
          <div
            role="progressbar"
            aria-valuenow={progress}
            aria-valuemin={0}
            aria-valuemax={100}
            aria-label="Hero image upload progress"
            style={{
              height: 3,
              borderRadius: 999,
              background: 'var(--bg-surface-3)',
              overflow: 'hidden',
            }}
          >
            <div
              style={{
                width: `${Math.max(progress, 4)}%`,
                height: '100%',
                background: 'var(--gold-dim)',
                transition: 'width 160ms linear',
              }}
            />
          </div>
          <span style={{ fontSize: '0.6875rem', color: 'var(--text-dimmed)' }}>
            Uploading… {progress}%
          </span>
        </div>
      ) : null}

      {phase === 'removing' ? (
        <span style={{ fontSize: '0.6875rem', color: 'var(--text-dimmed)' }} aria-live="polite">
          Removing…
        </span>
      ) : null}

      {(pending || isManaged) && (
        <div className="flex flex-wrap items-center gap-2">
          {pending ? (
            <>
              <AdminButton variant="primary" onClick={upload} disabled={!pending || busy}>
                Upload Image
              </AdminButton>
              <AdminButton variant="ghost" onClick={clearPending} disabled={busy}>
                Discard
              </AdminButton>
            </>
          ) : isManaged ? (
            <>
              <AdminButton variant="ghost" onClick={() => inputRef.current?.click()} disabled={busy}>
                Replace
              </AdminButton>
              <AdminButton variant="danger" onClick={() => void remove()} disabled={busy}>
                Remove Image
              </AdminButton>
            </>
          ) : null}
        </div>
      )}

      {error ? (
        <div
          role="status"
          className="d3-note"
          style={{
            borderColor: 'rgba(196,102,88,0.28)',
            color: '#E7B4AC',
          }}
        >
          <svg width="14" height="14" viewBox="0 0 14 14" fill="none" style={{ flexShrink: 0, marginTop: 3 }}>
            <circle cx="7" cy="7" r="6" stroke="currentColor" strokeWidth="1" />
            <path d="M7 4.2V7.2M7 9.4H7.01" stroke="currentColor" strokeWidth="1.2" strokeLinecap="round" />
          </svg>
          <span>{error}</span>
        </div>
      ) : success ? (
        <div
          role="status"
          className="d3-note"
          style={{
            borderColor: 'var(--border-warm)',
            color: 'var(--text-secondary)',
          }}
        >
          <svg width="14" height="14" viewBox="0 0 14 14" fill="none" style={{ flexShrink: 0, marginTop: 3 }}>
            <circle cx="7" cy="7" r="6" stroke="currentColor" strokeWidth="1" />
            <path d="M4.4 7.2L6.3 9.1L9.7 5.4" stroke="currentColor" strokeWidth="1.3" strokeLinecap="round" strokeLinejoin="round" />
          </svg>
          <span>{success}</span>
        </div>
      ) : null}

      <AdminNote tone={hasImage ? 'accent' : 'neutral'}>
        {hasImage ? (
          <>
            An image is set for the hero background. Upload a new one to replace it, or use the URL field above for an external image.
          </>
        ) : (
          <>
            No background image uploaded. You can either upload a file here or enter a URL or site path in the field above.
          </>
        )}
      </AdminNote>
    </div>
  );
}