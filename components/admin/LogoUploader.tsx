'use client';

// components/admin/LogoUploader.tsx
//
// The Dine3D logo uploader for the admin panel.
//
// WHAT IT DOES
// ------------
// 1. Shows the logo the site is currently using.
// 2. Accepts a file by drop or through the device file picker, restricted to
//    PNG / JPG / WebP up to 2 MB.
// 3. Previews the chosen file, at the exact size the site will render it, BEFORE
//    anything is stored. The owner can cancel and nothing changes.
// 4. Uploads with a real progress bar, then swaps the reference and re-renders
//    every logo in the app immediately.
// 5. Can remove the uploaded logo and fall back to the bundled asset.
//
// SECURITY
// --------
// The file goes to POST /api/admin/branding/logo as multipart form data. The
// browser never sees the Supabase service-role key, and the bucket has no write
// policy for any browser role. Every check below is duplicated on the server,
// which is the one that actually decides: this pass exists so a wrong file is
// rejected instantly instead of after a round trip.

import React, { useCallback, useEffect, useRef, useState } from 'react';
import Dine3DLogo from '@/components/Dine3DLogo';
import { useBrandLogo } from '@/components/branding/BrandLogoProvider';
import { AdminButton, AdminNote } from '@/components/admin/ui';
import {
  ACCEPTED_LOGO_LABEL,
  LOGO_FILE_ACCEPT,
  formatBytes,
  isAcceptableLogoFile,
  type LogoReference,
} from '@/lib/branding';

type Phase = 'idle' | 'uploading' | 'removing';

interface PendingFile {
  file: File;
  previewUrl: string;
  width: number;
  height: number;
}

interface LogoUploaderProps {
  /** Called after a successful upload or removal so the page can sync its editor state. */
  onLogoChanged?: (logo: LogoReference) => void;
}

const MAX_DIMENSION = 20000;

export default function LogoUploader({ onLogoChanged }: LogoUploaderProps) {
  const { logo, applyLogo } = useBrandLogo();
  const inputRef = useRef<HTMLInputElement>(null);

  const [pending, setPending] = useState<PendingFile | null>(null);
  const [phase, setPhase] = useState<Phase>('idle');
  const [progress, setProgress] = useState(0);
  const [dragActive, setDragActive] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);
  /** Guards against a drag leave from a child element cancelling the drop. */
  const dragDepth = useRef(0);

  const busy = phase !== 'idle';

  // Release the object URL for the file the owner is no longer looking at.
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

  /** Reads the file's real pixel size so the preview matches the live layout. */
  const measure = useCallback((file: File): Promise<{ width: number; height: number } | null> => {
    const objectUrl = URL.createObjectURL(file);

    return new Promise((resolve) => {
      const probe = new Image();
      probe.onload = () => {
        const width = Math.min(Math.round(probe.naturalWidth) || 0, MAX_DIMENSION);
        const height = Math.min(Math.round(probe.naturalHeight) || 0, MAX_DIMENSION);
        URL.revokeObjectURL(objectUrl);
        // A file the browser cannot decode is not a usable logo.
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
      // Reset so picking the same file twice still fires a change event.
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

  /**
   * Uploads with XMLHttpRequest rather than fetch: fetch still cannot report
   * request-body progress in any shipping browser, and a 2 MB logo on a slow
   * connection would otherwise look like a frozen button.
   */
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
    request.open('POST', '/api/admin/branding/logo');

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
        setError('Your admin session expired. Sign in again, then upload the logo.');
        return;
      }

      if (request.status < 200 || request.status >= 300 || !payload?.success) {
        setError(payload?.error ?? 'The upload did not complete. Please try again.');
        return;
      }

      setProgress(100);

      const nextLogo = payload.logo as LogoReference;
      applyLogo(nextLogo);
      clearPending();
      onLogoChanged?.(nextLogo);

      setSuccess(
        payload.removedPrevious
          ? 'Logo replaced. It is live across the site now.'
          : 'Logo uploaded. It is live across the site now.'
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
  }, [applyLogo, busy, clearPending, onLogoChanged, pending]);

  const remove = useCallback(async () => {
    if (busy) return;

    setError(null);
    setSuccess(null);
    setPhase('removing');

    try {
      const response = await fetch('/api/admin/branding/logo', { method: 'DELETE', cache: 'no-store' });
      const payload = await response.json();

      if (!response.ok || !payload?.success) {
        setError(payload?.error ?? 'Could not remove the logo.');
        return;
      }

      const nextLogo = payload.logo as LogoReference;
      applyLogo(nextLogo);
      clearPending();
      onLogoChanged?.(nextLogo);

      setSuccess(
        payload.message ??
          'Logo removed. The site is using the bundled Dine3D logo again.'
      );
    } catch {
      setError('Could not reach the server. The logo was not removed.');
    } finally {
      setPhase('idle');
    }
  }, [applyLogo, busy, clearPending, onLogoChanged]);

  const busyLabel = phase === 'uploading' ? 'Uploading' : 'Removing';

  return (
    <div className="flex flex-col gap-5">
      {/* ------------------------------------------- CURRENT + PREVIEW */}
      <div className="flex flex-wrap gap-6">
        <PreviewTile label="Live on the site" tone="var(--bg-secondary)">
          <Dine3DLogo size="lg" href={null} />
        </PreviewTile>

        <PreviewTile label="Your preview" tone="var(--bg-secondary)" dashed={!pending}>
          {pending ? (
            <Dine3DLogo
              size="lg"
              href={null}
              alt={pending.file.name}
              previewSrc={pending.previewUrl}
              previewWidth={pending.width}
              previewHeight={pending.height}
            />
          ) : (
            <span
              style={{
                fontSize: '0.75rem',
                color: 'var(--text-dimmed)',
                textAlign: 'center',
                maxWidth: 160,
              }}
            >
              Choose an image to preview it here before saving.
            </span>
          )}
        </PreviewTile>
      </div>

      {/* ------------------------------------------- FILE FACTS */}
      {pending ? (
        <div
          className="flex flex-wrap items-center gap-x-4 gap-y-1"
          style={{ fontSize: '0.75rem', color: 'var(--text-secondary)' }}
        >
          <span style={{ color: 'var(--text-primary)' }}>{pending.file.name}</span>
          <span>{formatBytes(pending.file.size)}</span>
          <span>
            {pending.width} × {pending.height} px
          </span>
          <span style={{ color: 'var(--text-dimmed)' }}>Not saved yet</span>
        </div>
      ) : null}

      {/* ------------------------------------------- DROP ZONE */}
      <div
        role="button"
        tabIndex={busy ? -1 : 0}
        aria-label={`Upload the Dine3D logo. Accepts ${ACCEPTED_LOGO_LABEL} up to ${formatBytes(2 * 1024 * 1024)}.`}
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
          minHeight: 132,
          padding: '1.5rem',
          textAlign: 'center',
          cursor: busy ? 'not-allowed' : 'pointer',
          opacity: busy ? 0.55 : 1,
          background: dragActive ? 'var(--bg-elevated)' : 'var(--bg-surface)',
          border: dragActive ? '1px dashed var(--gold-dim)' : '1px dashed var(--border-warm)',
          borderRadius: 10,
          transition: 'background var(--transition-base), border-color var(--transition-base)',
        }}
      >
        <svg width="22" height="22" viewBox="0 0 24 24" fill="none" style={{ color: dragActive ? 'var(--gold-pale)' : 'var(--text-dimmed)' }}>
          <path d="M12 16V4M12 4L8 8M12 4L16 8" stroke="currentColor" strokeWidth="1.3" strokeLinecap="round" strokeLinejoin="round" />
          <path d="M4 15v3a2 2 0 002 2h12a2 2 0 002-2v-3" stroke="currentColor" strokeWidth="1.3" strokeLinecap="round" />
        </svg>

        <span style={{ fontSize: '0.875rem', color: 'var(--text-primary)' }}>
          {dragActive ? 'Drop to use this image' : 'Drag an image here, or click to choose a file'}
        </span>
        <span style={{ fontSize: '0.6875rem', color: 'var(--text-dimmed)' }}>
          {ACCEPTED_LOGO_LABEL} · up to {formatBytes(2 * 1024 * 1024)} · shown exactly as supplied
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

      {/* ------------------------------------------- PROGRESS */}
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

      {/* ------------------------------------------- ACTIONS */}
      <div className="flex flex-wrap items-center gap-2">
        <AdminButton variant="primary" onClick={upload} disabled={!pending || busy}>
          {phase === 'uploading' ? 'Uploading…' : logo.hasCustomLogo ? 'Replace Logo' : 'Upload Logo'}
        </AdminButton>

        {pending ? (
          <AdminButton variant="ghost" onClick={clearPending} disabled={busy}>
            Discard
          </AdminButton>
        ) : null}

        {logo.hasCustomLogo ? (
          <AdminButton variant="danger" onClick={() => void remove()} disabled={busy}>
            {phase === 'removing' ? 'Removing…' : 'Remove Logo'}
          </AdminButton>
        ) : null}

        {logo.hasCustomLogo ? (
          <a
            href={logo.logoUrl}
            target="_blank"
            rel="noreferrer noopener"
            className="d3-btn-inline"
            style={{ marginLeft: 'auto', color: 'var(--text-dimmed)' }}
          >
            Open stored file
          </a>
        ) : null}
      </div>

      {/* ------------------------------------------- FEEDBACK */}
      {error ? (
        <StatusLine tone="error">{error}</StatusLine>
      ) : success ? (
        <StatusLine tone="success">{success}</StatusLine>
      ) : null}

      <AdminNote tone={logo.hasCustomLogo ? 'accent' : 'neutral'}>
        {logo.hasCustomLogo ? (
          <>
            The uploaded file is stored in Supabase Storage and served publicly, so every visitor sees
            it without signing in. Replacing it takes effect immediately — no publish step.
          </>
        ) : (
          <>
            Using the bundled Dine3D logo that ships with the app. Upload a file to replace it
            everywhere: site header and footer, sign-in and sign-up, admin panel, restaurant
            dashboard and the guest menu.
          </>
        )}
      </AdminNote>
    </div>
  );
}

/* ============================================================
   PRESENTATION
   ============================================================ */

function PreviewTile({
  label,
  tone,
  dashed,
  children,
}: {
  label: string;
  tone: string;
  dashed?: boolean;
  children: React.ReactNode;
}) {
  return (
    <div className="flex flex-col gap-2">
      <span className="d3-label" style={{ marginBottom: 0 }}>
        {label}
      </span>
      <div
        style={{
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          minWidth: 220,
          minHeight: 108,
          padding: '1.5rem 2rem',
          background: tone,
          border: dashed ? '1px dashed var(--border-warm)' : '1px solid var(--border-warm)',
          borderRadius: 8,
        }}
      >
        {children}
      </div>
    </div>
  );
}

function StatusLine({ tone, children }: { tone: 'success' | 'error'; children: React.ReactNode }) {
  const isError = tone === 'error';

  return (
    <div
      role="status"
      className="d3-note"
      style={{
        borderColor: isError ? 'rgba(196,102,88,0.28)' : 'var(--border-warm)',
        color: isError ? '#E7B4AC' : 'var(--text-secondary)',
      }}
    >
      <svg width="14" height="14" viewBox="0 0 14 14" fill="none" style={{ flexShrink: 0, marginTop: 3 }}>
        <circle cx="7" cy="7" r="6" stroke="currentColor" strokeWidth="1" />
        {isError ? (
          <>
            <path d="M7 4.2V7.4M7 9.4H7.01" stroke="currentColor" strokeWidth="1.2" strokeLinecap="round" />
          </>
        ) : (
          <path d="M4.4 7.2L6.3 9.1L9.7 5.4" stroke="currentColor" strokeWidth="1.3" strokeLinecap="round" strokeLinejoin="round" />
        )}
      </svg>
      <span>{children}</span>
    </div>
  );
}