// lib/hotelSchema.ts
// SERVER ONLY. Detects which optional `public.hotels` columns the
// *deployed* database actually has, so every hotel query is built
// against the real schema instead of assuming a migration state.
//
// Migration 010 (hotels.menu_theme) is additive and idempotent, but it
// is applied manually in the Supabase SQL Editor (see DEPLOYMENT.md).
// A deployment that has not run it yet still has a fully working hotels
// table - the app must therefore never hard-select a column that may
// not exist, because Postgres answers such a query with 42703
// (undefined_column) and the whole read fails.
//
// The result is cached per server process: the probe costs one
// roundtrip on the first request after startup and nothing afterwards.
import { supabaseAdmin } from './supabaseAdmin';

// Postgres / PostgREST codes for "that column is not in the schema".
const MISSING_COLUMN_CODES = new Set(['42703', 'PGRST204', 'PGRST205']);

async function columnExists(table: string, column: string): Promise<boolean> {
  try {
    const { error } = await supabaseAdmin
      .from(table)
      .select(column)
      .limit(1);
    if (!error) return true;
    if (error.code && MISSING_COLUMN_CODES.has(error.code)) return false;
    console.error(
      `[hotelSchema] probe for ${table}.${column} failed; treating as absent:`,
      error.message
    );
    return false;
  } catch (err: any) {
    console.error(
      `[hotelSchema] probe for ${table}.${column} threw; treating as absent:`,
      err?.message || err
    );
    return false;
  }
}

export interface HotelSchema {
  /** public.hotels.menu_theme exists (migration 010 applied). */
  menuTheme: boolean;
}

/**
 * Which optional hotels columns this deployment has. Probes on each call
 * so a schema change mid-session is always detected — critical because
 * the module-level cache in earlier versions caused stale results in
 * long-running dev servers.
 */
export async function getHotelSchema(): Promise<HotelSchema> {
  return {
    menuTheme: await columnExists('hotels', 'menu_theme'),
  };
}
