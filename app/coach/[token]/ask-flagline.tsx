"use client"

import { CircleCheck, Sparkles, TriangleAlert } from "lucide-react"
import { useLocale, useTranslations } from "next-intl"
import { useState, useTransition } from "react"

import { askFlaglineAction, type AskResult } from "@/app/actions/coach"
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { InputGroup, InputGroupAddon, InputGroupButton, InputGroupTextarea } from "@/components/ui/input-group"
import { Item, ItemContent, ItemGroup, ItemTitle } from "@/components/ui/item"
import { Spinner } from "@/components/ui/spinner"
import { ZoneBadge } from "@/components/zone/zone-badge"
import { formatDay, formatTime } from "@/lib/format"
import type { Conflict } from "@/lib/rules/plan"
import type { Level } from "@/lib/rules/schema"

const EXAMPLES = {
  en: ["Can we go full pads 4 to 6 tomorrow?", "Best time for a 2 hour practice tomorrow", "Conditioning at 5:30 today for an hour"],
  es: ["¿Podemos practicar con equipo completo mañana de 4 a 6?", "Mejor horario para practicar 2 horas mañana"],
} as const

export function AskFlagline({ coachToken, timeZone }: { coachToken: string; timeZone: string }) {
  const t = useTranslations("ask")
  const tc = useTranslations("coach")
  const tz = useTranslations("zone")
  const locale = useLocale() as "en" | "es"
  const [text, setText] = useState("")
  const [result, setResult] = useState<AskResult | null>(null)
  const [pending, startTransition] = useTransition()

  function ask(q: string) {
    if (q.trim().length < 3) return
    startTransition(async () => {
      const res = await askFlaglineAction({ coachToken, text: q, locale })
      setResult(res.ok ? res.data : null)
    })
  }

  function conflictText(c: Conflict, level: Level): string {
    switch (c.kind) {
      case "black":
        return t("conflict_black")
      case "too_long":
        return t("conflict_too_long", { level: tz(level), hours: `${c.maxMinutes / 60} h` })
      case "gear":
        return c.allowed === "none" ? t("conflict_gear_none", { level: tz(level) }) : t("conflict_gear_shells", { level: tz(level) })
      case "conditioning":
        return t("conflict_conditioning")
      case "no_forecast":
        return t("conflict_no_forecast")
    }
  }

  const p = result?.parsed
  const ev = result?.evaluation
  return (
    <div className="flex flex-col gap-4">
      <form
        onSubmit={(e) => {
          e.preventDefault()
          ask(text)
        }}
      >
        <InputGroup>
          <InputGroupTextarea value={text} onChange={(e) => setText(e.target.value)} placeholder={tc("askPlaceholder")} rows={2} maxLength={300} aria-label={tc("askTitle")} />
          <InputGroupAddon align="block-end" className="justify-between">
            <span className="text-xs text-muted-foreground">{text.length}/300</span>
            <InputGroupButton type="submit" size="sm" variant="default" disabled={pending || text.trim().length < 3}>
              {pending ? <Spinner data-icon="inline-start" /> : <Sparkles data-icon="inline-start" />}
              {pending ? tc("asking") : tc("ask")}
            </InputGroupButton>
          </InputGroupAddon>
        </InputGroup>
      </form>
      <div className="flex flex-wrap items-center gap-2">
        <span className="text-xs text-muted-foreground">{tc("demoLabel")}:</span>
        {EXAMPLES[locale].map((ex) => (
          <Button key={ex} size="xs" variant="outline" onClick={() => { setText(ex); ask(ex) }}>{ex}</Button>
        ))}
      </div>

      {result && p && (
        <div className="flex flex-col gap-3" aria-live="polite">
          <div className="flex flex-wrap items-center gap-2 text-sm">
            <span className="text-muted-foreground">{t("understood")}:</span>
            <Badge variant="secondary">{t(`intent_${p.intent}`)}</Badge>
            {p.start !== null && <Badge variant="outline">{formatDay(p.start, locale, timeZone)} {formatTime(p.start, locale, timeZone)}</Badge>}
            {p.minutes !== null && <Badge variant="outline">{p.minutes} min</Badge>}
            <Badge variant="outline">{t(`gear_${p.gear}`)}</Badge>
            {p.conditioning && <Badge variant="outline">{t("conditioning")}</Badge>}
          </div>
          {p.lowConfidence.length > 0 && (
            <Alert><TriangleAlert aria-hidden /><AlertDescription>{t("clarify", { fields: p.lowConfidence.map((k) => t(`field_${k}`)).join(", ") })}</AlertDescription></Alert>
          )}

          {p.intent === "rules_now" && result.nowLevel && (
            <Alert>
              <CircleCheck aria-hidden />
              <AlertTitle className="flex items-center gap-2">
                <ZoneBadge level={result.nowLevel.level as Level} value={result.nowLevel.value} />
                {t("rulesNow", { level: tz(result.nowLevel.level as Level), value: result.nowLevel.value.toFixed(1) })}
              </AlertTitle>
            </Alert>
          )}

          {ev && ev.maxLevel && (
            <Alert variant={ev.conflicts.length > 0 ? "destructive" : "default"}>
              {ev.conflicts.length > 0 ? <TriangleAlert aria-hidden /> : <CircleCheck aria-hidden />}
              <AlertTitle className="flex flex-wrap items-center gap-2">
                <ZoneBadge level={ev.maxLevel} />
                {ev.conflicts.length > 0 ? t("verdictConflicts", { level: tz(ev.maxLevel) }) : t("verdictOk", { level: tz(ev.maxLevel) })}
              </AlertTitle>
              {ev.conflicts.length > 0 && (
                <AlertDescription>
                  <ul className="list-disc pl-4">
                    {ev.conflicts.map((c, i) => <li key={i}>{conflictText(c, ev.maxLevel!)}</li>)}
                  </ul>
                </AlertDescription>
              )}
            </Alert>
          )}
          {!ev && p.intent === "check_plan" && <p className="text-sm text-muted-foreground">{t("noStart")}</p>}

          {result.windows.length > 0 && (
            <div className="flex flex-col gap-2">
              <p className="text-sm font-medium">{t("better")}</p>
              <ItemGroup>
                {result.windows.map((w) => (
                  <Item key={w.start} variant="outline" size="xs">
                    <ItemContent>
                      <ItemTitle className="flex items-center gap-2 font-normal">
                        <ZoneBadge level={w.maxLevel} />
                        {t("window", { time: `${formatDay(w.start, locale, timeZone)} ${formatTime(w.start, locale, timeZone)}`, level: tz(w.maxLevel) })}
                      </ItemTitle>
                    </ItemContent>
                  </Item>
                ))}
              </ItemGroup>
            </div>
          )}
          <p className="text-xs text-muted-foreground">{p.model ? t("aiNote") : t("fallbackNote")}</p>
        </div>
      )}
    </div>
  )
}
