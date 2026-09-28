/**
 * Evaluate a planned practice against an hourly forecast, and find better windows.
 * Pure and deterministic: AI only fills the typed PlanInput (lib/ai/ask).
 */
import { LEVEL_RANK, levelFor, requirementsFor, type RegionRef, type Sport } from "./index"
import type { Level } from "./schema"

export type ForecastHour = { t: number; wbgtF: number }
export type PlanGear = "full_pads" | "helmet_shoulder_pads_shorts" | "helmet_only" | "no_equipment" | "unspecified"
export type PlanInput = { start: number; minutes: number; sport: Sport; gear: PlanGear; conditioning: boolean }

export type Conflict =
  | { kind: "black" }
  | { kind: "too_long"; maxMinutes: number }
  | { kind: "gear"; allowed: "helmet_shoulder_pads_shorts" | "none" }
  | { kind: "conditioning" }
  | { kind: "no_forecast" }

export type PlanEvaluation = {
  maxLevel: Level | null
  levels: { t: number; level: Level; wbgtF: number }[]
  allowedMinutes: number | null
  conflicts: Conflict[]
}

const HOUR = 3_600_000
const STEP = 30 * 60_000

function hoursCovering(hours: readonly ForecastHour[], start: number, minutes: number): ForecastHour[] {
  const end = start + minutes * 60_000
  return hours.filter((h) => h.t + HOUR > start && h.t < end)
}

export function evaluatePlan(hours: readonly ForecastHour[], plan: PlanInput, region: RegionRef): PlanEvaluation {
  const covered = hoursCovering(hours, plan.start, plan.minutes)
  if (covered.length === 0) return { maxLevel: null, levels: [], allowedMinutes: null, conflicts: [{ kind: "no_forecast" }] }
  const levels = covered.map((h) => ({ t: h.t, level: levelFor(h.wbgtF, region), wbgtF: h.wbgtF }))
  const maxLevel = levels.reduce<Level>((m, l) => (LEVEL_RANK[l.level] > LEVEL_RANK[m] ? l.level : m), "green")
  const req = requirementsFor(maxLevel, plan.sport, region)
  const conflicts: Conflict[] = []
  if (!req.outdoorAllowed) conflicts.push({ kind: "black" })
  else if (req.maxPracticeMinutes !== null && plan.minutes > req.maxPracticeMinutes) conflicts.push({ kind: "too_long", maxMinutes: req.maxPracticeMinutes })
  if (plan.sport === "football" && req.football && req.outdoorAllowed) {
    const g = req.football.gear
    if (g === "helmet_shoulder_pads_shorts" && plan.gear === "full_pads") conflicts.push({ kind: "gear", allowed: g })
    if (g === "none" && plan.gear !== "no_equipment" && plan.gear !== "unspecified") conflicts.push({ kind: "gear", allowed: "none" })
    if (!req.football.conditioningAllowed && plan.conditioning) conflicts.push({ kind: "conditioning" })
  }
  return { maxLevel, levels, allowedMinutes: req.outdoorAllowed ? req.maxPracticeMinutes : 0, conflicts }
}

export type WindowOption = { start: number; maxLevel: Level; restrictiveHours: number; evaluation: PlanEvaluation }

/**
 * Rank alternative start times on the same local day as the plan (06:00 to 20:30 local,
 * in 30-minute steps): lowest flag first, then fewer hours at orange or above, then closest to the request.
 */
export function bestWindows(hours: readonly ForecastHour[], plan: PlanInput, region: RegionRef, opts: { dayStart: number; dayEnd: number; limit?: number }): WindowOption[] {
  const out: WindowOption[] = []
  for (let s = opts.dayStart; s + plan.minutes * 60_000 <= opts.dayEnd; s += STEP) {
    const evaluation = evaluatePlan(hours, { ...plan, start: s }, region)
    if (evaluation.maxLevel === null || evaluation.maxLevel === "black") continue
    const restrictiveHours = evaluation.levels.filter((l) => LEVEL_RANK[l.level] >= LEVEL_RANK.orange).length
    out.push({ start: s, maxLevel: evaluation.maxLevel, restrictiveHours, evaluation })
  }
  out.sort(
    (a, b) =>
      LEVEL_RANK[a.maxLevel] - LEVEL_RANK[b.maxLevel] ||
      a.restrictiveHours - b.restrictiveHours ||
      Math.abs(a.start - plan.start) - Math.abs(b.start - plan.start),
  )
  // Keep options at least an hour apart so suggestions are meaningfully different.
  const picked: WindowOption[] = []
  for (const w of out) {
    if (picked.every((p) => Math.abs(p.start - w.start) >= HOUR)) picked.push(w)
    if (picked.length >= (opts.limit ?? 3)) break
  }
  return picked
}
