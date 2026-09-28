import * as z from "zod"

import { fail, ok } from "@/lib/api"
import { searchPlaces } from "@/lib/conditions/geocode"
import { clientKey, rateLimit } from "@/lib/rate-limit"

const Query = z.object({ q: z.string().trim().min(2).max(80) })

export async function GET(req: Request) {
  const limit = rateLimit(`geocode:${clientKey(req)}`, 60, 60_000)
  if (!limit.ok) return fail(429, "rate_limited", "Too many requests. Try again shortly.", { "Retry-After": String(limit.retryAfterSeconds) })
  const parsed = Query.safeParse(Object.fromEntries(new URL(req.url).searchParams))
  if (!parsed.success) return fail(400, "invalid_query", "Enter at least 2 characters.")
  try {
    return ok(await searchPlaces(parsed.data.q))
  } catch {
    return fail(502, "upstream_error", "Place search is unavailable right now.")
  }
}
