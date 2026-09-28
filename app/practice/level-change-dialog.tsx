"use client"

import { useLocale, useTranslations } from "next-intl"
import { useState } from "react"

import { Button } from "@/components/ui/button"
import { Checkbox } from "@/components/ui/checkbox"
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog"
import { Field, FieldGroup, FieldLabel } from "@/components/ui/field"
import { ZoneBadge } from "@/components/zone/zone-badge"
import { formatTime } from "@/lib/format"
import type { GearRule, Requirements } from "@/lib/rules"
import type { Level } from "@/lib/rules/schema"

export function LevelChangeDialog({
  to,
  req,
  allowedEnd,
  isFootball,
  onConfirm,
  onLater,
}: {
  to: Level
  req: Requirements
  allowedEnd: number
  isFootball: boolean
  onConfirm: () => void
  onLater: () => void
}) {
  const t = useTranslations("practice")
  const tr = useTranslations("req")
  const tz = useTranslations("zone")
  const locale = useLocale()
  const gear: Record<GearRule, string> = {
    full: tr("gearFull"),
    helmet_shoulder_pads_shorts: tr("gearShells"),
    helmet_shoulder_pads_pants: tr("gearShellsPants"),
    none: tr("gearNone"),
  }
  const breaks =
    req.breaks.kind === "count"
      ? tr("breaksCount", { count: req.breaks.perHour, minutes: req.breaks.minMinutes })
      : req.breaks.kind === "total"
        ? tr("breaksTotal", { minutes: req.breaks.minutesPerHour })
        : tr("breaksNone")
  const changes = [
    ...(req.maxPracticeMinutes !== null ? [t("changeShorten", { time: formatTime(allowedEnd, locale) })] : []),
    t("changeBreaks", { rule: breaks }),
    ...(isFootball && req.football ? [t("changeGear", { gear: gear[req.football.gear] })] : []),
    ...(isFootball && req.football && !req.football.conditioningAllowed ? [t("changeConditioning")] : []),
    ...(req.coolingZoneRequired ? [t("changeCooling")] : []),
  ]
  const [checked, setChecked] = useState<boolean[]>(() => changes.map(() => false))

  return (
    <Dialog open onOpenChange={(o) => !o && onLater()}>
      <DialogContent showCloseButton={false}>
        <DialogHeader>
          <ZoneBadge level={to} size="lg" />
          <DialogTitle>{t("levelChanged", { level: tz(to) })}</DialogTitle>
          <DialogDescription>{t("levelChangedLead")}</DialogDescription>
        </DialogHeader>
        <FieldGroup>
          {changes.map((c, i) => (
            <Field key={c} orientation="horizontal">
              <Checkbox
                id={`change-${i}`}
                checked={checked[i]}
                onCheckedChange={(v) => setChecked((prev) => prev.map((p, j) => (j === i ? Boolean(v) : p)))}
                className="size-6"
              />
              <FieldLabel htmlFor={`change-${i}`} className="text-base">{c}</FieldLabel>
            </Field>
          ))}
        </FieldGroup>
        <DialogFooter>
          <Button variant="outline" size="lg" onClick={onLater}>{t("later")}</Button>
          <Button size="lg" onClick={onConfirm} disabled={!checked.every(Boolean)}>{t("confirmChanges")}</Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}
