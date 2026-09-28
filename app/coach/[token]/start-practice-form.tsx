"use client"

import { Play } from "lucide-react"
import { useRouter } from "next/navigation"
import { useTranslations } from "next-intl"
import { useState, useTransition } from "react"

import { startPracticeAction } from "@/app/actions/coach"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card"
import { Field, FieldGroup, FieldLabel } from "@/components/ui/field"
import { Input } from "@/components/ui/input"
import { NativeSelect, NativeSelectOption } from "@/components/ui/native-select"
import { Spinner } from "@/components/ui/spinner"

const LENGTHS = [60, 90, 120, 150, 180]

function defaultStart(): string {
  const d = new Date(Date.now() + 15 * 60_000)
  return `${String(d.getHours()).padStart(2, "0")}:${String(d.getMinutes()).padStart(2, "0")}`
}

export function StartPracticeForm({ coachToken, defaultLabel }: { coachToken: string; defaultLabel: string }) {
  const t = useTranslations("coach")
  const tp = useTranslations("practice")
  const router = useRouter()
  const [pending, startTransition] = useTransition()
  const [start, setStart] = useState(defaultStart)
  const [minutes, setMinutes] = useState(120)

  function submit() {
    const [h, m] = start.split(":").map(Number)
    const d = new Date()
    d.setHours(h ?? 0, m ?? 0, 0, 0)
    startTransition(async () => {
      const res = await startPracticeAction({ coachToken, label: defaultLabel, plannedStart: d.getTime(), plannedMinutes: minutes })
      if (res.ok) router.push(`/coach/${coachToken}/practice/${res.data.practiceId}`)
    })
  }

  return (
    <Card size="sm">
      <CardHeader>
        <CardTitle>{t("startTitle")}</CardTitle>
        <CardDescription>{t("startLead")}</CardDescription>
      </CardHeader>
      <CardContent>
        <FieldGroup>
          <Field>
            <FieldLabel htmlFor="p-start">{t("planned")}</FieldLabel>
            <Input id="p-start" type="time" className="h-11" value={start} onChange={(e) => setStart(e.target.value)} />
          </Field>
          <Field>
            <FieldLabel htmlFor="p-len">{t("length")}</FieldLabel>
            <NativeSelect id="p-len" className="h-11" value={String(minutes)} onChange={(e) => setMinutes(Number(e.target.value))}>
              {LENGTHS.map((m) => <NativeSelectOption key={m} value={String(m)}>{tp("minutes", { count: m })}</NativeSelectOption>)}
            </NativeSelect>
          </Field>
        </FieldGroup>
      </CardContent>
      <CardFooter>
        <Button size="lg" className="h-11 w-full" onClick={submit} disabled={pending}>
          {pending ? <Spinner data-icon="inline-start" /> : <Play data-icon="inline-start" />}
          {t("start")}
        </Button>
      </CardFooter>
    </Card>
  )
}
