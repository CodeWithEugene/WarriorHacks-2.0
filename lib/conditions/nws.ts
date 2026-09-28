import * as z from "zod"

import { getJson } from "./http"

const HOUR = 3_600_000

const PointsResponse = z.object({
  properties: z.object({ gridId: z.string(), gridX: z.number(), gridY: z.number() }),
})

const Series = z
  .object({
    uom: z.string().optional(),
    values: z.array(z.object({ validTime: z.string(), value: z.number().nullable() })),
  })
  .optional()

const GridResponse = z.object({
  properties: z.object({
    updateTime: z.string(),
    wetBulbGlobeTemperature: Series,
    heatRisk: Series,
    probabilityOfThunder: Series,
  }),
})

export type NwsGrid = { wfo: string; x: number; y: number }
export type NwsHour = { t: number; wbgtF?: number; heatRisk?: number; thunderPct?: number }
export type NwsForecast = { grid: NwsGrid; issuedAt: string; hours: Map<number, NwsHour> }

/** Parse an ISO 8601 duration like PT2H or P1DT3H into hours. */
export function durationHours(iso: string): number {
  const m = /^P(?:(\d+)D)?(?:T(?:(\d+)H)?(?:(\d+)M)?)?$/.exec(iso)
  if (!m) return 1
  const [, d, h, min] = m
  return Number(d ?? 0) * 24 + Number(h ?? 0) + Number(min ?? 0) / 60
}

/** Expand "2026-09-25T06:00:00+00:00/PT2H" style values into one entry per hour (epoch ms). */
export function expandSeries(series: z.infer<typeof Series>): Map<number, number> {
  const out = new Map<number, number>()
  if (!series) return out
  const isCelsius = series.uom?.includes("degC") ?? false
  for (const v of series.values) {
    if (v.value === null) continue
    const [start, dur] = v.validTime.split("/")
    const t0 = Date.parse(start!)
    const hours = Math.max(1, Math.round(durationHours(dur ?? "PT1H")))
    const value = isCelsius ? (v.value * 9) / 5 + 32 : v.value
    for (let i = 0; i < hours; i++) out.set(t0 + i * HOUR, value)
  }
  return out
}

export async function resolveGrid(lat: number, lon: number): Promise<NwsGrid> {
  const json = await getJson("nws", `https://api.weather.gov/points/${lat.toFixed(4)},${lon.toFixed(4)}`, 86_400)
  const p = PointsResponse.parse(json).properties
  return { wfo: p.gridId, x: p.gridX, y: p.gridY }
}

export function parseGrid(grid: NwsGrid, json: unknown): NwsForecast {
  const p = GridResponse.parse(json).properties
  const wbgt = expandSeries(p.wetBulbGlobeTemperature)
  const heatRisk = expandSeries(p.heatRisk)
  const thunder = expandSeries(p.probabilityOfThunder)
  const hours = new Map<number, NwsHour>()
  for (const t of new Set([...wbgt.keys(), ...heatRisk.keys(), ...thunder.keys()])) {
    hours.set(t, { t, wbgtF: wbgt.get(t), heatRisk: heatRisk.get(t), thunderPct: thunder.get(t) })
  }
  return { grid, issuedAt: p.updateTime, hours }
}

export async function fetchNwsForecast(lat: number, lon: number): Promise<NwsForecast> {
  const grid = await resolveGrid(lat, lon)
  const json = await getJson("nws", `https://api.weather.gov/gridpoints/${grid.wfo}/${grid.x},${grid.y}`, 1800)
  return parseGrid(grid, json)
}
