import { describe, expect, it } from "vitest"

import { breaksThisHour, initialState, practiceReducer, toCsv, type PracticeAction, type PracticeState } from "@/lib/practice/state"

const T0 = Date.parse("2026-09-28T20:45:00Z")
const min = (m: number) => T0 + m * 60_000

function run(actions: PracticeAction[], from: PracticeState = initialState()): PracticeState {
  return actions.reduce(practiceReducer, from)
}

const setup: PracticeAction = {
  type: "setup",
  team: "Varsity Football",
  sport: "football",
  region: { ruleSetId: "uil-2026-27", regionId: "class3" },
  plannedMinutes: 120,
  plannedStart: T0,
}

describe("practiceReducer", () => {
  it("moves from setup to precheck to active", () => {
    const s = run([setup, { type: "reading", wbgtF: 87.6, source: "measured", at: min(-7) }, { type: "start", at: T0 }])
    expect(s.phase).toBe("active")
    expect(s.readings[0]?.level).toBe("orange")
  })

  it("raises a pending level change only when the level worsens during practice", () => {
    const s = run([
      setup,
      { type: "reading", wbgtF: 86.0, source: "measured", at: min(-5) },
      { type: "start", at: T0 },
      { type: "reading", wbgtF: 87.2, source: "measured", at: min(30) },
    ])
    expect(s.pendingLevelChange).toEqual({ from: "yellow", to: "orange", at: min(30) })
    const improved = run([{ type: "confirmLevel", at: min(31) }, { type: "reading", wbgtF: 85, source: "measured", at: min(60) }], s)
    expect(improved.pendingLevelChange).toBeNull()
  })

  it("marks readings late after 30 minutes plus grace", () => {
    const s = run([
      setup,
      { type: "reading", wbgtF: 80, source: "measured", at: min(-5) },
      { type: "start", at: T0 },
      { type: "reading", wbgtF: 80, source: "measured", at: min(40) },
    ])
    expect(s.readings[1]?.onTime).toBe(false)
  })

  it("tracks breaks and counts breaks in the current hour", () => {
    const s = run([
      setup,
      { type: "reading", wbgtF: 83, source: "measured", at: min(-5) },
      { type: "start", at: T0 },
      { type: "breakStart", at: min(15) },
      { type: "breakEnd", at: min(19) },
      { type: "breakStart", at: min(35) },
      { type: "breakEnd", at: min(39) },
    ])
    expect(s.breaks).toHaveLength(2)
    expect(breaksThisHour(s, min(50))).toBe(2)
    expect(breaksThisHour(s, min(70))).toBe(0)
  })

  it("ignores a second break start while one is open", () => {
    const s = run([setup, { type: "start", at: T0 }, { type: "breakStart", at: min(10) }, { type: "breakStart", at: min(11) }])
    expect(s.breaks).toHaveLength(1)
  })

  it("ends the practice, closes open breaks and signs the log", () => {
    const s = run([setup, { type: "start", at: T0 }, { type: "breakStart", at: min(100) }, { type: "end", at: min(110), initials: "JR" }])
    expect(s.phase).toBe("ended")
    expect(s.breaks[0]?.end).toBe(min(110))
    expect(s.log.at(-1)).toMatchObject({ kind: "end", data: { initials: "JR" } })
  })

  it("exports a CSV log", () => {
    const s = run([setup, { type: "reading", wbgtF: 87.6, source: "measured", at: min(-7) }, { type: "start", at: T0 }, { type: "end", at: min(60), initials: "JR" }])
    const csv = toCsv(s)
    expect(csv).toContain("timestamp_iso,event,wbgt_f,source,level,on_time,detail")
    expect(csv).toContain("87.6,measured,orange,true")
    expect(csv).toContain("signed JR")
  })
})
