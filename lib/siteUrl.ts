// lib/siteUrl.ts
// Production-safe site URL resolver for Supabase Auth redirects and email confirmation.
//
// The confirmation link that Supabase emails is built from `emailRedirectTo`.
// If that value is missing or is not present in Supabase's redirect allow-list,
// Supabase silently falls back to the project's Site URL - which is how
// confirmation links end up pointing at http://localhost:3000 in production.
//
// Therefore the value produced here must be deterministic: it is resolved from
// configuration, never from an untrusted request host, while still supporting
// http://localhost:3000 during local development.

export const DEFAULT_PRODUCTION_URL =
  'https://new-3d-food-jz4ddpgn2-kingcinematics4-7720s-projects.vercel.app';

/** Canonical production origin used for every emailed confirmation link. */
export const PRODUCTION_SITE_URL = DEFAULT_PRODUCTION_URL;

function cleanUrl(url: string): string {
  let cleaned = url.trim();
  if (
    (cleaned.startsWith('"') && cleaned.endsWith('"')) ||
    (cleaned.startsWith("'") && cleaned.endsWith("'"))
  ) {
    cleaned = cleaned.slice(1, -1).trim();
  }
  return cleaned.replace(/\/+$/, '');
}

function isValidHttpUrl(urlStr: string): boolean {
  try {
    const parsed = new URL(urlStr);
    return parsed.protocol === 'http:' || parsed.protocol === 'https:';
  } catch {
    return false;
  }
}

function isLocalHostname(urlStr: string): boolean {
  try {
    const { hostname, protocol } = new URL(urlStr);
    return (
      protocol === 'http:' &&
      (hostname === 'localhost' ||
        hostname === '127.0.0.1' ||
        hostname === '0.0.0.0' ||
        hostname.endsWith('.localhost'))
    );
  } catch {
    return false;
  }
}

/**
 * True only for an un-instrumented local `next dev` run.
 * On Vercel (any environment) this is always false, so production can never
 * resolve to localhost.
 */
export function isLocalDevelopment(request?: Request): boolean {
  if (process.env.VERCEL) return false;

  const envFlag = process.env.NEXT_PUBLIC_SITE_URL_IS_LOCAL;
  if (envFlag === 'true') return true;
  if (envFlag === 'false') return false;

  if (process.env.NODE_ENV === 'development') return true;

  if (request) {
    try {
      return isLocalHostname(getRequestOrigin(request));
    } catch {
      return false;
    }
  }

  return false;
}

function getRequestOrigin(request: Request): string {
  const forwardedHost = request.headers.get('x-forwarded-host');
  const forwardedProto = request.headers.get('x-forwarded-proto') || 'https';
  if (forwardedHost) {
    return `${forwardedProto}://${forwardedHost}`;
  }

  const host = request.headers.get('host');
  if (host) {
    const proto = host.includes('localhost') ? 'http' : 'https';
    return `${proto}://${host}`;
  }

  return new URL(request.url).origin;
}

/**
 * Resolves the canonical public site URL for auth redirects and email confirmation.
 *
 * Precedence:
 *  1. Explicit configuration: NEXT_PUBLIC_SITE_URL, NEXT_PUBLIC_APP_URL,
 *     SITE_URL or APP_URL
 *  2. Vercel deployment URL variables
 *     (VERCEL_PROJECT_PRODUCTION_URL, VERCEL_URL, NEXT_PUBLIC_VERCEL_URL)
 *  3. The incoming request origin - local development only
 *  4. Fallback to the Dine3D production deployment URL
 *
 * In production the request origin is deliberately ignored: a proxy, preview
 * domain or malformed host header can never leak into an emailed link.
 */
export function getPublicSiteUrl(request?: Request): string {
  const allowLocal = isLocalDevelopment(request);

  // 1. Explicit configuration
  const configured = [
    process.env.NEXT_PUBLIC_SITE_URL,
    process.env.NEXT_PUBLIC_APP_URL,
    process.env.SITE_URL,
    process.env.APP_URL,
  ];
  for (const candidate of configured) {
    if (candidate && isValidHttpUrl(candidate)) {
      const cleaned = cleanUrl(candidate);
      // Never honour a localhost override outside local development.
      if (allowLocal || !isLocalHostname(cleaned)) {
        return cleaned;
      }
    }
  }

  // 2. Vercel deployment URLs
  if (process.env.VERCEL_PROJECT_PRODUCTION_URL) {
    return cleanUrl(`https://${process.env.VERCEL_PROJECT_PRODUCTION_URL}`);
  }
  if (process.env.VERCEL_URL) {
    return cleanUrl(`https://${process.env.VERCEL_URL}`);
  }
  if (process.env.NEXT_PUBLIC_VERCEL_URL) {
    return cleanUrl(`https://${process.env.NEXT_PUBLIC_VERCEL_URL}`);
  }

  // 3. Request origin - local development only
  if (allowLocal && request) {
    try {
      return cleanUrl(getRequestOrigin(request));
    } catch {
      // fall through to the production default
    }
  }

  // 4. Production fallback (never localhost)
  return DEFAULT_PRODUCTION_URL;
}

/**
 * Backwards-compatible alias for {@link getPublicSiteUrl}.
 */
export function getSiteUrl(request?: Request): string {
  return getPublicSiteUrl(request);
}

/**
 * The redirect URL embedded in Supabase confirmation emails.
 *
 * This must be an EXACT match for an entry in Supabase's redirect allow-list,
 * so it carries no query string. The auth callback resolves the post-login
 * destination itself and defaults to /dashboard.
 *
 * Production value:
 *   https://new-3d-food-jz4ddpgn2-kingcinematics4-7720s-projects.vercel.app/auth/callback
 */
export function getAuthCallbackUrl(_request?: Request): string {
  return `${getPublicSiteUrl(_request)}/auth/callback`;
}
