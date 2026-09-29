// lib/hotelAccess.ts
// SERVER ONLY. Resolves which hotel a signed-in Supabase user owns and
// authorises writes against it. Never import this from a client component.
//
// Relationship used (see supabase/migrations/002_auth_identity_and_menu_fields.sql):
//   auth.uid()  ==  public.hotels.user_id       <- canonical owner link
//   auth.uid()  ->  public.hotel_users.user_id  <- owner link for accounts
//                                                  created before that column
//
// The lookup runs through the service-role client because it is an *identity*
// check rather than a data fetch: the service key stays on the server, RLS stays
// enabled, and every write it authorises is re-checked against the same
// authenticated user id before it is applied.
import { supabaseAdmin } from './supabaseAdmin';
import { getAuthenticatedUser } from './serverAuth';

export interface OwnedHotel {
  id: string;
  name: string | null;
  slug: string | null;
}

export type HotelAccess =
  | { ok: true; hotelId: string }
  | { ok: false; status: 401 | 403 | 404; error: string };

// PostgREST / Postgres codes for "that relation or column is not in the schema".
// They are tolerated (treated as "no link found") so a partially applied schema
// degrades into a clear 404 instead of an opaque 500.
const MISSING_OBJECT_CODES = new Set(['PGRST205', 'PGRST204', '42P01', '42703']);

function isMissingObject(error: { code?: string } | null): boolean {
  return Boolean(error?.code && MISSING_OBJECT_CODES.has(error.code));
}

/**
 * The hotel owned by `userId`, or null when the account owns none.
 * `public.hotels.user_id` is checked first; `public.hotel_users` is the fallback.
 */
export async function findHotelOwnedByUser(
  userId: string | null | undefined
): Promise<OwnedHotel | null> {
  if (!userId) return null;

  const { data: direct, error: directError } = await supabaseAdmin
    .from('hotels')
    .select('id, name, slug')
    .eq('user_id', userId)
    .limit(1);

  if (directError && !isMissingObject(directError)) throw directError;
  const owned = direct?.[0];
  if (owned) return owned;

  const { data: links, error: linkError } = await supabaseAdmin
    .from('hotel_users')
    .select('hotel_id')
    .eq('user_id', userId)
    .limit(1);

  if (linkError) {
    if (isMissingObject(linkError)) return null;
    throw linkError;
  }

  const link = links?.[0];
  if (!link) return null;

  const { data: fallback, error: fallbackError } = await supabaseAdmin
    .from('hotels')
    .select('id, name, slug')
    .eq('id', link.hotel_id)
    .limit(1);

  if (fallbackError && !isMissingObject(fallbackError)) throw fallbackError;
  return fallback?.[0] ?? null;
}

/**
 * Guard for owner-scoped API routes.
 *
 * Always reads the identity from the request's Supabase session (never from the
 * request body). When the caller sends a `hotel_id` it must be the hotel that
 * session owns, so a signed-in owner can never write into another tenant.
 */
export async function requireOwnedHotelId(
  requestedHotelId?: string | null
): Promise<HotelAccess> {
  const user = await getAuthenticatedUser();

  if (!user) {
    return { ok: false, status: 401, error: 'Not authenticated' };
  }

  const owned = await findHotelOwnedByUser(user.id);

  if (!owned) {
    return {
      ok: false,
      status: 404,
      error: 'No restaurant is linked to this account yet.',
    };
  }

  if (requestedHotelId && requestedHotelId !== owned.id) {
    return { ok: false, status: 403, error: 'You do not have access to this restaurant' };
  }

  return { ok: true, hotelId: owned.id };
}
