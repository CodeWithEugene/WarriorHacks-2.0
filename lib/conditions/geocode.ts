import * as z from "zod"

import { getJson } from "./http"

const GeoResponse = z.object({
  results: z
    .array(
      z.object({
        id: z.number(),
        name: z.string(),
        latitude: z.number(),
        longitude: z.number(),
        timezone: z.string().optional(),
        admin1: z.string().optional(),
        admin2: z.string().optional(),
        country: z.string().optional(),
        country_code: z.string().optional(),
        postcodes: z.array(z.string()).optional(),
      }),
    )
    .optional(),
})

export type Place = { id: string; name: string; region: string; lat: number; lon: number; timeZone: string }

/** Place search via Open-Meteo Geocoding (US results first). */
export async function searchPlaces(query: string): Promise<Place[]> {
  const url = `https://geocoding-api.open-meteo.com/v1/search?name=${encodeURIComponent(query)}&count=8&language=en&format=json`
  const r = GeoResponse.parse(await getJson("geocode", url, 86_400))
  const results = [...(r.results ?? [])].sort((a, b) => Number(b.country_code === "US") - Number(a.country_code === "US"))
  return results.map((p) => ({
    id: String(p.id),
    name: p.name,
    region: [p.admin2, p.admin1, p.country_code === "US" ? null : p.country].filter(Boolean).join(", "),
    lat: p.latitude,
    lon: p.longitude,
    timeZone: p.timezone ?? "America/Chicago",
  }))
}
