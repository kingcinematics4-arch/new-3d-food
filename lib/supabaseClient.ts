// lib/supabaseClient.ts
// BROWSER-SAFE Supabase client.
//
// This module is imported by client components, so it must not re-export the
// service-role client or reference SUPABASE_SERVICE_ROLE_KEY. Server code that
// needs the service role imports from '@/lib/supabaseAdmin' directly.
import { createClient } from '@supabase/supabase-js';
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
 */
export const supabaseClient = createClient(
  browserUrl,
  supabasePublishableKey || 'missing-anon-key'
);
