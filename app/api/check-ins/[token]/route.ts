import * as z from "zod"

import { triageCheckIn } from "@/lib/ai/triage"
import { SYMPTOMS } from "@/lib/ai/triage-rules"
import { fail, ok } from "@/lib/api"
import { clientKey, rateLimit } from "@/lib/rate-limit"
import { addCheckIn, getPracticeByCheckInToken } from "@/lib/teams"

const Body = z.object({
  alias: z.string().trim().max(8).optional(),
  symptoms: z.array(z.enum(SYMPTOMS)).max(SYMPTOMS.length).default([]),
  text: z.string().trim().max(500).optional(),
  locale: z.enum(["en", "es"]).default("en"),
})

export async function POST(req: Request, ctx: { params: Promise<{ token: string }> }) {
  const { token } = await ctx.params
  const limit = rateLimit(`checkin:${clientKey(req)}:${token}`, 6, 60_000)
  if (!limit.ok) return fail(429, "rate_limited", "Too many check-ins. Tell a coach in person.", { "Retry-After": String(limit.retryAfterSeconds) })
  const found = await getPracticeByCheckInToken(token)
  if (!found || found.practice.status === "ended") return fail(404, "not_found", "This check-in code is not active.")
  const parsed = Body.safeParse(await req.json().catch(() => null))
  if (!parsed.success) return fail(400, "invalid", "Invalid check-in.")
  const { alias, symptoms, text, locale } = parsed.data
  const level = found.practice.state.readings.at(-1)?.level ?? "unknown"
  const triage = await triageCheckIn({ symptoms, text: text || null, level, locale })
  const flags: Record<string, number | string> = { reasons: triage.reasons.join(",") }
  if (triage.ai) {
    for (const [k, v] of Object.entries(triage.ai.redFlags)) flags[k] = Math.round((v ?? 0) * 100) / 100
    if (triage.ai.severity !== null) flags.severity = Math.round(triage.ai.severity * 100) / 100
    if (triage.ai.category) flags.category = triage.ai.category
  }
  await addCheckIn({ practiceId: found.practice.id, alias: alias || null, locale, symptoms, text: text || null, routing: triage.routing, aiFlags: flags, aiModel: triage.model })
  return ok({ routing: triage.routing })
}
