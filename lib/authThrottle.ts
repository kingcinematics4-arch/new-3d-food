// lib/authThrottle.ts
// SERVER ONLY. Guards every code path that can send a Supabase Auth email.
//
// Supabase enforces its own "email rate limit exceeded" error, but relying on it
// alone means a burst of clicks already produced too many send attempts. These
// helpers make sure one user action produces at most one email request, and that
// a confirmation email is only ever sent on an explicit user action.
//
// In-memory on purpose: this is a burst guard (double clicks, retries,
// React strict-mode double effects), not a durable quota system. Supabase
// remains the authoritative rate limiter.

const RESEND_COOLDOWN_MS = 60_000; // 1 minute between confirmation emails
const RESEND_MAX_PER_HOUR = 5; // hard ceiling per address per hour
const HOUR_MS = 60 * 60 * 1000;

interface Bucket {
  lastSentAt: number;
  timestamps: number[];
  inFlight: boolean;
}

const buckets = new Map<string, Bucket>();

function getBucket(key: string): Bucket {
  let bucket = buckets.get(key);
  if (!bucket) {
    bucket = { lastSentAt: 0, timestamps: [], inFlight: false };
    buckets.set(key, bucket);
  }
  return bucket;
}

function prune(bucket: Bucket, now: number) {
  bucket.timestamps = bucket.timestamps.filter((t) => now - t < HOUR_MS);
}

export interface ThrottleResult {
  allowed: boolean;
  /** Seconds the caller should wait before retrying. */
  retryAfterSeconds: number;
  reason?: 'in_flight' | 'cooldown' | 'hourly_limit';
}

/**
 * Atomically reserves the single allowed email send for `key`.
 * Returns `allowed: false` when a send is already in flight, was sent very
 * recently, or the hourly ceiling for this key was reached.
 *
 * The reservation must be released with `release()` if the send did not happen.
 */
export function reserveEmailSend(key: string): ThrottleResult {
  const now = Date.now();
  const bucket = getBucket(key);
  prune(bucket, now);

  if (bucket.inFlight) {
    return { allowed: false, retryAfterSeconds: 10, reason: 'in_flight' };
  }

  if (bucket.lastSentAt && now - bucket.lastSentAt < RESEND_COOLDOWN_MS) {
    const wait = Math.ceil((RESEND_COOLDOWN_MS - (now - bucket.lastSentAt)) / 1000);
    return { allowed: false, retryAfterSeconds: wait, reason: 'cooldown' };
  }

  if (bucket.timestamps.length >= RESEND_MAX_PER_HOUR) {
    return { allowed: false, retryAfterSeconds: 3600, reason: 'hourly_limit' };
  }

  bucket.inFlight = true;
  return { allowed: true, retryAfterSeconds: 0 };
}

/**
 * Marks the email as sent. Call only after a real send attempt was made.
 */
export function commitEmailSend(key: string) {
  const now = Date.now();
  const bucket = getBucket(key);
  bucket.inFlight = false;
  bucket.lastSentAt = now;
  bucket.timestamps.push(now);
}

/**
 * Releases a reservation without recording a send (for example when the request
 * failed before reaching Supabase).
 */
export function releaseEmailSend(key: string) {
  getBucket(key).inFlight = false;
}

/**
 * Detects Supabase's email rate-limit / throttling responses.
 */
export function isEmailRateLimitError(message?: string | null): boolean {
  if (!message) return false;
  const normalized = message.toLowerCase();
  return (
    normalized.includes('rate limit') ||
    normalized.includes('rate_limit') ||
    normalized.includes('too many') ||
    normalized.includes('security purposes') ||
    normalized.includes('email rate')
  );
}

export function isEmailUnconfirmedError(message?: string | null): boolean {
  if (!message) return false;
  return message.toLowerCase().includes('email not confirmed');
}

/**
 * True when the error means "no unconfirmed account exists for this address".
 * Used to keep the resend endpoint from leaking which emails are registered.
 */
export function isNoSuchUserError(message?: string | null): boolean {
  if (!message) return false;
  const normalized = message.toLowerCase();
  return (
    normalized.includes('user not found') ||
    normalized.includes('not found') ||
    normalized.includes('no user') ||
    normalized.includes('already been confirmed') ||
    normalized.includes('already confirmed') ||
    normalized.includes('signups not allowed')
  );
}
