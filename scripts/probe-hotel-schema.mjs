import { createClient } from '@supabase/supabase-js';
import fs from 'node:fs';
const env = Object.fromEntries(fs.readFileSync('.env.local','utf8').split(/\r?\n/).filter(l=>l&&!l.startsWith('#')&&l.includes('=')).map(l=>{const i=l.indexOf('=');return [l.slice(0,i).trim(),l.slice(i+1).trim()];}));
const db = createClient(env.NEXT_PUBLIC_SUPABASE_URL, env.SUPABASE_SERVICE_ROLE_KEY, { auth: { persistSession:false }});
const { data, error } = await db.from('hotels').select('*').limit(1);
if (error) { console.log('ERR', error); process.exit(1); }
const row = data?.[0] || null;
console.log('hotel columns:', row ? Object.keys(row).sort().join(', ') : '(no hotels)');
if (row) {
  const reviewKeys = Object.keys(row).filter(k=>k.includes('review')||k.includes('google'));
  console.log('review-like keys:', reviewKeys);
  for (const k of reviewKeys) console.log(k, '=', row[k]);
}
