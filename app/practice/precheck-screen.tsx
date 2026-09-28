"use client"

import { Gauge, Play, Wifi } from "lucide-react"
import { useLocale, useTranslations } from "next-intl"
import { useState } from "react"

import { RequirementsList } from "@/components/conditions/requirements-list"
import { Alert, AlertDescription } from "@/components/ui/alert"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card"
import { toast } from "@/components/ui/toast"
import { ZoneBadge } from "@/components/zone/zone-badge"
import { formatTime } from "@/lib/format"
import type { PracticeAction, PracticeState } from "@/lib/practice/state"
import { levelFor, requirementsFor } from "@/lib/rules"

import { forecastAt } from "./forecast"
import type { ForecastPoint } from "./practice-app"
import { ReadingDialog } from "./reading-dialog"

export function PrecheckScreen({ state, now, forecast, dispatch }: { state: PracticeState; now: number; forecast: ForecastPoint[]; dispatch: (a: PracticeAction) => void }) {
  const t = useTranslations("practice")
  const tz = useTranslations("zone")
  const tc = useTranslations("check")
  const locale = useLocale()
  const [open, setOpen] = useState(false)
  const fc = forecastAt(forecast, now)
  const latest = state.readings.at(-1) ?? null
  const req = latest ? requirementsFor(latest.level, state.sport, state.region) : null

  return (
    <div className="mx-auto flex w-full max-w-2xl flex-col gap-6">
      <div className="flex flex-col gap-2">
        <div className="flex items-center gap-2">
          <Badge variant="outline">{t("demoBadge")}</Badge>
          <Badge variant="secondary">{state.team}</Badge>
        </div>
        <h1 className="text-4xl font-light tracking-tight">{t("precheckTitle")}</h1>
        <p className="text-muted-foreground">{t("precheckLead")}</p>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>{formatTime(state.plannedStart, locale)} · {t("minutes", { count: state.plannedMinutes })}</CardTitle>
          {fc !== null && (
            <CardDescription>{t("precheckForecast", { value: fc.toFixed(1), level: tz(levelFor(fc, state.region)) })}</CardDescription>
          )}
        </CardHeader>
        <CardContent className="flex flex-col gap-3 sm:flex-row">
          <Button size="lg" className="h-12 flex-1" onClick={() => setOpen(true)}>
            <Gauge data-icon="inline-start" />
            {t("logReading")}
          </Button>
          <Button
            size="lg"
            variant="outline"
            className="h-12 flex-1"
            disabled={fc === null}
            onClick={() => {
              if (fc === null) return
              dispatch({ type: "reading", wbgtF: fc, source: "forecast", at: Date.now() })
              toast.add({ type: "success", title: t("readingSaved"), description: t("forecastUsed") })
            }}
          >
            <Wifi data-icon="inline-start" />
            {t("useForecast")}
          </Button>
        </CardContent>
        {latest && req && (
          <CardFooter className="flex flex-col items-stretch gap-4">
            <div className="flex flex-wrap items-center gap-2">
              <ZoneBadge level={latest.level} value={latest.wbgtF} size="lg" />
              <Badge variant="outline">{latest.source === "measured" ? t("measured") : t("forecastUsed")}</Badge>
              <span className="text-sm text-muted-foreground">
                {t("readingLevel", { level: tz(latest.level), region: tc(state.region.regionId as "class2" | "class3") })}
              </span>
            </div>
            <RequirementsList req={req} showFootball={state.sport === "football"} />
            {!req.outdoorAllowed && (
              <Alert variant="destructive"><AlertDescription>{t("suspended")}</AlertDescription></Alert>
            )}
            <Button size="lg" className="h-12" disabled={!req.outdoorAllowed} onClick={() => dispatch({ type: "start", at: Date.now() })}>
              <Play data-icon="inline-start" />
              {t("startPractice")}
            </Button>
          </CardFooter>
        )}
      </Card>
      <ReadingDialog
        key={open ? "open" : "closed"}
        open={open}
        onOpenChange={setOpen}
        initialValue={fc}
        region={state.region}
        onSave={(v, source) => {
          dispatch({ type: "reading", wbgtF: v, source, at: Date.now() })
          setOpen(false)
          toast.add({ type: "success", title: t("readingSaved") })
        }}
      />
    </div>
  )
}
