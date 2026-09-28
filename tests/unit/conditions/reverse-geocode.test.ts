import { describe, expect, it } from "vitest"

import { parseReverse } from "@/lib/conditions/reverse-geocode"
import { suggestTexasClass } from "@/lib/rules/texas-class"

describe("reverse geocoding", () => {
  it("names a neighborhood and lists the city, county, state and country", () => {
    const place = parseReverse({
      name: "Westlands",
      address: { suburb: "Westlands", city: "Nairobi", county: "Nairobi County", country: "Kenya", country_code: "ke" },
    })
    expect(place).toEqual({ name: "Westlands", region: "Nairobi, Nairobi County, Kenya", countryCode: "KE" })
  })

  it("uses the town when there is no neighborhood and skips duplicates", () => {
    const place = parseReverse({
      address: { town: "Pflugerville", county: "Travis County", state: "Texas", country: "United States", country_code: "us" },
    })
    expect(place).toEqual({ name: "Pflugerville", region: "Travis County, Texas, United States", countryCode: "US" })
  })

  it("returns null when the response has no address", () => {
    expect(parseReverse({ error: "Unable to geocode" })).toBeNull()
  })
})

describe("rules outside Texas", () => {
  it("does not suggest UIL for a location outside Texas", () => {
    expect(suggestTexasClass(-1.2864, 36.8172).inTexas).toBe(false)
    expect(suggestTexasClass(30.2672, -97.7431).inTexas).toBe(true)
  })
})
