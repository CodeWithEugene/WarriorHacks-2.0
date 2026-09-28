"use client"

import { Camera, Minus, Plus } from "lucide-react"
import { useTranslations } from "next-intl"
import { useRef, useState } from "react"

import { Button } from "@/components/ui/button"
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog"
import { Field, FieldDescription, FieldError, FieldLabel } from "@/components/ui/field"
import { InputGroup, InputGroupAddon, InputGroupInput, InputGroupText } from "@/components/ui/input-group"
import { NativeSelect, NativeSelectOption } from "@/components/ui/native-select"
import { Spinner } from "@/components/ui/spinner"
import { ZoneBadge } from "@/components/zone/zone-badge"
import type { ReadingSource } from "@/lib/practice/state"
import { levelFor, type RegionRef } from "@/lib/rules"

const MIN_F = 40
const MAX_F = 120
const MAX_SIDE_PX = 1280

type PhotoState = { kind: "idle" } | { kind: "reading" } | { kind: "ok"; far: boolean } | { kind: "manual"; notConfigured: boolean }

/** Resize a photo in the browser before upload (at most 1280 px on the long side, JPEG). */
async function toDataUrl(file: File): Promise<string> {
  const bitmap = await createImageBitmap(file)
  const scale = Math.min(1, MAX_SIDE_PX / Math.max(bitmap.width, bitmap.height))
  const canvas = document.createElement("canvas")
  canvas.width = Math.round(bitmap.width * scale)
  canvas.height = Math.round(bitmap.height * scale)
  canvas.getContext("2d")?.drawImage(bitmap, 0, 0, canvas.width, canvas.height)
  return canvas.toDataURL("image/jpeg", 0.85)
}

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
  const [photo, setPhoto] = useState<PhotoState>({ kind: "idle" })
  const fileRef = useRef<HTMLInputElement>(null)

  async function readPhoto(file: File) {
    setPhoto({ kind: "reading" })
    try {
      const image = await toDataUrl(file)
      const r = await fetch("/api/ai/meter-photo", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ image, forecastF: initialValue }) })
      const j = (await r.json()) as { ok: boolean; data?: { status: string; valueF?: number; farFromForecast?: boolean; reason?: string } }
      if (j.ok && j.data?.status === "ok" && typeof j.data.valueF === "number") {
        setValue(j.data.valueF.toFixed(1))
        setInstrument("measured")
        setPhoto({ kind: "ok", far: Boolean(j.data.farFromForecast) })
      } else {
        setPhoto({ kind: "manual", notConfigured: j.data?.reason === "not_configured" })
      }
    } catch {
      setPhoto({ kind: "manual", notConfigured: false })
    }
  }
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
            <input
              ref={fileRef}
              type="file"
              accept="image/*"
              capture="environment"
              className="sr-only"
              aria-label={t("photoOfMeter")}
              onChange={(e) => {
                const f = e.target.files?.[0]
                if (f) void readPhoto(f)
                e.target.value = ""
              }}
            />
            <Button type="button" variant="outline" className="h-11" disabled={photo.kind === "reading"} onClick={() => fileRef.current?.click()}>
              {photo.kind === "reading" ? <Spinner data-icon="inline-start" /> : <Camera data-icon="inline-start" />}
              {photo.kind === "reading" ? t("photoReading") : t("photoOfMeter")}
            </Button>
            <p className="text-xs text-muted-foreground" aria-live="polite">
              {photo.kind === "ok"
                ? `${t("photoDetected", { value })}${photo.far ? ` ${t("photoFar")}` : ""}`
                : photo.kind === "manual"
                  ? photo.notConfigured ? t("photoNotConfigured") : t("photoManual")
                  : t("photoPrivacy")}
            </p>
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
