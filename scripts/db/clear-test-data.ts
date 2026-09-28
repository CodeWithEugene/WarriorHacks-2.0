/** Delete every team except the demo team (development cleanup). Run: pnpm db:clear-test */
import { neon } from "@neondatabase/serverless"
import { config } from "dotenv"
import { ne } from "drizzle-orm"
import { drizzle } from "drizzle-orm/neon-http"

import { teams } from "../../lib/db/schema"

config({ path: ".env.local" })

async function main() {
  const db = drizzle(neon(process.env.DATABASE_URL ?? ""))
  const deleted = await db.delete(teams).where(ne(teams.slug, "pecan-creek-varsity-football")).returning({ slug: teams.slug })
  process.stdout.write(`Deleted ${deleted.length} test team(s).\n`)
}

void main()
