import { scrypt as _scrypt, timingSafeEqual } from 'crypto';
import { promisify } from 'util';
import { supabaseAdmin } from './supabaseAdmin';
import { isValidHotelPublicId } from './hotelPublicId';

const scrypt = promisify(_scrypt);
const enc = new TextEncoder();
const TOKEN_VERSION = 'd3dash1';
export const DASHBOARD_ADMIN_COOKIE = 'd3_dashboard_admin';
const SESSION_TTL_MS = 8 * 60 * 60 * 1000;
export const DASHBOARD_ADMIN_MAX_AGE = 8 * 60 * 60;

// Server-only dashboard/hotel-admin auth. Passwords are never sent to clients,
// never included in API responses, and never compared in frontend code.
// Format (dynamic, never hardcoded per hotel): `King.0001` + hotelPublicId
// Example: hotelPublicId AA11bb123 => King.0001AA11bb123
export const DASHBOARD_ADMIN_PASSWORD_PREFIX = 'King.0001';

const LEGACY_SALT = Buffer.from('5cb37ccc2cb44080114f81e605a8aadb', 'hex');
const LEGACY_HASH = Buffer.from(
  '493ebcd5c86ea043a8f142bb22e73d932637c35b03d38f7487be9196f234b31f736b1b75c418a4b5ef9a58718855c5452608ab5b74e2ceefe9a89a490a93f7db',
  'hex'
);
const LEGACY_CONTEXT = Buffer.from('d3dash-admin-v1', 'utf8');

async function deriveLegacy(password: string): Promise<Buffer> {
  return (await scrypt(password, Buffer.concat([LEGACY_CONTEXT, LEGACY_SALT]), 64)) as Buffer;
}

function safeEqualStr(a: string, b: string): boolean {
  const ab = Buffer.from(a, 'utf8');
  const bb = Buffer.from(b, 'utf8');
  if (ab.length !== bb.length) return false;
  return timingSafeEqual(ab, bb);
}

export function isDashboardAdminConfigured(): boolean {
  return true;
}

export interface DashboardAdminVerification {
  ok: boolean;
  hotelPublicId?: string; // present when authenticated via a valid hotel ID
}

async function hotelExistsWithPublicId(hotelPublicId: string): Promise<boolean> {
  if (!isValidHotelPublicId(hotelPublicId)) return false;
  try {
    const { data, error } = await supabaseAdmin
      .from('hotels')
      .select('id')
      .eq('hotel_public_id', hotelPublicId)
      .maybeSingle();
    if (error) return false;
    return !!data;
  } catch {
    return false;
  }
}

/** Server-side verification. Accepts ONLY `King.0001{hotelPublicId}` for a hotel ID that exists in DB. */
export async function verifyDashboardAdminPassword(candidate: string): Promise<DashboardAdminVerification> {
  const pw = typeof candidate === 'string' ? candidate : '';
  if (!pw) return { ok: false };

  // Optional server override (never NEXT_PUBLIC_, never returned). Exact match only.
  const configured = process.env.DASHBOARD_ADMIN_PASSWORD || '';
  if (configured && safeEqualStr(pw, configured)) return { ok: true };

  // New required format: King.0001 + valid AA12bb123 hotelPublicId that exists in DB.
  if (pw.startsWith(DASHBOARD_ADMIN_PASSWORD_PREFIX)) {
    const hotelPublicId = pw.slice(DASHBOARD_ADMIN_PASSWORD_PREFIX.length);
    if (isValidHotelPublicId(hotelPublicId) && (await hotelExistsWithPublicId(hotelPublicId))) {
      return { ok: true, hotelPublicId };
    }
    return { ok: false };
  }

  // Legacy compatibility for the previous global dashboard-admin password (hash-only; no plaintext).
  // This does not affect hotel IDs/records and does not grant per-hotel identity.
  if (!configured) {
    try {
      const derived = await deriveLegacy(pw);
      if (derived.length === LEGACY_HASH.length && timingSafeEqual(derived, LEGACY_HASH)) return { ok: true };
    } catch {}
  }

  return { ok: false };
}

function toB64Url(buf: ArrayBuffer | Uint8Array): string {
  return Buffer.from(buf as Uint8Array).toString('base64url');
}
function fromB64Url(s: string): Uint8Array {
  return new Uint8Array(Buffer.from(s, 'base64url'));
}

async function hmacKey() {
  const secret = process.env.DASHBOARD_ADMIN_SESSION_SECRET || process.env.NEXTAUTH_SECRET || 'd3dash-session-fallback-dev-only';
  return crypto.subtle.importKey('raw', enc.encode(secret), { name: 'HMAC', hash: 'SHA-256' }, false, ['sign', 'verify']);
}

export interface DashboardAdminSession { iat: number; exp: number; hid?: string }

export async function createDashboardAdminToken(claims: { hid?: string } = {}): Promise<string> {
  const now = Date.now();
  const payloadObj: any = { iat: now, exp: now + SESSION_TTL_MS };
  if (claims.hid && isValidHotelPublicId(claims.hid)) payloadObj.hid = claims.hid;
  const payload = toB64Url(enc.encode(JSON.stringify(payloadObj)));
  const sig = await crypto.subtle.sign('HMAC', await hmacKey(), enc.encode(`${TOKEN_VERSION}.${payload}`));
  return `${TOKEN_VERSION}.${payload}.${toB64Url(sig)}`;
}

export async function verifyDashboardAdminToken(token?: string): Promise<DashboardAdminSession | null> {
  if (!token) return null;
  const parts = token.split('.');
  if (parts.length !== 3 || parts[0] !== TOKEN_VERSION) return null;
  const [, payload, sig] = parts;
  try {
    const sigBuf = fromB64Url(sig);
    const dataBuf = enc.encode(TOKEN_VERSION + '.' + payload);
    const ok = await crypto.subtle.verify('HMAC', await hmacKey(), sigBuf as unknown as BufferSource, dataBuf as unknown as BufferSource);
    if (!ok) return null;
    const data = JSON.parse(Buffer.from(payload, 'base64url').toString('utf8')) as DashboardAdminSession;
    if (!data?.exp || Date.now() > data.exp) return null;
    return data;
  } catch {
    return null;
  }
}

export function dashboardAdminCookieOptions(maxAge: number) {
  return {
    httpOnly: true,
    secure: process.env.NODE_ENV === 'production',
    sameSite: 'lax' as const,
    path: '/',
    maxAge,
  };
}
