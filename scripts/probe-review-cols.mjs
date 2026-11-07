import { createClient } from '@supabase/supabase-js';
import fs from 'node:fs';
const env = Object.fromEntries(fs.readFileSync('.env.local','utf8').split(/\r?\n/).filter(l=>l&&!l.startsWith('#')&&l.includes('=')).map(l=>{const i=l.indexOf('=');return [l.slice(0,i).trim(),l.slice(i+1).trim()];}));
const db = createClient(env.NEXT_PUBLIC_SUPABASE_URL, env.SUPABASE_SERVICE_ROLE_KEY, { auth: { persistSession:false }});
// Try likely alternate column names
for (const col of ['google_review_url','google_review_link','review_url','google_maps_review_url']) {
  const { error } = await db.from('hotels').select(col).limit(1);
  console.log(col, error ? `MISSING/ERR ${error.code} ${error.message}` : 'OK');
}
