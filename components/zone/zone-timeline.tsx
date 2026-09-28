import { useLocale, useTranslations } from "next-intl"

import { ScrollArea, ScrollBar } from "@/components/ui/scroll-area"
import type { CombinedHour } from "@/lib/conditions/combine"
import { formatHour } from "@/lib/format"
import { cn } from "@/lib/utils"

import { ZONE_META } from "./zone-meta"

export function ZoneTimeline({ hours, timeZone, compact = false }: { hours: CombinedHour[]; timeZone?: string; compact?: boolean }) {
  const locale = useLocale()
  const t = useTranslations("zone")
  return (
    <ScrollArea className="w-full">
      <ol className="flex gap-1 pb-2" aria-label="Hourly flags">
        {hours.map((h) => {
          const meta = ZONE_META[h.level]
          const Icon = meta.icon
          const hour = formatHour(h.t, locale, timeZone)
          return (
            <li
              key={h.t}
              className={cn(
                "flex shrink-0 flex-col items-center gap-1 rounded-lg p-1.5 ring-1 ring-zone-edge",
                meta.solid,
                compact ? "w-11" : "w-14",
              )}
              aria-label={`${hour}: ${t(h.level)}${h.planningF !== null ? `, ${h.planningF.toFixed(1)} degrees` : ""}`}
            >
              <span className="text-[0.65rem] font-medium opacity-90">{hour}</span>
              <Icon className="size-3.5" aria-hidden />
              {!compact && <span className="font-mono text-xs tabular-nums">{h.planningF !== null ? Math.round(h.planningF) : "-"}</span>}
            </li>
          )
        })}
      </ol>
      <ScrollBar orientation="horizontal" />
    </ScrollArea>
  )
}
