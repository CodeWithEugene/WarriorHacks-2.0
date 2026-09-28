import { Clock, Droplets, HardHat, Snowflake, Timer, Zap } from "lucide-react"
import { useTranslations } from "next-intl"

import { Item, ItemContent, ItemDescription, ItemGroup, ItemMedia, ItemTitle } from "@/components/ui/item"
import type { GearRule, Requirements } from "@/lib/rules"

export function RequirementsList({ req, showFootball }: { req: Requirements; showFootball: boolean }) {
  const t = useTranslations("req")
  const breaks =
    req.breaks.kind === "count"
      ? t("breaksCount", { count: req.breaks.perHour, minutes: req.breaks.minMinutes })
      : req.breaks.kind === "total"
        ? t("breaksTotal", { minutes: req.breaks.minutesPerHour })
        : t("breaksNone")
  const maxTime = !req.outdoorAllowed ? t("none") : req.maxPracticeMinutes === null ? t("normalLimits") : t("hours", { count: req.maxPracticeMinutes / 60 })
  const gearLabel: Record<GearRule, string> = {
    full: t("gearFull"),
    helmet_shoulder_pads_shorts: t("gearShells"),
    helmet_shoulder_pads_pants: t("gearShellsPants"),
    none: t("gearNone"),
  }
  const rows = [
    { icon: Clock, title: t("maxTime"), body: maxTime },
    { icon: Timer, title: t("breaks"), body: breaks },
    { icon: Snowflake, title: t("cooling"), body: req.coolingZoneRequired ? t("coolingRequired") : t("coolingReady") },
    ...(showFootball && req.football && req.outdoorAllowed
      ? [
          { icon: HardHat, title: t("gear"), body: gearLabel[req.football.gear] },
          { icon: Zap, title: t("conditioning"), body: req.football.conditioningAllowed ? t("conditioningYes") : t("conditioningNo") },
        ]
      : []),
    { icon: Droplets, title: t("water"), body: t("waterAlways") },
  ]
  return (
    <ItemGroup>
      {rows.map((r) => (
        <Item key={r.title} size="sm">
          <ItemMedia variant="icon">
            <r.icon aria-hidden />
          </ItemMedia>
          <ItemContent>
            <ItemTitle>{r.title}</ItemTitle>
            <ItemDescription>{r.body}</ItemDescription>
          </ItemContent>
        </Item>
      ))}
      {req.discretionNote && <p className="px-3 text-xs text-muted-foreground">{t("discretion")}</p>}
    </ItemGroup>
  )
}
