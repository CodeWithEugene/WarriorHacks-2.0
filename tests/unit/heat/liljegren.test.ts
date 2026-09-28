import { describe, expect, it } from "vitest"

import reference from "@/tests/fixtures/thermofeel-reference.json"
import { cosZenith, modelWbgt, wbgtLiljegren } from "@/lib/heat"

type Case = (typeof reference.cases)[number]

const base = {
  tempC: 35,
  rhPct: 45,
  pressureHpa: 990,
  wind10mMs: 3,
  shortwaveWm2: 800,
  fdir: 0.8,
  cosZenith: 0.8,
}

describe("wbgtLiljegren matches the thermofeel reference", () => {
  it.each(reference.cases.map((c: Case) => [`${c.city} ${c.time}`, c] as const))(
    "%s",
    (_label, c) => {
      const { wbgtC } = wbgtLiljegren({
        tempC: c.tempC,
        rhPct: c.rhPct,
        pressureHpa: c.pressureHpa,
        wind10mMs: c.wind10mMs,
        shortwaveWm2: c.shortwaveWm2,
        fdir: c.fdir,
        cosZenith: c.cosZenith,
      })
      expect(Math.abs(wbgtC - c.expectedWbgtC)).toBeLessThan(0.1)
    },
  )
})

describe("wbgtLiljegren physical properties", () => {
  it("increases with humidity", () => {
    const low = wbgtLiljegren({ ...base, rhPct: 30 }).wbgtC
    const high = wbgtLiljegren({ ...base, rhPct: 70 }).wbgtC
    expect(high).toBeGreaterThan(low)
  })

  it("increases with solar radiation", () => {
    const shade = wbgtLiljegren({ ...base, shortwaveWm2: 100, fdir: 0 }).wbgtC
    const sun = wbgtLiljegren({ ...base, shortwaveWm2: 900 }).wbgtC
    expect(sun).toBeGreaterThan(shade)
  })

  it("does not increase with more wind in sun", () => {
    const calm = wbgtLiljegren({ ...base, wind10mMs: 1 }).wbgtC
    const windy = wbgtLiljegren({ ...base, wind10mMs: 8 }).wbgtC
    expect(windy).toBeLessThanOrEqual(calm)
  })

  it("has no solar term at night", () => {
    const night = { ...base, shortwaveWm2: 0, fdir: 0, cosZenith: -0.3 }
    const r = wbgtLiljegren(night)
    expect(Number.isFinite(r.wbgtC)).toBe(true)
    expect(r.wbgtC).toBeLessThan(base.tempC)
  })

  it("never returns NaN across a grid of realistic inputs", () => {
    for (const tempC of [10, 20, 30, 40, 45]) {
      for (const rhPct of [5, 30, 60, 95]) {
        for (const wind10mMs of [0, 1, 5, 12]) {
          for (const shortwaveWm2 of [0, 300, 1000]) {
            const r = wbgtLiljegren({ ...base, tempC, rhPct, wind10mMs, shortwaveWm2, cosZenith: shortwaveWm2 > 0 ? 0.7 : -0.1 })
            expect(Number.isFinite(r.wbgtC)).toBe(true)
          }
        }
      }
    }
  })
})

describe("cosZenith (NOAA solar position)", () => {
  it("is near its maximum around solar noon in Austin in late September", () => {
    // Solar noon in Austin (97.74 W) is about 18:40 UTC.
    const noon = cosZenith(new Date("2026-09-28T18:40:00Z"), 30.2672, -97.7431)
    // Zenith at solar noon is about latitude minus declination (30.27 - (-1.9)) = 32.2 degrees.
    expect(noon).toBeGreaterThan(Math.cos((33 * Math.PI) / 180))
    expect(noon).toBeLessThan(Math.cos((31 * Math.PI) / 180))
  })

  it("is negative at local midnight", () => {
    expect(cosZenith(new Date("2026-09-29T06:40:00Z"), 30.2672, -97.7431)).toBeLessThan(0)
  })
})

describe("modelWbgt", () => {
  it("gives a shade value at or below the sun value", () => {
    const r = modelWbgt(
      { time: new Date("2026-09-28T21:00:00Z"), tempC: 36, rhPct: 40, pressureHpa: 988, wind10mMs: 3, shortwaveWm2: 650, directWm2: 520 },
      30.2672,
      -97.7431,
    )
    expect(r).not.toBeNull()
    expect(r!.shadeF).toBeLessThanOrEqual(r!.sunF)
  })
})
