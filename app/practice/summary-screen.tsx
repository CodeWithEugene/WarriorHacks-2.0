"use client"

import { Download, RotateCcw } from "lucide-react"
import { useTranslations } from "next-intl"

import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card"
import { ZoneBadge } from "@/components/zone/zone-badge"
import { type PracticeState, toCsv } from "@/lib/practice/state"
import { LEVEL_RANK } from "@/lib/rules"
import type { Level } from "@/lib/rules/schema"

export function SummaryScreen({ state, onReset }: { state: PracticeState; onReset: () => void }) {
  const t = useTranslations("practice")
  const tz = useTranslations("zone")
  const maxLevel = state.readings.reduce<Level>((m, r) => (LEVEL_RANK[r.level] > LEVEL_RANK[m] ? r.level : m), "green")
  const late = state.readings.filter((r) => !r.onTime).length
  const breaks = state.breaks.filter((b) => b.end !== null).length

  function download() {
    const blob = new Blob([toCsv(state)], { type: "text/csv;charset=utf-8" })
    const url = URL.createObjectURL(blob)
    const a = document.createElement("a")
    a.href = url
    a.download = `flagline-practice-${new Date(state.start ?? Date.now()).toISOString().slice(0, 10)}.csv`
    a.click()
    URL.revokeObjectURL(url)
  }

  return (
    <div className="mx-auto flex w-full max-w-xl flex-col gap-6">
      <h1 className="text-4xl font-light tracking-tight">{t("summaryTitle")}</h1>
      <Card>
        <CardHeader>
          <CardTitle>{state.team}</CardTitle>
          <CardDescription className="flex flex-wrap items-center gap-2">
            <ZoneBadge level={maxLevel} />
            {t("summaryMax", { level: tz(maxLevel) })}
          </CardDescription>
        </CardHeader>
        <CardContent className="flex flex-col gap-2 text-sm">
          <p>{t("summaryReadings", { count: state.readings.length, late })}</p>
          <p>{t("summaryBreaks", { count: breaks })}</p>
          {state.initials && <Badge variant="secondary" className="w-fit">{t("logEndEntry", { initials: state.initials })}</Badge>}
        </CardContent>
        <CardFooter className="flex flex-col gap-2 sm:flex-row">
          <Button size="lg" className="h-11 w-full sm:w-auto" onClick={download}>
            <Download data-icon="inline-start" />
            {t("downloadCsv")}
          </Button>
          <Button size="lg" variant="outline" className="h-11 w-full sm:w-auto" onClick={onReset}>
            <RotateCcw data-icon="inline-start" />
            {t("newPractice")}
          </Button>
        </CardFooter>
      </Card>
    </div>
  )
}
