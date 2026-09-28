"use client"

import { ArrowLeft, Ambulance, Phone, Snowflake, Thermometer, Truck } from "lucide-react"
import Link from "next/link"
import { useLocale, useTranslations } from "next-intl"
import { useEffect, useState } from "react"

import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from "@/components/ui/accordion"
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert"
import { Button, buttonVariants } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Field, FieldLabel } from "@/components/ui/field"
import { InputGroup, InputGroupAddon, InputGroupButton, InputGroupInput } from "@/components/ui/input-group"
import { Item, ItemContent, ItemDescription, ItemGroup, ItemTitle } from "@/components/ui/item"
import { Progress } from "@/components/ui/progress"
import { formatClock, formatTime } from "@/lib/format"
import { cn } from "@/lib/utils"

type Event = { at: number; kind: "cooling" | "called911" | "temp" | "ems" | "transported"; value?: string }
const GOAL_MS = 30 * 60_000

export function EmergencyProtocol() {
  const t = useTranslations("emergency")
  const locale = useLocale()
  const [events, setEvents] = useState<Event[]>([])
  const [temp, setTemp] = useState("")
  const [now, setNow] = useState(() => Date.now())
  const coolingAt = events.find((e) => e.kind === "cooling")?.at ?? null

  useEffect(() => {
    if (coolingAt === null) return
    const id = setInterval(() => setNow(Date.now()), 1000)
    return () => clearInterval(id)
  }, [coolingAt])

  const add = (kind: Event["kind"], value?: string) => setEvents((prev) => [...prev, { at: Date.now(), kind, value }])
  const has = (kind: Event["kind"]) => events.some((e) => e.kind === kind)
  const elapsed = coolingAt !== null ? now - coolingAt : 0
  const label: Record<Event["kind"], string> = {
    cooling: t("step1"),
    called911: t("step2"),
    temp: t("step3"),
    ems: t("step4"),
    transported: t("step5"),
  }

  return (
    <div className="mx-auto flex w-full max-w-3xl flex-col gap-4">
      <h1 className="text-3xl font-semibold tracking-tight md:text-4xl">{t("title")}</h1>
      <Alert variant="destructive">
        <Snowflake aria-hidden />
        <AlertTitle className="text-lg">{t("banner")}</AlertTitle>
        <AlertDescription>{t("lead")}</AlertDescription>
      </Alert>

      <Card className={cn(coolingAt !== null && "ring-2 ring-destructive")}>
        <CardHeader>
          <CardTitle className="text-xl">1. {t("step1")}</CardTitle>
          <CardDescription className="text-base">{t("step1Body")}</CardDescription>
        </CardHeader>
        <CardContent className="flex flex-col gap-4">
          {coolingAt === null ? (
            <Button size="lg" variant="destructive" className="h-16 text-lg" onClick={() => add("cooling")}>
              <Snowflake data-icon="inline-start" />
              {t("step1")}
            </Button>
          ) : (
            <div className="flex flex-col gap-2" aria-live="polite">
              <p className="text-sm text-muted-foreground">{t("coolingFor")}</p>
              <p className="font-mono text-6xl tabular-nums">{formatClock(elapsed / 1000)}</p>
              <Progress value={Math.min(100, (elapsed / GOAL_MS) * 100)} aria-label={t("coolingFor")} />
              <p className="text-sm text-muted-foreground">{t("target")}</p>
            </div>
          )}
          <Accordion>
            <AccordionItem value="taco">
              <AccordionTrigger>{t("tacoTitle")}</AccordionTrigger>
              <AccordionContent>{t("tacoBody")}</AccordionContent>
            </AccordionItem>
          </Accordion>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle className="text-xl">2. {t("step2")}</CardTitle>
          <CardDescription className="text-base">{t("step2Body")}</CardDescription>
        </CardHeader>
        <CardContent>
          <a
            href="tel:911"
            onClick={() => !has("called911") && add("called911")}
            className={cn(buttonVariants({ variant: coolingAt === null ? "outline" : "destructive", size: "lg" }), "h-16 w-full text-lg")}
          >
            <Phone data-icon="inline-start" />
            {t("step2")}
          </a>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle className="text-xl">3. {t("step3")}</CardTitle>
          <CardDescription className="text-base">{t("step3Body")}</CardDescription>
        </CardHeader>
        <CardContent>
          <form
            onSubmit={(e) => {
              e.preventDefault()
              const v = Number(temp)
              if (Number.isFinite(v) && v >= 90 && v <= 112) {
                add("temp", `${v.toFixed(1)}° F`)
                setTemp("")
              }
            }}
          >
            <Field>
              <FieldLabel htmlFor="temp">{t("tempLabel")}</FieldLabel>
              <InputGroup className="h-12">
                <InputGroupInput id="temp" inputMode="decimal" value={temp} onChange={(e) => setTemp(e.target.value)} className="font-mono text-xl tabular-nums" />
                <InputGroupAddon align="inline-end">
                  <InputGroupButton type="submit" size="sm">
                    <Thermometer data-icon="inline-start" />
                    {t("record")}
                  </InputGroupButton>
                </InputGroupAddon>
              </InputGroup>
            </Field>
          </form>
        </CardContent>
      </Card>

      <div className="grid gap-4 sm:grid-cols-2">
        <Button size="lg" variant="outline" className="h-14" disabled={has("ems")} onClick={() => add("ems")}>
          <Ambulance data-icon="inline-start" />
          {t("step4")}
        </Button>
        <Button size="lg" variant="outline" className="h-14" disabled={has("transported")} onClick={() => add("transported")}>
          <Truck data-icon="inline-start" />
          {t("step5")}
        </Button>
      </div>

      {events.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle>{t("timeline")}</CardTitle>
          </CardHeader>
          <CardContent>
            <ItemGroup>
              {events.map((e, i) => (
                <Item key={`${e.at}-${i}`} size="xs" variant="muted">
                  <ItemContent>
                    <ItemTitle>{label[e.kind]}{e.value ? `: ${e.value}` : ""}</ItemTitle>
                    <ItemDescription className="font-mono tabular-nums">{formatTime(e.at, locale)}</ItemDescription>
                  </ItemContent>
                </Item>
              ))}
            </ItemGroup>
          </CardContent>
        </Card>
      )}

      <p className="text-sm text-muted-foreground">{t("survival")}</p>
      <Link href="/practice" className={cn(buttonVariants({ variant: "ghost" }), "w-fit")}>
        <ArrowLeft data-icon="inline-start" />
        {t("back")}
      </Link>
    </div>
  )
}
