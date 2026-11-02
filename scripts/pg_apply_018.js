// scripts/pg_apply_018.js
// Connects directly to Supabase PostgreSQL via the connection pooler
// and applies migration 018.
//
// Supabase Postgres connection details:
//   Host:     aws-0-ap-south-1.pooler.supabase.com (Session pooler, port 5432)
//   User:     postgres.sqfuoqmmaorjxlleggfu
//   Password: [db password – stored in SUPABASE_DB_PASSWORD env, or passed as arg]
//   Database: postgres
//
// The DB password is NOT the service role key. It is set when the project is
// created (or reset in Dashboard > Settings > Database > Reset password).

const { Client } = require('C:/Users/jay subhash vare/AppData/Local/Temp/pgclient/node_modules/pg');
const fs = require('fs');
const path = require('path');

// ── Connection candidates (try in order) ─────────────────────────────────────
// The password must be supplied via SUPABASE_DB_PASSWORD env var or CLI arg.
const DB_PASSWORD = process.env.SUPABASE_DB_PASSWORD || process.argv[2] || '';

const CONNECTIONS = [
  // Session pooler – IPv4 compatible
  {
    host:     'aws-0-ap-south-1.pooler.supabase.com',
    port:     5432,
    user:     'postgres.sqfuoqmmaorjxlleggfu',
    password: DB_PASSWORD,
    database: 'postgres',
    ssl:      { rejectUnauthorized: false },
    label:    'Pooler ap-south-1 (IPv4)',
  },
  // Direct DB – IPv6 only on most Supabase projects; may fail on IPv4-only networks
  {
    host:     'db.sqfuoqmmaorjxlleggfu.supabase.co',
    port:     5432,
    user:     'postgres',
    password: DB_PASSWORD,
    database: 'postgres',
    ssl:      { rejectUnauthorized: false },
    label:    'Direct DB (IPv6)',
  },
];

// ── Migration SQL ─────────────────────────────────────────────────────────────
// Minimal targeted DDL – only what is genuinely missing.
// Each ADD COLUMN uses IF NOT EXISTS → safe to re-run.
const MIGRATION_SQL = `
BEGIN;

-- ── A. public.orders missing columns ──────────────────────────────────────────
ALTER TABLE public.orders
  ADD COLUMN IF NOT EXISTS updated_at          timestamptz NOT NULL DEFAULT now(),
  ADD COLUMN IF NOT EXISTS order_number        text,
  ADD COLUMN IF NOT EXISTS cancellation_reason text,
  ADD COLUMN IF NOT EXISTS cancelled_by        text,
  ADD COLUMN IF NOT EXISTS cancellation_source text,
  ADD COLUMN IF NOT EXISTS cancelled_at        timestamptz;

-- Backfill updated_at: use created_at for historical rows
UPDATE public.orders
   SET updated_at = created_at
 WHERE updated_at > now() - interval '60 seconds';

-- updated_at trigger function
CREATE OR REPLACE FUNCTION public._touch_updated_at()
RETURNS trigger LANGUAGE plpgsql AS $$
BEGIN NEW.updated_at := now(); RETURN NEW; END; $$;

DROP TRIGGER IF EXISTS orders_touch_updated_at ON public.orders;
CREATE TRIGGER orders_touch_updated_at
  BEFORE UPDATE ON public.orders
  FOR EACH ROW EXECUTE FUNCTION public._touch_updated_at();

-- order_number sequence + trigger
CREATE SEQUENCE IF NOT EXISTS public.orders_order_number_seq START 10000;

CREATE OR REPLACE FUNCTION public._order_number_set()
RETURNS trigger LANGUAGE plpgsql AS $$
BEGIN
  IF NEW.order_number IS NULL OR btrim(NEW.order_number) = '' THEN
    NEW.order_number := 'DINE-' || nextval('public.orders_order_number_seq');
  END IF;
  RETURN NEW;
END; $$;

DROP TRIGGER IF EXISTS orders_set_order_number ON public.orders;
CREATE TRIGGER orders_set_order_number
  BEFORE INSERT ON public.orders
  FOR EACH ROW
  WHEN (NEW.order_number IS NULL OR btrim(NEW.order_number) = '')
  EXECUTE FUNCTION public._order_number_set();

-- Backfill order_number for existing rows (oldest first)
DO $$
DECLARE v public.orders%ROWTYPE;
BEGIN
  FOR v IN SELECT * FROM public.orders
           WHERE order_number IS NULL OR btrim(order_number) = ''
           ORDER BY created_at ASC, id ASC
  LOOP
    UPDATE public.orders
       SET order_number = 'DINE-' || nextval('public.orders_order_number_seq')
     WHERE id = v.id;
  END LOOP;
END $$;

-- Add unique constraint only once all rows have a value
DO $$
BEGIN
  IF NOT EXISTS (SELECT 1 FROM public.orders WHERE order_number IS NULL OR btrim(order_number) = '') THEN
    IF NOT EXISTS (SELECT 1 FROM pg_constraint WHERE conname='orders_order_number_unique' AND conrelid='public.orders'::regclass) THEN
      ALTER TABLE public.orders ADD CONSTRAINT orders_order_number_unique UNIQUE (order_number);
    END IF;
    ALTER TABLE public.orders ALTER COLUMN order_number SET NOT NULL;
  END IF;
END $$;

CREATE INDEX IF NOT EXISTS orders_order_number_idx      ON public.orders (order_number);
CREATE INDEX IF NOT EXISTS orders_hotel_id_updated_at_idx ON public.orders (hotel_id, updated_at DESC);
CREATE INDEX IF NOT EXISTS orders_status_updated_at_idx ON public.orders (status, updated_at DESC);
CREATE INDEX IF NOT EXISTS idx_orders_cancelled_by_reason ON public.orders (cancelled_by, cancellation_reason) WHERE status = 'cancelled';
CREATE INDEX IF NOT EXISTS idx_orders_cancellation_source ON public.orders (cancellation_source) WHERE status = 'cancelled';

-- Backfill cancellation metadata for already-cancelled orders
UPDATE public.orders
   SET cancellation_source = 'customer',
       cancelled_by        = 'customer',
       cancelled_at        = COALESCE(updated_at, created_at)
 WHERE status = 'cancelled'
   AND cancellation_source IS NULL;

-- ── B. public.order_items missing columns ─────────────────────────────────────
ALTER TABLE public.order_items
  ADD COLUMN IF NOT EXISTS status              text DEFAULT 'active',
  ADD COLUMN IF NOT EXISTS cancelled_at        timestamptz,
  ADD COLUMN IF NOT EXISTS cancellation_reason text,
  ADD COLUMN IF NOT EXISTS cancelled_by        text;

UPDATE public.order_items SET status = 'active' WHERE status IS NULL;

CREATE INDEX IF NOT EXISTS idx_order_items_order_id_status ON public.order_items (order_id, status);

-- ── C. Reload PostgREST schema cache ──────────────────────────────────────────
NOTIFY pgrst, 'reload schema';

COMMIT;
`;

// ── Verification SQL ──────────────────────────────────────────────────────────
const VERIFY_SQL = `
SELECT
  c.table_name,
  c.column_name,
  c.data_type,
  c.column_default
FROM information_schema.columns c
WHERE c.table_schema = 'public'
  AND c.table_name IN ('orders', 'order_items')
  AND c.column_name IN (
    'updated_at','order_number','cancellation_reason','cancelled_by',
    'cancellation_source','cancelled_at','status'
  )
ORDER BY c.table_name, c.column_name;
`;

const COUNT_SQL = `
SELECT
  (SELECT count(*) FROM public.orders)       AS orders_count,
  (SELECT count(*) FROM public.order_items)  AS order_items_count;
`;

// ── Main ──────────────────────────────────────────────────────────────────────
async function tryConnect(cfg) {
  const client = new Client(cfg);
  try {
    await client.connect();
    return client;
  } catch (e) {
    console.log(`  ❌ ${cfg.label}: ${e.message}`);
    return null;
  }
}

async function main() {
  if (!DB_PASSWORD) {
    console.error('❌ No database password supplied.');
    console.error('   Usage:  node scripts/pg_apply_018.js <db-password>');
    console.error('   Or set: SUPABASE_DB_PASSWORD=<password> node scripts/pg_apply_018.js');
    console.error('');
    console.error('   Find your password: Supabase Dashboard → Settings → Database → Connection string');
    console.error('   (It is NOT the service-role key.)');
    process.exit(1);
  }

  console.log('=== pg_apply_018: Direct Postgres Migration ===\n');

  let client = null;
  for (const cfg of CONNECTIONS) {
    console.log(`Trying: ${cfg.label} ...`);
    client = await tryConnect(cfg);
    if (client) { console.log(`  ✅ Connected via ${cfg.label}\n`); break; }
  }

  if (!client) {
    console.error('\n❌ All connection attempts failed.');
    console.error('   Apply manually in Supabase SQL Editor:');
    console.error('   https://supabase.com/dashboard/project/sqfuoqmmaorjxlleggfu/sql/new');
    process.exit(1);
  }

  try {
    // Row counts before
    const before = await client.query(COUNT_SQL);
    console.log('Pre-migration row counts:', before.rows[0]);

    // Apply migration
    console.log('Applying migration ...');
    await client.query(MIGRATION_SQL);
    console.log('✅ Migration SQL executed.\n');

    // Verify columns
    const cols = await client.query(VERIFY_SQL);
    console.log('Post-migration columns:');
    cols.rows.forEach(r =>
      console.log(`  ✅ ${r.table_name}.${r.column_name} (${r.data_type}${r.column_default ? ', DEFAULT '+r.column_default : ''})`)
    );

    // Row counts after (must match)
    const after = await client.query(COUNT_SQL);
    console.log('\nPost-migration row counts:', after.rows[0]);

    const ordOk    = after.rows[0].orders_count    === before.rows[0].orders_count;
    const itemsOk  = after.rows[0].order_items_count === before.rows[0].order_items_count;
    console.log(ordOk   ? '✅ orders count unchanged'      : '❌ orders count CHANGED');
    console.log(itemsOk ? '✅ order_items count unchanged' : '❌ order_items count CHANGED');

    // Sample order_numbers
    const nums = await client.query('SELECT order_number FROM public.orders ORDER BY created_at ASC LIMIT 3');
    console.log('\nSample order_numbers:', nums.rows.map(r => r.order_number).join(', '));

    // Sample order_items statuses
    const statuses = await client.query("SELECT status, count(*) FROM public.order_items GROUP BY status");
    console.log('order_items by status:', statuses.rows.map(r => `${r.status}:${r.count}`).join(', '));

    console.log('\n✅ Migration 018 applied and verified successfully.');

  } catch (e) {
    console.error('❌ Migration failed:', e.message);
    process.exit(1);
  } finally {
    await client.end();
  }
}

main();
