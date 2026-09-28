import { BellRing, CalendarClock, ChevronRight, ClipboardCheck, FileCheck2, ShieldPlus, Timer } from "lucide-react"
import Link from "next/link"
import { getLocale, getTranslations } from "next-intl/server"

import { SiteFooter } from "@/components/site/site-footer"
import { SiteHeader } from "@/components/site/site-header"
import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from "@/components/ui/accordion"
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert"
import { Badge } from "@/components/ui/badge"
import { buttonVariants } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { ZoneBadge } from "@/components/zone/zone-badge"
import { ZONE_META } from "@/components/zone/zone-meta"
import { ZoneTimeline } from "@/components/zone/zone-timeline"
import { getConditions } from "@/lib/conditions"
import type { CombinedHour } from "@/lib/conditions/combine"
import { formatTime } from "@/lib/format"
import { LEVELS } from "@/lib/rules"
import { cn } from "@/lib/utils"

const AUSTIN = { lat: 30.2672, lon: -97.7431 }
const HOUR = 3_600_000
const CLASS3_RANGES: Record<(typeof LEVELS)[number], string> = {
  green: "< 82.0°",
  yellow: "82.0 to 86.9°",
  orange: "87.0 to 90.0°",
  red: "90.1 to 92.0°",
  black: "≥ 92.1°",
}

function currentAndNext(hours: CombinedHour[], now: number) {
  const idx = hours.findIndex((h) => h.t <= now && now < h.t + HOUR)
  const start = idx >= 0 ? idx : hours.findIndex((h) => h.t > now)
  if (start < 0) return { current: null, upcoming: [] as CombinedHour[] }
  return { current: hours[start] ?? null, upcoming: hours.slice(start, start + 12) }
}

export default async function HomePage() {
  const [t, tz, locale] = await Promise.all([getTranslations("home"), getTranslations("zone"), getLocale()])
  const conditions = await getConditions(AUSTIN.lat, AUSTIN.lon)
  // eslint-disable-next-line react-hooks/purity -- server component rendered per request
  const { current, upcoming } = currentAndNext(conditions.hours, Date.now())
  const heroHasLive = current !== null && current.planningF !== null

  return (
    <>
      <SiteHeader />
      <main id="main" className="overflow-x-clip">
        {/* Hero */}
        <section className="relative">
          <div aria-hidden className="heat-ribbon pointer-events-none absolute -top-40 right-[-20%] h-[38rem] w-[70%] -rotate-12 rounded-full opacity-60 blur-3xl md:right-[-10%] dark:opacity-40" />
          <div className="page-col relative px-4 pt-16 pb-20 md:px-8 xl:px-16 md:pt-24 md:pb-28">
            <p className="flex items-center gap-2 text-sm text-muted-foreground">
              {heroHasLive ? (
                <>
                  <span aria-hidden className={cn("size-2 animate-pulse rounded-full", ZONE_META[current.level].dot)} />
                  {t("liveEyebrow", { place: "Austin", value: current.planningF!.toFixed(1), level: tz(current.level) })}
                </>
              ) : (
                t("liveUnavailable")
              )}
            </p>
            <h1 className="mt-6 max-w-4xl text-5xl leading-[1.05] font-light tracking-tight text-balance md:text-7xl">
              {t("heroTitle")}
            </h1>
            <p className="mt-6 max-w-3xl text-2xl leading-snug font-light tracking-tight text-muted-foreground md:text-3xl">{t("heroLead")}</p>
            <div className="mt-10 flex flex-wrap gap-3">
              <Link href="/check" className={buttonVariants({ size: "lg" })}>
                {t("ctaCheck")}
                <ChevronRight data-icon="inline-end" />
              </Link>
              <Link href="/practice" className={buttonVariants({ variant: "outline", size: "lg" })}>
                {t("ctaPractice")}
              </Link>
            </div>
            <div className="mt-10 flex flex-col gap-2 text-sm text-muted-foreground">
              <p>{t("ruleLine")}</p>
              <p>
                <Badge variant="outline">WarriorHacks 2.0</Badge> <span className="ml-1">{t("themeLine")}</span>
              </p>
            </div>
          </div>
        </section>

        {/* Sources strip */}
        <section className="border-y bg-muted/30">
          <div className="page-col flex flex-col items-start gap-4 px-4 py-6 md:flex-row md:items-center md:justify-between md:px-8 xl:px-16">
            <p className="text-sm font-medium">{t("sourcesTitle")}</p>
            <ul className="flex flex-wrap gap-2">
              {["Texas UIL", "NFHS", "National Weather Service", "Open-Meteo", "Korey Stringer Institute", "EPA AirNow"].map((s) => (
                <li key={s}>
                  <Badge variant="secondary">{s}</Badge>
                </li>
              ))}
            </ul>
          </div>
        </section>

        {/* Bento */}
        <section className="page-col px-4 py-20 md:px-8 xl:px-16">
          <h2 className="max-w-3xl text-3xl font-light tracking-tight md:text-5xl">{t("bentoTitle")}</h2>
          <p className="mt-4 max-w-2xl text-lg text-muted-foreground">{t("bentoLead")}</p>
          <div className="mt-10 grid gap-4 md:grid-cols-6">
            <Card className="md:col-span-4">
              <CardHeader>
                <CardTitle className="flex items-center gap-2"><CalendarClock className="size-4" aria-hidden />{t("planTitle")}</CardTitle>
                <CardDescription>{t("planBody")}</CardDescription>
              </CardHeader>
              <CardContent className="flex flex-col gap-3">
                {upcoming.length > 0 ? <ZoneTimeline hours={upcoming} /> : <div className="h-20 rounded-lg bg-muted" />}
                <p className="text-xs text-muted-foreground">{t("mockPlace")}</p>
              </CardContent>
            </Card>
            <Card className="md:col-span-2">
              <CardHeader>
                <CardTitle className="flex items-center gap-2"><Timer className="size-4" aria-hidden />{t("runTitle")}</CardTitle>
                <CardDescription>{t("runBody")}</CardDescription>
              </CardHeader>
              <CardContent className="flex flex-col gap-3">
                <div className={cn("flex items-center justify-between rounded-lg p-3 ring-1 ring-zone-edge", ZONE_META.orange.solid)}>
                  <span className="font-medium">{tz("orange")}</span>
                  <span className="font-mono tabular-nums">87.6°</span>
                </div>
                <div className="rounded-lg border p-3">
                  <p className="text-xs text-muted-foreground">{t("mockNextReading")}</p>
                  <p className="font-mono text-3xl tabular-nums">29:41</p>
                </div>
              </CardContent>
            </Card>
            <Card className="md:col-span-3">
              <CardHeader>
                <CardTitle className="flex items-center gap-2"><ShieldPlus className="size-4" aria-hidden />{t("protectTitle")}</CardTitle>
                <CardDescription>{t("protectBody")}</CardDescription>
              </CardHeader>
              <CardContent>
                <Alert variant="destructive">
                  <BellRing aria-hidden />
                  <AlertTitle>{t("mockAlertTitle")}</AlertTitle>
                  <AlertDescription>{t("mockAlertBody")}</AlertDescription>
                </Alert>
              </CardContent>
            </Card>
            <Card className="md:col-span-3">
              <CardHeader>
                <CardTitle className="flex items-center gap-2"><FileCheck2 className="size-4" aria-hidden />{t("proveTitle")}</CardTitle>
                <CardDescription>{t("proveBody")}</CardDescription>
              </CardHeader>
              <CardContent>
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>{t("mockTime")}</TableHead>
                      <TableHead>{t("mockWbgt")}</TableHead>
                      <TableHead>{t("mockFlag")}</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {[
                      ["3:38 PM", 87.6, "orange"],
                      ["4:15 PM", 87.2, "orange"],
                      ["4:45 PM", 86.3, "yellow"],
                    ].map(([time, v, lvl]) => (
                      <TableRow key={String(time)}>
                        <TableCell>{time}</TableCell>
                        <TableCell className="font-mono tabular-nums">{Number(v).toFixed(1)}°</TableCell>
                        <TableCell><ZoneBadge level={lvl as "orange" | "yellow"} /></TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </CardContent>
            </Card>
          </div>
        </section>

        {/* Stats band (dark scoped) */}
        <section className="dark bg-background text-foreground">
          <div className="page-col px-4 py-20 md:px-8 xl:px-16">
            <h2 className="text-center text-3xl font-light tracking-tight md:text-5xl">{t("statsTitle")}</h2>
            <p className="mx-auto mt-4 max-w-2xl text-center text-lg text-muted-foreground">{t("statsLead")}</p>
            <dl className="mt-14 grid gap-8 sm:grid-cols-2 lg:grid-cols-4">
              {([1, 2, 3, 4] as const).map((i) => (
                <div key={i} className="flex flex-col gap-2 border-l border-border pl-4">
                  <dt className="order-2 text-sm text-muted-foreground">{t(`stat${i}Label`)}</dt>
                  <dd className="order-1 text-4xl font-light tracking-tight tabular-nums md:text-5xl">{t(`stat${i}Value`)}</dd>
                </div>
              ))}
            </dl>
          </div>
        </section>

        {/* How it works */}
        <section id="how" className="page-col scroll-mt-16 px-4 py-20 md:px-8 xl:px-16">
          <h2 className="max-w-3xl text-3xl font-light tracking-tight md:text-5xl">{t("howTitle")}</h2>
          <p className="mt-4 max-w-2xl text-lg text-muted-foreground">{t("howLead")}</p>
          <ol className="mt-10 grid gap-4 md:grid-cols-3">
            {([1, 2, 3] as const).map((i) => (
              <li key={i}>
                <Card className="h-full">
                  <CardHeader>
                    <Badge variant="outline" className="font-mono">0{i}</Badge>
                    <CardTitle className="text-lg">{t(`step${i}Title`)}</CardTitle>
                    <CardDescription className="text-base">{t(`step${i}Body`)}</CardDescription>
                  </CardHeader>
                </Card>
              </li>
            ))}
          </ol>
        </section>

        {/* Levels */}
        <section className="border-t">
          <div className="page-col px-4 py-20 md:px-8 xl:px-16">
            <h2 className="max-w-3xl text-3xl font-light tracking-tight md:text-5xl">{t("levelsTitle")}</h2>
            <p className="mt-4 max-w-2xl text-lg text-muted-foreground">{t("levelsLead")}</p>
            <ul className="mt-10 grid gap-3 sm:grid-cols-2 lg:grid-cols-5">
              {LEVELS.map((lvl) => (
                <li key={lvl}>
                  <Card size="sm" className="h-full">
                    <CardHeader>
                      <ZoneBadge level={lvl} size="lg" />
                      <p className="font-mono text-sm tabular-nums">{CLASS3_RANGES[lvl]} WBGT</p>
                      <CardDescription>{tz(`short.${lvl}`)}</CardDescription>
                    </CardHeader>
                  </Card>
                </li>
              ))}
            </ul>
          </div>
        </section>

        {/* FAQ */}
        <section className="border-t">
          <div className="page-col grid gap-10 px-4 py-20 md:grid-cols-[1fr_2fr] md:px-8 xl:px-16">
            <h2 className="text-3xl font-light tracking-tight md:text-4xl">{t("faqTitle")}</h2>
            <Accordion>
              {([1, 2, 3, 4, 5] as const).map((i) => (
                <AccordionItem key={i} value={`faq-${i}`}>
                  <AccordionTrigger>{t(`faq${i}q`)}</AccordionTrigger>
                  <AccordionContent>{t(`faq${i}a`)}</AccordionContent>
                </AccordionItem>
              ))}
            </Accordion>
          </div>
        </section>

        {/* Final CTA */}
        <section className="relative border-t">
          <div aria-hidden className="heat-ribbon pointer-events-none absolute inset-x-0 -bottom-24 mx-auto h-48 max-w-3xl rounded-full opacity-40 blur-3xl" />
          <div className="page-col relative flex flex-col items-center gap-6 px-4 py-24 text-center md:px-8 xl:px-16">
            <ClipboardCheck className="size-8" aria-hidden />
            <h2 className="text-3xl font-light tracking-tight md:text-5xl">{t("finalTitle")}</h2>
            <p className="max-w-xl text-lg text-muted-foreground">{t("finalLead")}</p>
            <div className="flex flex-wrap justify-center gap-3">
              <Link href="/check" className={buttonVariants({ size: "lg" })}>
                {t("ctaCheck")}
                <ChevronRight data-icon="inline-end" />
              </Link>
              <Link href="/practice" className={buttonVariants({ variant: "outline", size: "lg" })}>
                {t("ctaPractice")}
              </Link>
            </div>
            {heroHasLive && (
              <p className="text-xs text-muted-foreground">
                {t("forecastFootnote", { time: formatTime(current.t, locale), nws: current.nwsF?.toFixed(0) ?? "n/a", model: current.modelSunF?.toFixed(1) ?? "n/a" })}
              </p>
            )}
          </div>
        </section>
      </main>
      <SiteFooter />
    </>
  )
}
