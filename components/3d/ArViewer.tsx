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
 * 
 * Uses model-viewer's default AR button which provides proper surface detection,
 * placement UI, and interaction controls (move, rotate, scale) in native AR.
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
  const [showPlacementHint, setShowPlacementHint] = useState(false);

  const glb = modelUrlGlb?.trim() || '';
  const usdz = modelUrlUsdz?.trim() || '';

  useEffect(() => {
    setPlatform(detectArPlatform());
  }, []);

  useEffect(() => {
    let cancelled = false;
    (async () => {
      try {
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
    setShowPlacementHint(false);
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
      if (status === 'failed') {
        setArStatus('AR could not be started on this device. You can continue using 3D preview.');
        setShowPlacementHint(false);
      } else if (status === 'session-started') {
        setArStatus(null);
        setShowPlacementHint(true);
        setTimeout(() => setShowPlacementHint(false), 8000);
      } else if (status === 'not-presenting') {
        setArStatus(null);
        setShowPlacementHint(false);
      }
    };
    el.addEventListener('load', onLoad);
    el.addEventListener('error', onError);
    el.addEventListener('ar-status', onArStatus);
    try { setCanActivateAr(Boolean(el.canActivateAr)); } catch {}
    return () => {
      el.removeEventListener('load', onLoad);
      el.removeEventListener('error', onError);
      el.removeEventListener('ar-status', onArStatus);
    };
  }, [ready, glb, usdz]);

  const deviceSupports = isArSupportedForDevice(platform, glb, usdz);
  const availabilityMsg = arAvailabilityLabel(platform, glb, usdz);

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
            display: 'inline-flex',
            alignItems: 'center',
            justifyContent: 'center',
            gap: 8,
            padding: '0.625rem 1.25rem',
            borderRadius: 999,
            border: '1px solid var(--gold, #B8A47A)',
            background: 'var(--gold, #B8A47A)',
            color: '#0B0B0A',
            fontSize: '0.75rem',
            fontWeight: 700,
            letterSpacing: '0.06em',
            textTransform: 'uppercase',
            textDecoration: 'none',
            boxShadow: '0 4px 16px rgba(0,0,0,0.3)',
          }}
        >
          View in AR (Quick Look)
        </a>
        <span style={{ fontSize: '0.625rem', color: 'var(--text-dimmed)' }}>AR opens on tap (camera permission required by your device).</span>
      </div>
    );
  }

  if (!glb) {
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
  return (
    <div
      className={className}
      style={{ position: 'relative', width: '100%', height: '100%', minHeight: 280, touchAction: 'none' }}
      onTouchStart={(e) => e.stopPropagation()}
      onTouchMove={(e) => e.stopPropagation()}
      onTouchEnd={(e) => e.stopPropagation()}
    >
      <ModelViewerTag
        ref={ref}
        src={glb}
        ios-src={usdz || undefined}
        ar
        ar-modes="scene-viewer quick-look webxr"
        ar-placement="floor"
        ar-scale="auto"
        xr-environment
        camera-controls
        touch-action="none"
        shadow-intensity="1.5"
        exposure="1"
        environment-image="neutral"
        alt={altText}
        poster={posterUrl || undefined}
        style={{ width: '100%', height: '100%', background: 'var(--bg-secondary)', touchAction: 'none' }}
      >
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

        {showPlacementHint && deviceSupports && (
          <div style={{ position: 'absolute', left: '50%', bottom: 60, transform: 'translateX(-50%)', padding: '0.5rem 0.75rem', borderRadius: 8, background: 'rgba(11,10,8,0.85)', color: 'var(--text-secondary)', fontSize: '0.6875rem', border: '1px solid var(--border-warm)', textAlign: 'center', maxWidth: '90%', animation: 'fadeIn 0.3s ease-out' }}>
            Move your phone slowly to detect surfaces, then tap to place the model.
          </div>
        )}

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
      </ModelViewerTag>

      <style jsx>{`
        @keyframes fadeIn {
          from { opacity: 0; transform: translateX(-50%) translateY(10px); }
          to { opacity: 1; transform: translateX(-50%) translateY(0); }
        }
      `}</style>
    </div>
  );
}