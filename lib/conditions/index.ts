import "server-only"

import { DEFAULT_REGION, type RegionRef } from "@/lib/rules"

import { type CombinedHour, combineHours } from "./combine"
import { fetchNwsForecast, type NwsForecast } from "./nws"
import { type AqiForecast, fetchAirQuality, fetchOpenMeteo } from "./openmeteo"

export type { CombinedHour } from "./combine"

export type SourceStatus = { ok: boolean; issuedAt?: string; detail?: string }

export type Conditions = {
  lat: number
  lon: number
  region: RegionRef
  fetchedAt: string
  hours: CombinedHour[]
  currentAqi: number | null
  sources: { nws: SourceStatus; model: SourceStatus; airQuality: SourceStatus }
}

function settle<T>(p: Promise<T>): Promise<{ ok: true; value: T } | { ok: false; error: string }> {
  return p.then(
    (value) => ({ ok: true as const, value }),
    (e: unknown) => ({ ok: false as const, error: e instanceof Error ? e.message : "failed" }),
  )
}

/** Combined heat and air-quality forecast for a location. Degrades gracefully if a source fails. */
export async function getConditions(lat: number, lon: number, region: RegionRef = DEFAULT_REGION): Promise<Conditions> {
  const [nws, weather, aq] = await Promise.all([settle(fetchNwsForecast(lat, lon)), settle(fetchOpenMeteo(lat, lon)), settle(fetchAirQuality(lat, lon))])
  const nwsData: NwsForecast | null = nws.ok ? nws.value : null
  const aqData: AqiForecast | null = aq.ok ? aq.value : null
  const hours = combineHours({
    lat,
    lon,
    region,
    weather: weather.ok ? weather.value : [],
    nws: nwsData?.hours ?? null,
    aqi: aqData?.hours ?? null,
  })
  return {
    lat,
    lon,
    region,
    fetchedAt: new Date().toISOString(),
    hours,
    currentAqi: aqData?.currentAqi ?? null,
    sources: {
      nws: nws.ok ? { ok: true, issuedAt: nws.value.issuedAt, detail: `${nws.value.grid.wfo} ${nws.value.grid.x},${nws.value.grid.y}` } : { ok: false, detail: nws.error },
      model: weather.ok ? { ok: weather.value.length > 0 } : { ok: false, detail: weather.error },
      airQuality: aq.ok ? { ok: true } : { ok: false, detail: aq.error },
    },
  }
}
