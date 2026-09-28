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
        country_code: z.string().optional(),
        postcodes: z.array(z.string()).optional(),
      }),
    )
    .optional(),
})

export type Place = { id: string; name: string; region: string; lat: number; lon: number; timeZone: string }

/** Place search (US) via Open-Meteo Geocoding. */
export async function searchPlaces(query: string): Promise<Place[]> {
  const url = `https://geocoding-api.open-meteo.com/v1/search?name=${encodeURIComponent(query)}&count=8&language=en&format=json&countryCode=US`
  const r = GeoResponse.parse(await getJson("geocode", url, 86_400))
  return (r.results ?? []).map((p) => ({
    id: String(p.id),
    name: p.name,
    region: [p.admin2, p.admin1].filter(Boolean).join(", "),
    lat: p.latitude,
    lon: p.longitude,
    timeZone: p.timezone ?? "America/Chicago",
  }))
}
