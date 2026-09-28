import { type HourlyWeather, modelWbgt } from "@/lib/heat"
import { isBorderline, levelFor, type LevelOrUnknown, type RegionRef, roundTenth } from "@/lib/rules"

import type { NwsHour } from "./nws"

export type CombinedHour = {
  /** Epoch ms at the start of the hour (UTC). */
  t: number
  nwsF: number | null
  modelSunF: number | null
  modelShadeF: number | null
  /** Planning WBGT: the higher of the available forecast sources. */
  planningF: number | null
  range: [number, number] | null
  level: LevelOrUnknown
  borderline: boolean
  singleSource: boolean
  aqi: number | null
  thunderPct: number | null
  heatRisk: number | null
}

const HOUR = 3_600_000

export function combineHours(input: {
  lat: number
  lon: number
  region: RegionRef
  weather: readonly HourlyWeather[]
  nws: ReadonlyMap<number, NwsHour> | null
  aqi: ReadonlyMap<number, number> | null
}): CombinedHour[] {
  const model = new Map<number, { sunF: number; shadeF: number }>()
  for (const w of input.weather) {
    const m = modelWbgt(w, input.lat, input.lon)
    if (m) model.set(w.time.getTime(), m)
  }
  const times = new Set<number>([...model.keys(), ...(input.nws ? [...input.nws.keys()] : [])])
  const sorted = [...times].filter((t) => t % HOUR === 0).sort((a, b) => a - b)

  return sorted.map((t) => {
    const m = model.get(t)
    const n = input.nws?.get(t)
    const nwsF = n?.wbgtF ?? null
    const sources = [nwsF, m?.sunF ?? null].filter((v): v is number => v !== null)
    const planningF = sources.length > 0 ? roundTenth(Math.max(...sources)) : null
    const low = [...sources, m?.shadeF ?? Number.POSITIVE_INFINITY].reduce((a, b) => Math.min(a, b), Number.POSITIVE_INFINITY)
    const range: [number, number] | null = planningF === null ? null : [roundTenth(Math.min(low, planningF)), planningF]
    return {
      t,
      nwsF: nwsF === null ? null : roundTenth(nwsF),
      modelSunF: m ? roundTenth(m.sunF) : null,
      modelShadeF: m ? roundTenth(m.shadeF) : null,
      planningF,
      range,
      level: planningF === null ? "unknown" : levelFor(planningF, input.region),
      borderline: planningF !== null && isBorderline(planningF, input.region),
      singleSource: sources.length === 1,
      aqi: input.aqi?.get(t) ?? null,
      thunderPct: n?.thunderPct ?? null,
      heatRisk: n?.heatRisk ?? null,
    }
  })
}
