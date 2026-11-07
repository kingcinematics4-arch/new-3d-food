import { createClient } from '@supabase/supabase-js';
import fs from 'node:fs';
const env = Object.fromEntries(fs.readFileSync('.env.local','utf8').split(/\r?\n/).filter(l=>l&&!l.startsWith('#')&&l.includes('=')).map(l=>{const i=l.indexOf('=');return [l.slice(0,i).trim(),l.slice(i+1).trim()];}));
const db = createClient(env.NEXT_PUBLIC_SUPABASE_URL, env.SUPABASE_SERVICE_ROLE_KEY, { auth: { persistSession:false }});

// Read-only: simulate transition validation logic used by the API.
const VALID_TRANSITIONS = {
  pending: ['accepted','preparing','cancelled'],
  accepted: ['preparing','cancelled'],
  preparing: ['ready','cancelled'],
  ready: ['delivered','completed','cancelled'],
  delivered: ['completed','cancelled'],
  completed: [],
  cancelled: [],
};
function decide(current, requested) {
  const c = String(current||'').trim().toLowerCase();
  const r = String(requested||'').trim().toLowerCase();
  if (c === r) return { ok:true, noop:true };
  const allowed = VALID_TRANSITIONS[c] || [];
  if (allowed.includes(r)) return { ok:true, noop:false, allowed };
  return { ok:false, error:`Invalid status transition: ${c} → ${r}. Allowed: ${allowed.join(', ')||'none'}` };
}

const cases = [
  ['preparing','preparing'],
  ['Preparing','preparing'],
  ['preparing','ready'],
  ['preparing','cancelled'],
  ['pending','preparing'],
  ['ready','completed'],
  ['completed','preparing'],
];
for (const [c,r] of cases) console.log(`${c} -> ${r}:`, JSON.stringify(decide(c,r)));

// Check recent orders for preparing ones (read-only) to confirm context
const { data } = await db.from('orders').select('id,order_number,hotel_id,status').eq('status','preparing').limit(5);
console.log('preparing orders (read-only):', (data||[]).length, data||[]);
