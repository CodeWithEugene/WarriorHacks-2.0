import * as z from "zod"

import type { HourlyWeather } from "@/lib/heat"

import { getJson } from "./http"

const nums = z.array(z.number().nullable())

const ForecastResponse = z.object({
  hourly: z.object({
    time: z.array(z.string()),
    temperature_2m: nums,
    relative_humidity_2m: nums,
    surface_pressure: nums,
    wind_speed_10m: nums,
    shortwave_radiation_instant: nums,
    direct_radiation_instant: nums,
  }),
})

const AirQualityResponse = z.object({
  current: z.object({ time: z.string(), us_aqi: z.number().nullable(), pm2_5: z.number().nullable(), ozone: z.number().nullable() }).optional(),
  hourly: z.object({ time: z.array(z.string()), us_aqi: nums }).optional(),
})

const HOURLY_VARS = [
  "temperature_2m",
  "relative_humidity_2m",
  "surface_pressure",
  "wind_speed_10m",
  "shortwave_radiation_instant",
  "direct_radiation_instant",
].join(",")

export function parseOpenMeteo(json: unknown): HourlyWeather[] {
  const h = ForecastResponse.parse(json).hourly
  const out: HourlyWeather[] = []
  h.time.forEach((ts, i) => {
    const tempC = h.temperature_2m[i]
    const rhPct = h.relative_humidity_2m[i]
    const pressureHpa = h.surface_pressure[i]
    const wind10mMs = h.wind_speed_10m[i]
    const shortwaveWm2 = h.shortwave_radiation_instant[i]
    const directWm2 = h.direct_radiation_instant[i]
    if ([tempC, rhPct, pressureHpa, wind10mMs, shortwaveWm2, directWm2].some((v) => v === null || v === undefined)) return
    out.push({
      time: new Date(`${ts}Z`),
      tempC: tempC!,
      rhPct: rhPct!,
      pressureHpa: pressureHpa!,
      wind10mMs: wind10mMs!,
      shortwaveWm2: shortwaveWm2!,
      directWm2: directWm2!,
    })
  })
  return out
}

export async function fetchOpenMeteo(lat: number, lon: number, days = 8): Promise<HourlyWeather[]> {
  const url =
    `https://api.open-meteo.com/v1/forecast?latitude=${lat.toFixed(2)}&longitude=${lon.toFixed(2)}` +
    `&hourly=${HOURLY_VARS}&wind_speed_unit=ms&timezone=UTC&forecast_days=${days}`
  return parseOpenMeteo(await getJson("open-meteo", url, 1800))
}

export type AqiForecast = { currentAqi: number | null; hours: Map<number, number>; pm25: number | null; ozone: number | null }

export async function fetchAirQuality(lat: number, lon: number): Promise<AqiForecast> {
  const url =
    `https://air-quality-api.open-meteo.com/v1/air-quality?latitude=${lat.toFixed(2)}&longitude=${lon.toFixed(2)}` +
    `&current=us_aqi,pm2_5,ozone&hourly=us_aqi&timezone=UTC&forecast_days=5`
  const r = AirQualityResponse.parse(await getJson("open-meteo-aq", url, 3600))
  const hours = new Map<number, number>()
  r.hourly?.time.forEach((ts, i) => {
    const v = r.hourly?.us_aqi[i]
    if (v !== null && v !== undefined) hours.set(Date.parse(`${ts}Z`), v)
  })
  return { currentAqi: r.current?.us_aqi ?? null, hours, pm25: r.current?.pm2_5 ?? null, ozone: r.current?.ozone ?? null }
}
