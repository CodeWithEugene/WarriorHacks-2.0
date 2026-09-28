import "server-only"

import { getJev } from "./jev"
import { runTriage, type TriageResult } from "./triage-core"
import type { Symptom } from "./triage-rules"

export type { TriageResult } from "./triage-core"

/** Screen an athlete check-in. Falls back to deterministic rules if Jev is unavailable or slow. */
export function triageCheckIn(input: { symptoms: Symptom[]; text: string | null; level: string; locale: string }): Promise<TriageResult> {
  return runTriage(getJev(), input)
}
