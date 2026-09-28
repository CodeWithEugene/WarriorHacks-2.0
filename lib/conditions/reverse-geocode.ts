import * as z from "zod"

import { getJson } from "./http"

const NominatimReverse = z.object({
  name: z.string().optional(),
  address: z
    .object({
      neighbourhood: z.string().optional(),
      suburb: z.string().optional(),
      city_district: z.string().optional(),
      city: z.string().optional(),
      town: z.string().optional(),
      village: z.string().optional(),
      hamlet: z.string().optional(),
      county: z.string().optional(),
      state: z.string().optional(),
      country: z.string().optional(),
      country_code: z.string().optional(),
    })
    .optional(),
})

export type ReversePlace = { name: string; region: string; countryCode: string | null }

/** Round to about 100 m so nearby requests share a cache entry and we never forward a precise fix. */
const COORD_DECIMALS = 3

/** Pick a short place name and a region line from a Nominatim reverse response. */
export function parseReverse(json: unknown): ReversePlace | null {
  const r = NominatimReverse.parse(json)
  const a = r.address
  if (!a) return null
  const locality = a.city ?? a.town ?? a.village ?? a.hamlet ?? null
  const local = a.suburb ?? a.neighbourhood ?? a.city_district ?? null
  const name = local ?? locality ?? a.county ?? r.name ?? null
  if (!name) return null
  const region = [locality !== name ? locality : null, a.county !== name ? a.county : null, a.state, a.country]
    .filter((s): s is string => Boolean(s))
    .join(", ")
  return { name, region, countryCode: a.country_code?.toUpperCase() ?? null }
}

/** Name the place at a coordinate via OpenStreetMap Nominatim (server-side, cached a day). */
export async function reverseGeocode(lat: number, lon: number, language = "en"): Promise<ReversePlace | null> {
  const url =
    `https://nominatim.openstreetmap.org/reverse?format=jsonv2&zoom=14&addressdetails=1` +
    `&lat=${lat.toFixed(COORD_DECIMALS)}&lon=${lon.toFixed(COORD_DECIMALS)}&accept-language=${encodeURIComponent(language)}`
  return parseReverse(await getJson("reverse-geocode", url, 86_400))
}
