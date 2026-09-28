// lib/supabaseBrowser.ts
// Browser-safe Supabase client. Uses the publishable/anon key only and keeps the
// auth session in cookies so the server (middleware, route handlers) can verify
// the real Supabase Auth session on every request.
import { createBrowserClient } from '@supabase/ssr';
import { supabaseUrl, supabasePublishableKey } from './supabaseEnv';

export const supabaseClient = createBrowserClient(supabaseUrl, supabasePublishableKey);
