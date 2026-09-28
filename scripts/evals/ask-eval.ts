/** Live smoke eval of Ask Flagline parsing against Jev. Run: pnpm eval:ask */
import { TypeSafeClient } from "@typesafe-ai/sdk"

import { parsePlan } from "../../lib/ai/ask-core"

const NOW = new Date()
const cases = [
  "can varsity go full pads 4 to 6 tomorrow?",
  "we want to run conditioning after school today for an hour",
  "what's the best time for band rehearsal tomorrow, about 2 hours",
  "shells and shorts at 5:30 for 90 minutes",
  "¿podemos practicar mañana a las 4 con equipo completo por 2 horas?",
  "what are the rules right now",
]
async function main() {
  const jev = new TypeSafeClient({ timeout: 10_000 })
  for (const text of cases) {
    const p = await parsePlan(jev, { text, now: NOW, timeZone: "America/Chicago", locale: /¿|mañana/.test(text) ? "es" : "en", sport: "football" })
    const start = p.start ? new Date(p.start).toLocaleString("en-US", { timeZone: "America/Chicago", weekday: "short", hour: "numeric", minute: "2-digit" }) : "-"
    process.stdout.write(`${p.intent.padEnd(17)} gear=${p.gear.padEnd(28)} cond=${String(p.conditioning).padEnd(5)} start=${start.padEnd(14)} min=${String(p.minutes ?? "-").padEnd(4)} low=[${p.lowConfidence.join(",")}]  ${text}\n`)
  }
}
void main()
