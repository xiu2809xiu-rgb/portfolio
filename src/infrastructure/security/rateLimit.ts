import type { NextRequest } from 'next/server';

interface Bucket {
  count: number;
  resetAt: number;
}

const buckets = new Map<string, Bucket>();

/** Stops the map growing without bound on a long-lived warm instance. */
function sweep(now: number): void {
  if (buckets.size < 512) return;
  for (const [key, bucket] of buckets) {
    if (bucket.resetAt <= now) buckets.delete(key);
  }
}

function clientIp(request: NextRequest): string {
  const forwarded = request.headers.get('x-forwarded-for');
  if (forwarded) return forwarded.split(',')[0]!.trim();
  return request.headers.get('x-real-ip') ?? 'unknown';
}

export interface RateLimitOptions {
  key: string;
  limit: number;
  windowMs: number;
}

export interface RateLimitResult {
  ok: boolean;
  remaining: number;
  retryAfterSeconds: number;
}

/**
 * Fixed-window rate limit, per IP, held in process memory.
 *
 * Deliberately simple. It is a speed bump against a script hammering the booking
 * endpoint, not a distributed quota — a serverless instance keeps its own counter,
 * so an attacker spread across many cold starts gets more than `limit`. For a
 * personal site that trade-off is right; swapping in Upstash Redis later means
 * reimplementing this one function and nothing else.
 */
export function rateLimit(request: NextRequest, options: RateLimitOptions): RateLimitResult {
  const now = Date.now();
  sweep(now);

  const id = `${options.key}:${clientIp(request)}`;
  const existing = buckets.get(id);

  if (!existing || existing.resetAt <= now) {
    buckets.set(id, { count: 1, resetAt: now + options.windowMs });
    return { ok: true, remaining: options.limit - 1, retryAfterSeconds: 0 };
  }

  existing.count += 1;

  if (existing.count > options.limit) {
    return {
      ok: false,
      remaining: 0,
      retryAfterSeconds: Math.max(1, Math.ceil((existing.resetAt - now) / 1000)),
    };
  }

  return { ok: true, remaining: options.limit - existing.count, retryAfterSeconds: 0 };
}
