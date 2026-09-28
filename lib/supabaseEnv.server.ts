// lib/supabaseEnv.server.ts
// SERVER ONLY. Holds every reference to SUPABASE_SERVICE_ROLE_KEY.
//
// This module is deliberately separate from ./supabaseEnv so that client
// components can import the public configuration without pulling the
// service-role key into the browser bundle.
import { cleanEnvValue, isRealValue, isValidSupabaseUrl, supabaseUrl, supabasePublishableKey } from './supabaseEnv';

export const supabaseServiceRoleKey =
  cleanEnvValue(process.env.SUPABASE_SERVICE_ROLE_KEY) ||
  cleanEnvValue(process.env.SUPABASE_SERVICE_KEY) ||
  cleanEnvValue(process.env.SUPABASE_SECRET_KEY);

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
 * missing. Only variable NAMES are exposed - never their values.
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
