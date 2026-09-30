/**
 * Meter photo reading.
 * Step 1 (vision, OpenRouter GLM): transcribe the numbers and labels on the display. No interpretation.
 * Step 2 (TypeSafe Jev): choose which transcribed number is the WBGT, and check it is a heat stress screen.
 * Step 3 (code): convert units, validate range, compare with the forecast. The coach confirms before logging.
 */
import type { TypeSafeClient } from "@typesafe-ai/sdk"
import { choice, noul } from "@typesafe-ai/sdk"
import * as z from "zod"

export const DEFAULT_VISION_MODEL = "z-ai/glm-5.3-flash"
const JEV_MODEL = "jev-latest"
export const MIN_F = 40
export const MAX_F = 120
export const PLAUSIBILITY_DELTA_F = 8
export const SELECT_CONFIDENCE_MIN = 0.7

export const Transcription = z.object({
  device: z.string().nullable().optional(),
  readings: z
    .array(z.object({ id: z.string(), value: z.number(), unit: z.string().nullable().optional(), label: z.string().nullable().optional() }))
    .max(20),
})
export type Transcription = z.infer<typeof Transcription>

export type MeterResult =
  | { status: "ok"; valueF: number; confidence: number; isHeatScreen: number; farFromForecast: boolean; transcription: Transcription; visionModel: string; jevModel: string | null }
  | { status: "manual"; reason: "no_numbers" | "low_confidence" | "out_of_range" | "not_configured" | "vision_error"; transcription?: Transcription }

const MAX_TOKENS = 2000
const TIMEOUT_MS = 30_000

const PROMPT =
  'You transcribe instrument displays. List every number shown on this device screen with the label or unit printed next to it. ' +
  'Do not interpret or compute anything. Reply with JSON only: {"device": string|null, "readings":[{"id":"r1","value":number,"unit":string|null,"label":string|null}]}'

/** Pull the first JSON object out of a model reply (tolerates code fences). */
export function extractJson(text: string): unknown {
  const fenced = /```(?:json)?\s*([\s\S]*?)```/.exec(text)
  const body = fenced ? fenced[1]! : text
  const start = body.indexOf("{")
  const end = body.lastIndexOf("}")
  if (start < 0 || end <= start) throw new Error("no json")
  return JSON.parse(body.slice(start, end + 1))
}

export function toFahrenheit(value: number, unit: string | null | undefined): number {
  const u = (unit ?? "").toLowerCase()
  return u.includes("c") && !u.includes("f") ? (value * 9) / 5 + 32 : value
}

export async function transcribe(opts: { apiKey: string; model: string; imageDataUrl: string; appUrl: string; fetchImpl?: typeof fetch }): Promise<Transcription> {
  const res = await (opts.fetchImpl ?? fetch)("https://openrouter.ai/api/v1/chat/completions", {
    method: "POST",
    headers: {
      Authorization: `Bearer ${opts.apiKey}`,
      "Content-Type": "application/json",
      "HTTP-Referer": opts.appUrl,
      "X-Title": "Flagline",
    },
    body: JSON.stringify({
      model: opts.model,
      temperature: 0,
      // GLM vision models reason before answering; keep reasoning short and out of the reply.
      max_tokens: MAX_TOKENS,
      reasoning: { effort: "low", exclude: true },
      messages: [{ role: "user", content: [{ type: "text", text: PROMPT }, { type: "image_url", image_url: { url: opts.imageDataUrl } }] }],
    }),
    signal: AbortSignal.timeout(TIMEOUT_MS),
  })
  if (!res.ok) throw new Error(`vision HTTP ${res.status}: ${(await res.text()).slice(0, 200)}`)
  const json = (await res.json()) as { choices?: { message?: { content?: string }; finish_reason?: string }[] }
  const content = json.choices?.[0]?.message?.content ?? ""
  if (!content.trim()) throw new Error(`vision reply empty (finish_reason ${json.choices?.[0]?.finish_reason ?? "unknown"})`)
  return Transcription.parse(extractJson(content))
}

export async function selectWbgt(jev: TypeSafeClient | null, t: Transcription): Promise<{ id: string | null; confidence: number; isHeatScreen: number; model: string | null }> {
  if (t.readings.length === 0) return { id: null, confidence: 0, isHeatScreen: 0, model: null }
  const labelled = t.readings.find((r) => /wbgt/i.test(`${r.label ?? ""} ${r.unit ?? ""}`))
  if (!jev) return { id: labelled?.id ?? null, confidence: labelled ? 0.8 : 0, isHeatScreen: labelled ? 1 : 0, model: null }
  const options = Object.fromEntries(t.readings.map((r) => [r.id, `${r.value} ${r.unit ?? ""} (${r.label ?? "no label"})`]))
  const res = await jev.systemOne({
    model: JEV_MODEL,
    state: { device: t.device ?? null, readings: t.readings },
    questions: {
      wbgt: choice("Which reading in `readings` is the wet bulb globe temperature (WBGT)?", { ...options, none: "None of them is WBGT" }),
      is_heat_screen: noul("Do `device` and `readings` look like a WBGT or heat stress meter display?"),
    },
  })
  const a = res.answers as { wbgt: { choice: string; confidence: number }; is_heat_screen: { noul: number } }
  return { id: a.wbgt.choice === "none" ? null : a.wbgt.choice, confidence: a.wbgt.confidence, isHeatScreen: a.is_heat_screen.noul, model: res.model }
}

export function finalize(t: Transcription, sel: { id: string | null; confidence: number; isHeatScreen: number; model: string | null }, forecastF: number | null, visionModel: string): MeterResult {
  if (t.readings.length === 0) return { status: "manual", reason: "no_numbers", transcription: t }
  const reading = t.readings.find((r) => r.id === sel.id)
  if (!reading || sel.confidence < SELECT_CONFIDENCE_MIN) return { status: "manual", reason: "low_confidence", transcription: t }
  const valueF = Math.round(toFahrenheit(reading.value, reading.unit) * 10) / 10
  if (valueF < MIN_F || valueF > MAX_F) return { status: "manual", reason: "out_of_range", transcription: t }
  return {
    status: "ok",
    valueF,
    confidence: sel.confidence,
    isHeatScreen: sel.isHeatScreen,
    // A measured value is never rejected for being hotter than the forecast; it is only flagged for a double-check.
    farFromForecast: forecastF !== null && Math.abs(valueF - forecastF) > PLAUSIBILITY_DELTA_F,
    transcription: t,
    visionModel,
    jevModel: sel.model,
  }
}
