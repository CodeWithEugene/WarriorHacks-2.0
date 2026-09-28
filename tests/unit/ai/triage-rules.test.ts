import { describe, expect, it } from "vitest"

import { matchesRedFlagKeywords } from "@/lib/ai/redflag-keywords"
import { routeCheckIn } from "@/lib/ai/triage-rules"

describe("routeCheckIn", () => {
  it("escalates any tapped red flag without AI", () => {
    expect(routeCheckIn({ symptoms: ["confused"], text: null, ai: null }).routing).toBe("emergency")
    expect(routeCheckIn({ symptoms: ["chest_pain"], text: null, ai: null }).routing).toBe("emergency")
  })
  it("escalates keyword matches in English and Spanish", () => {
    expect(routeCheckIn({ symptoms: [], text: "I think I'm gonna pass out", ai: null }).routing).toBe("emergency")
    expect(routeCheckIn({ symptoms: [], text: "me siento confundido", ai: null }).routing).toBe("emergency")
    expect(routeCheckIn({ symptoms: [], text: "Dejé de sudar", ai: null }).routing).toBe("emergency")
  })
  it("escalates on a low AI red-flag probability (recall first)", () => {
    const d = routeCheckIn({ symptoms: [], text: "feel weird", ai: { redFlags: { confusion: 0.3 }, severity: 1, category: "other" } })
    expect(d.routing).toBe("emergency")
    expect(d.reasons).toContain("ai:confusion")
  })
  it("escalates on high severity or heat stroke category", () => {
    expect(routeCheckIn({ symptoms: [], text: "x", ai: { redFlags: {}, severity: 3.2, category: "other" } }).routing).toBe("emergency")
    expect(routeCheckIn({ symptoms: [], text: "x", ai: { redFlags: {}, severity: 1, category: "possible_heat_stroke" } }).routing).toBe("emergency")
  })
  it("does not escalate on a third-party signal alone", () => {
    const d = routeCheckIn({ symptoms: ["cramps"], text: "calves cramping", ai: { redFlags: { third_party_distress: 0.29 }, severity: 1.1, category: "heat_cramps" } })
    expect(d.routing).toBe("check_now")
  })
  it("escalates a likely third-party report of a serious situation", () => {
    const d = routeCheckIn({ symptoms: [], text: "x", ai: { redFlags: { third_party_distress: 0.8 }, severity: 2.0, category: "other" } })
    expect(d.routing).toBe("emergency")
  })
  it("routes non red-flag symptoms to check now", () => {
    expect(routeCheckIn({ symptoms: ["cramps"], text: null, ai: null }).routing).toBe("check_now")
  })
  it("never dismisses: empty check-ins still reach an adult", () => {
    expect(routeCheckIn({ symptoms: [], text: null, ai: null }).routing).toBe("check_soon")
  })
})

describe("red-flag keywords", () => {
  const positives = [
    "I'm confused", "my friend collapsed", "he's not responding", "can't breathe", "chest hurts", "I threw up twice",
    "I stopped sweating", "I feel like fainting", "I don't know where I am", "someone is down by the bench",
    "me desmayé", "estoy vomitando", "no puedo respirar", "me duele el pecho", "tuvo una convulsión", "no responde",
  ]
  it.each(positives)("matches %s", (p) => expect(matchesRedFlagKeywords(p)).toBe(true))
  it.each(["I'm thirsty", "my legs are tired", "tengo sed", "just checking in"])("does not match %s", (p) => expect(matchesRedFlagKeywords(p)).toBe(false))
})
