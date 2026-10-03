'use client';

// components/branding/BrandLogoProvider.tsx
//
// Holds the current Dine3D logo for every logo surface in the app.
//
// WHY A PROVIDER
// --------------
// The logo appears on the marketing header and footer, the login and signup
// screens, the admin panel, the restaurant dashboard and the guest menu. Each of
// those is a different page, and several of them render before any admin state
// exists. Rather than have every page call the database, one provider at the
// root of the tree owns the reference and every consumer reads it from context.
//
// HYDRATION SAFETY
// ----------------
// The server passes `initialLogo` so the very first painted HTML already
// contains the correct logo — there is no flash of the fallback on a cold load.
// The revalidation below runs in an effect only, after hydration, so the client
// render starts from exactly the same value the server produced and React never
// reports a mismatch.
//
// WHY THE REVALIDATION FETCH EXISTS
// --------------------------------
// It covers two cases the server value cannot: a static page that was rendered
// at build time, and an owner replacing the logo in a second browser tab while
// this one stays open. The endpoint answers with an ETag, so the repeat request
// is almost free.

import React, { createContext, useCallback, useContext, useEffect, useMemo, useState } from 'react';
import { FALLBACK_LOGO_REFERENCE, type LogoReference } from '@/lib/branding';

type LogoStatus = 'idle' | 'loading' | 'ready' | 'error';

interface BrandLogoContextValue {
  logo: LogoReference;
  status: LogoStatus;
  /**
   * Applies a known-good reference without a round trip. The admin uploader
   * calls this the moment an upload succeeds so the whole app, including the
   * header, switches to the new logo immediately.
   */
  applyLogo: (logo: LogoReference) => void;
  /** Fetches the current reference again. */
  refresh: () => Promise<void>;
}

const BrandLogoContext = createContext<BrandLogoContextValue | null>(null);

export function BrandLogoProvider({
  children,
  initialLogo,
}: {
  children: React.ReactNode;
  initialLogo: LogoReference;
}) {
  const [logo, setLogo] = useState<LogoReference>(initialLogo);
  const [status, setStatus] = useState<LogoStatus>('idle');

  const refresh = useCallback(async () => {
    setStatus('loading');
    try {
      const response = await fetch('/api/branding');
      if (!response.ok) throw new Error(`Request failed with ${response.status}`);

      const payload = await response.json();
      if (!payload?.success || typeof payload.logoUrl !== 'string') {
        throw new Error('Malformed branding response.');
      }

      setLogo({
        logoUrl: payload.logoUrl,
        logoVersion: payload.logoVersion ?? null,
        logoAlt: payload.logoAlt || 'Dine3D',
        logoWidth: Number(payload.logoWidth) || FALLBACK_LOGO_REFERENCE.logoWidth,
        logoHeight: Number(payload.logoHeight) || FALLBACK_LOGO_REFERENCE.logoHeight,
        hasCustomLogo: Boolean(payload.hasCustomLogo),
      });
      setStatus('ready');
    } catch {
      // The bundled logo always exists, so a failed revalidation is not worth
      // surfacing: keep whatever is on screen rather than blanking every logo.
      setStatus('error');
    }
  }, []);

  useEffect(() => {
    void refresh();
  }, [refresh]);

  const applyLogo = useCallback((next: LogoReference) => {
    setLogo(next);
    setStatus('ready');
  }, []);

  const value = useMemo<BrandLogoContextValue>(
    () => ({ logo, status, applyLogo, refresh }),
    [logo, status, applyLogo, refresh]
  );

  return <BrandLogoContext.Provider value={value}>{children}</BrandLogoContext.Provider>;
}

/**
 * Reads the current logo.
 *
 * Falls back to the bundled asset when used outside a provider, so a component
 * rendered in isolation (a story, a test, a future route that forgets the
 * wrapper) still shows a logo instead of throwing.
 */
export function useBrandLogo(): BrandLogoContextValue {
  const context = useContext(BrandLogoContext);

  if (!context) {
    return {
      logo: FALLBACK_LOGO_REFERENCE,
      status: 'idle',
      applyLogo: () => {},
      refresh: async () => {},
    };
  }

  return context;
}