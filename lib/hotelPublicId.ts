import { randomInt } from 'crypto';
import { supabaseAdmin } from './supabaseAdmin';

const U = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ';
const L = 'abcdefghijklmnopqrstuvwxyz';
const pick = (chars: string, n: number) => Array.from({ length: n }, () => chars[randomInt(chars.length)]).join('');

export function makeHotelPublicId(): string {
  // AA12bb123
  return `${pick(U, 2)}${pick('0123456789', 2)}${pick(L, 2)}${pick('0123456789', 3)}`;
}

export async function generateUniqueHotelPublicId(): Promise<string> {
  for (let i = 0; i < 20; i++) {
    const id = makeHotelPublicId();
    const { data, error } = await supabaseAdmin
      .from('hotels')
      .select('id')
      .eq('hotel_public_id', id)
      .maybeSingle();
    if (error) {
      // If column is absent (migration not applied), fail clearly for new registrations.
      throw new Error(`Hotel ID generation failed: ${error.message}`);
    }
    if (!data) return id;
  }
  throw new Error('Could not generate a unique hotel ID. Please retry.');
}
