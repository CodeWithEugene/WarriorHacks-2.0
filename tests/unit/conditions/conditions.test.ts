import { describe, expect, it } from "vitest"

import nwsFixture from "@/tests/fixtures/nws-gridpoint-ewx-156-91.json"
import omFixture from "@/tests/fixtures/openmeteo-austin.json"
import { combineHours } from "@/lib/conditions/combine"
import { durationHours, expandSeries, parseGrid } from "@/lib/conditions/nws"
import { parseOpenMeteo } from "@/lib/conditions/openmeteo"
import { DEFAULT_REGION } from "@/lib/rules"

const AUSTIN = { lat: 30.2672, lon: -97.7431 }

describe("NWS parsing", () => {
  it("parses ISO durations", () => {
    expect(durationHours("PT1H")).toBe(1)
    expect(durationHours("PT3H")).toBe(3)
    expect(durationHours("P1DT6H")).toBe(30)
  })

  it("expands multi-hour intervals and converts Celsius to Fahrenheit", () => {
    const m = expandSeries({ uom: "wmoUnit:degC", values: [{ validTime: "2026-09-28T18:00:00+00:00/PT2H", value: 30 }] })
    expect(m.size).toBe(2)
    expect(m.get(Date.parse("2026-09-28T19:00:00Z"))).toBeCloseTo(86, 5)
  })

  it("parses the recorded gridpoint response", () => {
    const f = parseGrid({ wfo: "EWX", x: 156, y: 91 }, nwsFixture)
    expect(f.hours.size).toBeGreaterThan(100)
    const values = [...f.hours.values()].map((h) => h.wbgtF).filter((v): v is number => v !== undefined)
    expect(Math.min(...values)).toBeGreaterThan(40)
    expect(Math.max(...values)).toBeLessThan(100)
  })
})

describe("Open-Meteo parsing", () => {
  it("parses the recorded forecast into complete hourly inputs", () => {
    const hours = parseOpenMeteo(omFixture)
    expect(hours.length).toBeGreaterThan(150)
    expect(hours[0]!.time.toISOString()).toMatch(/Z$/)
  })
})

describe("combineHours", () => {
  const nws = parseGrid({ wfo: "EWX", x: 156, y: 91 }, nwsFixture).hours
  const weather = parseOpenMeteo(omFixture)
  const hours = combineHours({ ...AUSTIN, region: DEFAULT_REGION, weather, nws, aqi: null })

  it("uses the higher of the two sources for planning", () => {
    const both = hours.filter((h) => h.nwsF !== null && h.modelSunF !== null)
    expect(both.length).toBeGreaterThan(50)
    for (const h of both) expect(h.planningF).toBe(Math.max(h.nwsF!, h.modelSunF!))
  })

  it("assigns a level to every hour with data and a range that contains the planning value", () => {
    for (const h of hours) {
      if (h.planningF === null) continue
      expect(h.level).not.toBe("unknown")
      expect(h.range![0]).toBeLessThanOrEqual(h.planningF)
      expect(h.range![1]).toBe(h.planningF)
    }
  })

  it("marks hours with only one source", () => {
    const onlyModel = combineHours({ ...AUSTIN, region: DEFAULT_REGION, weather, nws: null, aqi: null })
    expect(onlyModel.every((h) => h.singleSource || h.planningF === null)).toBe(true)
  })
})
