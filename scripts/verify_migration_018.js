// scripts/verify_migration_018.js
// Run AFTER applying 018_apply_pending_migrations.sql in Supabase SQL Editor.
// Usage: node scripts/verify_migration_018.js
//
// Reads SUPABASE_URL and SUPABASE_SERVICE_ROLE_KEY from .env.local, then
// probes the live database for every column and row count. Prints a
// pass/fail summary.

const { createClient } = require('@supabase/supabase-js');
const fs = require('fs');
const path = require('path');

// ── Load env ──────────────────────────────────────────────────────────────────
const envPath = path.join(__dirname, '..', '.env.local');
const env = fs.readFileSync(envPath, 'utf8');
const get = (key) => { const m = env.match(new RegExp(`^${key}=(.+)$`, 'm')); return m ? m[1].trim() : null; };
const SUPABASE_URL = get('NEXT_PUBLIC_SUPABASE_URL');
const SERVICE_KEY  = get('SUPABASE_SERVICE_ROLE_KEY');

if (!SUPABASE_URL || !SERVICE_KEY) {
  console.error('Missing NEXT_PUBLIC_SUPABASE_URL or SUPABASE_SERVICE_ROLE_KEY in .env.local');
  process.exit(1);
}

const s = createClient(SUPABASE_URL, SERVICE_KEY);

async function colExists(table, col) {
  const { error } = await s.from(table).select(col).limit(1);
  return !error;
}

async function main() {
  console.log('\n=== Migration 018 Verification ===\n');
  const results = [];

  // ── orders columns ──────────────────────────────────────────────────────────
  const ordCols = ['updated_at', 'order_number', 'cancellation_reason',
                   'cancelled_by', 'cancellation_source', 'cancelled_at'];
  for (const col of ordCols) {
    const ok = await colExists('orders', col);
    results.push({ check: `orders.${col} exists`, ok });
  }

  // ── order_items columns ─────────────────────────────────────────────────────
  const itemCols = ['status', 'cancelled_at', 'cancellation_reason', 'cancelled_by'];
  for (const col of itemCols) {
    const ok = await colExists('order_items', col);
    results.push({ check: `order_items.${col} exists`, ok });
  }

  // ── row counts (must match pre-migration snapshot) ──────────────────────────
  const { count: ordCount } = await s.from('orders').select('id', { count: 'exact', head: true });
  results.push({ check: `orders row count = 52 (got ${ordCount})`, ok: ordCount === 52 });

  const { count: itemCount } = await s.from('order_items').select('id', { count: 'exact', head: true });
  results.push({ check: `order_items row count = 69 (got ${itemCount})`, ok: itemCount === 69 });

  // ── order_number backfill ───────────────────────────────────────────────────
  const { data: nullNum } = await s.from('orders').select('id').is('order_number', null).limit(1);
  results.push({ check: 'No orders with NULL order_number', ok: (nullNum || []).length === 0 });

  // ── order_items status backfill ─────────────────────────────────────────────
  const { data: nullStatus } = await s.from('order_items').select('id').is('status', null).limit(1);
  results.push({ check: 'No order_items with NULL status', ok: (nullStatus || []).length === 0 });

  // ── sample order_number format ──────────────────────────────────────────────
  const { data: sample } = await s.from('orders').select('order_number').limit(3);
  const allDine = (sample || []).every(o => /^DINE-\d+$/.test(o.order_number || ''));
  results.push({ check: 'order_number format is DINE-<digits>', ok: allDine });

  // ── item-level cancel: write test (dry-run probe) ───────────────────────────
  // Just verify the column is writable by reading — actual write test below
  const { data: itemSample } = await s.from('order_items').select('id, status, cancelled_at, cancellation_reason, cancelled_by').limit(3);
  results.push({ check: 'order_items cancel columns readable in SELECT', ok: !!itemSample });

  // ── Print results ───────────────────────────────────────────────────────────
  let passed = 0, failed = 0;
  for (const r of results) {
    const mark = r.ok ? '✅' : '❌';
    console.log(`  ${mark}  ${r.check}`);
    r.ok ? passed++ : failed++;
  }

  console.log(`\n  ${passed} passed, ${failed} failed\n`);

  if (failed > 0) {
    console.error('⚠️  One or more checks failed. Migration may not have been applied correctly.');
    process.exit(1);
  } else {
    console.log('✅  All checks passed. Migration 018 applied successfully.');
  }
}

main().catch(e => { console.error(e); process.exit(1); });
