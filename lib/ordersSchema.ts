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
  /** public.orders.linked_order_id exists (migration 030 applied). */
  linkedOrderId: boolean;
}

/**
 * Which optional order_items columns this deployment has.
 * Migration 017 adds status / cancelled_at / cancellation_reason /
 * cancelled_by. Migration 027 adds item_name (for water / non-menu items).
 * Routes must select them only when present, else Postgres answers with 42703.
 */
export interface OrderItemsSchema {
  /** public.order_items.status exists (migration 017 applied). */
  status: boolean;
  /** public.order_items.cancelled_at exists (migration 017 applied). */
  cancelledAt: boolean;
  /** public.order_items.cancellation_reason exists (migration 017 applied). */
  cancellationReason: boolean;
  /** public.order_items.cancelled_by exists (migration 017 applied). */
  cancelledBy: boolean;
  /** public.order_items.item_name exists (migration 027 applied). */
  itemName: boolean;
  /** public.order_items.item_kind exists (migration 028 applied). e.g. 'water' */
  itemKind: boolean;
  /** public.order_items.size_id exists (migration 033 applied). */
  sizeId: boolean;
  /** public.order_items.size_name exists (migration 033 applied). */
  sizeName: boolean;
  /** public.order_items.size_price exists (migration 033 applied). */
  sizePrice: boolean;
}

// Postgres / PostgREST codes for "that column is not in the schema".
// Same tolerance hotelAccess.ts uses for missing relations.
const MISSING_COLUMN_CODES = new Set(['42703', 'PGRST204', 'PGRST205']);

async function orderColumnExists(column: string): Promise<boolean> {
  try {
    const { error } = await supabaseAdmin
      .from('orders')
      .select(column)
      .limit(1);
    if (!error) return true;
    if (error.code && MISSING_COLUMN_CODES.has(error.code)) return false;
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

async function orderItemColumnExists(column: string): Promise<boolean> {
  try {
    const { error } = await supabaseAdmin
      .from('order_items')
      .select(column)
      .limit(1);
    if (!error) return true;
    if (error.code && MISSING_COLUMN_CODES.has(error.code)) return false;
    console.error(
      `[ordersSchema] probe for order_items.${column} failed; treating as absent:`,
      error.message
    );
    return false;
  } catch (err: any) {
    console.error(
      `[ordersSchema] probe for order_items.${column} threw; treating as absent:`,
      err?.message || err
    );
    return false;
  }
}

/**
 * Which optional orders columns this deployment has. Probes on each call
 * so a schema change mid-session is always detected — critical because
 * the module-level cache in earlier versions caused stale results in
 * long-running dev servers.
 */
export async function getOrdersSchema(): Promise<OrdersSchema> {
  return {
    orderNumber: await orderColumnExists('order_number'),
    updatedAt: await orderColumnExists('updated_at'),
    linkedOrderId: await orderColumnExists('linked_order_id'),
  };
}

/**
 * Which optional order_items columns this deployment has.
 * Probes on each call so a mid-session migration is always detected.
 */
export async function getOrderItemsSchema(): Promise<OrderItemsSchema> {
  return {
    status: await orderItemColumnExists('status'),
    cancelledAt: await orderItemColumnExists('cancelled_at'),
    cancellationReason: await orderItemColumnExists('cancellation_reason'),
    cancelledBy: await orderItemColumnExists('cancelled_by'),
    itemName: await orderItemColumnExists('item_name'),
    itemKind: await orderItemColumnExists('item_kind'),
    sizeId: await orderItemColumnExists('size_id'),
    sizeName: await orderItemColumnExists('size_name'),
    sizePrice: await orderItemColumnExists('size_price'),
  };
}
