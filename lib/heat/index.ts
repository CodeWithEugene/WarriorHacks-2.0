import { wbgtLiljegren } from "./liljegren"
import { cosZenith } from "./solar"

export { wbgtLiljegren, windSpeed2m } from "./liljegren"
export { cosZenith } from "./solar"

export const cToF = (c: number): number => (c * 9) / 5 + 32
export const fToC = (f: number): number => ((f - 32) * 5) / 9

export type HourlyWeather = {
  time: Date
  tempC: number
  rhPct: number
  pressureHpa: number
  wind10mMs: number
  shortwaveWm2: number
  directWm2: number
}

export type ModelWbgt = { sunF: number; shadeF: number }

/**
 * Flagline model WBGT for one time step, in sun and in shade (diffuse light only).
 * Returns null when the physics does not converge (should not happen for real weather).
 */
export function modelWbgt(w: HourlyWeather, lat: number, lon: number): ModelWbgt | null {
  const cz = cosZenith(w.time, lat, lon)
  const shortwave = Math.max(0, w.shortwaveWm2)
  const fdir = shortwave > 0 ? Math.max(0, w.directWm2) / shortwave : 0
  const base = {
    tempC: w.tempC,
    rhPct: w.rhPct,
    pressureHpa: w.pressureHpa,
    wind10mMs: w.wind10mMs,
    cosZenith: cz,
  }
  const sun = wbgtLiljegren({ ...base, shortwaveWm2: shortwave, fdir })
  const diffuse = shortwave * (1 - Math.min(0.9, fdir))
  const shade = wbgtLiljegren({ ...base, shortwaveWm2: diffuse, fdir: 0 })
  if (!Number.isFinite(sun.wbgtC) || !Number.isFinite(shade.wbgtC)) return null
  return { sunF: cToF(sun.wbgtC), shadeF: cToF(shade.wbgtC) }
}
