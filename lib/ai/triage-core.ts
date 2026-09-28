import { choice, noul, score } from "@typesafe-ai/sdk"

import type { TypeSafeClient } from "@typesafe-ai/sdk"

const JEV_MODEL = "jev-latest"
import { RED_FLAG_QUESTIONS, routeCheckIn, type RedFlagKey, type Symptom, type TriageAnswers, type TriageDecision } from "./triage-rules"

export type TriageResult = TriageDecision & { ai: TriageAnswers | null; model: string | null }

const noulQuestions = Object.fromEntries(Object.entries(RED_FLAG_QUESTIONS).map(([k, q]) => [k, noul(q)])) as Record<RedFlagKey, ReturnType<typeof noul>>

/** Screen an athlete check-in. Falls back to deterministic rules if Jev is unavailable or slow. */
export async function runTriage(jev: TypeSafeClient | null, input: { symptoms: Symptom[]; text: string | null; level: string; locale: string }): Promise<TriageResult> {
  const hasText = Boolean(input.text && input.text.trim().length > 0)
  if (!jev || !hasText) return { ...routeCheckIn({ symptoms: input.symptoms, text: input.text, ai: null }), ai: null, model: null }
  try {
    const res = await jev.systemOne({
      model: JEV_MODEL,
      state: { report: { text: input.text, tapped_symptoms: input.symptoms, current_heat_flag: input.level, language: input.locale } },
      questions: {
        ...noulQuestions,
        severity: score("How serious is the situation described in `report`?", [
          "No symptoms",
          "Mild discomfort",
          "Moderate symptoms that need a check",
          "Severe symptoms",
          "Life-threatening emergency",
        ]),
        category: choice("Which category best fits `report`?", {
          heat_cramps: "Muscle cramps",
          heat_exhaustion_signs: "Heavy sweating, weakness, dizziness, nausea, headache",
          possible_heat_stroke: "Confusion, collapse, very hot skin, vomiting or other signs of heat stroke",
          breathing_or_smoke: "Breathing trouble, asthma or smoke",
          dehydration: "Thirst, dry mouth, dark urine",
          unrelated_injury: "An injury not caused by heat",
          other: null,
        }),
      },
    })
    const a = res.answers as Record<string, { type: string; noul?: number; score?: number; choice?: string }>
    const ai: TriageAnswers = {
      redFlags: Object.fromEntries((Object.keys(RED_FLAG_QUESTIONS) as RedFlagKey[]).map((k) => [k, a[k]?.noul ?? 0])),
      severity: a.severity?.score ?? null,
      category: a.category?.choice ?? null,
    }
    return { ...routeCheckIn({ symptoms: input.symptoms, text: input.text, ai }), ai, model: res.model }
  } catch {
    return { ...routeCheckIn({ symptoms: input.symptoms, text: input.text, ai: null }), ai: null, model: null }
  }
}
