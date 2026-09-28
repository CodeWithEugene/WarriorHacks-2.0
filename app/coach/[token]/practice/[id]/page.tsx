import type { Metadata } from "next"
import { headers } from "next/headers"
import { notFound } from "next/navigation"
import QRCode from "qrcode"

import { SiteHeader } from "@/components/site/site-header"
import { getConditions } from "@/lib/conditions"
import { getPractice, getTeamByCoachToken } from "@/lib/teams"

import { SyncedPractice } from "./synced-practice"

export const metadata: Metadata = { robots: { index: false, follow: false } }

const HOUR = 3_600_000

export default async function CoachPracticePage({ params }: { params: Promise<{ token: string; id: string }> }) {
  const { token, id } = await params
  const team = await getTeamByCoachToken(token)
  if (!team) notFound()
  const practice = await getPractice(team, id)
  if (!practice) notFound()
  const conditions = await getConditions(team.lat, team.lon, { ruleSetId: team.ruleSetId as "uil-2026-27", regionId: team.regionId })
  // eslint-disable-next-line react-hooks/purity -- server component rendered per request
  const now = Date.now()
  const forecast = conditions.hours
    .filter((h) => h.t + HOUR > now && h.t < now + 12 * HOUR && h.planningF !== null)
    .map((h) => ({ t: h.t, wbgtF: h.planningF! }))
  const h = await headers()
  const origin = `${h.get("x-forwarded-proto") ?? "https"}://${h.get("host")}`
  const checkInUrl = `${origin}/c/${practice.checkInToken}`
  const qrDataUrl = await QRCode.toDataURL(checkInUrl, { margin: 1, width: 320, errorCorrectionLevel: "M" })
  return (
    <>
      <SiteHeader />
      <main id="main" className="page-col px-4 py-8 md:px-8 md:py-12 xl:px-16">
        <SyncedPractice coachToken={token} practiceId={practice.id} initialState={practice.state} forecast={forecast} checkInUrl={checkInUrl} qrDataUrl={qrDataUrl} />
      </main>
    </>
  )
}
