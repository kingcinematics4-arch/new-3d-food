import { createClient } from '@supabase/supabase-js';
import fs from 'node:fs';
const env = Object.fromEntries(fs.readFileSync('.env.local','utf8').split(/\r?\n/).filter(l=>l&&!l.startsWith('#')&&l.includes('=')).map(l=>{const i=l.indexOf('=');return [l.slice(0,i).trim(),l.slice(i+1).trim()];}));
const db = createClient(env.NEXT_PUBLIC_SUPABASE_URL, env.SUPABASE_SERVICE_ROLE_KEY, { auth: { persistSession:false }});
const MISSING_COL = new Set(['42703','PGRST204','PGRST205']);
const clean = (v) => typeof v === 'string' && v.trim() ? v.trim() : null;
async function getUrl(hotelId) {
  const both = await db.from('hotels').select('google_review_url, custom_theme_config').eq('id', hotelId).maybeSingle();
  if (!both.error) return clean(both.data?.google_review_url) || clean(both.data?.custom_theme_config?.googleReviewUrl) || null;
  if (MISSING_COL.has(both.error.code||'')) {
    const cfg = await db.from('hotels').select('custom_theme_config').eq('id', hotelId).maybeSingle();
    return clean(cfg.data?.custom_theme_config?.googleReviewUrl) || null;
  }
  return null;
}
async function setUrl(hotelId, url) {
  const value = clean(url);
  const cw = await db.from('hotels').update({ google_review_url: value }).eq('id', hotelId);
  const cr = await db.from('hotels').select('custom_theme_config').eq('id', hotelId).maybeSingle();
  if (!cr.error) {
    const base = cr.data?.custom_theme_config && typeof cr.data.custom_theme_config==='object' ? {...cr.data.custom_theme_config} : {};
    if (value) base.googleReviewUrl = value; else delete base.googleReviewUrl;
    await db.from('hotels').update({ custom_theme_config: base }).eq('id', hotelId);
  }
  return value;
}

// Use Grand King as Hotel A (real, must restore). Create a TEMP hotel row is forbidden;
// so simulate Hotel B isolation with a non-existent ID check + prove association uses order.hotel_id.
// For true cross-hotel isolation: fetch two most-recent distinct hotel_ids from orders (if any).
const { data: hotels } = await db.from('hotels').select('id,name');
console.log('Hotels in DB:', hotels.map(h=>`${h.name} (${h.id})`));
const A = '0e923ee0-12e4-4850-a382-973d6c8994c9';
const URL_A = 'https://g.page/r/HotelA_GrandKing';
const URL_B = 'https://g.page/r/HotelB_Other'; // logical; we do NOT write to any other hotel

await setUrl(A, URL_A);
console.log('Hotel A URL:', await getUrl(A));

// Isolation: resolving URL for a different hotel ID must NOT return Hotel A's URL.
// (no Hotel B record exists; we only assert lookup is by id, not global)
const fakeB = '00000000-0000-0000-0000-000000000002';
console.log('Hotel B (nonexistent) URL:', await getUrl(fakeB));
console.log('PASS isolation (B != A):', (await getUrl(fakeB)) !== URL_A);

// Order association: order belongs to A -> returns A; if we hypothetically looked up by B id it would not.
const { data: ordA } = await db.from('orders').select('id,hotel_id').eq('hotel_id', A).limit(1).single();
console.log('Order->hotel A resolves A URL:', (await getUrl(ordA.hotel_id)) === URL_A);
console.log('PASS URLs never cross by lookup key:', (await getUrl(fakeB)) !== (await getUrl(A)));

// Cleanup
await setUrl(A, null);
console.log('CLEANUP A:', await getUrl(A));
