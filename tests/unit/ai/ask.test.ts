import { describe, expect, it } from "vitest"

import { extractCandidates, parsePlan } from "@/lib/ai/ask-core"

const NOW = new Date("2026-09-28T17:00:00Z") // noon CDT Monday
const TZ = "America/Chicago"

describe("extractCandidates", () => {
  it("reads '4 to 6 tomorrow' as a 2-hour afternoon practice", () => {
    const { starts, durations } = extractCandidates("can varsity go full pads 4 to 6 tomorrow", NOW, TZ, "en")
    expect(new Date(starts[0]!.value).toISOString()).toBe("2026-09-29T21:00:00.000Z") // 4 PM CDT
    expect(durations[0]?.value).toBe(120)
  })
  it("keeps explicit AM", () => {
    const { starts } = extractCandidates("band at 7am tomorrow for 90 minutes", NOW, TZ, "en")
    expect(new Date(starts[0]!.value).toISOString()).toBe("2026-09-29T12:00:00.000Z")
  })
  it("reads an unstated 5:30 as this afternoon when it is still ahead", () => {
    const { starts } = extractCandidates("shells and shorts at 5:30 for 90 minutes", NOW, TZ, "en")
    expect(new Date(starts[0]!.value).toISOString()).toBe("2026-09-28T22:30:00.000Z")
  })
  it("does not read a duration as a relative time", () => {
    const r = extractCandidates("best time for band tomorrow, about 2 hours", NOW, TZ, "en")
    expect(r.starts).toEqual([])
    expect(r.durations[0]?.value).toBe(120)
    expect(r.day).not.toBeNull()
  })
  it("finds durations written out", () => {
    expect(extractCandidates("practice at 5 for 2 hours", NOW, TZ, "en").durations.map((d) => d.value)).toContain(120)
  })
  it("parses Spanish", () => {
    const { starts } = extractCandidates("mañana a las 5 por 2 horas", NOW, TZ, "es")
    expect(new Date(starts[0]!.value).toISOString()).toBe("2026-09-29T22:00:00.000Z")
  })
})

describe("parsePlan without Jev", () => {
  it("falls back to deterministic parsing", async () => {
    const p = await parsePlan(null, { text: "full pads 4 to 6 tomorrow with conditioning", now: NOW, timeZone: TZ, locale: "en", sport: "football" })
    expect(p.intent).toBe("check_plan")
    expect(p.gear).toBe("full_pads")
    expect(p.conditioning).toBe(true)
    expect(p.minutes).toBe(120)
  })
})
