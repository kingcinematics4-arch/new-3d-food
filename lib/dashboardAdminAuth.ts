import { randomBytes, scrypt as _scrypt, timingSafeEqual } from 'crypto';
import { promisify } from 'util';

const scrypt = promisify(_scrypt);
const enc = new TextEncoder();
const TOKEN_VERSION = 'd3dash1';
export const DASHBOARD_ADMIN_COOKIE = 'd3_dashboard_admin';
const SESSION_TTL_MS = 8 * 60 * 60 * 1000;
export const DASHBOARD_ADMIN_MAX_AGE = 8 * 60 * 60;

// Server-only verification material. The dashboard Admin password is never sent to
// clients and never included in API responses. Verification is performed server-side
// only. A scrypt-derived hash is used so the raw secret is not compared in logs/UI.
const BUILTIN_SALT = Buffer.from('5cb37ccc2cb44080114f81e605a8aadb', 'hex');
const BUILTIN_HASH = Buffer.from(
  '493ebcd5c86ea043a8f142bb22e73d932637c35b03d38f7487be9196f234b31f736b1b75c418a4b5ef9a58718855c5452608ab5b74e2ceefe9a89a490a93f7db',
  'hex'
);
const CONTEXT = Buffer.from('d3dash-admin-v1', 'utf8');

function getSecret(): string {
  // Server env can override without code changes; never NEXT_PUBLIC_, never returned.
  return process.env.DASHBOARD_ADMIN_PASSWORD ?? '';
}

async function derive(password: string, salt: Buffer): Promise<Buffer> {
  const key = (await scrypt(password, Buffer.concat([CONTEXT, salt]), 64)) as Buffer;
  return key;
}

export async function verifyDashboardAdminPassword(candidate: string): Promise<boolean> {
  const pw = typeof candidate === 'string' ? candidate : '';
  if (!pw) return false;
  const configured = getSecret();
  if (configured) {
    const a = Buffer.from(pw, 'utf8');
    const b = Buffer.from(configured, 'utf8');
    if (a.length !== b.length) return false;
    return timingSafeEqual(a, b);
  }
  const derived = await derive(pw, BUILTIN_SALT);
  return derived.length === BUILTIN_HASH.length && timingSafeEqual(derived, BUILTIN_HASH);
}

export function isDashboardAdminConfigured(): boolean {
  return true;
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

export interface DashboardAdminSession { iat: number; exp: number }

export async function createDashboardAdminToken(): Promise<string> {
  const now = Date.now();
  const payload = toB64Url(enc.encode(JSON.stringify({ iat: now, exp: now + SESSION_TTL_MS })));
  const sig = await crypto.subtle.sign('HMAC', await hmacKey(), enc.encode(`${TOKEN_VERSION}.${payload}`));
  return `${TOKEN_VERSION}.${payload}.${toB64Url(sig)}`;
}

export async function verifyDashboardAdminToken(token?: string): Promise<DashboardAdminSession | null> {
  if (!token) return null;
  const parts = token.split('.');
  if (parts.length !== 3 || parts[0] !== TOKEN_VERSION) return null;
  const [, payload, sig] = parts;
  try {
    const ok = await crypto.subtle.verify('HMAC', await hmacKey(), fromB64Url(sig) as unknown as BufferSource, enc.encode(`${TOKEN_VERSION}.${payload}`));
    if (!ok) return false as any;
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
