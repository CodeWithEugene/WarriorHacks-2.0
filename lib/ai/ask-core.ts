/**
 * Ask Flagline: plain-language practice plans to typed parameters.
 * Deterministic pre-parse (chrono-node) finds candidate times and durations; one Jev request
 * with parallel Choice and Noul questions picks intent, gear, conditioning and the right candidates.
 * Anything below the confidence gate becomes a question for the coach, never a guess.
 */
import type { TypeSafeClient } from "@typesafe-ai/sdk"
import { choice, noul } from "@typesafe-ai/sdk"
import * as chrono from "chrono-node"

import type { PlanGear } from "@/lib/rules/plan"

export const CONFIDENCE_MIN = 0.6
const JEV_MODEL = "jev-latest"

export type Intent = "check_plan" | "find_best_window" | "rules_now" | "other"
export type Candidate = { id: string; label: string; value: number }
export type ParsedPlan = {
  intent: Intent
  start: number | null
  minutes: number | null
  gear: PlanGear
  conditioning: boolean
  /** Epoch ms somewhere on the day the coach referred to ("tomorrow"), or null for today. */
  day: number | null
  lowConfidence: ("intent" | "gear" | "start" | "minutes")[]
  model: string | null
}

function offsetMinutes(timeZone: string, at: Date): number {
  const parts = new Intl.DateTimeFormat("en-US", { timeZone, timeZoneName: "shortOffset" }).formatToParts(at)
  const name = parts.find((p) => p.type === "timeZoneName")?.value ?? "GMT"
  const m = /GMT([+-]\d{1,2})(?::(\d{2}))?/.exec(name)
  if (!m) return 0
  const h = Number(m[1])
  return h * 60 + Math.sign(h || 1) * Number(m[2] ?? 0)
}

const DURATION_RE = /(\d+(?:[.,]\d+)?|an|a|one|half an|una|media)\s*(hours?|hrs?|h|horas?|minutes?|mins?|minutos?)\b/gi
const WORD_NUM: Record<string, number> = { an: 1, a: 1, one: 1, una: 1, "half an": 0.5, media: 0.5 }

/**
 * Deterministic candidates for start times, durations and the day.
 * Duration phrases are removed before date parsing so "2 hours" is never read as "in 2 hours".
 * An unstated AM or PM between 1 and 6 means PM (practice hours).
 */
export function extractCandidates(
  text: string,
  now: Date,
  timeZone: string,
  locale: string,
): { starts: Candidate[]; durations: Candidate[]; day: number | null } {
  const durations: Candidate[] = []
  for (const m of text.matchAll(DURATION_RE)) {
    const raw = m[1]!.toLowerCase()
    const n = WORD_NUM[raw] ?? Number(raw.replace(",", "."))
    const unit = m[2]!.toLowerCase()
    const minutes = Math.round(unit.startsWith("h") ? n * 60 : n)
    if (minutes >= 15 && minutes <= 300) durations.push({ id: `r${durations.length}`, label: `${minutes} minutes`, value: minutes })
  }
  const stripped = text.replace(DURATION_RE, " ")
  const parser = locale === "es" ? chrono.es : chrono
  const results = parser.parse(stripped, { instant: now, timezone: offsetMinutes(timeZone, now) }, { forwardDate: true })
  const fmt = new Intl.DateTimeFormat(locale, { weekday: "short", hour: "numeric", minute: "2-digit", timeZone })
  const starts: Candidate[] = []
  let day: number | null = null
  results.forEach((r, i) => {
    let start = r.start.date().getTime()
    let end = r.end?.date().getTime() ?? null
    if (day === null && (r.start.isCertain("day") || r.start.isCertain("weekday"))) day = start
    if (!r.start.isCertain("hour")) return
    const hour = r.start.get("hour") ?? 12
    if (!r.start.isCertain("meridiem") && hour >= 1 && hour <= 6) {
      start += 12 * 3_600_000
      if (end !== null) end += 12 * 3_600_000
      // forwardDate may have pushed an AM time to tomorrow; if the PM time today is still ahead, use today.
      const dayGiven = r.start.isCertain("day") || r.start.isCertain("weekday")
      if (!dayGiven && start - 86_400_000 > now.getTime()) {
        start -= 86_400_000
        if (end !== null) end -= 86_400_000
      }
    }
    starts.push({ id: `s${i}`, label: fmt.format(start), value: start })
    if (day === null) day = start
    if (end !== null && end > start) durations.unshift({ id: `d${i}`, label: `${Math.round((end - start) / 60_000)} minutes`, value: Math.round((end - start) / 60_000) })
  })
  return { starts, durations, day }
}

type AnswerMap = Record<string, { choice?: string; confidence?: number; noul?: number } | undefined>

export async function parsePlan(jev: TypeSafeClient | null, input: { text: string; now: Date; timeZone: string; locale: string; sport: string }): Promise<ParsedPlan> {
  const { starts, durations, day } = extractCandidates(input.text, input.now, input.timeZone, input.locale)
  const fallback: ParsedPlan = {
    intent: starts.length > 0 ? "check_plan" : "find_best_window",
    start: starts[0]?.value ?? null,
    minutes: durations[0]?.value ?? null,
    gear: /full pads|full gear|equipo completo/i.test(input.text) ? "full_pads" : "unspecified",
    conditioning: /condition|sprint|gasser|acondicionamiento/i.test(input.text),
    day,
    lowConfidence: [],
    model: null,
  }
  if (!jev) return fallback

  const questions = {
    intent: choice("What does the coach want to do in `request`?", {
      check_plan: "Check whether a specific planned practice time is allowed and what must change",
      find_best_window: "Find the best time to hold a practice",
      rules_now: "Know the rules or conditions right now",
      other: "Something else",
    }),
    gear: choice("What equipment does `request` plan for the players to wear?", {
      full_pads: "Full pads or full gear",
      helmet_shoulder_pads_shorts: "Helmet, shoulder pads and shorts (shells)",
      helmet_only: "Helmets only",
      no_equipment: "No protective equipment",
      unspecified: "Equipment is not mentioned",
    }),
    conditioning: noul("Does `request` plan conditioning, sprints, gassers or running drills?"),
    ...(starts.length > 1
      ? { start: choice("Which option is the practice start time the coach means in `request`?", Object.fromEntries(starts.map((s) => [s.id, s.label]))) }
      : {}),
    ...(durations.length > 1
      ? { minutes: choice("Which option is the practice length the coach means in `request`?", Object.fromEntries(durations.map((d) => [d.id, d.label]))) }
      : {}),
  }
  try {
    const res = await jev.systemOne({ model: JEV_MODEL, state: { request: input.text, sport: input.sport, today: input.now.toISOString() }, questions })
    const a = res.answers as AnswerMap
    const low: ParsedPlan["lowConfidence"] = []
    const pick = <T extends string>(key: "intent" | "gear" | "start" | "minutes", fb: T): T => {
      const ans = a[key]
      if (!ans?.choice) return fb
      if ((ans.confidence ?? 0) < CONFIDENCE_MIN) low.push(key)
      return ans.choice as T
    }
    const picked = pick<Intent>("intent", fallback.intent)
    // A low-confidence intent falls back to what the typed facts support.
    const intent: Intent = low.includes("intent") ? fallback.intent : picked
    const gear = pick<PlanGear>("gear", fallback.gear)
    const startId = starts.length > 1 ? pick("start", starts[0]!.id) : starts[0]?.id
    const minutesId = durations.length > 1 ? pick("minutes", durations[0]!.id) : durations[0]?.id
    return {
      intent,
      gear,
      conditioning: (a.conditioning?.noul ?? 0) >= 0.5,
      start: starts.find((s) => s.id === startId)?.value ?? null,
      minutes: durations.find((d) => d.id === minutesId)?.value ?? null,
      day,
      lowConfidence: low,
      model: res.model,
    }
  } catch {
    return fallback
  }
}
