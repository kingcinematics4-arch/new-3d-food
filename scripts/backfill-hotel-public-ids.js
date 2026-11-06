/* eslint-disable no-console */
/**
 * Idempotent backfill: assigns a unique permanent hotel_public_id (AA12bb123)
 * to every existing hotel missing/invalid ID. Safe to run multiple times.
 * Preserves existing valid IDs and all hotel data/relationships.
 *
 * Requires in env or .env.local: NEXT_PUBLIC_SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY
 * Run AFTER migration 021:
 *   node scripts/backfill-hotel-public-ids.js
 */
const fs = require('fs');
const path = require('path');
const crypto = require('crypto');
const { createClient } = require('@supabase/supabase-js');

function loadEnv() {
  const p = path.join(process.cwd(), '.env.local');
  if (!fs.existsSync(p)) return;
  for (const line of fs.readFileSync(p, 'utf8').split(/\r?\n/)) {
    const m = line.match(/^\s*([A-Z0-9_]+)\s*=\s*(.*)\s*$/);
    if (!m || process.env[m[1]]) continue;
    let v = m[2];
    if ((v.startsWith('"') && v.endsWith('"')) || (v.startsWith("'") && v.endsWith("'"))) v = v.slice(1, -1);
    process.env[m[1]] = v;
  }
}

const U = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ';
const L = 'abcdefghijklmnopqrstuvwxyz';
const D = '0123456789';
const pick = (chars, n) => Array.from({ length: n }, () => chars[crypto.randomInt(chars.length)]).join('');
const makeId = () => `${pick(U, 2)}${pick(D, 2)}${pick(L, 2)}${pick(D, 3)}`;
const valid = (v) => typeof v === 'string' && /^[A-Z]{2}\d{2}[a-z]{2}\d{3}$/.test(v);
const isUnique = (e) => e && (e.code === '23505' || /unique|duplicate/i.test(`${e.message || ''} ${e.details || ''}`));

async function main() {
  loadEnv();
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const key = process.env.SUPABASE_SERVICE_ROLE_KEY;
  if (!url || !key) throw new Error('Missing NEXT_PUBLIC_SUPABASE_URL or SUPABASE_SERVICE_ROLE_KEY');
  const sb = createClient(url, key, { auth: { persistSession: false } });

  const { data, error } = await sb.from('hotels').select('id, name, hotel_public_id').order('created_at', { ascending: true });
  if (error) throw new Error(error.message + ' (ensure migration 021 is applied)');
  const rows = data || [];
  let scanned = rows.length, assigned = 0, skipped = 0, errors = 0;

  for (const r of rows) {
    if (valid(r.hotel_public_id)) { skipped++; continue; }
    let done = false;
    for (let i = 0; i < 20 && !done; i++) {
      const hid = makeId();
      const { data: upd, error: upErr } = await sb.from('hotels')
        .update({ hotel_public_id: hid }).eq('id', r.id)
        .or('hotel_public_id.is.null,hotel_public_id.eq.')
        .select('id, hotel_public_id').maybeSingle();
      if (!upErr && upd?.hotel_public_id) { assigned++; done = true; console.log(`assigned ${upd.hotel_public_id} -> ${r.id} (${r.name || ''})`); break; }
      if (upErr && isUnique(upErr)) continue;
      if (upErr) { console.error(`error ${r.id}: ${upErr.message}`); errors++; done = true; }
    }
    if (!done) { errors++; console.error(`failed to assign ${r.id}`); }
  }
  console.log(JSON.stringify({ ok: true, scanned, assigned, skipped_existing_valid: skipped, errors }, null, 2));
}

main().catch((e) => { console.error(e.message || e); process.exit(1); });
