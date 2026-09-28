// lib/supabaseEnv.ts
// Shared Supabase project configuration.
//
// Canonical environment variable names used by Dine3D:
//   NEXT_PUBLIC_SUPABASE_URL
//   NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY   (alias: NEXT_PUBLIC_SUPABASE_ANON_KEY)
//   SUPABASE_SERVICE_ROLE_KEY              (server-only secret)

function cleanEnvValue(value: string | undefined): string {
  if (!value) return '';
  let cleaned = value.trim();
  // Strip outer quotes if pasted into hosting dashboard with quotes
  if (
    (cleaned.startsWith('"') && cleaned.endsWith('"')) ||
    (cleaned.startsWith("'") && cleaned.endsWith("'"))
  ) {
    cleaned = cleaned.slice(1, -1).trim();
  }
  return cleaned;
}

/**
 * Rejects empty values and the placeholder strings from .env.example
 * (YOUR_SUPABASE_URL / YOUR_SUPABASE_PUBLISHABLE_KEY / ...) so they are never
 * mistaken for a working configuration.
 */
function isRealValue(value: string): boolean {
  if (!value) return false;
  const upper = value.toUpperCase();
  return (
    !upper.startsWith('YOUR_') &&
    !upper.startsWith('PLACEHOLDER') &&
    !upper.includes('SUPABASE_URL') &&
    !upper.includes('SUPABASE-CONFIG-MISSING')
  );
}

// Access environment variables as direct static properties so that Next.js / Webpack
// client-side bundling inlines NEXT_PUBLIC_* variables into the browser bundle.
const rawUrl =
  cleanEnvValue(process.env.NEXT_PUBLIC_SUPABASE_URL) ||
  cleanEnvValue(process.env.SUPABASE_URL);

// Strip trailing slash if present
export const supabaseUrl = rawUrl.replace(/\/+$/, '');

export const supabasePublishableKey =
  cleanEnvValue(process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY) ||
  cleanEnvValue(process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY) ||
  cleanEnvValue(process.env.SUPABASE_ANON_KEY) ||
  cleanEnvValue(process.env.SUPABASE_PUBLISHABLE_KEY);

export const supabaseServiceRoleKey =
  cleanEnvValue(process.env.SUPABASE_SERVICE_ROLE_KEY) ||
  cleanEnvValue(process.env.SUPABASE_SERVICE_KEY) ||
  cleanEnvValue(process.env.SUPABASE_SECRET_KEY);

/**
 * Sentinel placeholder used ONLY to construct clients when env vars are missing
 * so createClient does not throw at module evaluation time.
 * Must never be contacted at runtime.
 */
export const SUPABASE_URL_SENTINEL = 'https://supabase-config-missing.invalid';

// Known placeholder hostnames that must never be treated as a real project URL.
const FORBIDDEN_HOSTS = [
  'placeholder-url.supabase.co',
  'your-project.supabase.co',
  'your-project-id.supabase.co',
  'supabase.co',
  'supabase-config-missing.invalid',
];

export function isValidSupabaseUrl(value: string): boolean {
  if (!value || !isRealValue(value)) return false;
  try {
    const parsed = new URL(value);
    const host = parsed.hostname;
    if (parsed.protocol !== 'https:' && parsed.protocol !== 'http:') return false;
    if (!host || host === 'localhost' || host.endsWith('.localhost')) return false;
    if (FORBIDDEN_HOSTS.includes(host)) return false;
    return host.includes('.');
  } catch {
    return false;
  }
}

/** True only when a real Supabase project URL + anon/publishable key exist. */
export function isSupabaseConfigured(): boolean {
  return isValidSupabaseUrl(supabaseUrl) && isRealValue(supabasePublishableKey);
}

/** True only when the (server-only) service-role key is present. */
export function hasSupabaseServiceRoleKey(): boolean {
  return isRealValue(supabaseServiceRoleKey);
}

/**
 * Returns a list of required variable names that are missing.
 */
export function getMissingSupabaseEnvVars(): string[] {
  const missing: string[] = [];
  if (!isValidSupabaseUrl(supabaseUrl)) {
    missing.push('NEXT_PUBLIC_SUPABASE_URL');
  }
  if (!isRealValue(supabasePublishableKey)) {
    missing.push('NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY');
  }
  if (!isRealValue(supabaseServiceRoleKey)) {
    missing.push('SUPABASE_SERVICE_ROLE_KEY');
  }
  return missing;
}

/**
 * Human readable description of exactly which environment variables are
 * missing. Only variable NAMES are exposed – never their values.
 */
export function getMissingSupabaseConfigMessage(): string {
  const missing = getMissingSupabaseEnvVars();
  if (missing.length === 0) return '';
  return (
    'Supabase is not configured on the server. The following environment variables must be ' +
    'added to the hosting provider (e.g. Vercel -> Project Settings -> Environment Variables) ' +
    `and the project must be redeployed: ${missing.join(', ')}.`
  );
}

export { getSiteUrl, getAuthCallbackUrl } from './siteUrl';

