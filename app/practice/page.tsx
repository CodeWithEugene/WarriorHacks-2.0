import type { Metadata } from "next"
import { getTranslations } from "next-intl/server"
import * as z from "zod"

import { SiteHeader } from "@/components/site/site-header"
import { getConditions } from "@/lib/conditions"
import { SPORTS } from "@/lib/rules"

import { PracticeClient } from "./practice-client"

export async function generateMetadata(): Promise<Metadata> {
  const t = await getTranslations("practice")
  return { title: t("title") }
}

const Params = z.object({
  lat: z.coerce.number().min(-90).max(90).catch(30.2672),
  lon: z.coerce.number().min(-180).max(180).catch(-97.7431),
  region: z.enum(["class2", "class3"]).catch("class3"),
  sport: z.enum(SPORTS).catch("football"),
})

const HOUR = 3_600_000

export default async function PracticePage({ searchParams }: { searchParams: Promise<Record<string, string | string[] | undefined>> }) {
  const raw = await searchParams
  const p = Params.parse({ lat: raw.lat, lon: raw.lon, region: raw.region, sport: raw.sport })
  const conditions = await getConditions(p.lat, p.lon, { ruleSetId: "uil-2026-27", regionId: p.region })
  // eslint-disable-next-line react-hooks/purity -- server component rendered per request
  const now = Date.now()
  const forecast = conditions.hours
    .filter((h) => h.t + HOUR > now && h.t < now + 12 * HOUR && h.planningF !== null)
    .map((h) => ({ t: h.t, wbgtF: h.planningF! }))
  return (
    <>
      <SiteHeader />
      <main id="main" className="page-col px-4 py-8 md:px-8 md:py-12 xl:px-16">
        <PracticeClient forecast={forecast} defaultRegion={p.region} defaultSport={p.sport} />
      </main>
    </>
  )
}
