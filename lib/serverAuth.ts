// lib/serverAuth.ts
// SERVER ONLY helpers for resolving the *real* authenticated Supabase user.
//
// The canonical identity is always `auth.uid()` / `session.user.id`.
// There is no demo user, no fake session and no localStorage/sessionStorage
// fallback anywhere in this file (or in this project).
import { createServerClient } from '@supabase/ssr';
import { cookies } from 'next/headers';
import type { User } from '@supabase/supabase-js';
import {
  supabaseUrl,
  supabasePublishableKey,
  isSupabaseConfigured,
  SUPABASE_URL_SENTINEL,
} from './supabaseEnv';

export interface HotelRecord {
  id: string;
  user_id: string | null;
  name: string;
  slug: string;
  owner_name: string | null;
  email: string | null;
  phone: string | null;
  city: string | null;
  address: string | null;
  logo_url: string | null;
  primary_color: string | null;
  secondary_color: string | null;
  menu_style: string | null;
  card_style: string | null;
  dark_mode: boolean | null;
  typography: string | null;
  welcome_text: string | null;
  custom_domain: string | null;
  currency: string | null;
  tax_rate: number | null;
  service_charge: number | null;
  is_active: boolean | null;
  created_at?: string;
  updated_at?: string;
}

/**
 * Supabase client bound to the incoming request's auth cookies.
 * Use in server components / route handlers that need an RLS-scoped session.
 */
export function getServerSupabase() {
  const cookieStore = cookies();
  const url = isSupabaseConfigured() ? supabaseUrl : SUPABASE_URL_SENTINEL;
  const key = supabasePublishableKey || 'missing-anon-key';

  return createServerClient(url, key, {
    cookies: {
      get(name: string) {
        return cookieStore.get(name)?.value;
      },
      set(name: string, value: string, options: Record<string, unknown>) {
        try {
          cookieStore.set({ name, value, ...options });
        } catch {
          // Called from a Server Component where cookies are read-only.
          // Safe to ignore: the session is already persisted in cookies.
        }
      },
      remove(name: string, options: Record<string, unknown>) {
        try {
          cookieStore.set({ name, value: '', ...options });
        } catch {
          // See note above.
        }
      },
    },
  });
}

/**
 * Returns the authenticated Supabase user, or null when there is no valid session.
 * Never returns a placeholder, demo or synthesised user.
 */
export async function getAuthenticatedUser(): Promise<User | null> {
  if (!isSupabaseConfigured()) return null;
  const supabase = getServerSupabase();

  const {
    data: { user },
    error,
  } = await supabase.auth.getUser();

  if (error || !user) return null;
  return user;
}

/**
 * Resolve the hotel owned by the authenticated user.
 * The lookup is always `public.hotels.user_id = <auth user id>`; the hotel name
 * and email are never used as an identity.
 */
export async function getHotelForUser(userId: string): Promise<HotelRecord | null> {
  const supabase = getServerSupabase();

  const { data, error } = await supabase
    .from('hotels')
    .select('*')
    .eq('user_id', userId)
    .maybeSingle<HotelRecord>();

  if (error || !data) return null;
  return data;
}

/**
 * Resolve a hotel by its public slug. Used only by the public customer menu.
 */
export async function getHotelBySlug(slug: string): Promise<HotelRecord | null> {
  const supabase = getServerSupabase();

  const { data, error } = await supabase
    .from('hotels')
    .select('*')
    .eq('slug', slug)
    .maybeSingle<HotelRecord>();

  if (error || !data) return null;
  return data;
}
