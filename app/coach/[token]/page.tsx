import { ExternalLink } from "lucide-react"
import type { Metadata } from "next"
import Link from "next/link"
import { notFound } from "next/navigation"
import { getLocale, getTranslations } from "next-intl/server"

import { RequirementsList } from "@/components/conditions/requirements-list"
import { PlannerGrid } from "@/components/planner/planner-grid"
import { SiteHeader } from "@/components/site/site-header"
import { Badge } from "@/components/ui/badge"
import { buttonVariants } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Item, ItemActions, ItemContent, ItemDescription, ItemGroup, ItemTitle } from "@/components/ui/item"
import { ZoneBadge } from "@/components/zone/zone-badge"
import { ZONE_META } from "@/components/zone/zone-meta"
import { getConditions } from "@/lib/conditions"
import { formatTime } from "@/lib/format"
import { requirementsFor, type Sport } from "@/lib/rules"
import type { Level } from "@/lib/rules/schema"
import { getTeamByCoachToken, listPractices } from "@/lib/teams"
import { cn } from "@/lib/utils"

import { AskFlagline } from "./ask-flagline"
import { CoachLinkCard } from "./coach-link-card"
import { StartPracticeForm } from "./start-practice-form"

export const metadata: Metadata = { robots: { index: false, follow: false } }

const HOUR = 3_600_000

export default async function CoachPage({ params }: { params: Promise<{ token: string }> }) {
  const { token } = await params
  const team = await getTeamByCoachToken(token)
  if (!team) notFound()
  const [t, tz, ts, locale] = await Promise.all([getTranslations("coach"), getTranslations("zone"), getTranslations("sports"), getLocale()])
  const region = { ruleSetId: team.ruleSetId as "uil-2026-27", regionId: team.regionId }
  const [conditions, practices] = await Promise.all([getConditions(team.lat, team.lon, region), listPractices(team)])
  // eslint-disable-next-line react-hooks/purity -- server component rendered per request
  const now = Date.now()
  const current = conditions.hours.find((h) => h.t <= now && now < h.t + HOUR) ?? null
  const req = current && current.level !== "unknown" ? requirementsFor(current.level, team.sport as Sport, region) : null
  const statusLabel = (s: string) => (s === "active" ? t("statusActive") : s === "ended" ? t("statusEnded") : t("statusPrecheck"))

  return (
    <>
      <SiteHeader />
      <main id="main" className="page-col flex flex-col gap-6 px-4 py-8 md:px-8 md:py-12 xl:px-16">
        <div className="flex flex-col gap-2">
          <div className="flex flex-wrap items-center gap-2">
            <Badge variant="secondary">{ts(team.sport as Sport)}</Badge>
            <Badge variant="outline">{team.regionId === "class2" ? "UIL Class 2" : "UIL Class 3"}</Badge>
          </div>
          <h1 className="text-4xl font-light tracking-tight md:text-5xl">{team.name}</h1>
          <p className="text-muted-foreground">{[team.school, team.placeName].filter(Boolean).join(" · ")}</p>
        </div>

        <div className="grid gap-6 lg:grid-cols-3">
          <Card className="overflow-hidden lg:col-span-2">
            {current && (
              <div className={cn("flex items-end justify-between gap-4 p-5", ZONE_META[current.level].solid)}>
                <div>
                  <p className="text-sm opacity-90">{t("now")}</p>
                  <p className="text-4xl font-semibold tracking-tight">{tz(current.level)}</p>
                  <p className="text-sm opacity-90">{tz(`short.${current.level}`)}</p>
                </div>
                <p className="font-mono text-5xl font-semibold tabular-nums">{current.planningF?.toFixed(1)}°</p>
              </div>
            )}
            <CardContent className="pt-4">{req && <RequirementsList req={req} showFootball={team.sport === "football"} />}</CardContent>
          </Card>
          <div className="flex flex-col gap-6">
            <CoachLinkCard coachToken={token} slug={team.slug} name={team.name} />
            <StartPracticeForm coachToken={token} defaultLabel={team.name} />
          </div>
        </div>

        <Card>
          <CardHeader>
            <CardTitle>{t("askTitle")}</CardTitle>
            <CardDescription>{t("askLead")}</CardDescription>
          </CardHeader>
          <CardContent>
            <AskFlagline coachToken={token} timeZone={team.timeZone} />
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>{t("plannerTitle")}</CardTitle>
            <CardDescription>{t("plannerLead")}</CardDescription>
          </CardHeader>
          <CardContent>
            <PlannerGrid hours={conditions.hours} timeZone={team.timeZone} now={now} />
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>{t("recentTitle")}</CardTitle>
          </CardHeader>
          <CardContent>
            {practices.length === 0 ? (
              <p className="text-sm text-muted-foreground">{t("noPractices")}</p>
            ) : (
              <ItemGroup>
                {practices.map((p) => (
                  <Item key={p.id} variant="outline" size="sm">
                    <ItemContent>
                      <ItemTitle>
                        {p.state.team} {p.maxLevel && <ZoneBadge level={p.maxLevel as Level} />}
                      </ItemTitle>
                      <ItemDescription>
                        {formatTime(p.plannedStart, locale, team.timeZone)} · {statusLabel(p.status)} · {p.state.readings.length} readings
                      </ItemDescription>
                    </ItemContent>
                    <ItemActions>
                      <Link href={`/coach/${token}/practice/${p.id}`} className={buttonVariants({ size: "sm", variant: "outline" })}>
                        {t("open")}
                        <ExternalLink data-icon="inline-end" />
                      </Link>
                    </ItemActions>
                  </Item>
                ))}
              </ItemGroup>
            )}
          </CardContent>
        </Card>
      </main>
    </>
  )
}
