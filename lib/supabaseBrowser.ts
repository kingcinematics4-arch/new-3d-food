// lib/supabaseBrowser.ts
// Historical alias. The browser client now lives in ./supabaseClient so there
// is exactly one cookie-backed Supabase instance in the app. Re-exported rather
// than deleted so existing imports keep resolving to the same singleton.
export { supabaseClient, isSupabaseConfigured } from './supabaseClient';
