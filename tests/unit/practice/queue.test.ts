import { describe, expect, it } from "vitest"

import { groupReasons, sortQueue } from "@/lib/practice/queue"

const at = (min: number) => new Date(Date.UTC(2026, 9, 1, 15, min))

describe("sortQueue", () => {
  it("puts open emergencies first, then check now, then check soon, newest first within a level", () => {
    const items = [
      { id: "soon", routing: "check_soon" as const, at: at(5), resolvedAt: null },
      { id: "now", routing: "check_now" as const, at: at(9), resolvedAt: null },
      { id: "emerg-old", routing: "emergency" as const, at: at(1), resolvedAt: null },
      { id: "emerg-new", routing: "emergency" as const, at: at(8), resolvedAt: null },
      { id: "emerg-done", routing: "emergency" as const, at: at(10), resolvedAt: at(11) },
    ]
    expect(sortQueue(items).map((c) => c.id)).toEqual(["emerg-new", "emerg-old", "now", "soon", "emerg-done"])
  })

  it("does not change the input array", () => {
    const items = [
      { id: "a", routing: "check_soon" as const, at: at(1), resolvedAt: null },
      { id: "b", routing: "emergency" as const, at: at(2), resolvedAt: null },
    ]
    sortQueue(items)
    expect(items.map((c) => c.id)).toEqual(["a", "b"])
  })
})

describe("groupReasons", () => {
  it("splits triage codes into tapped symptoms, warning words and AI signals", () => {
    expect(groupReasons(["tapped:stopped_sweating", "keyword", "ai:confusion", "ai:hot_dry_skin", "ai:category", "ai:severity"])).toEqual({
      tapped: ["stopped_sweating"],
      keyword: true,
      ai: ["confusion", "hot_dry_skin", "category", "severity"],
    })
  })

  it("reads the comma-joined form stored with a check-in", () => {
    expect(groupReasons("tapped:dizzy,keyword,ai:confusion")).toEqual({ tapped: ["dizzy"], keyword: true, ai: ["confusion"] })
  })

  it("accepts a missing or malformed value", () => {
    expect(groupReasons(undefined)).toEqual({ tapped: [], keyword: false, ai: [] })
    expect(groupReasons(42)).toEqual({ tapped: [], keyword: false, ai: [] })
    expect(groupReasons("")).toEqual({ tapped: [], keyword: false, ai: [] })
  })
})
