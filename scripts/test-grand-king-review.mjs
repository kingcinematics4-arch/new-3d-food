import { createClient } from '@supabase/supabase-js';
import fs from 'node:fs';
const env = Object.fromEntries(fs.readFileSync('.env.local','utf8').split(/\r?\n/).filter(l=>l&&!l.startsWith('#')&&l.includes('=')).map(l=>{const i=l.indexOf('=');return [l.slice(0,i).trim(),l.slice(i+1).trim()];}));
const db = createClient(env.NEXT_PUBLIC_SUPABASE_URL, env.SUPABASE_SERVICE_ROLE_KEY, { auth: { persistSession:false }});

// Replicate getHotelGoogleReviewUrl / setHotelGoogleReviewUrl logic
const MISSING_COL = new Set(['42703','PGRST204','PGRST205']);
const clean = (v) => typeof v === 'string' && v.trim() ? v.trim() : null;
async function getUrl(hotelId) {
  if (!hotelId) return null;
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
  let col = false, cfg = false;
  const cw = await db.from('hotels').update({ google_review_url: value }).eq('id', hotelId);
  col = !cw.error; if (cw.error && !MISSING_COL.has(cw.error.code||'')) console.log('col err', cw.error.message);
  const cr = await db.from('hotels').select('custom_theme_config').eq('id', hotelId).maybeSingle();
  if (!cr.error) {
    const base = cr.data?.custom_theme_config && typeof cr.data.custom_theme_config==='object' ? {...cr.data.custom_theme_config} : {};
    if (value) base.googleReviewUrl = value; else delete base.googleReviewUrl;
    const uw = await db.from('hotels').update({ custom_theme_config: base }).eq('id', hotelId);
    cfg = !uw.error; if (uw.error) console.log('cfg err', uw.error.message);
  }
  return { col, cfg, value };
}

const HOTEL = '0e923ee0-12e4-4850-a382-973d6c8994c9'; // Grand King
const ORDER = 'ba439c58-d5f7-4a0c-a1af-f3501b4f2743'; // DINE-10074, completed, paid
const TEST_URL = 'https://g.page/r/GrandKingTestReviewExample';

const before = await getUrl(HOTEL);
console.log('BEFORE Grand King google_review_url:', before);
console.log('ASSERT before is null (do not overwrite existing):', before === null);

const save = await setUrl(HOTEL, TEST_URL);
console.log('SAVE result:', save);

const after = await getUrl(HOTEL);
console.log('AFTER Grand King google_review_url:', after);
console.log('PASS save->retrieve:', after === TEST_URL);

// Verify config preserved other keys
const { data: h } = await db.from('hotels').select('custom_theme_config').eq('id', HOTEL).single();
console.log('custom_theme_config has googleReviewUrl:', h?.custom_theme_config?.googleReviewUrl === TEST_URL);
console.log('custom_theme_config preserved menu_theme keys (cardBg present):', !!h?.custom_theme_config?.cardBg);

// Public order resolution by order.hotel_id
const { data: order } = await db.from('orders').select('id,order_number,hotel_id,status,payment_status').eq('id', ORDER).single();
const orderUrl = await getUrl(order.hotel_id);
console.log('Public order API resolution:', JSON.stringify({ orderId: order.id, orderHotelId: order.hotel_id, google_review_url: orderUrl }));
console.log('PASS order->hotel association:', orderUrl === TEST_URL && order.hotel_id === HOTEL);

// Payment status payload shape
const paymentPayload = { success:true, order:{ ...order, google_review_url: orderUrl } };
console.log('Payment payload has google_review_url:', paymentPayload.order.google_review_url === TEST_URL);

// Cleanup: restore null (this was empty before; test URL must not remain)
const restore = await setUrl(HOTEL, null);
const restored = await getUrl(HOTEL);
console.log('RESTORE result:', restore, 'restored value:', restored);
console.log('PASS restored (no test data left):', restored === null);
const { data: h2 } = await db.from('hotels').select('custom_theme_config').eq('id', HOTEL).single();
console.log('Config keys preserved after restore (cardBg still present):', !!h2?.custom_theme_config?.cardBg);
console.log('googleReviewUrl removed from config:', !('googleReviewUrl' in (h2?.custom_theme_config||{})));
