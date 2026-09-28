"use server"

import { headers } from "next/headers"
import * as z from "zod"

import { parsePlan, type ParsedPlan } from "@/lib/ai/ask-core"
import { getJev } from "@/lib/ai/jev"
import { getConditions } from "@/lib/conditions"
import type { PracticeState } from "@/lib/practice/state"
import { rateLimit } from "@/lib/rate-limit"
import { levelFor, SPORTS, type Sport } from "@/lib/rules"
import { bestWindows, evaluatePlan, type PlanEvaluation, type WindowOption } from "@/lib/rules/plan"
import { createPractice, createTeam, getTeamByCoachToken, resolveCheckIn, savePracticeState } from "@/lib/teams"

async function ip(): Promise<string> {
  const h = await headers()
  return h.get("x-forwarded-for")?.split(",")[0]?.trim() ?? "local"
}

const NewTeamInput = z.object({
  name: z.string().trim().min(2).max(60),
  school: z.string().trim().max(80).optional(),
  sport: z.enum(SPORTS),
  regionId: z.enum(["class2", "class3"]),
  placeName: z.string().trim().min(2).max(120),
  lat: z.number().min(-90).max(90),
  lon: z.number().min(-180).max(180),
  timeZone: z.string().min(3).max(64),
})

export type ActionResult<T> = { ok: true; data: T } | { ok: false; error: string }

export async function createTeamAction(input: z.input<typeof NewTeamInput>): Promise<ActionResult<{ coachToken: string; slug: string }>> {
  if (!rateLimit(`team:${await ip()}`, 10, 3_600_000).ok) return { ok: false, error: "rate_limited" }
  const parsed = NewTeamInput.safeParse(input)
  if (!parsed.success) return { ok: false, error: "invalid" }
  const { team, coachToken } = await createTeam({ ...parsed.data, school: parsed.data.school || null })
  return { ok: true, data: { coachToken, slug: team.slug } }
}

export type AskResult = {
  parsed: ParsedPlan
  evaluation: PlanEvaluation | null
  windows: WindowOption[]
  nowLevel: { level: string; value: number } | null
}

const AskInput = z.object({ coachToken: z.string().min(16).max(64), text: z.string().trim().min(3).max(300), locale: z.enum(["en", "es"]) })
const DEFAULT_MINUTES = 120
const DAY_START_HOUR = 6
const DAY_END_HOUR = 21

function localDayBounds(at: number, timeZone: string): { start: number; end: number } {
  // Find local midnight by stepping back the local hour and minute.
  const parts = new Intl.DateTimeFormat("en-US", { timeZone, hour: "numeric", minute: "numeric", hourCycle: "h23" }).formatToParts(at)
  const h = Number(parts.find((p) => p.type === "hour")?.value ?? 0)
  const m = Number(parts.find((p) => p.type === "minute")?.value ?? 0)
  const midnight = at - (h * 60 + m) * 60_000
  return { start: midnight + DAY_START_HOUR * 3_600_000, end: midnight + DAY_END_HOUR * 3_600_000 }
}

export async function askFlaglineAction(input: z.input<typeof AskInput>): Promise<ActionResult<AskResult>> {
  const parsedInput = AskInput.safeParse(input)
  if (!parsedInput.success) return { ok: false, error: "invalid" }
  if (!rateLimit(`ask:${parsedInput.data.coachToken}`, 20, 60_000).ok) return { ok: false, error: "rate_limited" }
  const team = await getTeamByCoachToken(parsedInput.data.coachToken)
  if (!team) return { ok: false, error: "not_found" }
  const region = { ruleSetId: team.ruleSetId as "uil-2026-27", regionId: team.regionId }
  const now = new Date()
  const [parsed, conditions] = await Promise.all([
    parsePlan(getJev(), { text: parsedInput.data.text, now, timeZone: team.timeZone, locale: parsedInput.data.locale, sport: team.sport }),
    getConditions(team.lat, team.lon, region),
  ])
  const hours = conditions.hours.filter((h) => h.planningF !== null).map((h) => ({ t: h.t, wbgtF: h.planningF! }))
  const current = hours.find((h) => h.t <= now.getTime() && now.getTime() < h.t + 3_600_000)
  const nowLevel = current ? { level: levelFor(current.wbgtF, region), value: current.wbgtF } : null
  const minutes = parsed.minutes ?? DEFAULT_MINUTES
  const plan = { start: parsed.start ?? now.getTime(), minutes, sport: team.sport as Sport, gear: parsed.gear, conditioning: parsed.conditioning }
  const evaluation = parsed.start !== null ? evaluatePlan(hours, plan, region) : null
  const dayAnchor = parsed.start ?? parsed.day ?? now.getTime()
  const bounds = localDayBounds(dayAnchor, team.timeZone)
  const windows =
    parsed.intent === "rules_now" ? [] : bestWindows(hours, plan, region, { dayStart: Math.max(bounds.start, now.getTime()), dayEnd: bounds.end })
  return { ok: true, data: { parsed, evaluation, windows, nowLevel } }
}

const StartInput = z.object({
  coachToken: z.string().min(16).max(64),
  label: z.string().trim().min(2).max(60),
  plannedStart: z.number().int().positive(),
  plannedMinutes: z.number().int().min(15).max(240),
})

export async function startPracticeAction(input: z.input<typeof StartInput>): Promise<ActionResult<{ practiceId: string }>> {
  const parsed = StartInput.safeParse(input)
  if (!parsed.success) return { ok: false, error: "invalid" }
  const team = await getTeamByCoachToken(parsed.data.coachToken)
  if (!team) return { ok: false, error: "not_found" }
  const practice = await createPractice(team, { team: parsed.data.label, plannedStart: parsed.data.plannedStart, plannedMinutes: parsed.data.plannedMinutes })
  return { ok: true, data: { practiceId: practice.id } }
}

const StateShape = z
  .object({
    phase: z.enum(["setup", "precheck", "active", "ended"]),
    readings: z.array(z.object({ at: z.number(), wbgtF: z.number().min(30).max(130) })).max(200),
    log: z.array(z.object({ at: z.number(), kind: z.string() })).max(1000),
  })
  .passthrough()

export async function syncPracticeAction(coachToken: string, practiceId: string, state: PracticeState): Promise<ActionResult<null>> {
  if (!rateLimit(`sync:${coachToken}`, 120, 60_000).ok) return { ok: false, error: "rate_limited" }
  if (!StateShape.safeParse(state).success) return { ok: false, error: "invalid" }
  const team = await getTeamByCoachToken(coachToken)
  if (!team) return { ok: false, error: "not_found" }
  const ok = await savePracticeState(team, practiceId, state)
  return ok ? { ok: true, data: null } : { ok: false, error: "not_found" }
}

export async function resolveCheckInAction(coachToken: string, practiceId: string, checkInId: string): Promise<ActionResult<null>> {
  const team = await getTeamByCoachToken(coachToken)
  if (!team) return { ok: false, error: "not_found" }
  return (await resolveCheckIn(team, practiceId, checkInId)) ? { ok: true, data: null } : { ok: false, error: "not_found" }
}
