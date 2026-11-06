import { randomInt } from 'crypto';
import { supabaseAdmin } from './supabaseAdmin';

const U = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ';
const L = 'abcdefghijklmnopqrstuvwxyz';
const D = '0123456789';
const pick = (chars: string, n: number) => Array.from({ length: n }, () => chars[randomInt(chars.length)]).join('');

export function isValidHotelPublicId(v: unknown): v is string {
  return typeof v === 'string' && /^[A-Z]{2}\d{2}[a-z]{2}\d{3}$/.test(v);
}

export function makeHotelPublicId(): string {
  // AA12bb123
  return `${pick(U, 2)}${pick(D, 2)}${pick(L, 2)}${pick(D, 3)}`;
}

function isUniqueViolation(error: any): boolean {
  const msg = `${error?.code || ''} ${error?.message || ''} ${error?.details || ''}`.toLowerCase();
  return error?.code === '23505' || msg.includes('unique') || msg.includes('duplicate');
}

export async function generateUniqueHotelPublicId(excludeHotelId?: string): Promise<string> {
  for (let i = 0; i < 30; i++) {
    const id = makeHotelPublicId();
    let q = supabaseAdmin.from('hotels').select('id').eq('hotel_public_id', id);
    if (excludeHotelId) q = q.neq('id', excludeHotelId);
    const { data, error } = await q.maybeSingle();
    if (error) throw new Error(`Hotel ID generation failed: ${error.message}`);
    if (!data) return id;
  }
  throw new Error('Could not generate a unique hotel ID. Please retry.');
}

/** Assign a permanent ID only when missing/invalid. Safe to run multiple times. */
export async function assignHotelPublicIdIfMissing(hotelId: string, current?: unknown): Promise<string | null> {
  if (isValidHotelPublicId(current)) return current;
  for (let i = 0; i < 12; i++) {
    const hid = await generateUniqueHotelPublicId(hotelId);
    const { data, error } = await supabaseAdmin
      .from('hotels')
      .update({ hotel_public_id: hid })
      .eq('id', hotelId)
      .or('hotel_public_id.is.null,hotel_public_id.eq.')
      .select('id, hotel_public_id')
      .maybeSingle();
    if (!error && data?.hotel_public_id) return data.hotel_public_id as string;
    if (error && isUniqueViolation(error)) continue;
    if (error) throw new Error(error.message);
    // Row may already have a valid ID now (race/previous run) - re-read.
    const { data: existing } = await supabaseAdmin.from('hotels').select('hotel_public_id').eq('id', hotelId).maybeSingle();
    if (isValidHotelPublicId(existing?.hotel_public_id)) return existing!.hotel_public_id as string;
  }
  throw new Error('Could not assign a unique hotel ID.');
}

/** Idempotent backfill for all hotels missing a valid ID. Preserves existing valid IDs. */
export async function backfillMissingHotelPublicIds(): Promise<{ scanned: number; assigned: number; errors: number }> {
  const res = { scanned: 0, assigned: 0, errors: 0 };
  const { data, error } = await supabaseAdmin.from('hotels').select('id, hotel_public_id');
  if (error) throw new Error(error.message);
  const rows = (data || []) as Array<{ id: string; hotel_public_id?: string | null }>;
  res.scanned = rows.length;
  for (const r of rows) {
    if (isValidHotelPublicId(r.hotel_public_id)) continue;
    try {
      const id = await assignHotelPublicIdIfMissing(r.id, r.hotel_public_id);
      if (id) res.assigned += 1;
    } catch {
      res.errors += 1;
    }
  }
  return res;
}
