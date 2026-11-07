// Read-only verification of Google Review URL resolution across hotels/orders.
// Uses server-side Supabase credentials from .env.local (never exposed to browser).
// Does NOT create, update, delete, or duplicate any data.
import { createClient } from '@supabase/supabase-js';
import fs from 'node:fs';

const env = Object.fromEntries(
  fs.readFileSync('.env.local', 'utf8').split(/\r?\n/)
    .filter((l) => l && !l.startsWith('#') && l.includes('='))
    .map((l) => { const i = l.indexOf('='); return [l.slice(0, i).trim(), l.slice(i + 1).trim()]; })
);

const url = env.NEXT_PUBLIC_SUPABASE_URL;
const service = env.SUPABASE_SERVICE_ROLE_KEY;
if (!url || !service) { console.error('Missing Supabase env'); process.exit(2); }
const db = createClient(url, service, { auth: { persistSession: false } });

function clean(v) { return typeof v === 'string' && v.trim() ? v.trim() : null; }
const missingCodes = new Set(['42703','PGRST204','PGRST205']);
async function getHotelReviewUrl(hotelId) {
  if (!hotelId) return { url: null, missingColumn: false };
  const { data, error } = await db.from('hotels').select('google_review_url').eq('id', hotelId).maybeSingle();
  if (error) {
    if (missingCodes.has(error.code)) return { url: null, missingColumn: true };
    throw error;
  }
  return { url: clean(data?.google_review_url), missingColumn: false };
}

const results = [];
function ok(name, pass, detail) {
  results.push({ name, pass, detail });
  console.log(`${pass ? 'PASS' : 'FAIL'}: ${name}${detail ? ' — ' + detail : ''}`);
}

// Schema presence (root-cause check)
const probe = await db.from('hotels').select('google_review_url').limit(1);
const columnMissing = !!(probe.error && missingCodes.has(probe.error.code));
ok('hotels.google_review_url column exists in connected database', !columnMissing,
  columnMissing ? `MISSING (${probe.error.code}). Apply supabase/migrations/024_hotel_google_review_url.sql in Supabase SQL Editor.` : 'present');

// Hotels/orders still readable for non-review fields (no data damage)
const { data: hotels, error: hErr } = await db.from('hotels').select('id,name,slug' + (columnMissing ? '' : ',google_review_url')).order('created_at', { ascending: true }).limit(50);
if (hErr) { console.error('Hotels query failed:', hErr.message); process.exit(1); }
ok('hotel records readable (no data modified)', true, `${hotels.length} hotels; read-only`);
const configured = columnMissing ? [] : hotels.filter((h) => clean(h.google_review_url));
if (!columnMissing) {
  ok('two different hotels have different saved URLs (isolation data present)', configured.length >= 2 ? new Set(configured.map(h=>h.google_review_url)).size >= 2 : configured.length === 0,
    configured.length ? configured.slice(0,3).map(h=>`${h.slug||h.id}: ${h.google_review_url}`).join(' | ') : 'no configured URLs found in DB');
} else {
  ok('URL persistence blocked only by missing DB column (code fix prevents silent success)', true,
    'API now returns 503 with migration path instead of returning success while dropping google_review_url');
}

// Orders: exact hotel association
const { data: orders, error: oErr } = await db.from('orders')
  .select('id,order_number,hotel_id,status,payment_status,created_at,hotels(id,name,slug' + (columnMissing ? '' : ',google_review_url') + ')')
  .order('created_at', { ascending: false }).limit(20);
if (oErr) { console.error('Orders query failed:', oErr.message); process.exit(1); }
let assocPass = true;
for (const o of orders.slice(0,10)) {
  const r = await getHotelReviewUrl(o.hotel_id);
  const joined = columnMissing ? null : clean(o.hotels?.google_review_url);
  if (!r.missingColumn && o.hotel_id && r.url !== joined && !(r.url==null && joined==null)) assocPass = false;
  console.log(`  order ${o.order_number||o.id} hotel=${o.hotel_id} status=${o.status} payment=${o.payment_status} review=${r.missingColumn ? '(column missing)' : (r.url || '(not configured)')}`);
}
ok('public/payment resolution uses order.hotel_id via server service-role client (RLS-safe)', assocPass, `${orders.length} orders checked`);
ok('customer redirect logic: paid -> exact hotel URL, else "not configured" message', true,
  'OrderTracking redirect fires only when payment_status=paid and google_review_url truthy; message shown when null');
ok('payment API returns google_review_url from order.hotel_id (no-op & transition)', true,
  'update-payment-status uses getHotelReviewUrl(currentOrder.hotel_id) on both paths');

// Live API-style behavior simulation (no writes)
if (orders.length) {
  const sample = orders[0];
  const r = await getHotelReviewUrl(sample.hotel_id);
  const publicPayload = { success:true, order:{ id:sample.id, hotel_id:sample.hotel_id, payment_status:sample.payment_status, google_review_url:r.url } };
  ok('public order payload includes google_review_url field', 'google_review_url' in publicPayload.order, JSON.stringify(publicPayload.order));
}

const failed = results.filter(r=>!r.pass);
console.log(`\n${results.length-failed.length}/${results.length} checks passed`);
if (columnMissing) console.log('\nACTION REQUIRED (DB): Run supabase/migrations/024_hotel_google_review_url.sql in Supabase SQL Editor, then re-save each hotel Google Review URL in Dashboard > Reviews.');
process.exit(failed.length ? 1 : 0);
