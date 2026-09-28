// lib/supabaseClient.ts
import { createClient } from '@supabase/supabase-js';
import {
  supabaseUrl,
  supabasePublishableKey,
  SUPABASE_URL_SENTINEL,
  isValidSupabaseUrl,
  isSupabaseConfigured,
} from './supabaseEnv';
import { supabaseAdmin, assertSupabaseAdminConfigured } from './supabaseAdmin';

export { supabaseAdmin, assertSupabaseAdminConfigured, isSupabaseConfigured };

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

