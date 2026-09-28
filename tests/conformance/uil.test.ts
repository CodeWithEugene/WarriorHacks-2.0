/**
 * UIL 2026-27 conformance. Expected values are transcribed independently from the official
 * UIL "WBGT Activity Guidelines" chart (https://www.uiltexas.org/files/athletics/25-26WBGTChart.png),
 * not derived from our JSON, so a transcription error in the rule set fails CI.
 */
import { describe, expect, it } from "vitest"

import { aqiRequirements } from "@/lib/rules/aqi"
import { breakSlots, isBorderline, levelFor, requirementsFor, restMinutesPerHour } from "@/lib/rules"
import { lightningState } from "@/lib/rules/lightning"
import { sessionLimits } from "@/lib/rules/session"
import { suggestTexasClass } from "@/lib/rules/texas-class"

const C3 = { ruleSetId: "uil-2026-27", regionId: "class3" } as const
const C2 = { ruleSetId: "uil-2026-27", regionId: "class2" } as const
const K1 = { ruleSetId: "ksi-2015", regionId: "ksi1" } as const
const K2 = { ruleSetId: "ksi-2015", regionId: "ksi2" } as const
const K3 = { ruleSetId: "ksi-2015", regionId: "ksi3" } as const

const class3: [number, string][] = [
  [60, "green"], [81.9, "green"], [81.94, "green"], [81.95, "yellow"], [82.0, "yellow"], [84.5, "yellow"], [86.9, "yellow"],
  [86.95, "orange"], [87.0, "orange"], [88.5, "orange"], [90.0, "orange"], [90.1, "red"], [91.0, "red"], [92.0, "red"],
  [92.1, "black"], [95, "black"], [110, "black"],
]
const class2: [number, string][] = [
  [60, "green"], [79.6, "green"], [79.7, "yellow"], [84.6, "yellow"], [84.7, "orange"], [87.6, "orange"],
  [87.7, "red"], [89.7, "red"], [89.8, "black"], [100, "black"],
]
const ksi: [typeof K1 | typeof K2 | typeof K3, number, string][] = [
  [K1, 76.1, "green"], [K1, 76.2, "yellow"], [K1, 81.1, "yellow"], [K1, 81.2, "orange"], [K1, 84.1, "orange"], [K1, 84.2, "red"], [K1, 86.0, "red"], [K1, 86.1, "black"],
  [K2, 79.7, "green"], [K2, 79.8, "yellow"], [K2, 84.6, "yellow"], [K2, 84.7, "orange"], [K2, 87.6, "orange"], [K2, 87.7, "red"], [K2, 89.6, "red"], [K2, 89.7, "black"],
  [K3, 82.2, "green"], [K3, 82.3, "yellow"], [K3, 87.0, "yellow"], [K3, 87.1, "orange"], [K3, 90.0, "orange"], [K3, 90.1, "red"], [K3, 92.0, "red"], [K3, 92.1, "black"],
]

describe("levelFor: UIL Class 3", () => {
  it.each(class3)("%s F is %s", (f, level) => expect(levelFor(f, C3)).toBe(level))
})
describe("levelFor: UIL Class 2", () => {
  it.each(class2)("%s F is %s", (f, level) => expect(levelFor(f, C2)).toBe(level))
})
describe("levelFor: KSI categories", () => {
  it.each(ksi)("%o %s F is %s", (ref, f, level) => expect(levelFor(f, ref)).toBe(level))
})

describe("requirementsFor (UIL chart text)", () => {
  it("green: normal, 3 breaks of 3 minutes, no cap", () => {
    const r = requirementsFor("green", "soccer", C3)
    expect(r.maxPracticeMinutes).toBeNull()
    expect(r.breaks).toEqual({ kind: "count", perHour: 3, minMinutes: 3 })
    expect(r.coolingZoneRequired).toBe(false)
  })
  it("yellow: 3 breaks of 4 minutes, cooling zone required", () => {
    const r = requirementsFor("yellow", "marching_band", C3)
    expect(r.breaks).toEqual({ kind: "count", perHour: 3, minMinutes: 4 })
    expect(r.coolingZoneRequired).toBe(true)
    expect(r.maxPracticeMinutes).toBeNull()
  })
  it("orange: 2 hours max, 4 breaks of 4 minutes, football shells and shorts", () => {
    const r = requirementsFor("orange", "football", C3)
    expect(r.maxPracticeMinutes).toBe(120)
    expect(r.breaks).toEqual({ kind: "count", perHour: 4, minMinutes: 4 })
    expect(r.football?.gear).toBe("helmet_shoulder_pads_shorts")
    expect(r.coolingZoneRequired).toBe(true)
  })
  it("orange reached mid-practice: football may keep pants", () => {
    expect(requirementsFor("orange", "football", C3, { reachedMidPractice: true }).football?.gear).toBe("helmet_shoulder_pads_pants")
  })
  it("red: 1 hour max, 20 minutes rest per hour, no football equipment, no conditioning", () => {
    const r = requirementsFor("red", "football", C3)
    expect(r.maxPracticeMinutes).toBe(60)
    expect(r.breaks).toEqual({ kind: "total", minutesPerHour: 20 })
    expect(r.football).toEqual({ gear: "none", conditioningAllowed: false })
  })
  it("black: no outdoor workouts", () => {
    const r = requirementsFor("black", "cross_country", C3)
    expect(r.outdoorAllowed).toBe(false)
    expect(r.maxPracticeMinutes).toBe(0)
  })
  it("non-football sports get no football block", () => {
    expect(requirementsFor("red", "marching_band", C3).football).toBeUndefined()
  })
  it("rest minutes and break slots", () => {
    expect(restMinutesPerHour({ kind: "count", perHour: 4, minMinutes: 4 })).toBe(16)
    expect(restMinutesPerHour({ kind: "total", minutesPerHour: 20 })).toBe(20)
    expect(breakSlots({ kind: "total", minutesPerHour: 20 }).reduce((s, b) => s + b.minutes, 0)).toBe(20)
    expect(breakSlots({ kind: "count", perHour: 3, minMinutes: 3 })).toHaveLength(3)
  })
})

describe("borderline", () => {
  it("flags values within 1.0 F below the next level", () => {
    expect(isBorderline(86.0, C3)).toBe(true)
    expect(isBorderline(85.9, C3)).toBe(false)
    expect(isBorderline(93, C3)).toBe(false)
  })
})

describe("sessionLimits (UIL FAQ behavior)", () => {
  const start = new Date("2026-09-28T20:45:00Z") // 3:45 PM CDT
  const at = (min: number) => new Date(start.getTime() + min * 60_000)

  it("orange at the pre-check caps practice at 2 hours", () => {
    const s = sessionLimits({ start, plannedMinutes: 150, sport: "football", readings: [{ at: at(-7), wbgtF: 87.6 }] }, at(10))
    expect(s.currentLevel).toBe("orange")
    expect(s.allowedEnd).toEqual(at(120))
  })

  it("worsening to red mid-practice applies the 1 hour cap from the start", () => {
    const s = sessionLimits(
      { start, plannedMinutes: 120, sport: "football", readings: [{ at: at(-5), wbgtF: 86 }, { at: at(30), wbgtF: 90.4 }] },
      at(35),
    )
    expect(s.maxLevel).toBe("red")
    expect(s.allowedEnd).toEqual(at(60))
  })

  it("improving does not extend practice automatically", () => {
    const s = sessionLimits(
      { start, plannedMinutes: 150, sport: "football", readings: [{ at: at(-5), wbgtF: 87.6 }, { at: at(60), wbgtF: 86.3 }] },
      at(65),
    )
    expect(s.currentLevel).toBe("yellow")
    expect(s.noAutoExtend).toBe(true)
    expect(s.allowedEnd).toEqual(at(120))
  })

  it("tracks the next reading and overdue state (30 minutes plus 2 minutes grace)", () => {
    const readings = [{ at: at(-5), wbgtF: 84 }]
    expect(sessionLimits({ start, plannedMinutes: 90, sport: "soccer", readings }, at(26)).overdue).toBe(false)
    expect(sessionLimits({ start, plannedMinutes: 90, sport: "soccer", readings }, at(28)).overdue).toBe(true)
  })

  it("marks orange reached mid-practice for the football pants exception", () => {
    const s = sessionLimits(
      { start, plannedMinutes: 120, sport: "football", readings: [{ at: at(-5), wbgtF: 85 }, { at: at(30), wbgtF: 87.2 }] },
      at(31),
    )
    expect(s.reachedOrangeMidPractice).toBe(true)
  })

  it("black suspends outdoor practice", () => {
    expect(sessionLimits({ start, plannedMinutes: 60, sport: "soccer", readings: [{ at: at(-5), wbgtF: 92.4 }] }, at(0)).suspended).toBe(true)
  })

  it("accumulates time in each level", () => {
    const s = sessionLimits(
      { start, plannedMinutes: 120, sport: "soccer", readings: [{ at: at(-5), wbgtF: 87.5 }, { at: at(30), wbgtF: 85 }] },
      at(60),
    )
    expect(Math.round(s.minutesInLevel.orange)).toBe(30)
    expect(Math.round(s.minutesInLevel.yellow)).toBe(30)
  })
})

describe("AQI presets", () => {
  it("EPA schools", () => {
    expect(aqiRequirements(40).action).toBe("normal")
    expect(aqiRequirements(120).action).toBe("reduce")
    expect(aqiRequirements(175).action).toBe("move_or_reschedule")
    expect(aqiRequirements(220).outdoorAllowed).toBe(false)
  })
  it("strict youth (WA/OR 2026)", () => {
    expect(aqiRequirements(120, "strict-youth").maxMinutes).toBe(60)
    expect(aqiRequirements(151, "strict-youth").outdoorAllowed).toBe(false)
  })
})

describe("lightning 30-minute resetting hold", () => {
  const t0 = new Date("2026-09-28T21:00:00Z")
  const plus = (m: number) => new Date(t0.getTime() + m * 60_000)
  it("holds for 30 minutes after the last event and resets on each new one", () => {
    expect(lightningState([{ at: t0 }], plus(29)).hold).toBe(true)
    expect(lightningState([{ at: t0 }], plus(30)).hold).toBe(false)
    const s = lightningState([{ at: t0 }, { at: plus(20) }], plus(35))
    expect(s.hold).toBe(true)
    expect(s.resumesAt).toEqual(plus(50))
  })
})

describe("Texas class suggestion", () => {
  it("Austin, Houston, Dallas, El Paso are Class 3", () => {
    for (const [lat, lon] of [[30.2672, -97.7431], [29.7604, -95.3698], [32.7767, -96.797], [31.7619, -106.485]] as const) {
      expect(suggestTexasClass(lat, lon).regionId).toBe("class3")
    }
  })
  it("Amarillo and Lubbock are Class 2", () => {
    expect(suggestTexasClass(35.222, -101.8313).regionId).toBe("class2")
    expect(suggestTexasClass(33.5779, -101.8552).regionId).toBe("class2")
  })
})
