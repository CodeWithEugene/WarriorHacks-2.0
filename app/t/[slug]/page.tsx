import type { Metadata } from "next"
import { notFound } from "next/navigation"
import { getLocale, getTranslations } from "next-intl/server"

import { RequirementsList } from "@/components/conditions/requirements-list"
import { SiteFooter } from "@/components/site/site-footer"
import { SiteHeader } from "@/components/site/site-header"
import { Alert, AlertDescription } from "@/components/ui/alert"
import { Badge } from "@/components/ui/badge"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { ZoneBadge } from "@/components/zone/zone-badge"
import { ZONE_META } from "@/components/zone/zone-meta"
import { ZoneTimeline } from "@/components/zone/zone-timeline"
import { getConditions } from "@/lib/conditions"
import { formatTime } from "@/lib/format"
import { requirementsFor, type Sport } from "@/lib/rules"
import type { Level } from "@/lib/rules/schema"
import { getTeamBySlug, latestPractice } from "@/lib/teams"
import { cn } from "@/lib/utils"

export const metadata: Metadata = { robots: { index: false, follow: false } }

const HOUR = 3_600_000

export default async function TeamPage({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params
  const team = await getTeamBySlug(slug)
  if (!team) notFound()
  const [t, tz, locale] = await Promise.all([getTranslations("teamPage"), getTranslations("zone"), getLocale()])
  const region = { ruleSetId: team.ruleSetId as "uil-2026-27", regionId: team.regionId }
  const [conditions, practice] = await Promise.all([getConditions(team.lat, team.lon, region), latestPractice(team)])
  // eslint-disable-next-line react-hooks/purity -- server component rendered per request
  const now = Date.now()
  const idx = conditions.hours.findIndex((h) => h.t <= now && now < h.t + HOUR)
  const current = idx >= 0 ? conditions.hours[idx]! : null
  const upcoming = idx >= 0 ? conditions.hours.slice(idx, idx + 12) : []
  const reading = practice?.state.readings.at(-1) ?? null
  const level = (reading?.level ?? (current?.level !== "unknown" ? current?.level : null) ?? null) as Level | null
  const req = level ? requirementsFor(level, team.sport as Sport, region) : null

  return (
    <>
      <SiteHeader />
      <main id="main" className="page-col px-4 py-10 md:px-8 md:py-14 xl:px-16">
        <div className="mx-auto flex w-full max-w-3xl flex-col gap-6">
          <div>
            <p className="text-sm text-muted-foreground">{t("title")}</p>
            <h1 className="text-4xl font-light tracking-tight">{team.name}</h1>
            <p className="text-muted-foreground">{[team.school, team.placeName].filter(Boolean).join(" · ")}</p>
          </div>
          <Card className="overflow-hidden">
            {level && (
              <div className={cn("flex items-end justify-between p-5", ZONE_META[level].solid)}>
                <div>
                  <p className="text-sm opacity-90">{practice ? t("today") : t("conditions")}</p>
                  <p className="text-3xl font-semibold">{tz(level)}</p>
                  <p className="text-sm opacity-90">{tz(`short.${level}`)}</p>
                </div>
                {(reading?.wbgtF ?? current?.planningF) != null && (
                  <p className="font-mono text-4xl font-semibold tabular-nums">{(reading?.wbgtF ?? current!.planningF!).toFixed(1)}°</p>
                )}
              </div>
            )}
            <CardHeader>
              {practice ? (
                <CardTitle className="flex flex-wrap items-center gap-2">
                  {formatTime(practice.plannedStart, locale, team.timeZone)} · {practice.plannedMinutes} min
                  <Badge variant="secondary">{t(`status_${practice.status}` as "status_active")}</Badge>
                  {practice.maxLevel && <ZoneBadge level={practice.maxLevel as Level} />}
                </CardTitle>
              ) : (
                <CardTitle>{t("none")}</CardTitle>
              )}
              <CardDescription>{t("water")}</CardDescription>
            </CardHeader>
            <CardContent>{req && <RequirementsList req={req} showFootball={team.sport === "football"} />}</CardContent>
          </Card>
          {upcoming.length > 0 && (
            <Card size="sm">
              <CardHeader><CardTitle>{t("conditions")}</CardTitle></CardHeader>
              <CardContent><ZoneTimeline hours={upcoming} timeZone={team.timeZone} /></CardContent>
            </Card>
          )}
          <Alert><AlertDescription>{t("source")}</AlertDescription></Alert>
        </div>
      </main>
      <SiteFooter />
    </>
  )
}
