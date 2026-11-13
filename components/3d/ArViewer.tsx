'use client';

import React, { useEffect, useRef, useState } from 'react';
import { detectArPlatform, isArSupportedForDevice, arAvailabilityLabel } from '@/lib/arAvailability';

interface ArViewerProps {
  modelUrlGlb?: string | null;
  modelUrlUsdz?: string | null;
  altText?: string;
  posterUrl?: string | null;
  className?: string;
}

/**
 * Cross-platform AR delivery using Google's <model-viewer>.
 * - Android: Scene Viewer via GLB (ar-modes includes scene-viewer)
 * - iOS/iPadOS: Apple Quick Look via USDZ (ios-src)
 * - WebXR where supported (GLB)
 * AR is user-initiated only (no auto-activate). Availability is determined per
 * device and per uploaded format; GLB and USDZ are NOT both required.
 */
export default function ArViewer({
  modelUrlGlb,
  modelUrlUsdz,
  altText = '3D food model',
  posterUrl,
  className = '',
}: ArViewerProps) {
  const ref = useRef<any>(null);
  const [ready, setReady] = useState(false);
  const [loadError, setLoadError] = useState<string | null>(null);
  const [arStatus, setArStatus] = useState<string | null>(null);
  const [canActivateAr, setCanActivateAr] = useState(false);
  const [platform, setPlatform] = useState<'ios' | 'android' | 'other'>('other');

  const glb = modelUrlGlb?.trim() || '';
  const usdz = modelUrlUsdz?.trim() || '';

  useEffect(() => {
    setPlatform(detectArPlatform());
  }, []);

  useEffect(() => {
    let cancelled = false;
    (async () => {
      try {
        // @ts-ignore - custom element registration
        await import('@google/model-viewer');
        if (!cancelled) setReady(true);
      } catch {
        if (!cancelled) setLoadError('AR viewer could not be loaded in this browser.');
      }
    })();
    return () => { cancelled = true; };
  }, []);

  useEffect(() => {
    setLoadError(null);
    setArStatus(null);
  }, [glb, usdz]);

  useEffect(() => {
    const el = ref.current;
    if (!el) return;
    const onLoad = () => {
      setLoadError(null);
      try { setCanActivateAr(Boolean(el.canActivateAR)); } catch { setCanActivateAr(false); }
    };
    const onError = (e: any) => {
      const msg = e?.detail?.sourceError?.message || 'The 3D model could not be loaded.';
      setLoadError(msg);
    };
    const onArStatus = (e: any) => {
      const status = e?.detail?.status;
      if (status === 'failed') setArStatus('AR could not be started on this device. You can continue using 3D preview.');
      else if (status === 'session-started' || status === 'not-presenting') setArStatus(null);
    };
    el.addEventListener('load', onLoad);
    el.addEventListener('error', onError);
    el.addEventListener('ar-status', onArStatus);
    try { setCanActivateAr(Boolean(el.canActivateAR)); } catch {}
    return () => {
      el.removeEventListener('load', onLoad);
      el.removeEventListener('error', onError);
      el.removeEventListener('ar-status', onArStatus);
    };
  }, [ready, glb, usdz]);

  const deviceSupports = isArSupportedForDevice(platform, glb, usdz);
  const availabilityMsg = arAvailabilityLabel(platform, glb, usdz);

  // iOS/iPadOS with USDZ only (no GLB): provide native Quick Look link.
  if (platform === 'ios' && usdz && !glb) {
    return (
      <div className={className} style={{ position: 'relative', width: '100%', height: '100%', minHeight: 280, display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', gap: 16, padding: 20, background: 'var(--bg-secondary)' }}>
        {posterUrl ? <img src={posterUrl} alt={altText} style={{ maxHeight: 180, maxWidth: '100%', objectFit: 'contain', borderRadius: 8, opacity: 0.95 }} /> : null}
        <div style={{ textAlign: 'center', color: 'var(--text-muted)', fontSize: '0.75rem', maxWidth: 420 }}>
          <p style={{ margin: 0 }}>{availabilityMsg}</p>
        </div>
        <a
          rel="ar"
          href={usdz}
          style={{
            display: 'inline-flex', alignItems: 'center', justifyContent: 'center', gap: 8,
            padding: '0.625rem 1.1rem', borderRadius: 999, border: '1px solid rgba(201,169,110,0.5)',
            background: 'rgba(11,10,8,0.78)', color: 'var(--gold)', fontSize: '0.6875rem',
            letterSpacing: '0.12em', textTransform: 'uppercase', textDecoration: 'none',
          }}
        >
          View in AR (Quick Look)
        </a>
        <span style={{ fontSize: '0.625rem', color: 'var(--text-dimmed)' }}>AR opens on tap (camera permission required by your device).</span>
      </div>
    );
  }

  if (!glb) {
    // No GLB: cannot render model-viewer 3D/AR canvas. Show clear status.
    return (
      <div className={className} style={{ position: 'relative', width: '100%', height: '100%', minHeight: 280, display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', gap: 12, padding: 20, background: 'var(--bg-secondary)' }}>
        {posterUrl ? <img src={posterUrl} alt={altText} style={{ maxHeight: 180, maxWidth: '100%', objectFit: 'contain', borderRadius: 8, opacity: 0.9 }} /> : null}
        <p style={{ margin: 0, textAlign: 'center', color: 'var(--text-muted)', fontSize: '0.75rem', maxWidth: 420 }}>{availabilityMsg}</p>
      </div>
    );
  }

  if (loadError && !ready) {
    return <div className={className} style={{ padding: '1rem', textAlign: 'center', color: 'var(--text-muted)', fontSize: '0.75rem' }}>{loadError}</div>;
  }
  if (!ready) {
    return <div className={className} style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', minHeight: 180, color: 'var(--text-dimmed)', fontSize: '0.6875rem', letterSpacing: '0.08em', textTransform: 'uppercase' }}>Loading AR viewer…</div>;
  }

  const ModelViewerTag = 'model-viewer' as any;
  // Android uses GLB (src) via Scene Viewer; Apple uses USDZ (ios-src) via Quick Look.
  // ar-modes includes scene-viewer, quick-look, webxr so correct mode is chosen per platform.
  return (
    <div className={className} style={{ position: 'relative', width: '100%', height: '100%', minHeight: 280 }}>
      <ModelViewerTag
        ref={ref}
        src={glb}
        ios-src={usdz || undefined}
        ar
        ar-modes="scene-viewer quick-look webxr"
        camera-controls
        touch-action="pan-y"
        shadow-intensity="1"
        exposure="1"
        environment-image="neutral"
        alt={altText}
        poster={posterUrl || undefined}
        style={{ width: '100%', height: '100%', background: 'var(--bg-secondary)' }}
      >
        {deviceSupports ? (
          <button
            slot="ar-button"
            type="button"
            style={{
              position: 'absolute', left: '50%', bottom: 14, transform: 'translateX(-50%)',
              padding: '0.5rem 1rem', borderRadius: 999, border: '1px solid rgba(201,169,110,0.5)',
              background: 'rgba(11,10,8,0.78)', color: 'var(--gold)', fontSize: '0.6875rem',
              letterSpacing: '0.12em', textTransform: 'uppercase', cursor: 'pointer', backdropFilter: 'blur(8px)',
            }}
          >
            {platform === 'ios' ? 'View in AR (Quick Look)' : platform === 'android' ? 'View in AR (Scene Viewer)' : 'View in AR'}
          </button>
        ) : null}
      </ModelViewerTag>

      {loadError ? (
        <div style={{ position: 'absolute', left: 10, right: 10, bottom: 10, padding: '0.5rem 0.75rem', borderRadius: 8, background: 'rgba(120,40,40,0.85)', color: '#fff', fontSize: '0.6875rem' }}>
          {loadError}
        </div>
      ) : null}
      {arStatus ? (
        <div style={{ position: 'absolute', left: 10, right: 10, top: 10, padding: '0.5rem 0.75rem', borderRadius: 8, background: 'rgba(11,10,8,0.8)', color: 'var(--text-secondary)', fontSize: '0.6875rem', border: '1px solid var(--border-warm)' }}>
          {arStatus}
        </div>
      ) : null}

      <div style={{ position: 'absolute', left: 10, top: 10, right: 10, display: 'flex', gap: 6, flexWrap: 'wrap', pointerEvents: 'none' }}>
        <span style={{ padding: '0.25rem 0.5rem', borderRadius: 6, background: 'rgba(11,10,8,0.72)', color: 'var(--text-dimmed)', fontSize: '0.5625rem', letterSpacing: '0.08em', textTransform: 'uppercase', border: '1px solid var(--border-warm)' }}>
          {availabilityMsg}
        </span>
      </div>

      {!deviceSupports && ready && !loadError ? (
        <div style={{ position: 'absolute', left: '50%', bottom: 14, transform: 'translateX(-50%)', padding: '0.5rem 0.75rem', borderRadius: 8, background: 'rgba(11,10,8,0.78)', color: 'var(--text-muted)', fontSize: '0.6875rem', border: '1px solid var(--border-warm)', textAlign: 'center', maxWidth: '90%' }}>
          AR is not available on this device with the uploaded model format. You can continue using 3D preview.
        </div>
      ) : null}
      {deviceSupports && !canActivateAr && ready && !loadError ? (
        <div style={{ position: 'absolute', right: 10, bottom: 58, padding: '0.25rem 0.5rem', borderRadius: 6, background: 'rgba(11,10,8,0.72)', color: 'var(--text-dimmed)', fontSize: '0.5625rem', letterSpacing: '0.08em', textTransform: 'uppercase', border: '1px solid var(--border-warm)' }}>
          AR capability depends on device/browser support
        </div>
      ) : null}
    </div>
  );
}
