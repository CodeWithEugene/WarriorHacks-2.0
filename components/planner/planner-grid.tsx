import { useLocale, useTranslations } from "next-intl"

import { ScrollArea, ScrollBar } from "@/components/ui/scroll-area"
import { ZONE_META } from "@/components/zone/zone-meta"
import type { CombinedHour } from "@/lib/conditions/combine"
import { cn } from "@/lib/utils"

const FIRST_HOUR = 6
const LAST_HOUR = 21
const HOUR_MS = 3_600_000

function localParts(t: number, timeZone: string) {
  const parts = new Intl.DateTimeFormat("en-US", { timeZone, year: "numeric", month: "2-digit", day: "2-digit", hour: "numeric", hourCycle: "h23" }).formatToParts(t)
  const get = (type: string) => parts.find((p) => p.type === type)?.value ?? ""
  return { day: `${get("year")}-${get("month")}-${get("day")}`, hour: Number(get("hour")) }
}

/** Seven days by practice hours (6 AM to 9 PM local), each cell a forecast flag. Hours already over are left out. */
export function PlannerGrid({ hours, timeZone, now }: { hours: CombinedHour[]; timeZone: string; now: number }) {
  const locale = useLocale()
  const tz = useTranslations("zone")
  const days = new Map<string, Map<number, CombinedHour>>()
  for (const h of hours) {
    if (h.t + HOUR_MS <= now) continue
    const { day, hour } = localParts(h.t, timeZone)
    if (hour < FIRST_HOUR || hour > LAST_HOUR || h.planningF === null) continue
    if (!days.has(day)) days.set(day, new Map())
    days.get(day)!.set(hour, h)
  }
  const dayKeys = [...days.keys()].sort().slice(0, 7)
  const hourList = Array.from({ length: LAST_HOUR - FIRST_HOUR + 1 }, (_, i) => FIRST_HOUR + i)
  const hourLabel = (h: number) => new Intl.DateTimeFormat(locale, { hour: "numeric", timeZone: "UTC" }).format(Date.UTC(2026, 0, 1, h))
  const dayLabel = (key: string) =>
    new Intl.DateTimeFormat(locale, { weekday: "short", month: "short", day: "numeric", timeZone: "UTC" }).format(new Date(`${key}T12:00:00Z`))

  return (
    <ScrollArea className="w-full">
      <table className="w-full border-separate border-spacing-1 text-xs">
        <thead>
          <tr>
            <th className="sr-only" scope="col">Day</th>
            {hourList.map((h) => (
              <th key={h} scope="col" className="px-1 text-center font-medium text-muted-foreground">{hourLabel(h)}</th>
            ))}
          </tr>
        </thead>
        <tbody>
          {dayKeys.map((key) => (
            <tr key={key}>
              <th scope="row" className="pr-2 text-left font-medium whitespace-nowrap">{dayLabel(key)}</th>
              {hourList.map((h) => {
                const cell = days.get(key)?.get(h)
                if (!cell) return <td key={h} className="h-9 min-w-10 rounded-md bg-muted/40" aria-label={`${dayLabel(key)} ${hourLabel(h)}: no data`} />
                const meta = ZONE_META[cell.level]
                return (
                  <td
                    key={h}
                    className={cn("h-9 min-w-10 rounded-md text-center font-mono tabular-nums ring-1 ring-zone-edge", meta.solid, cell.borderline && "ring-2 ring-foreground/60")}
                    aria-label={`${dayLabel(key)} ${hourLabel(h)}: ${tz(cell.level)}, ${cell.planningF!.toFixed(1)} degrees`}
                    title={`${tz(cell.level)} ${cell.planningF!.toFixed(1)}°`}
                  >
                    {Math.round(cell.planningF!)}
                  </td>
                )
              })}
            </tr>
          ))}
        </tbody>
      </table>
      <ScrollBar orientation="horizontal" />
    </ScrollArea>
  )
}
