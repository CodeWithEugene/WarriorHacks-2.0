import * as z from "zod"

import { getJev } from "@/lib/ai/jev"
import { DEFAULT_VISION_MODEL, finalize, selectWbgt, transcribe } from "@/lib/ai/vision-core"
import { fail, ok } from "@/lib/api"
import { clientKey, rateLimit } from "@/lib/rate-limit"

const MAX_BYTES = 4 * 1024 * 1024
const Body = z.object({
  image: z.string().regex(/^data:image\/(jpeg|png|webp);base64,[A-Za-z0-9+/=]+$/),
  forecastF: z.number().min(0).max(140).nullable().optional(),
})

export async function POST(req: Request) {
  const limit = rateLimit(`meter:${clientKey(req)}`, 10, 60_000)
  if (!limit.ok) return fail(429, "rate_limited", "Too many photos. Enter the value by hand.", { "Retry-After": String(limit.retryAfterSeconds) })
  const apiKey = process.env.OPENROUTER_API_KEY
  if (!apiKey) return ok({ status: "manual", reason: "not_configured" })
  const raw = await req.text()
  if (raw.length > MAX_BYTES * 1.4) return fail(413, "too_large", "Photo is too large.")
  const parsed = Body.safeParse(JSON.parse(raw || "null"))
  if (!parsed.success) return fail(400, "invalid", "Send a JPEG, PNG or WebP photo.")
  const model = process.env.OPENROUTER_VISION_MODEL || DEFAULT_VISION_MODEL
  try {
    // The photo is processed in memory and never stored.
    const transcription = await transcribe({ apiKey, model, imageDataUrl: parsed.data.image, appUrl: process.env.NEXT_PUBLIC_APP_URL ?? "https://flagline.codewitheugene.top" })
    const selection = await selectWbgt(getJev(), transcription)
    return ok(finalize(transcription, selection, parsed.data.forecastF ?? null, model))
  } catch (e: unknown) {
    console.error("meter-photo: vision failed", { model, error: e instanceof Error ? e.message : String(e) })
    return ok({ status: "manual", reason: "vision_error" })
  }
}
