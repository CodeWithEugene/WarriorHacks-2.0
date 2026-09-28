/**
 * Practice session limits under the UIL rules and FAQ:
 * - A reading is required within 15 minutes before practice, then every 30 minutes.
 * - When the level worsens, the stricter limits apply immediately; time already practiced counts.
 * - When the level improves, practice is not extended automatically.
 * Practice time runs from when players report to the area until they leave it.
 */
import { DEFAULT_REGION, getRuleSet, LEVEL_RANK, levelFor, requirementsFor, type RegionRef, type Sport } from "./index"
import type { Level } from "./schema"

export type SessionReading = { at: Date; wbgtF: number }

export type SessionInput = {
  start: Date
  plannedMinutes: number
  sport: Sport
  readings: readonly SessionReading[]
  region?: RegionRef
}

export type SessionLimits = {
  /** Most restrictive level seen so far (drives the allowed end). */
  maxLevel: Level
  /** Level of the latest reading. */
  currentLevel: Level
  allowedEnd: Date
  plannedEnd: Date
  minutesInLevel: Record<Level, number>
  /** True when the latest reading is lower than the most restrictive level seen. */
  noAutoExtend: boolean
  nextReadingDue: Date
  overdue: boolean
  /** True when the current level forbids outdoor practice (black). */
  suspended: boolean
  /** True when the reached-mid-practice orange football exception applies. */
  reachedOrangeMidPractice: boolean
}

const MINUTE = 60_000

export function sessionLimits(input: SessionInput, now: Date): SessionLimits {
  const region = input.region ?? DEFAULT_REGION
  const rs = getRuleSet(region.ruleSetId)
  const readings = [...input.readings].sort((a, b) => a.at.getTime() - b.at.getTime())
  const plannedEnd = new Date(input.start.getTime() + input.plannedMinutes * MINUTE)
  const minutesInLevel: Record<Level, number> = { green: 0, yellow: 0, orange: 0, red: 0, black: 0 }

  if (readings.length === 0) {
    return {
      maxLevel: "green",
      currentLevel: "green",
      allowedEnd: plannedEnd,
      plannedEnd,
      minutesInLevel,
      noAutoExtend: false,
      nextReadingDue: new Date(input.start.getTime() - rs.timing.precheckWithinMinutes * MINUTE),
      overdue: now.getTime() >= input.start.getTime(),
      suspended: false,
      reachedOrangeMidPractice: false,
    }
  }

  let maxLevel: Level = "green"
  let allowedEnd = plannedEnd
  let reachedOrangeMidPractice = false
  readings.forEach((r, i) => {
    const level = levelFor(r.wbgtF, region)
    if (LEVEL_RANK[level] > LEVEL_RANK[maxLevel]) {
      maxLevel = level
      if (level === "orange" && r.at > input.start) reachedOrangeMidPractice = true
    }
    const cap = requirementsFor(level, input.sport, region).maxPracticeMinutes
    if (cap !== null) {
      const capEnd = new Date(input.start.getTime() + cap * MINUTE)
      if (capEnd < allowedEnd) allowedEnd = capEnd
    }
    // Time spent under this reading's level, clipped to the practice window up to now.
    const segStart = Math.max(r.at.getTime(), input.start.getTime())
    const nextAt = readings[i + 1]?.at.getTime() ?? now.getTime()
    const segEnd = Math.min(nextAt, now.getTime(), plannedEnd.getTime())
    if (segEnd > segStart) minutesInLevel[level] += (segEnd - segStart) / MINUTE
  })

  const latest = readings[readings.length - 1]!
  const currentLevel = levelFor(latest.wbgtF, region)
  const nextReadingDue = new Date(latest.at.getTime() + rs.timing.recheckEveryMinutes * MINUTE)
  const overdue = now.getTime() > nextReadingDue.getTime() + rs.timing.graceMinutes * MINUTE

  return {
    maxLevel,
    currentLevel,
    allowedEnd,
    plannedEnd,
    minutesInLevel,
    noAutoExtend: LEVEL_RANK[currentLevel] < LEVEL_RANK[maxLevel],
    nextReadingDue,
    overdue,
    suspended: !requirementsFor(currentLevel, input.sport, region).outdoorAllowed,
    reachedOrangeMidPractice,
  }
}
