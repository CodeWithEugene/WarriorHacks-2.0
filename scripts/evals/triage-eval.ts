/**
 * Live eval of check-in triage against TypeSafe Jev.
 * Gate: 100% of red-flag phrases must route to "emergency". False alarms are reported, not gated.
 * Run: pnpm eval:triage   (requires TYPESAFE_API_KEY)
 */
import { TypeSafeClient } from "@typesafe-ai/sdk"

import data from "../../tests/ai-evals/redflags.json"
import { runTriage } from "../../lib/ai/triage-core"

async function main() {
  const jev = new TypeSafeClient({ timeout: 10_000 })
  const misses: string[] = []
  let falseAlarms = 0
  let aiOnlyCatches = 0
  for (const text of data.redFlags) {
    const r = await runTriage(jev, { symptoms: [], text, level: "orange", locale: /[ñáéíóú]|estoy|me |mi |no /i.test(text) ? "es" : "en" })
    if (r.routing !== "emergency") misses.push(text)
    if (r.reasons.every((x) => x.startsWith("ai:"))) aiOnlyCatches++
    process.stdout.write(`${r.routing === "emergency" ? "PASS" : "MISS"}  ${r.routing.padEnd(10)} ${r.reasons.join(",").padEnd(60)} ${text}\n`)
  }
  for (const text of data.nonRedFlags) {
    const r = await runTriage(jev, { symptoms: [], text, level: "orange", locale: "en" })
    if (r.routing === "emergency") falseAlarms++
    process.stdout.write(`      ${r.routing.padEnd(10)} ${r.reasons.join(",").padEnd(60)} ${text}\n`)
  }
  const recall = (data.redFlags.length - misses.length) / data.redFlags.length
  process.stdout.write(`\nRecall: ${(recall * 100).toFixed(1)}% (${data.redFlags.length - misses.length}/${data.redFlags.length}); caught only by Jev: ${aiOnlyCatches}; false alarms: ${falseAlarms}/${data.nonRedFlags.length}\n`)
  if (misses.length > 0) {
    process.stdout.write(`Misses:\n${misses.map((m) => `  - ${m}`).join("\n")}\n`)
    process.exit(1)
  }
}

void main()
