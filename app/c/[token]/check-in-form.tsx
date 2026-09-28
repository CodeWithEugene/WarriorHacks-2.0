"use client"

import { HeartPulse, Send, Siren, ThumbsUp } from "lucide-react"
import { useLocale, useTranslations } from "next-intl"
import { useState } from "react"

import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from "@/components/ui/accordion"
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert"
import { Button } from "@/components/ui/button"
import { Field, FieldGroup, FieldLabel, FieldLegend, FieldSet } from "@/components/ui/field"
import { Input } from "@/components/ui/input"
import { Spinner } from "@/components/ui/spinner"
import { Textarea } from "@/components/ui/textarea"
import { Toggle } from "@/components/ui/toggle"
import { SYMPTOMS, type Routing, type Symptom } from "@/lib/ai/triage-rules"
import type { ApiEnvelope } from "@/lib/api"

export function CheckInForm({ token }: { token: string }) {
  const t = useTranslations("checkin")
  const locale = useLocale()
  const [alias, setAlias] = useState("")
  const [symptoms, setSymptoms] = useState<Symptom[]>([])
  const [text, setText] = useState("")
  const [sending, setSending] = useState(false)
  const [routing, setRouting] = useState<Routing | null>(null)
  const [error, setError] = useState(false)

  async function send(e: React.FormEvent) {
    e.preventDefault()
    setSending(true)
    setError(false)
    try {
      const r = await fetch(`/api/check-ins/${token}`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ alias: alias || undefined, symptoms, text: text || undefined, locale }),
      })
      const j = (await r.json()) as ApiEnvelope<{ routing: Routing }>
      if (!j.ok) throw new Error(j.error.code)
      setRouting(j.data.routing)
    } catch {
      setError(true)
    } finally {
      setSending(false)
    }
  }

  if (routing) {
    const map = {
      emergency: { icon: Siren, title: t("emergencyTitle"), body: t("emergencyBody"), variant: "destructive" as const },
      check_now: { icon: HeartPulse, title: t("checkNowTitle"), body: t("checkNowBody"), variant: "destructive" as const },
      check_soon: { icon: ThumbsUp, title: t("checkSoonTitle"), body: t("checkSoonBody"), variant: "default" as const },
    }[routing]
    const Icon = map.icon
    return (
      <div className="flex flex-col gap-4" role="status" aria-live="assertive">
        <Alert variant={map.variant} className="p-5">
          <Icon aria-hidden />
          <AlertTitle className="text-xl">{map.title}</AlertTitle>
          <AlertDescription className="text-base">{map.body}</AlertDescription>
        </Alert>
        <Button size="lg" variant="outline" className="h-12" onClick={() => { setRouting(null); setSymptoms([]); setText("") }}>{t("again")}</Button>
      </div>
    )
  }

  return (
    <form onSubmit={send} className="flex flex-col gap-6">
      <FieldGroup>
        <Field>
          <FieldLabel htmlFor="alias">{t("alias")}</FieldLabel>
          <Input id="alias" className="h-12 text-lg" value={alias} maxLength={8} onChange={(e) => setAlias(e.target.value)} inputMode="text" autoComplete="off" />
        </Field>
        <FieldSet>
          <FieldLegend variant="label">{t("symptomsTitle")}</FieldLegend>
          <div className="grid grid-cols-2 gap-2">
            {SYMPTOMS.map((s) => (
              <Toggle
                key={s}
                variant="outline"
                size="lg"
                className="h-12 justify-start whitespace-normal text-left"
                pressed={symptoms.includes(s)}
                onPressedChange={(p) => setSymptoms((prev) => (p ? [...prev, s] : prev.filter((x) => x !== s)))}
              >
                {t(`sym_${s}`)}
              </Toggle>
            ))}
          </div>
        </FieldSet>
        <Field>
          <FieldLabel htmlFor="text">{t("textLabel")}</FieldLabel>
          <Textarea id="text" rows={3} maxLength={500} value={text} onChange={(e) => setText(e.target.value)} placeholder={t("textPlaceholder")} className="text-base" />
        </Field>
      </FieldGroup>
      {error && <Alert variant="destructive"><AlertDescription>{t("error")}</AlertDescription></Alert>}
      <Button type="submit" size="lg" className="h-14 text-base" disabled={sending}>
        {sending ? <Spinner data-icon="inline-start" /> : <Send data-icon="inline-start" />}
        {sending ? t("sending") : t("send")}
      </Button>
      <Accordion>
        <AccordionItem value="signs">
          <AccordionTrigger>{t("signsTitle")}</AccordionTrigger>
          <AccordionContent>{t("signsBody")}</AccordionContent>
        </AccordionItem>
      </Accordion>
    </form>
  )
}
