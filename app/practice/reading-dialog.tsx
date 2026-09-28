"use client"

import { Minus, Plus } from "lucide-react"
import { useTranslations } from "next-intl"
import { useState } from "react"

import { Button } from "@/components/ui/button"
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog"
import { Field, FieldDescription, FieldError, FieldLabel } from "@/components/ui/field"
import { InputGroup, InputGroupAddon, InputGroupInput, InputGroupText } from "@/components/ui/input-group"
import { NativeSelect, NativeSelectOption } from "@/components/ui/native-select"
import { ZoneBadge } from "@/components/zone/zone-badge"
import type { ReadingSource } from "@/lib/practice/state"
import { levelFor, type RegionRef } from "@/lib/rules"

const MIN_F = 40
const MAX_F = 120

export function ReadingDialog({
  open,
  onOpenChange,
  initialValue,
  region,
  onSave,
}: {
  open: boolean
  onOpenChange: (open: boolean) => void
  initialValue: number | null
  region: RegionRef
  onSave: (wbgtF: number, source: ReadingSource) => void
}) {
  const t = useTranslations("practice")
  const [value, setValue] = useState(initialValue !== null ? initialValue.toFixed(1) : "")
  const [instrument, setInstrument] = useState<ReadingSource>("measured")
  const num = Number(value)
  const valid = value.trim() !== "" && Number.isFinite(num) && num >= MIN_F && num <= MAX_F

  function step(delta: number) {
    const base = Number.isFinite(num) && value !== "" ? num : (initialValue ?? 80)
    setValue((Math.round((base + delta) * 10) / 10).toFixed(1))
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>{t("readingTitle")}</DialogTitle>
          <DialogDescription>{t("readingLead")}</DialogDescription>
        </DialogHeader>
        <form
          id="reading-form"
          className="flex flex-col gap-4"
          onSubmit={(e) => {
            e.preventDefault()
            if (valid) onSave(Math.round(num * 10) / 10, instrument)
          }}
        >
          <Field data-invalid={value !== "" && !valid}>
            <FieldLabel htmlFor="wbgt">{t("readingLabel")}</FieldLabel>
            <div className="flex items-center gap-2">
              <Button type="button" variant="outline" size="icon-lg" className="size-12" onClick={() => step(-0.1)} aria-label={t("stepDown")}>
                <Minus />
              </Button>
              <InputGroup className="h-14">
                <InputGroupInput
                  id="wbgt"
                  inputMode="decimal"
                  autoFocus
                  value={value}
                  onChange={(e) => setValue(e.target.value.replace(",", "."))}
                  className="text-center font-mono text-3xl tabular-nums"
                  aria-invalid={value !== "" && !valid}
                />
                <InputGroupAddon align="inline-end">
                  <InputGroupText>° F</InputGroupText>
                </InputGroupAddon>
              </InputGroup>
              <Button type="button" variant="outline" size="icon-lg" className="size-12" onClick={() => step(0.1)} aria-label={t("stepUp")}>
                <Plus />
              </Button>
            </div>
            <FieldDescription>{t("decimalHint")}</FieldDescription>
            {value !== "" && !valid && <FieldError>{t("readingInvalid")}</FieldError>}
            {valid && (
              <div className="flex items-center gap-2 text-sm" aria-live="polite">
                <ZoneBadge level={levelFor(num, region)} value={num} />
              </div>
            )}
          </Field>
          <Field>
            <FieldLabel htmlFor="instrument">{t("instrument")}</FieldLabel>
            <NativeSelect id="instrument" value={instrument} onChange={(e) => setInstrument(e.target.value as ReadingSource)} className="h-11">
              <NativeSelectOption value="measured">{t("instrumentMeter")}</NativeSelectOption>
              <NativeSelectOption value="forecast">{t("instrumentInternet")}</NativeSelectOption>
            </NativeSelect>
          </Field>
        </form>
        <DialogFooter>
          <Button type="submit" form="reading-form" size="lg" className="h-11 w-full sm:w-auto" disabled={!valid}>
            {t("saveReading")}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}
