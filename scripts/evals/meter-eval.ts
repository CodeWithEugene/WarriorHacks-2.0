/**
 * Live eval of meter photo reading (OpenRouter GLM vision + Jev selection).
 * Run: pnpm eval:meter   (requires OPENROUTER_API_KEY and TYPESAFE_API_KEY)
 * Files in tests/ai-evals/meter-photos are named <anything>-<expected with _ for the decimal point>.png
 */
import { readdirSync, readFileSync } from "node:fs"
import { join } from "node:path"

import { TypeSafeClient } from "@typesafe-ai/sdk"
import { config } from "dotenv"

import { DEFAULT_VISION_MODEL, finalize, selectWbgt, transcribe } from "../../lib/ai/vision-core"

config({ path: ".env.local" })

async function main() {
  const apiKey = process.env.OPENROUTER_API_KEY
  if (!apiKey) throw new Error("OPENROUTER_API_KEY is not set")
  const model = process.env.OPENROUTER_VISION_MODEL || DEFAULT_VISION_MODEL
  const jev = new TypeSafeClient({ timeout: 10_000 })
  const dir = "tests/ai-evals/meter-photos"
  let pass = 0
  const files = readdirSync(dir).filter((f) => /\.(png|jpe?g|webp)$/i.test(f))
  for (const f of files) {
    const expected = Number(/-(\d+_\d)\.\w+$/.exec(f)?.[1]?.replace("_", "."))
    const mime = f.endsWith(".png") ? "image/png" : f.endsWith(".webp") ? "image/webp" : "image/jpeg"
    const image = `data:${mime};base64,${readFileSync(join(dir, f)).toString("base64")}`
    const t = await transcribe({ apiKey, model, imageDataUrl: image, appUrl: "https://flagline.codewitheugene.top" })
    const r = finalize(t, await selectWbgt(jev, t), null, model)
    const ok = r.status === "ok" && Math.abs(r.valueF - expected) < 0.05
    if (ok) pass++
    process.stdout.write(`${ok ? "PASS" : "FAIL"}  ${f}  expected ${expected}  got ${r.status === "ok" ? r.valueF : r.reason}\n`)
  }
  process.stdout.write(`\n${pass}/${files.length} read correctly with ${model}\n`)
}

void main()
