"use client"

import { BellRing, Check, QrCode, Siren } from "lucide-react"
import Link from "next/link"
import { useLocale, useTranslations } from "next-intl"
import { useEffect, useState } from "react"

import { resolveCheckInAction } from "@/app/actions/coach"
import {
  AlertDialog,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogMedia,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog"
import { Badge } from "@/components/ui/badge"
import { Button, buttonVariants } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Item, ItemActions, ItemContent, ItemDescription, ItemGroup, ItemTitle } from "@/components/ui/item"
import type { ApiEnvelope } from "@/lib/api"
import type { CheckIn } from "@/lib/db/schema"
import { formatTime } from "@/lib/format"
import { groupReasons, sortQueue } from "@/lib/practice/queue"
import { cn } from "@/lib/utils"

const POLL_MS = 10_000

export function CheckInPanel({ coachToken, practiceId, checkInUrl, qrDataUrl }: { coachToken: string; practiceId: string; checkInUrl: string; qrDataUrl: string }) {
  const t = useTranslations("queue")
  const tc = useTranslations("checkin")
  const locale = useLocale()
  const [items, setItems] = useState<CheckIn[]>([])
  const [acknowledged, setAcknowledged] = useState<string[]>([])

  useEffect(() => {
    let cancelled = false
    async function poll() {
      try {
        const r = await fetch(`/api/coach/${coachToken}/practices/${practiceId}/check-ins`, { cache: "no-store" })
        const j = (await r.json()) as ApiEnvelope<CheckIn[]>
        if (!cancelled && j.ok) setItems(j.data)
      } catch {
        // Offline: keep the last list and try again on the next tick.
      }
    }
    void poll()
    const id = setInterval(poll, POLL_MS)
    return () => {
      cancelled = true
      clearInterval(id)
    }
  }, [coachToken, practiceId])

  const alert = items.find((c) => c.routing === "emergency" && !c.resolvedAt && !acknowledged.includes(c.id)) ?? null
  useEffect(() => {
    if (alert) navigator.vibrate?.([400, 200, 400, 200, 400])
  }, [alert])

  async function resolve(id: string) {
    const res = await resolveCheckInAction(coachToken, practiceId, id)
    if (res.ok) setItems((prev) => prev.map((c) => (c.id === id ? { ...c, resolvedAt: new Date() } : c)))
  }

  const symptomLabel = (s: string) => tc(`sym_${s}` as "sym_dizzy")
  const listFormat = new Intl.ListFormat(locale, { type: "conjunction" })
  const reasonText = (reasons: unknown) => {
    const g = groupReasons(reasons)
    const parts = [
      g.tapped.length > 0 ? t("reasonTapped", { list: listFormat.format(g.tapped.map((s) => symptomLabel(s).toLowerCase())) }) : null,
      g.keyword ? t("reasonKeyword") : null,
      g.ai.length > 0 ? t("reasonAi", { list: listFormat.format(g.ai.map((k) => t(`ai_${k}` as "ai_confusion"))) }) : null,
    ].filter(Boolean)
    return parts.length > 0 ? parts.join("; ") : null
  }
  const queue = sortQueue(items)

  return (
    <>
      <div className="grid gap-4 md:grid-cols-[18rem_1fr]">
        <Card size="sm">
          <CardHeader>
            <CardTitle className="flex items-center gap-2"><QrCode className="size-4" aria-hidden />{t("qrTitle")}</CardTitle>
            <CardDescription>{t("qrLead")}</CardDescription>
          </CardHeader>
          <CardContent className="flex flex-col items-center gap-2">
            {/* eslint-disable-next-line @next/next/no-img-element -- generated data URL QR code */}
            <img src={qrDataUrl} alt={t("qrTitle")} width={220} height={220} className="rounded-lg bg-white p-2" />
            <a href={checkInUrl} target="_blank" rel="noopener noreferrer" className="max-w-full truncate font-mono text-xs text-muted-foreground underline-offset-4 hover:underline">
              {checkInUrl}
            </a>
          </CardContent>
        </Card>
        <Card size="sm">
          <CardHeader>
            <CardTitle>{t("title")}</CardTitle>
          </CardHeader>
          <CardContent>
            {items.length === 0 ? (
              <p className="text-sm text-muted-foreground">{t("empty")}</p>
            ) : (
              <ItemGroup className="max-h-96 overflow-y-auto">
                {queue.map((c) => (
                  <Item key={c.id} size="sm" variant={c.routing === "emergency" && !c.resolvedAt ? "outline" : "muted"} className={cn(c.routing === "emergency" && !c.resolvedAt && "ring-2 ring-destructive")}>
                    <ItemContent>
                      <ItemTitle className="flex flex-wrap items-center gap-2">
                        <Badge variant={c.routing === "emergency" ? "destructive" : c.routing === "check_now" ? "secondary" : "outline"}>{t(c.routing as "emergency")}</Badge>
                        <span>{c.alias ?? t("anonymous")}</span>
                        <span className="font-mono text-xs text-muted-foreground tabular-nums">{formatTime(new Date(c.at), locale)}</span>
                      </ItemTitle>
                      <ItemDescription>
                        {[...c.symptoms.map(symptomLabel), c.text ? `"${c.text}"` : null].filter(Boolean).join(" · ")}
                      </ItemDescription>
                      {reasonText(c.aiFlags?.reasons) && <p className="text-xs text-muted-foreground">{t("aiFlags", { reasons: reasonText(c.aiFlags?.reasons)! })}</p>}
                    </ItemContent>
                    <ItemActions>
                      {c.resolvedAt ? (
                        <Badge variant="outline"><Check data-icon="inline-start" />{t("resolved")}</Badge>
                      ) : (
                        <Button size="sm" variant="outline" onClick={() => resolve(c.id)}>{t("resolve")}</Button>
                      )}
                    </ItemActions>
                  </Item>
                ))}
              </ItemGroup>
            )}
          </CardContent>
        </Card>
      </div>

      <AlertDialog open={alert !== null} onOpenChange={(o) => !o && alert && setAcknowledged((a) => [...a, alert.id])}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogMedia className="bg-destructive/10 text-destructive"><BellRing /></AlertDialogMedia>
            <AlertDialogTitle>{t("alertTitle")}: {alert?.alias ? `#${alert.alias}` : t("anonymous")}</AlertDialogTitle>
            <AlertDialogDescription>
              {alert && [...alert.symptoms.map(symptomLabel), alert.text ? `"${alert.text}"` : null].filter(Boolean).join(" · ")}
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>{t("alertDismiss")}</AlertDialogCancel>
            <Link href="/emergency" className={buttonVariants({ variant: "destructive" })}>
              <Siren data-icon="inline-start" />
              {t("alertOpen")}
            </Link>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </>
  )
}
