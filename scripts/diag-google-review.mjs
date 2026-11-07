import { createClient } from '@supabase/supabase-js';
import fs from 'node:fs';
const env = Object.fromEntries(fs.readFileSync('.env.local','utf8').split(/\r?\n/).filter(l=>l&&!l.startsWith('#')&&l.includes('=')).map(l=>{const i=l.indexOf('=');return [l.slice(0,i).trim(),l.slice(i+1).trim()];}));
const db = createClient(env.NEXT_PUBLIC_SUPABASE_URL, env.SUPABASE_SERVICE_ROLE_KEY, { auth: { persistSession:false }});

// Find Grand King Hotel and all hotels
const { data: hotels, error } = await db.from('hotels').select('*').order('created_at',{ascending:true});
if (error) { console.log('ERR', error.message); process.exit(1); }
console.log('=== HOTELS ===');
for (const h of hotels) {
  const reviewKeys = Object.keys(h).filter(k=>k.toLowerCase().includes('review')||k.toLowerCase().includes('google'));
  console.log(JSON.stringify({
    id: h.id, name: h.name, slug: h.slug, user_id: h.user_id,
    reviewKeys, reviewValues: Object.fromEntries(reviewKeys.map(k=>[k,h[k]])),
    hasGoogleReviewUrl: 'google_review_url' in h, google_review_url: h.google_review_url ?? '(field absent)',
  }, null, 2));
}

// Find orders for Grand King / all hotels
console.log('\n=== RECENT ORDERS (all hotels) ===');
const { data: orders } = await db.from('orders').select('id,order_number,hotel_id,status,payment_status,customer_name,table_number,created_at').order('created_at',{ascending:false}).limit(15);
for (const o of orders||[]) {
  const hotel = hotels.find(h=>h.id===o.hotel_id);
  console.log(JSON.stringify({ ...o, hotel_name: hotel?.name, hotel_id_match: !!hotel }));
}

// Check if google_review_url column exists now
const { error: colErr } = await db.from('hotels').select('google_review_url').limit(1);
console.log('\n=== COLUMN CHECK ===');
console.log('google_review_url:', colErr ? `MISSING ${colErr.code}` : 'EXISTS');
