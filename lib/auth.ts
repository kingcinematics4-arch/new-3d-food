// lib/auth.ts
import { supabaseAdmin, assertSupabaseAdminConfigured } from './supabaseClient';
import { z } from 'zod';

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
 */
export async function signUpAndOnboardHotel(data: SignUpInput) {
  // Guard: Ensure Supabase environment is properly configured.
  // Throws clear error identifying missing env var names instead of failing with generic "fetch failed".
  assertSupabaseAdminConfigured();

  // 1. Create Supabase Auth user
  let userId: string | undefined;
  let authUser: any = null;

  // Primary: Use Admin API with service-role key (auto-confirms email so owner can immediately log in)
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
    if (adminMsg.toLowerCase().includes('already') || adminMsg.toLowerCase().includes('exists')) {
      throw new Error(`Auth Signup Error: An account with email ${data.email} already exists. Please sign in instead.`);
    }

    // Secondary fallback: standard auth.signUp
    const { data: authData, error: authError } = await supabaseAdmin.auth.signUp({
      email: data.email,
      password: data.password,
      options: {
        data: {
          owner_name: data.owner_name,
          hotel_name: data.hotel_name,
        },
      },
    });

    if (authError) {
      throw new Error(`Auth Signup Error: ${authError.message}`);
    }

    userId = authData.user?.id;
    authUser = authData.user;
  }

  if (!userId) {
    throw new Error('Supabase Auth user created but failed to return user ID.');
  }

  // 2. Generate slug and insert hotel record into 'hotels' table
  const slug = generateSlug(data.hotel_name);
  const { data: hotelData, error: hotelError } = await supabaseAdmin
    .from('hotels')
    .insert({
      user_id: userId,
      name: data.hotel_name,
      slug: slug,
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
    throw new Error(`Hotel Creation Error (${hotelError.code}): ${hotelError.message} - ${hotelError.details || ''}`);
  }

  // 3. Link user to hotel in 'hotel_users' table
  const { error: linkError } = await supabaseAdmin
    .from('hotel_users')
    .insert({
      user_id: userId,
      hotel_id: hotelData.id,
      role: 'owner',
    });

  if (linkError) {
    throw new Error(`User-Hotel Linking Error (${linkError.code}): ${linkError.message}`);
  }

  return {
    userId,
    hotel: hotelData,
    user: authUser,
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
