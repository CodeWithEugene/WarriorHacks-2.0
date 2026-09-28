/**
 * Seed (or reset) the fictional demo team used by judges and the demo video.
 * Demo coach link: /coach/<DEMO_COACH_TOKEN>. All data is fictional.
 * Run: pnpm db:seed
 */
import { createHash } from "node:crypto"

import { neon } from "@neondatabase/serverless"
import { config } from "dotenv"
import { drizzle } from "drizzle-orm/neon-http"
import { eq } from "drizzle-orm"

import { teams } from "../../lib/db/schema"

config({ path: ".env.local" })

export const DEMO_COACH_TOKEN = "demo-pecan-creek-coach-2026"
export const DEMO_SLUG = "pecan-creek-varsity-football"

async function main() {
  const url = process.env.DATABASE_URL
  if (!url) throw new Error("DATABASE_URL is not set")
  const db = drizzle(neon(url))
  const hash = createHash("sha256").update(DEMO_COACH_TOKEN).digest("hex")
  await db.delete(teams).where(eq(teams.slug, DEMO_SLUG))
  await db.insert(teams).values({
    slug: DEMO_SLUG,
    name: "Varsity Football",
    school: "Pecan Creek High School (Demo)",
    sport: "football",
    ruleSetId: "uil-2026-27",
    regionId: "class3",
    placeName: "Austin, Travis County, Texas",
    lat: 30.2672,
    lon: -97.7431,
    timeZone: "America/Chicago",
    coachTokenHash: hash,
  })
  process.stdout.write(`Seeded demo team. Coach link: /coach/${DEMO_COACH_TOKEN}  Parent page: /t/${DEMO_SLUG}\n`)
}

void main()
