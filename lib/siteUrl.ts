// lib/siteUrl.ts
// Production-safe site URL resolver for Supabase Auth redirects and email confirmation.

export const DEFAULT_PRODUCTION_URL =
  'https://new-3d-food-jz4ddpgn2-kingcinematics4-7720s-projects.vercel.app';

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

/**
 * Resolves the canonical base site URL for auth redirects, email confirmation, etc.
 *
 * Precedence:
 * 1. Explicit NEXT_PUBLIC_SITE_URL or SITE_URL environment variable
 * 2. Dynamic request origin / x-forwarded-host header (when called in a request context)
 * 3. Vercel deployment URL variables (VERCEL_PROJECT_PRODUCTION_URL, NEXT_PUBLIC_VERCEL_URL, VERCEL_URL)
 * 4. Fallback to Dine3D production deployment URL:
 *    https://new-3d-food-jz4ddpgn2-kingcinematics4-7720s-projects.vercel.app
 */
export function getSiteUrl(request?: Request): string {
  // 1. Explicit configured site URL in environment
  const envUrl = process.env.NEXT_PUBLIC_SITE_URL || process.env.SITE_URL;
  if (envUrl && isValidHttpUrl(envUrl)) {
    return cleanUrl(envUrl);
  }

  // 2. Incoming request context (dynamically resolve current origin)
  if (request) {
    try {
      const forwardedHost = request.headers.get('x-forwarded-host');
      const forwardedProto = request.headers.get('x-forwarded-proto') || 'https';
      if (forwardedHost) {
        return cleanUrl(`${forwardedProto}://${forwardedHost}`);
      }

      const host = request.headers.get('host');
      if (host) {
        const proto = host.includes('localhost') ? 'http' : 'https';
        return cleanUrl(`${proto}://${host}`);
      }

      const parsed = new URL(request.url);
      if (parsed.origin) {
        return cleanUrl(parsed.origin);
      }
    } catch {
      // Fall through to environment detection
    }
  }

  // 3. Vercel environment variables
  if (process.env.VERCEL_PROJECT_PRODUCTION_URL) {
    return cleanUrl(`https://${process.env.VERCEL_PROJECT_PRODUCTION_URL}`);
  }
  if (process.env.NEXT_PUBLIC_VERCEL_URL) {
    return cleanUrl(`https://${process.env.NEXT_PUBLIC_VERCEL_URL}`);
  }
  if (process.env.VERCEL_URL) {
    return cleanUrl(`https://${process.env.VERCEL_URL}`);
  }

  // 4. Default production fallback
  return DEFAULT_PRODUCTION_URL;
}

/**
 * Returns the full callback URL for email confirmation redirects.
 */
export function getAuthCallbackUrl(request?: Request, nextPath: string = '/dashboard'): string {
  const base = getSiteUrl(request);
  const targetNext = nextPath.startsWith('/') ? nextPath : `/${nextPath}`;
  return `${base}/auth/callback?next=${encodeURIComponent(targetNext)}`;
}
