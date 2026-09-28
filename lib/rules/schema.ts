import * as z from "zod"

export const LEVELS = ["green", "yellow", "orange", "red", "black"] as const
export const Level = z.enum(LEVELS)
export type Level = z.infer<typeof Level>
export type LevelOrUnknown = Level | "unknown"

export const LevelBand = z.object({
  level: Level,
  /** Lower bound in F WBGT (inclusive). null for the lowest band. */
  minF: z.number().nullable(),
})

export const Breaks = z.discriminatedUnion("kind", [
  z.object({ kind: z.literal("count"), perHour: z.number().int().positive(), minMinutes: z.number().positive() }),
  z.object({ kind: z.literal("total"), minutesPerHour: z.number().positive() }),
  z.object({ kind: z.literal("none") }),
])
export type Breaks = z.infer<typeof Breaks>

export const FootballGear = z.enum(["full", "helmet_shoulder_pads_shorts", "none"])
export type FootballGear = z.infer<typeof FootballGear>

export const LevelRequirement = z.object({
  level: Level,
  /** null means normal limits apply (no heat-specific cap). */
  maxPracticeMinutes: z.number().int().nonnegative().nullable(),
  breaks: Breaks,
  coolingZoneRequired: z.boolean(),
  outdoorAllowed: z.boolean(),
  football: z
    .object({
      gear: FootballGear,
      pantsIfReachedMidPractice: z.boolean(),
      conditioningAllowed: z.boolean(),
    })
    .optional(),
  discretionNote: z.string().optional(),
  sourceQuote: z.string(),
})
export type LevelRequirement = z.infer<typeof LevelRequirement>

export const RuleSet = z.object({
  id: z.string(),
  name: z.string(),
  version: z.string(),
  effectiveFrom: z.string(),
  effectiveTo: z.string().nullable(),
  sources: z.array(z.object({ title: z.string(), url: z.url(), retrieved: z.string() })).min(1),
  regions: z
    .array(z.object({ id: z.string(), label: z.string(), bands: z.array(LevelBand).length(5) }))
    .min(1),
  requirements: z.array(LevelRequirement).length(5),
  timing: z.object({
    precheckWithinMinutes: z.number().int().positive(),
    recheckEveryMinutes: z.number().int().positive(),
    graceMinutes: z.number().int().nonnegative(),
  }),
})
export type RuleSet = z.infer<typeof RuleSet>
