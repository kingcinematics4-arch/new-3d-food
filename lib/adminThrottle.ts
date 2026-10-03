// lib/adminThrottle.ts
//
// SERVER ONLY. Burst protection for the admin password endpoint.
//
// The admin panel is a single shared secret, so a password-guessing loop is the
// realistic attack. This caps how many guesses a client can make in a window and
// adds a short penalty after repeated failures.
//
// In-memory on purpose: this is a per-instance burst guard, not a durable quota.
// It stops casual online guessing; it is not a substitute for a strong password.

const WINDOW_MS = 15 * 60 * 1000; // 15 minutes
const MAX_ATTEMPTS_PER_WINDOW = 10;
const PENALTY_AFTER_FAILURES = 5;
const PENALTY_MS = 5 * 60 * 1000; // 5 minutes

interface Bucket {
  failures: number;
  firstFailureAt: number;
  penalizedUntil: number;
}

const buckets = new Map<string, Bucket>();

function bucketFor(key: string): Bucket {
  const existing = buckets.get(key);
  if (existing) return existing;
  const created: Bucket = { failures: 0, firstFailureAt: 0, penalizedUntil: 0 };
  buckets.set(key, created);
  return created;
}

export interface ThrottleDecision {
  allowed: boolean;
  retryAfterSeconds: number;
}

/**
 * True when `key` (an IP address) may attempt a password check right now.
 */
export function canAttempt(key: string): ThrottleDecision {
  const bucket = bucketFor(key);
  const now = Date.now();

  if (bucket.penalizedUntil > now) {
    return { allowed: false, retryAfterSeconds: Math.ceil((bucket.penalizedUntil - now) / 1000) };
  }

  // Window elapsed: start counting again.
  if (bucket.failures > 0 && now - bucket.firstFailureAt > WINDOW_MS) {
    bucket.failures = 0;
    bucket.firstFailureAt = 0;
  }

  if (bucket.failures >= MAX_ATTEMPTS_PER_WINDOW) {
    return { allowed: false, retryAfterSeconds: Math.ceil((WINDOW_MS - (now - bucket.firstFailureAt)) / 1000) };
  }

  return { allowed: true, retryAfterSeconds: 0 };
}

/** Records a failed password attempt and escalates to a penalty if needed. */
export function recordFailure(key: string): void {
  const bucket = bucketFor(key);
  const now = Date.now();

  if (bucket.failures === 0 || now - bucket.firstFailureAt > WINDOW_MS) {
    bucket.firstFailureAt = now;
    bucket.failures = 0;
  }

  bucket.failures += 1;

  if (bucket.failures >= PENALTY_AFTER_FAILURES) {
    bucket.penalizedUntil = now + PENALTY_MS;
  }
}

/** Clears the counter after a successful login. */
export function recordSuccess(key: string): void {
  buckets.delete(key);
}