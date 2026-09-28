/**
 * Air quality (smoke, ozone) guidance for school outdoor activity.
 * - "epa-schools": EPA "Air Quality and Outdoor Activity Guidance for Schools" (EPA-456/F-14-003)
 *   https://document.airnow.gov/air-quality-and-outdoor-guidance-for-schools.pdf
 * - "strict-youth": Washington DOH 334-332 (May 2026) and Oregon OHA (June 2026) youth guidance
 *   https://doh.wa.gov/sites/default/files/legacy/Documents/Pubs//334-332.pdf
 */

export type AqiPreset = "epa-schools" | "strict-youth"
export type AqiCategory = "good" | "moderate" | "usg" | "unhealthy" | "very_unhealthy"
export type AqiAction = "normal" | "watch_sensitive" | "reduce" | "limit_1h" | "move_or_reschedule" | "cancel"

export function aqiCategory(aqi: number): AqiCategory {
  if (aqi <= 50) return "good"
  if (aqi <= 100) return "moderate"
  if (aqi <= 150) return "usg"
  if (aqi <= 200) return "unhealthy"
  return "very_unhealthy"
}

export type AqiRequirements = {
  aqi: number
  category: AqiCategory
  action: AqiAction
  /** Cap on activity duration in minutes, or null for no cap. */
  maxMinutes: number | null
  outdoorAllowed: boolean
}

export function aqiRequirements(aqi: number, preset: AqiPreset = "epa-schools"): AqiRequirements {
  const category = aqiCategory(aqi)
  const base = { aqi, category }
  if (preset === "strict-youth") {
    if (category === "good") return { ...base, action: "normal", maxMinutes: null, outdoorAllowed: true }
    if (category === "moderate") return { ...base, action: "watch_sensitive", maxMinutes: null, outdoorAllowed: true }
    if (category === "usg") return { ...base, action: "limit_1h", maxMinutes: 60, outdoorAllowed: true }
    return { ...base, action: "cancel", maxMinutes: 0, outdoorAllowed: false }
  }
  if (category === "good") return { ...base, action: "normal", maxMinutes: null, outdoorAllowed: true }
  if (category === "moderate") return { ...base, action: "watch_sensitive", maxMinutes: null, outdoorAllowed: true }
  if (category === "usg") return { ...base, action: "reduce", maxMinutes: null, outdoorAllowed: true }
  if (category === "unhealthy") return { ...base, action: "move_or_reschedule", maxMinutes: null, outdoorAllowed: true }
  return { ...base, action: "cancel", maxMinutes: 0, outdoorAllowed: false }
}
