// lib/ordersSchema.ts
// SERVER ONLY. Detects which optional `public.orders` columns the
// *deployed* database actually has, so every order query is built
// against the real schema instead of assuming a migration state.
//
// Migrations 007 (orders.updated_at) and 008 (orders.order_number)
// are additive and idempotent, but they are applied manually in the
// Supabase SQL Editor (see DEPLOYMENT.md). A deployment that has not
// run them yet still has a fully working orders table - the app must
// therefore never hard-select a column that may not exist, because
// Postgres answers such a query with 42703 (undefined_column) and
// the whole order read/write fails.
//
// The result is cached per server process: the probe costs one
// roundtrip on the first order request after startup and nothing
// afterwards. A probe failure degrades to "column absent", which is
// always the safe answer - the fallback queries use only columns that
// have existed since migration 001.
import { supabaseAdmin } from './supabaseAdmin';

export interface OrdersSchema {
  /** public.orders.order_number exists (migration 008 applied). */
  orderNumber: boolean;
  /** public.orders.updated_at exists (migration 007 applied). */
  updatedAt: boolean;
}

// Postgres / PostgREST codes for "that column is not in the schema".
// Same tolerance hotelAccess.ts uses for missing relations.
const MISSING_COLUMN_CODES = new Set(['42703', 'PGRST204', 'PGRST205']);

async function columnExists(column: string): Promise<boolean> {
  try {
    const { error } = await supabaseAdmin
      .from('orders')
      .select(column)
      .limit(1);
    if (!error) return true;
    if (error.code && MISSING_COLUMN_CODES.has(error.code)) return false;
    // Unexpected failure (network, permissions): assume absent so the
    // caller falls back to the migration-001 column set, which always
    // works, rather than failing every order request.
    console.error(
      `[ordersSchema] probe for orders.${column} failed; treating as absent:`,
      error.message
    );
    return false;
  } catch (err: any) {
    console.error(
      `[ordersSchema] probe for orders.${column} threw; treating as absent:`,
      err?.message || err
    );
    return false;
  }
}

let cached: Promise<OrdersSchema> | null = null;

/**
 * Which optional orders columns this deployment has. Cached for the
 * lifetime of the server process.
 */
export function getOrdersSchema(): Promise<OrdersSchema> {
  if (!cached) {
    cached = (async () => ({
      orderNumber: await columnExists('order_number'),
      updatedAt: await columnExists('updated_at'),
    }))();
  }
  return cached;
}
