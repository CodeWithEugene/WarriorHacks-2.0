"use client"

import { useLocale, useTranslations } from "next-intl"
import { Area, CartesianGrid, ComposedChart, Line, ReferenceArea, XAxis, YAxis } from "recharts"

import { type ChartConfig, ChartContainer, ChartLegend, ChartLegendContent, ChartTooltip, ChartTooltipContent } from "@/components/ui/chart"
import type { CombinedHour } from "@/lib/conditions/combine"
import { formatHour } from "@/lib/format"
import type { RuleSet } from "@/lib/rules/schema"

const ZONE_VAR = {
  green: "var(--color-zone-green)",
  yellow: "var(--color-zone-yellow)",
  orange: "var(--color-zone-orange)",
  red: "var(--color-zone-red)",
  black: "var(--color-zone-black)",
} as const

export function WbgtChart({
  hours,
  bands,
  timeZone,
}: {
  hours: CombinedHour[]
  bands: RuleSet["regions"][number]["bands"]
  timeZone: string
}) {
  const t = useTranslations("check")
  const locale = useLocale()
  const config = {
    planning: { label: "WBGT", color: "var(--foreground)" },
    nws: { label: t("nws"), color: "var(--chart-2)" },
    model: { label: t("model"), color: "var(--chart-4)" },
  } satisfies ChartConfig

  const data = hours.map((h) => ({
    t: h.t,
    label: formatHour(h.t, locale, timeZone),
    planning: h.planningF,
    nws: h.nwsF,
    model: h.modelSunF,
    range: h.range,
  }))
  const values = hours.flatMap((h) => (h.range ? h.range : []))
  const yMin = Math.floor(Math.min(60, ...values) / 5) * 5
  const yMax = Math.ceil(Math.max(95, ...values) / 5) * 5
  const edges = bands.map((b, i) => ({ level: b.level, from: b.minF ?? yMin, to: bands[i + 1]?.minF ?? yMax }))

  return (
    <ChartContainer config={config} className="aspect-auto h-72 w-full">
      <ComposedChart accessibilityLayer data={data} margin={{ left: 0, right: 8, top: 8 }}>
        {edges.map((e) => (
          <ReferenceArea key={e.level} y1={e.from} y2={e.to} fill={ZONE_VAR[e.level]} fillOpacity={0.18} ifOverflow="hidden" />
        ))}
        <CartesianGrid vertical={false} strokeDasharray="3 3" />
        <XAxis dataKey="label" tickLine={false} axisLine={false} interval={2} tickMargin={8} />
        <YAxis domain={[yMin, yMax]} tickLine={false} axisLine={false} width={32} unit="°" />
        <ChartTooltip content={<ChartTooltipContent indicator="line" />} />
        <ChartLegend content={<ChartLegendContent />} />
        <Area dataKey="range" type="monotone" stroke="none" fill="var(--color-planning)" fillOpacity={0.08} isAnimationActive={false} />
        <Line dataKey="nws" type="monotone" stroke="var(--color-nws)" strokeWidth={1.5} dot={false} strokeDasharray="4 3" connectNulls />
        <Line dataKey="model" type="monotone" stroke="var(--color-model)" strokeWidth={1.5} dot={false} connectNulls />
        <Line dataKey="planning" type="monotone" stroke="var(--color-planning)" strokeWidth={2.5} dot={false} connectNulls />
      </ComposedChart>
    </ChartContainer>
  )
}
