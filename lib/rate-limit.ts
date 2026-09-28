/**
 * Minimal fixed-window rate limiter (per server instance). Adequate for the demo;
 * swap for @upstash/ratelimit when Redis is provisioned (docs/build.md section 17).
 */
type Window = { count: number; resetAt: number }
const buckets = new Map<string, Window>()
const MAX_KEYS = 10_000

export function rateLimit(key: string, limit: number, windowMs: number): { ok: boolean; retryAfterSeconds: number } {
  const now = Date.now()
  const w = buckets.get(key)
  if (!w || w.resetAt <= now) {
    if (buckets.size > MAX_KEYS) buckets.clear()
    buckets.set(key, { count: 1, resetAt: now + windowMs })
    return { ok: true, retryAfterSeconds: 0 }
  }
  if (w.count >= limit) return { ok: false, retryAfterSeconds: Math.ceil((w.resetAt - now) / 1000) }
  buckets.set(key, { count: w.count + 1, resetAt: w.resetAt })
  return { ok: true, retryAfterSeconds: 0 }
}

export function clientKey(req: Request): string {
  return req.headers.get("x-forwarded-for")?.split(",")[0]?.trim() || req.headers.get("x-real-ip") || "local"
}
