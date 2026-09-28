// lib/supabaseAdmin.ts
// SERVER ONLY. Service-role client used inside API route handlers and server
// helpers to resolve auth users and read/write database rows. Never import this
// module from a client component - the service role key bypasses RLS.
import { createClient } from '@supabase/supabase-js';
import {
  supabaseUrl,
  supabaseServiceRoleKey,
  SUPABASE_URL_SENTINEL,
  isValidSupabaseUrl,
  isSupabaseConfigured,
  hasSupabaseServiceRoleKey,
  getMissingSupabaseConfigMessage,
  getMissingSupabaseEnvVars,
} from './supabaseEnv';

export {
  isSupabaseConfigured,
  hasSupabaseServiceRoleKey,
  getMissingSupabaseConfigMessage,
  getMissingSupabaseEnvVars,
};

/**
 * Asserts that the server has a valid Supabase project URL and service role key.
 * Throws a descriptive error with the exact missing variable names rather than
 * allowing a network request to an invalid sentinel domain to fail with "fetch failed".
 */
export function assertSupabaseAdminConfigured(): void {
  const missing = [];
  if (!isValidSupabaseUrl(supabaseUrl)) {
    missing.push('NEXT_PUBLIC_SUPABASE_URL');
  }
  if (!hasSupabaseServiceRoleKey()) {
    missing.push('SUPABASE_SERVICE_ROLE_KEY');
  }
  if (missing.length > 0) {
    throw new Error(
      `Supabase configuration error: Missing environment variable(s): ${missing.join(', ')}. ` +
      `Please configure these in Vercel (Project Settings -> Environment Variables) and redeploy.`
    );
  }
}

// Prevent module-scope client construction from throwing when the environment
// is not configured. The sentinel URL is only a safe placeholder - callers
// should check assertSupabaseAdminConfigured() before issuing requests so the
// sentinel is never contacted at runtime.
const resolvedUrl = isValidSupabaseUrl(supabaseUrl)
  ? supabaseUrl
  : SUPABASE_URL_SENTINEL;

export const supabaseAdmin = createClient(
  resolvedUrl,
  supabaseServiceRoleKey || 'missing-service-role-key',
  {
    auth: {
      autoRefreshToken: false,
      persistSession: false,
    },
  }
);

