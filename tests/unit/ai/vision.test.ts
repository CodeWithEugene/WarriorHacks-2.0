import { describe, expect, it } from "vitest"

import { extractJson, finalize, selectWbgt, toFahrenheit, transcribe, type Transcription } from "@/lib/ai/vision-core"

const T: Transcription = {
  device: "Kestrel 5400 Heat Stress Tracker",
  readings: [
    { id: "r1", value: 87.6, unit: "°F", label: "WBGT" },
    { id: "r2", value: 97.2, unit: "°F", label: "TEMP" },
    { id: "r3", value: 41, unit: "%", label: "RH" },
  ],
}

describe("vision helpers", () => {
  it("extracts JSON from fenced replies", () => {
    expect(extractJson('```json\n{"a":1}\n```')).toEqual({ a: 1 })
    expect(extractJson('Here: {"a":2} done')).toEqual({ a: 2 })
  })
  it("converts Celsius", () => {
    expect(toFahrenheit(30, "°C")).toBeCloseTo(86, 5)
    expect(toFahrenheit(86, "°F")).toBe(86)
  })
  it("parses an OpenRouter reply", async () => {
    const fetchImpl = (async () =>
      new Response(JSON.stringify({ choices: [{ message: { content: "```json\n" + JSON.stringify(T) + "\n```" } }] }), { status: 200 })) as typeof fetch
    const t = await transcribe({ apiKey: "k", model: "m", imageDataUrl: "data:image/jpeg;base64,AA==", appUrl: "https://x", fetchImpl })
    expect(t.readings[0]?.value).toBe(87.6)
  })
})

describe("selection and validation", () => {
  it("falls back to the WBGT label without Jev", async () => {
    const sel = await selectWbgt(null, T)
    expect(sel.id).toBe("r1")
    const r = finalize(T, sel, 86, "m")
    expect(r.status).toBe("ok")
    if (r.status === "ok") expect(r.valueF).toBe(87.6)
  })
  it("asks for manual entry on low confidence", () => {
    expect(finalize(T, { id: "r1", confidence: 0.4, isHeatScreen: 1, model: "jev" }, null, "m").status).toBe("manual")
  })
  it("flags values far from the forecast but never rejects them", () => {
    const r = finalize(T, { id: "r1", confidence: 0.9, isHeatScreen: 1, model: "jev" }, 75, "m")
    expect(r.status).toBe("ok")
    if (r.status === "ok") expect(r.farFromForecast).toBe(true)
  })
  it("rejects impossible values", () => {
    const bad: Transcription = { device: null, readings: [{ id: "r1", value: 150, unit: "°F", label: "WBGT" }] }
    expect(finalize(bad, { id: "r1", confidence: 0.95, isHeatScreen: 1, model: null }, null, "m")).toMatchObject({ status: "manual", reason: "out_of_range" })
  })
})
