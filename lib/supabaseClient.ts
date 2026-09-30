// lib/supabaseClient.ts
// BROWSER-SAFE Supabase client - the single client used by client components.
//
// The session is persisted by @supabase/ssr in the cookie jar under
// `sb-<project-ref>-auth-token` (chunked, base64url). That is deliberately the
// *same* store the server reads: lib/serverAuth.ts (route handlers, server
// components) and middleware.ts both build a `createServerClient` over these
// cookies. Browser, middleware and API therefore always observe one and the
// same Supabase Auth session - there is no second session, no localStorage copy
// and no hand-rolled token cookie.
//
// This module is imported by client components, so it must not re-export the
// service-role client or reference SUPABASE_SERVICE_ROLE_KEY. Server code that
// needs the service role imports from '@/lib/supabaseAdmin' directly.
import { createBrowserClient } from '@supabase/ssr';
import {
  supabaseUrl,
  supabasePublishableKey,
  SUPABASE_URL_SENTINEL,
  isValidSupabaseUrl,
  isSupabaseConfigured,
} from './supabaseEnv';

export { isSupabaseConfigured };

// Safe construction even when env vars are missing - the sentinel URL is a
// placeholder that is guarded so it doesn't throw at load time.
const browserUrl = isValidSupabaseUrl(supabaseUrl)
  ? supabaseUrl
  : SUPABASE_URL_SENTINEL;

/**
 * Supabase client used by browser & client-side components (public anon key).
 * Cookie-backed so the session is verifiable by the server on every request.
 */
export const supabaseClient = createBrowserClient(
  browserUrl,
  supabasePublishableKey || 'missing-anon-key'
);
