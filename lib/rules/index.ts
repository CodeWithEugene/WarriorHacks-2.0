import ksiJson from "./rulesets/ksi-2015.json"
import uilJson from "./rulesets/uil-2026-27.json"
import { type Breaks, type Level, type LevelOrUnknown, type LevelRequirement, LEVELS, RuleSet } from "./schema"

export * from "./schema"

export const UIL_2026 = RuleSet.parse(uilJson)
export const KSI_2015 = RuleSet.parse(ksiJson)
export type RuleSetId = "uil-2026-27" | "ksi-2015"
export const RULESETS: Record<RuleSetId, RuleSet> = { "uil-2026-27": UIL_2026, "ksi-2015": KSI_2015 }

export type RegionRef = { ruleSetId: RuleSetId; regionId: string }
export const DEFAULT_REGION: RegionRef = { ruleSetId: "uil-2026-27", regionId: "class3" }

export const SPORTS = [
  "football",
  "marching_band",
  "soccer",
  "cross_country",
  "track_field",
  "tennis",
  "baseball",
  "softball",
  "pe",
  "other",
] as const
export type Sport = (typeof SPORTS)[number]

/** Readings are rounded to 0.1 F before comparison, matching the chart's resolution. */
export function roundTenth(f: number): number {
  return Math.round(f * 10) / 10
}

export function getRuleSet(id: string): RuleSet {
  const rs = RULESETS[id as RuleSetId]
  if (!rs) throw new Error(`Unknown rule set: ${id}`)
  return rs
}

function bandsFor(rs: RuleSet, regionId: string) {
  const region = rs.regions.find((r) => r.id === regionId)
  if (!region) throw new Error(`Unknown region ${regionId} in ${rs.id}`)
  return region.bands
}

/** The flag level for a WBGT value (F) under a rule set and region. */
export function levelFor(wbgtF: number, ref: RegionRef = DEFAULT_REGION): Level {
  const value = roundTenth(wbgtF)
  const bands = bandsFor(getRuleSet(ref.ruleSetId), ref.regionId)
  let level: Level = "green"
  for (const band of bands) {
    if (band.minF !== null && value >= band.minF) level = band.level
  }
  return level
}

/** Lower bound (F) of the next stricter level, or null at black. */
export function nextBoundary(level: Level, ref: RegionRef = DEFAULT_REGION): number | null {
  const bands = bandsFor(getRuleSet(ref.ruleSetId), ref.regionId)
  const idx = LEVELS.indexOf(level)
  const next = bands[idx + 1]
  return next?.minF ?? null
}

/** Planning values within this distance below the next level are borderline. */
export const BORDERLINE_F = 1.0

export function isBorderline(wbgtF: number, ref: RegionRef = DEFAULT_REGION): boolean {
  const boundary = nextBoundary(levelFor(wbgtF, ref), ref)
  return boundary !== null && boundary - roundTenth(wbgtF) <= BORDERLINE_F
}

export const LEVEL_RANK: Record<LevelOrUnknown, number> = {
  unknown: -1,
  green: 0,
  yellow: 1,
  orange: 2,
  red: 3,
  black: 4,
}

export function stricter(a: LevelOrUnknown, b: LevelOrUnknown): LevelOrUnknown {
  return LEVEL_RANK[a] >= LEVEL_RANK[b] ? a : b
}

export type GearRule = "full" | "helmet_shoulder_pads_shorts" | "helmet_shoulder_pads_pants" | "none"

export type Requirements = {
  level: Level
  maxPracticeMinutes: number | null
  breaks: Breaks
  coolingZoneRequired: boolean
  outdoorAllowed: boolean
  football?: { gear: GearRule; conditioningAllowed: boolean }
  discretionNote?: string
  sourceQuote: string
  sourceUrl: string
}

function requirementRow(rs: RuleSet, level: Level): LevelRequirement {
  const row = rs.requirements.find((r) => r.level === level)
  if (!row) throw new Error(`Missing requirement for ${level} in ${rs.id}`)
  return row
}

/**
 * What the rules require at a level for a sport.
 * `reachedMidPractice` enables the UIL orange exception: football players may keep pants on
 * when orange is reached during practice.
 */
export function requirementsFor(
  level: Level,
  sport: Sport,
  ref: RegionRef = DEFAULT_REGION,
  ctx: { reachedMidPractice?: boolean } = {},
): Requirements {
  const rs = getRuleSet(ref.ruleSetId)
  const row = requirementRow(rs, level)
  const base: Requirements = {
    level,
    maxPracticeMinutes: row.maxPracticeMinutes,
    breaks: row.breaks,
    coolingZoneRequired: row.coolingZoneRequired,
    outdoorAllowed: row.outdoorAllowed,
    discretionNote: row.discretionNote,
    sourceQuote: row.sourceQuote,
    sourceUrl: rs.sources[0]!.url,
  }
  if (sport !== "football" || !row.football) return base
  const gear: GearRule =
    row.football.gear === "helmet_shoulder_pads_shorts" && row.football.pantsIfReachedMidPractice && ctx.reachedMidPractice
      ? "helmet_shoulder_pads_pants"
      : row.football.gear
  return { ...base, football: { gear, conditioningAllowed: row.football.conditioningAllowed } }
}

/** Minimum rest minutes required per hour at a level. */
export function restMinutesPerHour(breaks: Breaks): number {
  if (breaks.kind === "count") return breaks.perHour * breaks.minMinutes
  if (breaks.kind === "total") return breaks.minutesPerHour
  return 0
}

/** Evenly spaced break slots within one hour (minutes from the start of the hour). */
export function breakSlots(breaks: Breaks): { startMinute: number; minutes: number }[] {
  if (breaks.kind === "none") return []
  const count = breaks.kind === "count" ? breaks.perHour : 4
  const minutes = breaks.kind === "count" ? breaks.minMinutes : breaks.minutesPerHour / count
  const spacing = 60 / count
  return Array.from({ length: count }, (_, i) => ({ startMinute: Math.round(spacing * (i + 1) - minutes), minutes }))
}
