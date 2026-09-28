import { describe, expect, it } from "vitest"

import { bestWindows, evaluatePlan, type ForecastHour } from "@/lib/rules/plan"

const C3 = { ruleSetId: "uil-2026-27", regionId: "class3" } as const
const day = Date.parse("2026-09-29T11:00:00Z") // 6 AM CDT
const H = 3_600_000
// A typical hot Austin day: green morning, orange afternoon, yellow evening (values in F WBGT)
const profile = [72, 74, 77, 80, 83, 86, 88, 89, 88.5, 87.5, 86, 84, 82, 80, 78, 76]
const hours: ForecastHour[] = profile.map((wbgtF, i) => ({ t: day + i * H, wbgtF }))
const at = (hourIndex: number) => day + hourIndex * H

describe("evaluatePlan", () => {
  it("flags full pads and a too-long practice in orange", () => {
    const e = evaluatePlan(hours, { start: at(8), minutes: 150, sport: "football", gear: "full_pads", conditioning: false }, C3)
    expect(e.maxLevel).toBe("orange")
    expect(e.conflicts).toContainEqual({ kind: "too_long", maxMinutes: 120 })
    expect(e.conflicts).toContainEqual({ kind: "gear", allowed: "helmet_shoulder_pads_shorts" })
  })
  it("has no conflicts for an early green practice", () => {
    const e = evaluatePlan(hours, { start: at(0), minutes: 120, sport: "football", gear: "full_pads", conditioning: true }, C3)
    expect(e.maxLevel).toBe("green")
    expect(e.conflicts).toEqual([])
  })
  it("reports missing forecast", () => {
    expect(evaluatePlan(hours, { start: at(40), minutes: 60, sport: "soccer", gear: "unspecified", conditioning: false }, C3).conflicts).toEqual([{ kind: "no_forecast" }])
  })
})

describe("bestWindows", () => {
  it("prefers the green morning and returns distinct options", () => {
    const w = bestWindows(hours, { start: at(10), minutes: 120, sport: "football", gear: "full_pads", conditioning: false }, C3, { dayStart: at(0), dayEnd: at(16) })
    expect(w[0]?.maxLevel).toBe("green")
    expect(w.length).toBeGreaterThan(1)
    for (let i = 1; i < w.length; i++) expect(Math.abs(w[i]!.start - w[0]!.start)).toBeGreaterThanOrEqual(H)
  })
})
