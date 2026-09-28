import { matchesRedFlagKeywords } from "./redflag-keywords"

export const SYMPTOMS = [
  "dizzy",
  "headache",
  "nausea",
  "cramps",
  "very_tired",
  "confused",
  "stopped_sweating",
  "vomiting",
  "fainted",
  "trouble_breathing",
  "chest_pain",
] as const
export type Symptom = (typeof SYMPTOMS)[number]

/** Tapped symptoms that always escalate, without any AI involved. */
export const TAPPED_RED_FLAGS: ReadonlySet<Symptom> = new Set(["confused", "stopped_sweating", "vomiting", "fainted", "trouble_breathing", "chest_pain"])

export const RED_FLAG_QUESTIONS = {
  confusion: "Does `report.text` describe confusion, disorientation, not knowing where they are, slurred speech, or acting strangely?",
  collapse_or_fainting: "Does `report.text` say the athlete collapsed, fainted, nearly fainted, or cannot stand?",
  vomiting: "Does `report.text` describe vomiting or being unable to keep fluids down?",
  hot_dry_skin: "Does `report.text` describe stopped sweating or very hot, dry skin?",
  severe_headache: "Does `report.text` describe a severe or worsening headache?",
  seizure_or_unresponsive: "Does `report.text` describe a seizure, twitching, or someone not responding?",
  breathing_difficulty: "Does `report.text` describe trouble breathing, wheezing, or an asthma attack?",
  chest_pain: "Does `report.text` describe chest pain or a racing, pounding heart?",
  third_party_distress: "Is `report.text` written by someone reporting another person who is in distress?",
} as const
export type RedFlagKey = keyof typeof RED_FLAG_QUESTIONS

/** Recall first: false alarms cost a walk across the field; misses can cost a life. */
export const RED_FLAG_NOUL_MIN = 0.25
export const SEVERE_SCORE_MIN = 3.0
export const CHECK_NOW_SCORE_MIN = 1.5
export const THIRD_PARTY_MIN = 0.5

export type Routing = "emergency" | "check_now" | "check_soon"

export type TriageAnswers = {
  redFlags: Partial<Record<RedFlagKey, number>>
  severity: number | null
  category: string | null
}

export type TriageDecision = { routing: Routing; reasons: string[] }

export function routeCheckIn(input: { symptoms: readonly Symptom[]; text: string | null; ai: TriageAnswers | null }): TriageDecision {
  const reasons: string[] = []
  const tapped = input.symptoms.filter((s) => TAPPED_RED_FLAGS.has(s))
  if (tapped.length > 0) reasons.push(...tapped.map((s) => `tapped:${s}`))
  if (matchesRedFlagKeywords(input.text)) reasons.push("keyword")
  if (input.ai) {
    for (const [k, p] of Object.entries(input.ai.redFlags)) {
      if (k === "third_party_distress") continue
      if ((p ?? 0) >= RED_FLAG_NOUL_MIN) reasons.push(`ai:${k}`)
    }
    // A report about someone else is context, not a symptom: escalate when it is likely and the situation is serious.
    const thirdParty = input.ai.redFlags.third_party_distress ?? 0
    if (thirdParty >= THIRD_PARTY_MIN && (input.ai.severity ?? 0) >= CHECK_NOW_SCORE_MIN) reasons.push("ai:third_party_distress")
    if ((input.ai.severity ?? 0) >= SEVERE_SCORE_MIN) reasons.push("ai:severity")
    if (input.ai.category === "possible_heat_stroke") reasons.push("ai:category")
  }
  if (reasons.length > 0) return { routing: "emergency", reasons }
  if (input.symptoms.length > 0) return { routing: "check_now", reasons: input.symptoms.map((s) => `tapped:${s}`) }
  if (input.ai && (input.ai.severity ?? 0) >= CHECK_NOW_SCORE_MIN) return { routing: "check_now", reasons: ["ai:severity"] }
  // Nothing is auto-dismissed: an adult still sees every check-in.
  return { routing: "check_soon", reasons: [] }
}
