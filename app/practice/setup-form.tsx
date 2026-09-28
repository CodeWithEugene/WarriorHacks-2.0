"use client"

import { zodResolver } from "@hookform/resolvers/zod"
import { ChevronRight } from "lucide-react"
import { useTranslations } from "next-intl"
import { Controller, useForm } from "react-hook-form"
import * as z from "zod"

import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card"
import { Field, FieldError, FieldGroup, FieldLabel } from "@/components/ui/field"
import { Input } from "@/components/ui/input"
import { NativeSelect, NativeSelectOption } from "@/components/ui/native-select"
import { Slider } from "@/components/ui/slider"
import { ToggleGroup, ToggleGroupItem } from "@/components/ui/toggle-group"
import type { PracticeAction } from "@/lib/practice/state"
import { SPORTS, type Sport } from "@/lib/rules"

const Schema = z.object({
  team: z.string().trim().min(2).max(60),
  sport: z.enum(SPORTS),
  start: z.string().regex(/^\d{2}:\d{2}$/),
  plannedMinutes: z.number().int().min(15).max(240),
  region: z.enum(["class2", "class3"]),
})
type Values = z.infer<typeof Schema>

function defaultStart(): string {
  const d = new Date(Date.now() + 10 * 60_000)
  return `${String(d.getHours()).padStart(2, "0")}:${String(d.getMinutes()).padStart(2, "0")}`
}

function startToEpoch(hhmm: string): number {
  const [h, m] = hhmm.split(":").map(Number)
  const d = new Date()
  d.setHours(h ?? 0, m ?? 0, 0, 0)
  return d.getTime()
}

export function SetupForm({
  defaultRegion,
  defaultSport,
  onSubmit,
}: {
  defaultRegion: "class2" | "class3"
  defaultSport: Sport
  onSubmit: (action: PracticeAction) => void
}) {
  const t = useTranslations("practice")
  const tc = useTranslations("check")
  const ts = useTranslations("sports")
  const form = useForm<Values>({
    resolver: zodResolver(Schema),
    defaultValues: { team: "", sport: defaultSport, start: defaultStart(), plannedMinutes: 120, region: defaultRegion },
  })

  function submit(v: Values) {
    onSubmit({
      type: "setup",
      team: v.team,
      sport: v.sport,
      region: { ruleSetId: "uil-2026-27", regionId: v.region },
      plannedMinutes: v.plannedMinutes,
      plannedStart: startToEpoch(v.start),
    })
  }

  return (
    <div className="mx-auto flex w-full max-w-xl flex-col gap-6">
      <div className="flex flex-col gap-2">
        <Badge variant="outline" className="w-fit">{t("demoBadge")}</Badge>
        <h1 className="text-4xl font-light tracking-tight">{t("setupTitle")}</h1>
        <p className="text-muted-foreground">{t("setupLead")}</p>
      </div>
      <Card>
        <CardHeader>
          <CardTitle>{t("title")}</CardTitle>
          <CardDescription>{t("precheckLead")}</CardDescription>
        </CardHeader>
        <CardContent>
          <form id="practice-setup" onSubmit={form.handleSubmit(submit)}>
            <FieldGroup>
              <Controller
                name="team"
                control={form.control}
                render={({ field, fieldState }) => (
                  <Field data-invalid={fieldState.invalid}>
                    <FieldLabel htmlFor="team">{t("team")}</FieldLabel>
                    <Input {...field} id="team" placeholder={t("teamPlaceholder")} aria-invalid={fieldState.invalid} className="h-11" />
                    {fieldState.invalid && <FieldError errors={[fieldState.error]} />}
                  </Field>
                )}
              />
              <Controller
                name="sport"
                control={form.control}
                render={({ field }) => (
                  <Field>
                    <FieldLabel htmlFor="sport">{t("sport")}</FieldLabel>
                    <NativeSelect id="sport" value={field.value} onChange={(e) => field.onChange(e.target.value)} className="h-11">
                      {SPORTS.map((s) => (
                        <NativeSelectOption key={s} value={s}>{ts(s)}</NativeSelectOption>
                      ))}
                    </NativeSelect>
                  </Field>
                )}
              />
              <Controller
                name="start"
                control={form.control}
                render={({ field, fieldState }) => (
                  <Field data-invalid={fieldState.invalid}>
                    <FieldLabel htmlFor="start">{t("start")}</FieldLabel>
                    <Input {...field} id="start" type="time" aria-invalid={fieldState.invalid} className="h-11" />
                  </Field>
                )}
              />
              <Controller
                name="plannedMinutes"
                control={form.control}
                render={({ field }) => (
                  <Field>
                    <FieldLabel>
                      {t("duration")}: <span className="font-mono tabular-nums">{t("minutes", { count: field.value })}</span>
                    </FieldLabel>
                    <Slider min={30} max={180} step={15} value={field.value} onValueChange={(v) => field.onChange(Array.isArray(v) ? v[0] : v)} aria-label={t("duration")} />
                  </Field>
                )}
              />
              <Controller
                name="region"
                control={form.control}
                render={({ field }) => (
                  <Field>
                    <FieldLabel>{t("region")}</FieldLabel>
                    <ToggleGroup variant="outline" value={[field.value]} onValueChange={(v) => v[0] && field.onChange(v[0])}>
                      <ToggleGroupItem value="class3">{tc("class3")}</ToggleGroupItem>
                      <ToggleGroupItem value="class2">{tc("class2")}</ToggleGroupItem>
                    </ToggleGroup>
                  </Field>
                )}
              />
            </FieldGroup>
          </form>
        </CardContent>
        <CardFooter>
          <Button type="submit" form="practice-setup" size="lg" className="h-11 w-full">
            {t("begin")}
            <ChevronRight data-icon="inline-end" />
          </Button>
        </CardFooter>
      </Card>
    </div>
  )
}
