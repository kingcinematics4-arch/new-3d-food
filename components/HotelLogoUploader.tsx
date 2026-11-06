'use client';

// components/HotelLogoUploader.tsx
//
// Per-hotel logo uploader for the DinePixel Luxury Hotel Card settings.
// Each hotel stores its own logo in Supabase Storage under the existing
// `dine3d-branding` bucket, with the public URL persisted on
// `public.hotels.logo_url`.

import React, { useCallback, useEffect, useRef, useState } from 'react';
import {
  ACCEPTED_LOGO_LABEL,
  LOGO_FILE_ACCEPT,
  formatBytes,
  isAcceptableLogoFile,
} from '@/lib/branding';

type Phase = 'idle' | 'uploading' | 'removing';

interface PendingFile {
  file: File;
  previewUrl: string;
  width: number;
  height: number;
}

interface HotelLogoUploaderProps {
  hotelId: string;
  logoUrl: string | null;
  onLogoChanged?: (logoUrl: string | null) => void;
}

const MAX_DIMENSION = 20000;

export default function HotelLogoUploader({
  hotelId,
  logoUrl,
  onLogoChanged,
}: HotelLogoUploaderProps) {
  const inputRef = useRef<HTMLInputElement>(null);

  const [pending, setPending] = useState<PendingFile | null>(null);
  const [phase, setPhase] = useState<Phase>('idle');
  const [progress, setProgress] = useState(0);
  const [dragActive, setDragActive] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);
  const dragDepth = useRef(0);

  const busy = phase !== 'idle';
  const hasLogo = Boolean(logoUrl);

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

  const measure = useCallback((file: File): Promise<{ width: number; height: number } | null> => {
    const objectUrl = URL.createObjectURL(file);

    return new Promise((resolve) => {
      const probe = new Image();
      probe.onload = () => {
        const width = Math.min(Math.round(probe.naturalWidth) || 0, MAX_DIMENSION);
        const height = Math.min(Math.round(probe.naturalHeight) || 0, MAX_DIMENSION);
        URL.revokeObjectURL(objectUrl);
        if (width < 1 || height < 1) resolve(null);
        else resolve({ width, height });
      };
      probe.onerror = () => {
        URL.revokeObjectURL(objectUrl);
        resolve(null);
      };
      probe.src = objectUrl;
    });
  }, []);

  const selectFile = useCallback(
    async (file: File) => {
      setSuccess(null);

      const check = isAcceptableLogoFile(file);
      if (!check.ok) {
        setError(check.error);
        return;
      }

      const size = await measure(file);
      if (!size) {
        setError('That image could not be read. It may be damaged or not a real image file.');
        return;
      }

      setError(null);

      const previewUrl = URL.createObjectURL(file);
      setPending((current) => {
        if (current) URL.revokeObjectURL(current.previewUrl);
        return { file, previewUrl, ...size };
      });
    },
    [measure]
  );

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
    form.append('width', String(pending.width));
    form.append('height', String(pending.height));

    setError(null);
    setSuccess(null);
    setPhase('uploading');
    setProgress(0);

    const request = new XMLHttpRequest();
    request.open('POST', `/api/dashboard-admin/hotels/${hotelId}/logo`);

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
        setError('Your session expired. Sign in again, then upload the logo.');
        return;
      }

      if (request.status < 200 || request.status >= 300 || !payload?.success) {
        setError(payload?.error ?? 'The upload did not complete. Please try again.');
        return;
      }

      setProgress(100);
      clearPending();
      onLogoChanged?.(payload.logoUrl ?? null);

      setSuccess(
        hasLogo ? 'Logo replaced.' : 'Logo uploaded.'
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

    request.timeout = 60_000;
    request.send(form);
  }, [busy, clearPending, hasLogo, hotelId, onLogoChanged, pending]);

  const remove = useCallback(async () => {
    if (busy) return;

    setError(null);
    setSuccess(null);
    setPhase('removing');

    try {
      const response = await fetch(`/api/dashboard-admin/hotels/${hotelId}/logo`, {
        method: 'DELETE',
        cache: 'no-store',
      });
      const payload = await response.json();

      if (!response.ok || !payload?.success) {
        setError(payload?.error ?? 'Could not remove the logo.');
        return;
      }

      clearPending();
      onLogoChanged?.(null);

      setSuccess(payload.message ?? 'Logo removed.');
    } catch {
      setError('Could not reach the server. The logo was not removed.');
    } finally {
      setPhase('idle');
    }
  }, [busy, clearPending, hotelId, onLogoChanged]);

  const busyLabel = phase === 'uploading' ? 'Uploading' : 'Removing';

  return (
    <div className="flex flex-col gap-4">
      {/* CURRENT + PREVIEW */}
      <div className="flex flex-wrap gap-4">
        <div className="flex flex-col items-center gap-2">
          <span className="d3-label" style={{ marginBottom: 0 }}>
            {hasLogo ? 'Live logo' : 'No logo yet'}
          </span>
          <div
            style={{
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              minWidth: 170,
              minHeight: 110,
              padding: '1rem',
              background: 'var(--bg-secondary)',
              border: `1px solid ${hasLogo ? 'var(--border-warm)' : 'var(--border-warm)'}`,
              borderRadius: 10,
            }}
          >
            {pending ? (
              <img
                src={pending.previewUrl}
                alt="Logo preview"
                style={{ maxWidth: '100%', maxHeight: '100%', objectFit: 'contain', display: 'block' }}
              />
            ) : hasLogo ? (
              <img
                src={logoUrl!}
                alt="Hotel logo"
                style={{ maxWidth: '100%', maxHeight: '100%', objectFit: 'contain', display: 'block' }}
              />
            ) : (
              <span style={{ fontSize: '0.7rem', color: 'var(--text-dimmed)', textAlign: 'center' }}>
                No logo uploaded
              </span>
            )}
          </div>
        </div>
      </div>

      {/* FILE FACTS */}
      {pending ? (
        <div
          className="flex flex-wrap items-center gap-x-3 gap-y-1"
          style={{ fontSize: '0.75rem', color: 'var(--text-secondary)' }}
        >
          <span style={{ color: 'var(--text-primary)' }}>{pending.file.name}</span>
          <span>{formatBytes(pending.file.size)}</span>
          <span>{pending.width} × {pending.height} px</span>
          <span style={{ color: 'var(--text-dimmed)' }}>Not saved yet</span>
        </div>
      ) : null}

      {/* DROP ZONE */}
      <div
        role="button"
        tabIndex={busy ? -1 : 0}
        aria-label={`Upload brand logo. Accepts ${ACCEPTED_LOGO_LABEL} up to ${formatBytes(2 * 1024 * 1024)}.`}
        aria-disabled={busy}
        onClick={() => !busy && inputRef.current?.click()}
        onKeyDown={(event) => {
          if (busy) return;
          if (event.key === 'Enter' || event.key === ' ') {
            event.preventDefault();
            inputRef.current?.click();
          }
        }}
        onDragEnter={(event) => {
          event.preventDefault();
          dragDepth.current += 1;
          if (!busy) setDragActive(true);
        }}
        onDragOver={(event) => event.preventDefault()}
        onDragLeave={(event) => {
          event.preventDefault();
          dragDepth.current = Math.max(0, dragDepth.current - 1);
          if (dragDepth.current === 0) setDragActive(false);
        }}
        onDrop={onDrop}
        style={{
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'center',
          justifyContent: 'center',
          gap: '0.5rem',
          minHeight: 110,
          padding: '1.25rem',
          textAlign: 'center',
          cursor: busy ? 'not-allowed' : 'pointer',
          opacity: busy ? 0.55 : 1,
          background: dragActive ? 'var(--bg-elevated)' : 'var(--bg-surface)',
          border: dragActive ? '1px dashed var(--gold-dim)' : '1px dashed var(--border-warm)',
          borderRadius: 10,
          transition: 'background var(--transition-base), border-color var(--transition-base)',
        }}
      >
        <svg width="20" height="20" viewBox="0 0 24 24" fill="none" style={{ color: dragActive ? 'var(--gold-pale)' : 'var(--text-dimmed)' }}>
          <path d="M12 16V4M12 4L8 8M12 4L16 8" stroke="currentColor" strokeWidth="1.3" strokeLinecap="round" strokeLinejoin="round" />
          <path d="M4 15v3a2 2 0 002 2h12a2 2 0 002-2v-3" stroke="currentColor" strokeWidth="1.3" strokeLinecap="round" />
        </svg>

        <span style={{ fontSize: '0.8125rem', color: 'var(--text-primary)' }}>
          {dragActive ? 'Drop to use this image' : 'Drag an image here, or click to choose a file'}
        </span>
        <span style={{ fontSize: '0.6875rem', color: 'var(--text-dimmed)' }}>
          {ACCEPTED_LOGO_LABEL} · up to {formatBytes(2 * 1024 * 1024)}
        </span>

        <input
          ref={inputRef}
          type="file"
          accept={LOGO_FILE_ACCEPT}
          onChange={onInputChange}
          className="hidden"
          tabIndex={-1}
          aria-hidden="true"
        />
      </div>

      {/* PROGRESS */}
      {phase === 'uploading' ? (
        <div className="flex flex-col gap-1.5" aria-live="polite">
          <div
            role="progressbar"
            aria-valuenow={progress}
            aria-valuemin={0}
            aria-valuemax={100}
            aria-label="Logo upload progress"
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
            {busyLabel}… {progress}%
          </span>
        </div>
      ) : null}

      {phase === 'removing' ? (
        <span style={{ fontSize: '0.6875rem', color: 'var(--text-dimmed)' }} aria-live="polite">
          Removing…
        </span>
      ) : null}

      {/* ACTIONS */}
      <div className="flex flex-wrap items-center gap-2">
        <button
          type="button"
          onClick={upload}
          disabled={!pending || busy}
          className="d3-btn-primary"
          style={{ minHeight: 34, padding: '0 14px', fontSize: '0.8125rem' }}
        >
          {phase === 'uploading' ? 'Uploading…' : hasLogo ? 'Replace Logo' : 'Upload Brand Logo'}
        </button>

        {pending ? (
          <button
            type="button"
            onClick={clearPending}
            disabled={busy}
            className="d3-btn-ghost"
            style={{ minHeight: 34, padding: '0 14px', fontSize: '0.8125rem' }}
          >
            Discard
          </button>
        ) : null}

        {hasLogo ? (
          <button
            type="button"
            onClick={() => void remove()}
            disabled={busy}
            className="d3-btn-danger"
            style={{ minHeight: 34, padding: '0 14px', fontSize: '0.8125rem' }}
          >
            {phase === 'removing' ? 'Removing…' : 'Remove Logo'}
          </button>
        ) : null}
      </div>

      {/* FEEDBACK */}
      {error ? (
        <div
          className="d3-note d3-note-danger"
          role="status"
          aria-live="polite"
        >
          {error}
        </div>
      ) : success ? (
        <div
          className="d3-note d3-note-accent"
          role="status"
          aria-live="polite"
        >
          {success}
        </div>
      ) : null}
    </div>
  );
}
