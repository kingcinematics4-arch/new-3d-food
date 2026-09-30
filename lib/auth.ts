// lib/auth.ts
import { supabaseAdmin, assertSupabaseAdminConfigured } from './supabaseAdmin';
import { findHotelOwnedByUser } from './hotelAccess';
import { z } from 'zod';
import { getAuthCallbackUrl } from './siteUrl';
import { isEmailRateLimitError } from './authThrottle';

/**
 * In-flight signups keyed by email.
 * A double-clicked submit (or a client retry) must never start a second
 * signup for the same address, which would produce a second email request.
 */
const inFlightSignups = new Map<string, Promise<OnboardingResult>>();

export interface OnboardingResult {
  userId: string;
  hotel: any;
  user: any;
  /** True when Supabase still has to email a confirmation link before sign-in. */
  requiresEmailConfirmation: boolean;
}

/**
 * Validation schema for hotel sign‑up & onboarding.
 */
export const signUpSchema = z.object({
  hotel_name: z.string().min(2, 'Hotel name must be at least 2 characters'),
  owner_name: z.string().min(2, 'Owner name must be at least 2 characters'),
  email: z.string().email('Invalid email address'),
  password: z.string().min(8, 'Password must be at least 8 characters'),
  city: z.string().optional().default(''),
  address: z.string().optional().default(''),
  phone: z.string().optional().default(''),
});

export type SignUpInput = z.infer<typeof signUpSchema>;

/**
 * Generate a URL-friendly slug from hotel name
 */
export function generateSlug(name: string): string {
  const baseSlug = name
    .toLowerCase()
    .trim()
    .replace(/[^\w\s-]/g, '')
    .replace(/[\s_-]+/g, '-')
    .replace(/^-+|-+$/g, '');
  const randomSuffix = Math.floor(1000 + Math.random() * 9000);
  return `${baseSlug}-${randomSuffix}`;
}

/**
 * Multi-tenant Onboarding: Creates Auth User -> Inserts Hotel -> Links User to Hotel
 *
 * Exactly one Auth user creation call is made per invocation. Concurrent
 * invocations for the same email (double-clicked submit, client retry) share a
 * single in-flight promise so a second signup - and therefore a second
 * confirmation email - is never issued.
 */
export async function signUpAndOnboardHotel(
  data: SignUpInput,
  callbackUrl?: string
): Promise<OnboardingResult> {
  const email = data.email.trim().toLowerCase();

  const existing = inFlightSignups.get(email);
  if (existing) {
    return existing;
  }

  const run = performHotelOnboarding(data, callbackUrl).finally(() => {
    inFlightSignups.delete(email);
  });

  inFlightSignups.set(email, run);
  return run;
}

async function performHotelOnboarding(
  data: SignUpInput,
  callbackUrl?: string
): Promise<OnboardingResult> {
  // Guard: Ensure Supabase environment is properly configured.
  // Throws clear error identifying missing env var names instead of failing with generic "fetch failed".
  assertSupabaseAdminConfigured();

  // The exact URL embedded in the Supabase confirmation email. It must match an
  // entry in Supabase's redirect allow-list verbatim (no query string).
  const redirectUrl = callbackUrl || getAuthCallbackUrl();

  // 1. Create Supabase Auth user
  let userId: string | undefined;
  let authUser: any = null;
  let requiresEmailConfirmation = false;

  // Primary: Use Admin API with service-role key (auto-confirms email so owner can immediately log in).
  // This path sends no confirmation email.
  const { data: adminData, error: adminError } = await supabaseAdmin.auth.admin.createUser({
    email: data.email,
    password: data.password,
    email_confirm: true,
    user_metadata: {
      owner_name: data.owner_name,
      hotel_name: data.hotel_name,
    },
  });

  if (!adminError && adminData?.user?.id) {
    userId = adminData.user.id;
    authUser = adminData.user;
  } else {
    // If the email is already in use, provide a user-friendly message
    const adminMsg = adminError?.message || '';

    if (isEmailRateLimitError(adminMsg)) {
      throw new Error(
        'Auth Signup Error: Too many confirmation emails were requested for this address. Please wait a few minutes and try again.'
      );
    }

    if (adminMsg.toLowerCase().includes('already') || adminMsg.toLowerCase().includes('exists')) {
      // The Auth account already exists, but onboarding may never have finished
      // (for example when the hotels table was missing a column at the time).
      // Without this branch such an account is stranded forever: the address is
      // taken, so it can never sign up again, and it owns no hotel. Prove the
      // caller owns the existing account with the submitted password and finish
      // its onboarding. auth.users is only read here, never modified.
      const recovered = await recoverIncompleteOnboarding(data);
      if (recovered) return recovered;

      throw new Error(`Auth Signup Error: An account with email ${data.email} already exists. Please sign in instead.`);
    }

    // Secondary fallback: standard auth.signUp with explicit production emailRedirectTo.
    // This is the only path that can trigger a confirmation email, and it runs
    // at most once per signup action.
    const { data: authData, error: authError } = await supabaseAdmin.auth.signUp({
      email: data.email,
      password: data.password,
      options: {
        emailRedirectTo: redirectUrl,
        data: {
          owner_name: data.owner_name,
          hotel_name: data.hotel_name,
        },
      },
    });

    if (authError) {
      if (isEmailRateLimitError(authError.message)) {
        throw new Error(
          'Auth Signup Error: Too many confirmation emails were requested for this address. Please wait a few minutes and try again.'
        );
      }
      throw new Error(`Auth Signup Error: ${authError.message}`);
    }

    userId = authData.user?.id;
    authUser = authData.user;
    requiresEmailConfirmation = true;
  }

  if (!userId) {
    throw new Error('Supabase Auth user created but failed to return user ID.');
  }

  // 2. Create the hotel owned by this authenticated user, then link it.
  const hotel = await createHotelForUser(userId, data);

  return {
    userId,
    hotel,
    user: authUser,
    requiresEmailConfirmation,
  };
}

/**
 * Insert the hotel row owned by `userId` plus the hotel_users membership row.
 *
 * `public.hotels.user_id` is the canonical owner link that
 * findHotelOwnedByUser resolves first, so the membership row is best-effort:
 * failing it must not abort onboarding and strand the Auth account, which is
 * exactly the half-onboarded state recoverIncompleteOnboarding exists to fix.
 */
async function createHotelForUser(userId: string, data: SignUpInput) {
  const { data: hotelData, error: hotelError } = await supabaseAdmin
    .from('hotels')
    .insert({
      user_id: userId,
      name: data.hotel_name,
      slug: generateSlug(data.hotel_name),
      owner_name: data.owner_name,
      email: data.email,
      phone: data.phone || null,
      city: data.city || null,
      address: data.address || null,
      is_active: true,
      subscription_plan: 'starter',
    })
    .select()
    .single();

  if (hotelError) {
    throw new Error(describeHotelInsertError(hotelError));
  }

  const { error: linkError } = await supabaseAdmin
    .from('hotel_users')
    .insert({ user_id: userId, hotel_id: hotelData.id, role: 'owner' });

  if (linkError) {
    console.error(
      '[auth] hotel_users membership insert failed; ownership still resolves via hotels.user_id:',
      linkError.message
    );
  }

  return hotelData;
}

/**
 * Turn a "relation or column does not exist" failure into an actionable
 * message. PGRST204 = column missing from the schema cache, PGRST205 = table
 * missing, 42703 = undefined_column.
 */
function describeHotelInsertError(error: {
  code?: string;
  message?: string;
  details?: string;
}): string {
  const base = `Hotel Creation Error (${error.code}): ${error.message} - ${error.details || ''}`;

  if (error.code === 'PGRST204' || error.code === '42703' || error.code === 'PGRST205') {
    return (
      `${base} -- the public schema is missing a column or table the app writes. ` +
      'Run supabase/migrations/001_initial.sql and 002_auth_identity_and_menu_fields.sql in the Supabase SQL Editor, refresh the schema cache, then retry signup.'
    );
  }

  return base;
}

/**
 * Finish onboarding for an Auth account that exists but owns no hotel.
 *
 * Returns null when the credentials do not match that address, or when the
 * account is already fully onboarded - in both cases the caller keeps the
 * normal "already exists, please sign in" message. The user id always comes
 * from Supabase Auth: nothing is hardcoded and auth.users is never written to.
 */
async function recoverIncompleteOnboarding(data: SignUpInput): Promise<OnboardingResult | null> {
  // A password grant doubles as proof that the caller owns this address. The
  // service-role client keeps this independent of the request cookie jar.
  const { data: signInData, error: signInError } = await supabaseAdmin.auth.signInWithPassword({
    email: data.email,
    password: data.password,
  });

  const existingUserId = signInData?.user?.id;
  if (signInError || !existingUserId) return null;

  // Already onboarded: nothing to repair, keep the "sign in instead" message.
  if (await findHotelOwnedByUser(existingUserId)) return null;

  const hotel = await createHotelForUser(existingUserId, data);

  return {
    userId: existingUserId,
    hotel,
    user: signInData.user,
    requiresEmailConfirmation: false,
  };
}

/**
 * Fetch the hotel and user link details for an authenticated user.
 * Returns the hotel_users row joined with the hotel record, or null if none exists.
 */
export async function getUserHotel(userId: string) {
  const { data, error } = await supabaseAdmin
    .from('hotel_users')
    .select('*, hotel:hotels(*)')
    .eq('user_id', userId)
    .single();

  if (error) return null;
  return data;
}

/**
 * Fetch the hotel record for an authenticated user by user_id.
 * Uses the public.hotels table joined via hotel_users.
 */
export async function getHotelByUserId(userId: string) {
  const { data, error } = await supabaseAdmin
    .from('hotel_users')
    .select('hotel_id, hotel:hotels(*)')
    .eq('user_id', userId)
    .single();

  if (error || !data) return null;

  const rawHotel = data.hotel as unknown;
  if (Array.isArray(rawHotel) && rawHotel.length > 0) {
    return rawHotel[0];
  }
  if (rawHotel && typeof rawHotel === 'object') {
    return rawHotel;
  }
  return null;
}
