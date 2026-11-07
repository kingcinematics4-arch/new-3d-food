import { createClient } from '@supabase/supabase-js';
import fs from 'node:fs';
const env = Object.fromEntries(fs.readFileSync('.env.local','utf8').split(/\r?\n/).filter(l=>l&&!l.startsWith('#')&&l.includes('=')).map(l=>{const i=l.indexOf('=');return [l.slice(0,i).trim(),l.slice(i+1).trim()];}));
const db = createClient(env.NEXT_PUBLIC_SUPABASE_URL, env.SUPABASE_SERVICE_ROLE_KEY, { auth: { persistSession:false }});
const { data, error } = await db.from('hotels').select('id,name,custom_theme_config,menu_theme').limit(5);
console.log('custom_theme_config col:', error ? `ERR ${error.code}` : 'OK');
for (const h of (data||[])) console.log(JSON.stringify({id:h.id,name:h.name,menu_theme:h.menu_theme,ctc_type: typeof h.custom_theme_config, ctc_keys: h.custom_theme_config && typeof h.custom_theme_config==='object'?Object.keys(h.custom_theme_config):h.custom_theme_config}));
