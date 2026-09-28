import * as z from "zod"

import { fail, ok } from "@/lib/api"
import { getConditions } from "@/lib/conditions"
import { clientKey, rateLimit } from "@/lib/rate-limit"
import { getRuleSet } from "@/lib/rules"
import { suggestTexasClass } from "@/lib/rules/texas-class"

const Query = z.object({
  lat: z.coerce.number().min(-90).max(90),
  lon: z.coerce.number().min(-180).max(180),
  ruleSetId: z.enum(["uil-2026-27", "ksi-2015"]).optional(),
  regionId: z.string().max(20).optional(),
})

export async function GET(req: Request) {
  const limit = rateLimit(`conditions:${clientKey(req)}`, 60, 60_000)
  if (!limit.ok) return fail(429, "rate_limited", "Too many requests. Try again shortly.", { "Retry-After": String(limit.retryAfterSeconds) })
  const parsed = Query.safeParse(Object.fromEntries(new URL(req.url).searchParams))
  if (!parsed.success) return fail(400, "invalid_query", "Provide a valid latitude and longitude.")
  const { lat, lon } = parsed.data
  const suggestion = suggestTexasClass(lat, lon)
  const ruleSetId = parsed.data.ruleSetId ?? (suggestion.inTexas ? "uil-2026-27" : "ksi-2015")
  const rs = getRuleSet(ruleSetId)
  const regionId =
    parsed.data.regionId && rs.regions.some((r) => r.id === parsed.data.regionId)
      ? parsed.data.regionId
      : ruleSetId === "uil-2026-27"
        ? suggestion.regionId
        : "ksi1"
  const conditions = await getConditions(lat, lon, { ruleSetId, regionId })
  return ok({ ...conditions, suggestion }, { headers: { "Cache-Control": "public, s-maxage=600, stale-while-revalidate=1200" } })
}
