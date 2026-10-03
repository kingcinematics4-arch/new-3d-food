// lib/adminAuth.ts
//
// Authentication for the Dine3D owner admin panel.
//
// This is COMPLETELY SEPARATE from the Supabase auth system used by restaurant
// owners. Nothing here reads, writes or depends on a Supabase session, and no
// Supabase table or auth code path is modified.
//
// SECURITY MODEL
// --------------
// 1. The password lives ONLY in `DINE3D_ADMIN_PASSWORD`, a server-side
//    environment variable. It is never prefixed `NEXT_PUBLIC_`, so Next.js can
//    never inline it into a client bundle, and it is never returned by any API
//    response. There is no client-side comparison of any kind: the browser
//    posts the candidate to a server route and receives only a success flag.
//
// 2. Successful authentication issues an HMAC-SHA256 signed session token in an
//    httpOnly cookie. httpOnly means JavaScript cannot read it, so an XSS bug
//    cannot exfiltrate the session.
//
// 3. The signature is verified with a constant-time comparison, so the token
//    cannot be forged byte-by-byte through a timing oracle.
//
// 4. The token is stateless (no database read on the hot path), but logout is
//    genuinely server-side: `revokeAllAdminSessions()` records the logout time,
//    and `isAdminSessionActive()` rejects any token issued at or before it. A
//    stolen cookie therefore stops working the moment the owner logs out.
//
// RUNTIME
// -------
// Uses only `globalThis.crypto` (Web Crypto), which exists in both the Edge
// runtime used by `middleware.ts` and the Node runtime used by route handlers
// and server components. `node:crypto` is deliberately avoided so the same
// verification code can guard both.
//
// This module also deliberately does NOT import `next/headers`: it must stay
// importable from Edge middleware. Reading the cookie off a real request lives
// in `adminSession.server.ts`.

const encoder = new TextEncoder();

/** Session lifetime. Short enough that a leaked cookie has limited value. */
const SESSION_TTL_MS = 8 * 60 * 60 * 1000; // 8 hours

const TOKEN_VERSION = 'v1';

/** Cookie that carries the signed admin session. */
export const ADMIN_COOKIE_NAME = 'dine3d_admin_session';

/* ============================================================
   CONFIGURATION
   ============================================================ */

/**
 * The admin password, read from the server environment only.
 * Returns an empty string when unset, which makes every login attempt fail.
 */
function getAdminPassword(): string {
  return process.env.DINE3D_ADMIN_PASSWORD ?? '';
}

/**
 * True when the owner has actually configured a password. The admin UI uses
 * this to show setup instructions instead of pretending a login failed.
 */
export function isAdminConfigured(): boolean {
  return getAdminPassword().trim().length > 0;
}

/**
 * Key used to sign session tokens.
 *
 * Prefers a dedicated `DINE3D_ADMIN_SESSION_SECRET` so the signing key can be
 * rotated independently of the password. When that is unset the password itself
 * is hashed to derive the key, which keeps the panel usable out of the box;
 * both are server-only values.
 *
 * Returns null whenever no usable material exists, so an unconfigured
 * deployment can never mint or accept a session. It fails safe by construction:
 * a blank password yields no key even if a session secret happens to be set to
 * whitespace, and a blank session secret falls through to the password rather
 * than being treated as a valid key.
 */
async function getSigningKey(): Promise<CryptoKey | null> {
  const importKey = (material: string) =>
    crypto.subtle.importKey(
      'raw',
      encoder.encode(material),
      { name: 'HMAC', hash: 'SHA-256' },
      false,
      ['sign', 'verify']
    );

  const explicit = process.env.DINE3D_ADMIN_SESSION_SECRET?.trim();
  if (explicit && explicit.length > 0) return importKey(explicit);

  const password = getAdminPassword();
  if (password.trim().length === 0) return null;

  return importKey(`dine3d-admin::${password}`);
}

/* ============================================================
   LOW LEVEL CRYPTO
   ============================================================ */

function toBase64Url(bytes: Uint8Array): string {
  let binary = '';
  for (const byte of bytes) binary += String.fromCharCode(byte);
  return btoa(binary).replace(/\+/g, '-').replace(/\//g, '_').replace(/=+$/, '');
}

function fromBase64Url(value: string): Uint8Array | null {
  try {
    const padded = value.replace(/-/g, '+').replace(/_/g, '/');
    const binary = atob(padded.padEnd(Math.ceil(padded.length / 4) * 4, '='));
    const bytes = new Uint8Array(binary.length);
    for (let i = 0; i < binary.length; i += 1) bytes[i] = binary.charCodeAt(i);
    return bytes;
  } catch {
    return null;
  }
}

/**
 * Constant-time string comparison.
 *
 * Length is compared first (it is not a secret), then every character is XORed
 * into an accumulator that is only inspected once the whole string has been
 * walked, so the loop cannot exit early and leak a prefix match by timing.
 */
function timingSafeEqual(a: string, b: string): boolean {
  if (a.length !== b.length) return false;
  let diff = 0;
  for (let i = 0; i < a.length; i += 1) {
    diff |= a.charCodeAt(i) ^ b.charCodeAt(i);
  }
  return diff === 0;
}

/** Hashes a candidate password so the comparison happens on fixed-width data. */
async function digest(value: string): Promise<string> {
  const hash = await crypto.subtle.digest('SHA-256', encoder.encode(value));
  return toBase64Url(new Uint8Array(hash));
}

/* ============================================================
   PASSWORD VERIFICATION
   ============================================================ */

/**
 * Constant-time check of a candidate password against `DINE3D_ADMIN_PASSWORD`.
 * Always performs the digest so a missing password is not distinguishable from
 * a wrong one by response timing.
 */
export async function verifyAdminPassword(candidate: unknown): Promise<boolean> {
  const password = getAdminPassword();
  const value = typeof candidate === 'string' ? candidate : '';

  const [expectedHash, candidateHash] = await Promise.all([digest(password), digest(value)]);
  const ok = timingSafeEqual(expectedHash, candidateHash);

  // An unset password must never authenticate, even against an empty input.
  return ok && password.trim().length > 0;
}

/* ============================================================
   SESSION TOKEN
   ============================================================ */

interface SessionPayload {
  /** Issued-at, epoch milliseconds. */
  iat: number;
  /** Expiry, epoch milliseconds. */
  exp: number;
}

export interface AdminSession {
  issuedAt: number;
  expiresAt: number;
}

/**
 * Creates a signed session token for a freshly authenticated admin.
 * Contains no user data and no secret material beyond the signature.
 */
export async function createAdminSessionToken(): Promise<string> {
  const key = await getSigningKey();
  if (!key) throw new Error('Dine3D admin is not configured.');

  const issuedAt = Date.now();
  const payload: SessionPayload = { iat: issuedAt, exp: issuedAt + SESSION_TTL_MS };

  const body = toBase64Url(encoder.encode(JSON.stringify(payload)));
  const signature = toBase64Url(new Uint8Array(await crypto.subtle.sign('HMAC', key, encoder.encode(body))));

  return `${TOKEN_VERSION}.${body}.${signature}`;
}

/**
 * Verifies a token's signature and expiry.
 *
 * Only proves the token was issued by this server and is still within its
 * lifetime. Revocation after logout is layered on top by
 * `isAdminSessionActive`, which has the database available.
 */
export async function verifyAdminSessionToken(token: string | undefined | null): Promise<AdminSession | null> {
  if (!token) return null;

  const key = await getSigningKey();
  if (!key) return null;

  const parts = token.split('.');
  if (parts.length !== 3) return null;

  const [version, body, signature] = parts;
  if (version !== TOKEN_VERSION) return null;

  const expected = toBase64Url(new Uint8Array(await crypto.subtle.sign('HMAC', key, encoder.encode(body))));
  if (!timingSafeEqual(expected, signature)) return null;

  const decoded = fromBase64Url(body);
  if (!decoded) return null;

  try {
    const payload = JSON.parse(new TextDecoder().decode(decoded)) as SessionPayload;
    if (typeof payload.iat !== 'number' || typeof payload.exp !== 'number') return null;
    if (!Number.isFinite(payload.iat) || !Number.isFinite(payload.exp)) return null;
    if (Date.now() >= payload.exp) return null;
    return { issuedAt: payload.iat, expiresAt: payload.exp };
  } catch {
    return null;
  }
}

/**
 * True when a session is still usable, taking server-side logout revocation
 * into account. `revokedAt` is the timestamp recorded by the most recent logout
 * (null when no admin has ever logged out).
 */
export function isAdminSessionActive(session: AdminSession, revokedAt: string | null): boolean {
  if (!revokedAt) return true;
  const revoked = Date.parse(revokedAt);
  if (Number.isNaN(revoked)) return true;
  // A token issued at or before the logout instant is dead.
  return session.issuedAt > revoked;
}

/* ============================================================
   COOKIE PLUMBING
   ============================================================ */

export function adminCookieOptions(maxAgeSeconds: number) {
  return {
    httpOnly: true,
    sameSite: 'lax' as const,
    secure: process.env.NODE_ENV === 'production',
    path: '/',
    maxAge: maxAgeSeconds,
  };
}

export const ADMIN_COOKIE_MAX_AGE = SESSION_TTL_MS / 1000;