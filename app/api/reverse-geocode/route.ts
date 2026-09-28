import * as z from "zod"

import { fail, ok } from "@/lib/api"
import { reverseGeocode } from "@/lib/conditions/reverse-geocode"
import { clientKey, rateLimit } from "@/lib/rate-limit"

const Query = z.object({
  lat: z.coerce.number().min(-90).max(90),
  lon: z.coerce.number().min(-180).max(180),
  lang: z.enum(["en", "es"]).catch("en"),
})

export async function GET(req: Request) {
  const limit = rateLimit(`reverse:${clientKey(req)}`, 20, 60_000)
  if (!limit.ok) return fail(429, "rate_limited", "Too many requests. Try again shortly.", { "Retry-After": String(limit.retryAfterSeconds) })
  const parsed = Query.safeParse(Object.fromEntries(new URL(req.url).searchParams))
  if (!parsed.success) return fail(400, "invalid_query", "Provide a valid latitude and longitude.")
  try {
    return ok(await reverseGeocode(parsed.data.lat, parsed.data.lon, parsed.data.lang))
  } catch {
    return fail(502, "upstream_error", "Place names are unavailable right now.")
  }
}
