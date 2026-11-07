import { createClient } from '@supabase/supabase-js';
import fs from 'node:fs';
const env = Object.fromEntries(fs.readFileSync('.env.local','utf8').split(/\r?\n/).filter(l=>l&&!l.startsWith('#')&&l.includes('=')).map(l=>{const i=l.indexOf('=');return [l.slice(0,i).trim(),l.slice(i+1).trim()];}));
const db = createClient(env.NEXT_PUBLIC_SUPABASE_URL, env.SUPABASE_SERVICE_ROLE_KEY, { auth: { persistSession:false }});
const sql = `alter table public.hotels add column if not exists google_review_url text;`;
let applied = false;
for (const fn of ['exec_sql','exec','execute_sql']) {
  try {
    const { error } = await db.rpc(fn, { sql_query: sql, query: sql, sql });
    if (!error) { console.log('Applied via rpc', fn); applied = true; break; }
    console.log(`rpc ${fn}:`, error.message);
  } catch (e) { console.log(`rpc ${fn} threw:`, e.message); }
}
const { error: vErr } = await db.from('hotels').select('google_review_url').limit(1);
console.log('google_review_url column:', vErr ? `MISSING ${vErr.code} ${vErr.message}` : 'OK', applied ? '(DDL applied)' : '(DDL not applied via RPC; run migration 024 in Supabase SQL Editor)');
