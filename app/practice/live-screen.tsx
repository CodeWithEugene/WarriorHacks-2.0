"use client"

import { CloudLightning, Coffee, Gauge, Siren, Snowflake, Square, TriangleAlert } from "lucide-react"
import Link from "next/link"
import { useLocale, useTranslations } from "next-intl"
import { useEffect, useRef, useState } from "react"

import { RequirementsList } from "@/components/conditions/requirements-list"
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert"
import {
  AlertDialog,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from "@/components/ui/alert-dialog"
import { Badge } from "@/components/ui/badge"
import { Button, buttonVariants } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Checkbox } from "@/components/ui/checkbox"
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from "@/components/ui/collapsible"
import { Field, FieldGroup, FieldLabel } from "@/components/ui/field"
import { Input } from "@/components/ui/input"
import { Item, ItemContent, ItemDescription, ItemGroup, ItemTitle } from "@/components/ui/item"
import { Progress } from "@/components/ui/progress"
import { Switch } from "@/components/ui/switch"
import { toast } from "@/components/ui/toast"
import { ZONE_META } from "@/components/zone/zone-meta"
import { formatClock, formatDuration, formatTime } from "@/lib/format"
import { breaksThisHour, type PracticeAction, type PracticeState } from "@/lib/practice/state"
import { requirementsFor } from "@/lib/rules"
import { lightningState } from "@/lib/rules/lightning"
import { sessionLimits } from "@/lib/rules/session"
import { cn } from "@/lib/utils"

import { forecastAt } from "./forecast"
import { LevelChangeDialog } from "./level-change-dialog"
import type { ForecastPoint } from "./practice-app"
import { ReadingDialog } from "./reading-dialog"

const MINUTE = 60_000

function breakPlan(req: ReturnType<typeof requirementsFor>) {
  if (req.breaks.kind === "count") return { intervalMin: 60 / req.breaks.perHour, minutes: req.breaks.minMinutes, perHour: req.breaks.perHour }
  if (req.breaks.kind === "total") return { intervalMin: 15, minutes: req.breaks.minutesPerHour / 4, perHour: 4 }
  return null
}

export function LiveScreen({
  state,
  now,
  forecast,
  dispatch,
  extra,
}: {
  state: PracticeState
  now: number
  forecast: ForecastPoint[]
  dispatch: (a: PracticeAction) => void
  /** Optional panel (for example athlete check-ins) rendered above the footer. */
  extra?: React.ReactNode
}) {
  const t = useTranslations("practice")
  const tz = useTranslations("zone")
  const locale = useLocale()
  const [readingOpen, setReadingOpen] = useState(false)
  const [initials, setInitials] = useState("")
  const [wakeLock, setWakeLock] = useState(false)
  const start = state.start ?? now

  const limits = sessionLimits(
    { start: new Date(start), plannedMinutes: state.plannedMinutes, sport: state.sport, region: state.region, readings: state.readings.map((r) => ({ at: new Date(r.at), wbgtF: r.wbgtF })) },
    new Date(now),
  )
  const level = limits.currentLevel
  const meta = ZONE_META[level]
  const Icon = meta.icon
  const req = requirementsFor(level, state.sport, state.region, { reachedMidPractice: limits.reachedOrangeMidPractice })
  const latest = state.readings.at(-1)
  const elapsedMin = (now - start) / MINUTE
  const allowedEnd = limits.allowedEnd.getTime()
  const capped = req.maxPracticeMinutes !== null || limits.allowedEnd < limits.plannedEnd
  const maxMin = (allowedEnd - start) / MINUTE
  const remainingMs = limits.nextReadingDue.getTime() - now
  const overdue = limits.overdue
  const plan = breakPlan(req)
  const openBreak = state.breaks.find((b) => b.end === null) ?? null
  const lastBreakStart = state.breaks.at(-1)?.start ?? start
  const nextBreakAt = plan ? lastBreakStart + plan.intervalMin * MINUTE : null
  const lightning = lightningState(state.thunder.map((at) => ({ at: new Date(at) })), new Date(now))

  // Alert once when a reading becomes due.
  const dueRef = useRef(false)
  useEffect(() => {
    const due = remainingMs <= 0
    if (due && !dueRef.current) {
      navigator.vibrate?.([300, 150, 300])
      toast.add({ type: "warning", title: t("readingDue"), priority: "high" })
    }
    dueRef.current = due
  }, [remainingMs, t])

  // Screen wake lock while in Practice Mode.
  useEffect(() => {
    if (!wakeLock || !("wakeLock" in navigator)) return
    let sentinel: WakeLockSentinel | null = null
    navigator.wakeLock.request("screen").then((s) => (sentinel = s)).catch(() => setWakeLock(false))
    return () => {
      void sentinel?.release()
    }
  }, [wakeLock])

  const fc = forecastAt(forecast, now)
  const pending = state.pendingLevelChange

  return (
    <div className="mx-auto flex w-full max-w-5xl flex-col gap-4">
      {/* Top bar */}
      <div className="flex flex-wrap items-center justify-between gap-2">
        <div className="flex items-center gap-2">
          <Badge variant="outline">{t("demoBadge")}</Badge>
          <span className="font-medium">{state.team}</span>
        </div>
        <Link href="/emergency" className={cn(buttonVariants({ variant: "destructive", size: "lg" }), "h-11")}>
          <Siren data-icon="inline-start" />
          {t("emergency")}
        </Link>
      </div>

      {/* Zone banner */}
      <section
        role="status"
        aria-live="polite"
        className={cn("flex flex-col gap-2 rounded-2xl p-5 ring-1 ring-zone-edge md:flex-row md:items-end md:justify-between md:p-7", meta.solid)}
      >
        <div className="flex flex-col gap-1">
          <p className="flex items-center gap-2 text-2xl font-semibold md:text-3xl">
            <Icon className="size-7" aria-hidden />
            {tz(level)}
          </p>
          <p className="text-sm opacity-90">
            {limits.suspended ? t("suspended") : capped ? t("limitedBy", { level: tz(limits.maxLevel) }) : tz(`short.${level}`)}
          </p>
        </div>
        {latest && (
          <p className="font-mono text-6xl font-semibold tabular-nums md:text-7xl">
            {latest.wbgtF.toFixed(1)}°
            <span className="ml-2 align-middle text-sm font-normal opacity-90">
              {latest.source === "measured" ? t("measured") : t("forecastUsed")} · {formatTime(latest.at, locale)}
            </span>
          </p>
        )}
      </section>

      {lightning.hold && lightning.resumesAt && (
        <Alert variant="destructive">
          <CloudLightning aria-hidden />
          <AlertTitle>{t("lightningHold")}</AlertTitle>
          <AlertDescription>
            {t("lightningResume", { time: formatTime(lightning.resumesAt, locale) })} {t("lightningHelp")}
          </AlertDescription>
        </Alert>
      )}
      {limits.noAutoExtend && <Alert><TriangleAlert aria-hidden /><AlertDescription>{t("noAutoExtend", { time: formatTime(allowedEnd, locale) })}</AlertDescription></Alert>}
      {now >= allowedEnd && !limits.suspended && (
        <Alert variant="destructive"><TriangleAlert aria-hidden /><AlertDescription>{t("maxReached")}</AlertDescription></Alert>
      )}

      <div className="grid gap-4 md:grid-cols-2">
        {/* Recheck */}
        <Card className={cn(overdue && "ring-2 ring-destructive")}>
          <CardHeader>
            <CardTitle className="text-muted-foreground">{overdue ? t("readingOverdue") : remainingMs <= 0 ? t("readingDue") : t("nextReadingIn")}</CardTitle>
          </CardHeader>
          <CardContent className="flex flex-col gap-4">
            <p className={cn("font-mono text-6xl tabular-nums", overdue && "text-destructive")} aria-live="off">
              {remainingMs <= 0 ? `+${formatClock(-remainingMs / 1000)}` : formatClock(remainingMs / 1000)}
            </p>
            <Button size="lg" className="h-14 text-base" onClick={() => setReadingOpen(true)}>
              <Gauge data-icon="inline-start" />
              {t("logReading")}
            </Button>
          </CardContent>
        </Card>

        {/* Breaks */}
        <Card>
          <CardHeader>
            <CardTitle className="text-muted-foreground">{openBreak ? t("onBreak") : t("nextBreakIn")}</CardTitle>
          </CardHeader>
          <CardContent className="flex flex-col gap-4">
            {plan ? (
              <>
                <p className="font-mono text-6xl tabular-nums">
                  {openBreak
                    ? formatClock(Math.max(0, openBreak.start + plan.minutes * MINUTE - now) / 1000)
                    : nextBreakAt !== null
                      ? nextBreakAt <= now
                        ? "0:00"
                        : formatClock((nextBreakAt - now) / 1000)
                      : "-"}
                </p>
                <p className="text-sm text-muted-foreground">{t("breaksThisHour", { taken: breaksThisHour(state, now), required: plan.perHour })}</p>
                <Button
                  size="lg"
                  variant={openBreak ? "secondary" : "outline"}
                  className="h-14 text-base"
                  onClick={() => dispatch(openBreak ? { type: "breakEnd", at: Date.now() } : { type: "breakStart", at: Date.now() })}
                >
                  <Coffee data-icon="inline-start" />
                  {openBreak ? t("endBreak") : t("startBreak")}
                </Button>
              </>
            ) : (
              <p className="text-sm">{t("suspended")}</p>
            )}
          </CardContent>
        </Card>
      </div>

      {/* Time used */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center justify-between">
            <span>{t("timeUsed")}</span>
            <span className="font-mono text-sm tabular-nums text-muted-foreground">
              {capped ? t("of", { used: formatDuration(elapsedMin), max: formatDuration(maxMin) }) : t("noCap", { used: formatDuration(elapsedMin) })}
            </span>
          </CardTitle>
        </CardHeader>
        <CardContent className="flex flex-col gap-3">
          <Progress value={Math.min(100, (elapsedMin / Math.max(1, maxMin)) * 100)} aria-label={t("timeUsed")} />
          <p className="text-sm text-muted-foreground">
            {t("allowedEnd", { time: formatTime(allowedEnd, locale) })} {t("timeInLevel")}:{" "}
            {Object.entries(limits.minutesInLevel)
              .filter(([, m]) => m >= 1)
              .map(([l, m]) => `${tz(l as never)} ${formatDuration(m)}`)
              .join(" · ") || "0:00"}
          </p>
        </CardContent>
      </Card>

      <div className="grid gap-4 md:grid-cols-2">
        <Card>
          <CardHeader>
            <CardTitle>{t("rightNow")}</CardTitle>
          </CardHeader>
          <CardContent className="flex flex-col gap-4">
            <RequirementsList req={req} showFootball={state.sport === "football"} />
            <Collapsible defaultOpen={req.coolingZoneRequired}>
              <CollapsibleTrigger render={<Button variant="outline" className="w-full justify-start" />}>
                <Snowflake data-icon="inline-start" />
                {t("coolingChecklist")} ({Object.values(state.cooling).filter(Boolean).length}/4)
              </CollapsibleTrigger>
              <CollapsibleContent className="pt-3">
                <FieldGroup>
                  {(["tub", "temp", "tarp", "person"] as const).map((k) => (
                    <Field key={k} orientation="horizontal">
                      <Checkbox id={`cool-${k}`} className="size-6" checked={state.cooling[k]} onCheckedChange={(v) => dispatch({ type: "cooling", key: k, value: Boolean(v) })} />
                      <FieldLabel htmlFor={`cool-${k}`}>{t(`cool${k[0]!.toUpperCase()}${k.slice(1)}` as "coolTub")}</FieldLabel>
                    </Field>
                  ))}
                </FieldGroup>
              </CollapsibleContent>
            </Collapsible>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>{t("log")}</CardTitle>
          </CardHeader>
          <CardContent className="flex flex-col gap-4">
            <ItemGroup className="max-h-72 overflow-y-auto">
              {[...state.log].reverse().map((e) => (
                <Item key={e.id} size="xs" variant="muted">
                  <ItemContent>
                    <ItemTitle className="font-normal">{logLine(e, t, tz)}</ItemTitle>
                    <ItemDescription className="font-mono tabular-nums">{formatTime(e.at, locale)}</ItemDescription>
                  </ItemContent>
                </Item>
              ))}
            </ItemGroup>
            <div className="flex flex-wrap gap-2">
              <Button size="lg" variant="outline" className="h-12 flex-1" onClick={() => dispatch({ type: "thunder", at: Date.now() })}>
                <CloudLightning data-icon="inline-start" />
                {t("thunder")}
              </Button>
              <AlertDialog>
                <AlertDialogTrigger render={<Button size="lg" variant="secondary" className="h-12 flex-1" />}>
                  <Square data-icon="inline-start" />
                  {t("endPractice")}
                </AlertDialogTrigger>
                <AlertDialogContent>
                  <AlertDialogHeader>
                    <AlertDialogTitle>{t("endTitle")}</AlertDialogTitle>
                    <AlertDialogDescription>{t("endLead")}</AlertDialogDescription>
                  </AlertDialogHeader>
                  <Field>
                    <FieldLabel htmlFor="initials">{t("initials")}</FieldLabel>
                    <Input id="initials" value={initials} maxLength={4} onChange={(e) => setInitials(e.target.value.toUpperCase())} className="h-11" />
                  </Field>
                  <AlertDialogFooter>
                    <AlertDialogCancel>{t("cancel")}</AlertDialogCancel>
                    <Button disabled={initials.trim().length < 2} onClick={() => dispatch({ type: "end", at: Date.now(), initials: initials.trim() })}>
                      {t("finalize")}
                    </Button>
                  </AlertDialogFooter>
                </AlertDialogContent>
              </AlertDialog>
            </div>
            <Field orientation="horizontal">
              <Switch id="wake" checked={wakeLock} onCheckedChange={(v) => setWakeLock(Boolean(v))} />
              <FieldLabel htmlFor="wake">{t("wakeLock")}</FieldLabel>
            </Field>
          </CardContent>
        </Card>
      </div>

      {extra}

      <p className="text-xs text-muted-foreground">{t("footer")}</p>

      <ReadingDialog
        key={readingOpen ? "open" : "closed"}
        open={readingOpen}
        onOpenChange={setReadingOpen}
        initialValue={latest?.wbgtF ?? fc}
        region={state.region}
        onSave={(v, source) => {
          dispatch({ type: "reading", wbgtF: v, source, at: Date.now() })
          setReadingOpen(false)
          toast.add({ type: "success", title: t("readingSaved") })
        }}
      />
      {pending && (
        <LevelChangeDialog
          to={pending.to}
          req={requirementsFor(pending.to, state.sport, state.region, { reachedMidPractice: true })}
          allowedEnd={allowedEnd}
          isFootball={state.sport === "football"}
          onConfirm={() => dispatch({ type: "confirmLevel", at: Date.now() })}
          onLater={() => dispatch({ type: "dismissLevel" })}
        />
      )}
    </div>
  )
}

type T = ReturnType<typeof useTranslations<"practice">>
type TZ = ReturnType<typeof useTranslations<"zone">>

function logLine(e: PracticeState["log"][number], t: T, tz: TZ): string {
  switch (e.kind) {
    case "start":
      return t("logStartEntry")
    case "reading":
      return t("logReadingEntry", { value: String(e.data.value), source: e.data.source === "measured" ? t("measured") : t("forecastUsed"), level: tz(e.data.level as never) })
    case "level":
      return t("logLevelEntry", { level: tz(e.data.level as never) })
    case "confirm":
      return t("logConfirmEntry")
    case "break":
      return t("logBreakEntry", { minutes: Number(e.data.minutes) })
    case "thunder":
      return t("logThunderEntry")
    case "end":
      return t("logEndEntry", { initials: String(e.data.initials) })
  }
}
