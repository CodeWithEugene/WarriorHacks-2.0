import { useTranslations } from "next-intl"

import { Badge } from "@/components/ui/badge"
import type { LevelOrUnknown } from "@/lib/rules/schema"
import { cn } from "@/lib/utils"

import { ZONE_META } from "./zone-meta"

export function ZoneBadge({
  level,
  value,
  size = "default",
  className,
}: {
  level: LevelOrUnknown
  value?: number | null
  size?: "default" | "lg"
  className?: string
}) {
  const t = useTranslations("zone")
  const meta = ZONE_META[level]
  const Icon = meta.icon
  const label = t(level)
  const hasValue = value !== undefined && value !== null
  return (
    <Badge
      className={cn(meta.solid, "ring-1 ring-zone-edge", size === "lg" && "h-7 gap-1.5 px-3 text-sm", className)}
      aria-label={hasValue ? t("flagValueAria", { level: label, value: value.toFixed(1) }) : t("flagAria", { level: label })}
    >
      <Icon data-icon="inline-start" aria-hidden />
      {label}
      {hasValue && <span className="font-mono tabular-nums">{value.toFixed(1)}°</span>}
    </Badge>
  )
}
