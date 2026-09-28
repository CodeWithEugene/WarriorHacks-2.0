"use client"

import { AlertTriangle, CloudLightning, LocateFixed, MapPin, RefreshCw, Search, Wind } from "lucide-react"
import Link from "next/link"
import { useLocale, useTranslations } from "next-intl"
import { useEffect, useMemo, useState } from "react"

import { RequirementsList } from "@/components/conditions/requirements-list"
import { WbgtChart } from "@/components/conditions/wbgt-chart"
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert"
import { Badge } from "@/components/ui/badge"
import { Button, buttonVariants } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Empty, EmptyDescription, EmptyHeader, EmptyMedia, EmptyTitle } from "@/components/ui/empty"
import { Field, FieldGroup, FieldLabel } from "@/components/ui/field"
import { InputGroup, InputGroupAddon, InputGroupInput } from "@/components/ui/input-group"
import { Item, ItemContent, ItemDescription, ItemGroup, ItemMedia, ItemTitle } from "@/components/ui/item"
import { Skeleton } from "@/components/ui/skeleton"
import { Spinner } from "@/components/ui/spinner"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { ToggleGroup, ToggleGroupItem } from "@/components/ui/toggle-group"
import { ZoneBadge } from "@/components/zone/zone-badge"
import { ZONE_META } from "@/components/zone/zone-meta"
import { ZoneTimeline } from "@/components/zone/zone-timeline"
import type { ApiEnvelope } from "@/lib/api"
import type { CombinedHour } from "@/lib/conditions/combine"
import type { Place } from "@/lib/conditions/geocode"
import { formatTime } from "@/lib/format"
import { getRuleSet, requirementsFor, type RuleSetId, type Sport } from "@/lib/rules"
import { aqiRequirements } from "@/lib/rules/aqi"
import type { ClassSuggestion } from "@/lib/rules/texas-class"
import { cn } from "@/lib/utils"

type ConditionsResponse = {
  lat: number
  lon: number
  region: { ruleSetId: RuleSetId; regionId: string }
  hours: CombinedHour[]
  currentAqi: number | null
  suggestion: ClassSuggestion
  sources: { nws: { ok: boolean; issuedAt?: string; detail?: string }; model: { ok: boolean }; airQuality: { ok: boolean } }
}

const AUSTIN: Place = { id: "austin", name: "Austin", region: "Travis County, Texas", lat: 30.2672, lon: -97.7431, timeZone: "America/Chicago" }
const HOUR = 3_600_000
/** Browser fixes looser than this are usually Wi-Fi or IP based, not GPS. */
const ROUGH_FIX_M = 1000
const ACTIVITIES: { value: Sport; key: "football" | "band" | "otherSport" | "pe" }[] = [
  { value: "football", key: "football" },
  { value: "marching_band", key: "band" },
  { value: "soccer", key: "otherSport" },
  { value: "pe", key: "pe" },
]

function useDebounced<T>(value: T, ms: number): T {
  const [v, setV] = useState(value)
  useEffect(() => {
    const id = setTimeout(() => setV(value), ms)
    return () => clearTimeout(id)
  }, [value, ms])
  return v
}

export function QuickCheck() {
  const t = useTranslations("check")
  const tz = useTranslations("zone")
  const ta = useTranslations("aqi")
  const locale = useLocale()

  const [place, setPlace] = useState<Place>(AUSTIN)
  const [query, setQuery] = useState("")
  const [search, setSearch] = useState<{ q: string; items: Place[] } | null>(null)
  const [locating, setLocating] = useState(false)
  const [locError, setLocError] = useState<string | null>(null)
  /** null means "choose rules from the location" (UIL inside Texas, KSI elsewhere). */
  const [ruleSetId, setRuleSetId] = useState<RuleSetId | null>(null)
  const [accuracyM, setAccuracyM] = useState<number | null>(null)
  /** null means "use the class suggested for this location". */
  const [regionId, setRegionId] = useState<string | null>(null)
  const [sport, setSport] = useState<Sport>("football")
  const [nonce, setNonce] = useState(0)
  const [result, setResult] = useState<{ key: string; data: ConditionsResponse | null; error: boolean } | null>(null)
  const [now, setNow] = useState(() => Date.now())
  const debounced = useDebounced(query.trim(), 300)

  useEffect(() => {
    const id = setInterval(() => setNow(Date.now()), 60_000)
    return () => clearInterval(id)
  }, [])

  // Place search (state is only set from async callbacks; "searching" is derived).
  useEffect(() => {
    if (debounced.length < 2) return
    const ctrl = new AbortController()
    fetch(`/api/geocode?q=${encodeURIComponent(debounced)}`, { signal: ctrl.signal })
      .then((r) => r.json() as Promise<ApiEnvelope<Place[]>>)
      .then((j) => setSearch({ q: debounced, items: j.ok ? j.data : [] }))
      .catch(() => undefined)
    return () => ctrl.abort()
  }, [debounced])
  const searching = debounced.length >= 2 && search?.q !== debounced
  const results = debounced.length >= 2 && search?.q === debounced ? search.items : null

  // Conditions (loading and error are derived from the request key).
  const requestKey = `${place.lat},${place.lon},${ruleSetId ?? "auto"},${regionId ?? "auto"},${nonce}`
  useEffect(() => {
    const ctrl = new AbortController()
    const params = new URLSearchParams({ lat: String(place.lat), lon: String(place.lon) })
    if (ruleSetId) params.set("ruleSetId", ruleSetId)
    if (regionId) params.set("regionId", regionId)
    fetch(`/api/conditions?${params}`, { signal: ctrl.signal })
      .then((r) => r.json() as Promise<ApiEnvelope<ConditionsResponse>>)
      .then((j) => setResult({ key: requestKey, data: j.ok ? j.data : null, error: !j.ok }))
      .catch((e: unknown) => {
        if (!(e instanceof DOMException && e.name === "AbortError")) setResult({ key: requestKey, data: null, error: true })
      })
    return () => ctrl.abort()
  }, [requestKey, place, ruleSetId, regionId])
  const loading = result?.key !== requestKey
  const error = !loading && result?.error === true
  const data = result?.data ?? null
  const load = () => setNonce((n) => n + 1)

  function choosePlace(p: Place, accuracy: number | null = null) {
    setPlace(p)
    setQuery("")
    setRuleSetId(null)
    setRegionId(null)
    setAccuracyM(accuracy)
  }

  /** Replace the coordinate label with a real place name once the lookup returns. */
  async function nameLocation(lat: number, lon: number) {
    try {
      const r = await fetch(`/api/reverse-geocode?lat=${lat}&lon=${lon}&lang=${locale}`)
      const j = (await r.json()) as ApiEnvelope<{ name: string; region: string } | null>
      if (!j.ok || !j.data) return
      const named = j.data
      setPlace((cur) => (cur.id === "me" && cur.lat === lat && cur.lon === lon ? { ...cur, name: named.name, region: named.region } : cur))
    } catch {
      // Keep the coordinate label; the forecast does not depend on the name.
    }
  }

  function useMyLocation() {
    if (!("geolocation" in navigator)) return
    setLocating(true)
    setLocError(null)
    navigator.geolocation.getCurrentPosition(
      (pos) => {
        setLocating(false)
        const lat = Math.round(pos.coords.latitude * 1e4) / 1e4
        const lon = Math.round(pos.coords.longitude * 1e4) / 1e4
        choosePlace(
          {
            id: "me",
            name: t("myLocation"),
            region: `${lat.toFixed(4)}, ${lon.toFixed(4)}`,
            lat,
            lon,
            timeZone: Intl.DateTimeFormat().resolvedOptions().timeZone,
          },
          pos.coords.accuracy,
        )
        void nameLocation(lat, lon)
      },
      (err) => {
        setLocating(false)
        setLocError(err.code === err.PERMISSION_DENIED ? t("locationDenied") : t("locationUnavailable"))
      },
      { enableHighAccuracy: true, timeout: 15_000, maximumAge: 0 },
    )
  }

  const view = useMemo(() => {
    if (!data) return null
    const start = data.hours.findIndex((h) => h.t <= now && now < h.t + HOUR)
    const idx = start >= 0 ? start : data.hours.findIndex((h) => h.t > now)
    const next24 = idx >= 0 ? data.hours.slice(idx, idx + 24) : []
    const current = next24[0] ?? null
    const change = current ? next24.find((h) => h.level !== current.level && h.level !== "unknown") ?? null : null
    const chartHours = idx >= 0 ? data.hours.slice(Math.max(0, idx - 6), idx + 36) : []
    return { current, next24, change, chartHours }
  }, [data, now])

  const regionRef = data ? data.region : { ruleSetId: ruleSetId ?? "uil-2026-27", regionId: regionId ?? "class3" }
  const rs = getRuleSet(regionRef.ruleSetId)
  const region = rs.regions.find((r) => r.id === regionRef.regionId) ?? rs.regions[0]!
  const current = view?.current ?? null
  const req = current && current.level !== "unknown" ? requirementsFor(current.level, sport, regionRef) : null
  const aqi = data?.currentAqi != null ? aqiRequirements(data.currentAqi) : null
  const regionLabel = (id: string) => t(id as "class2" | "class3" | "ksi1" | "ksi2" | "ksi3")

  return (
    <div className="mt-10 grid gap-6 lg:grid-cols-[22rem_1fr]">
      {/* Controls */}
      <Card className="h-fit lg:sticky lg:top-20">
        <CardContent>
          <FieldGroup>
            <Field>
              <FieldLabel htmlFor="place">{t("place")}</FieldLabel>
              <InputGroup>
                <InputGroupInput
                  id="place"
                  value={query}
                  onChange={(e) => setQuery(e.target.value)}
                  placeholder={t("placePlaceholder")}
                  autoComplete="off"
                />
                <InputGroupAddon>{searching ? <Spinner /> : <Search aria-hidden />}</InputGroupAddon>
              </InputGroup>
              {results && (
                <ItemGroup className="mt-1" aria-live="polite">
                  {results.length === 0 ? (
                    <p className="text-sm text-muted-foreground">{t("notFound")}</p>
                  ) : (
                    results.map((p) => (
                      <Item key={p.id} size="xs" variant="outline" render={<button type="button" onClick={() => choosePlace(p)} />}>
                        <ItemMedia variant="icon"><MapPin aria-hidden /></ItemMedia>
                        <ItemContent>
                          <ItemTitle>{p.name}</ItemTitle>
                          <ItemDescription>{p.region}</ItemDescription>
                        </ItemContent>
                      </Item>
                    ))
                  )}
                </ItemGroup>
              )}
              <Button type="button" variant="outline" onClick={useMyLocation} disabled={locating}>
                {locating ? <Spinner data-icon="inline-start" /> : <LocateFixed data-icon="inline-start" />}
                {locating ? t("locating") : t("useLocation")}
              </Button>
              {locError && <p className="text-sm text-destructive">{locError}</p>}
              <p className="flex items-center gap-1.5 text-sm">
                <MapPin className="size-4 text-muted-foreground" aria-hidden />
                <span className="font-medium">{place.name}</span>
                <span className="truncate text-muted-foreground">{place.region}</span>
              </p>
              {accuracyM !== null && (
                <p className={cn("text-xs", accuracyM > ROUGH_FIX_M ? "text-destructive" : "text-muted-foreground")}>
                  {accuracyM > ROUGH_FIX_M
                    ? t("accuracyRough", { km: (accuracyM / 1000).toFixed(accuracyM >= 10_000 ? 0 : 1) })
                    : t("accuracy", { meters: Math.round(accuracyM) })}
                </p>
              )}
              {data && !data.sources.nws.ok && <p className="text-xs text-muted-foreground">{t("nwsUsOnly")}</p>}
            </Field>

            <Field>
              <FieldLabel>{t("rules")}</FieldLabel>
              <ToggleGroup
                variant="outline"
                value={[regionRef.ruleSetId]}
                onValueChange={(v) => {
                  const next = v[0] as RuleSetId | undefined
                  if (!next) return
                  setRuleSetId(next)
                  setRegionId(next === "uil-2026-27" ? (data?.suggestion.regionId ?? "class3") : "ksi1")
                }}
              >
                <ToggleGroupItem value="uil-2026-27">{t("rulesUil")}</ToggleGroupItem>
                <ToggleGroupItem value="ksi-2015">{t("rulesKsi")}</ToggleGroupItem>
              </ToggleGroup>
            </Field>

            <Field>
              <FieldLabel>{t("region")}</FieldLabel>
              <ToggleGroup
                variant="outline"
                size="sm"
                value={[region.id]}
                onValueChange={(v) => v[0] && setRegionId(v[0])}
              >
                {rs.regions.map((r) => (
                  <ToggleGroupItem key={r.id} value={r.id}>{regionLabel(r.id)}</ToggleGroupItem>
                ))}
              </ToggleGroup>
              {regionRef.ruleSetId === "ksi-2015" && <p className="text-xs text-muted-foreground">{t("ksiHelp")}</p>}
              {regionRef.ruleSetId === "uil-2026-27" && data?.suggestion.inTexas && (
                <p className="text-xs text-muted-foreground">{t("suggestedClass", { region: regionLabel(data.suggestion.regionId) })}</p>
              )}
              {regionRef.ruleSetId === "uil-2026-27" && data?.suggestion.nearBoundary && (
                <p className="text-xs text-muted-foreground">{t("nearBoundary")}</p>
              )}
            </Field>

            <Field>
              <FieldLabel>{t("activity")}</FieldLabel>
              <ToggleGroup variant="outline" size="sm" className="flex-wrap" value={[sport]} onValueChange={(v) => v[0] && setSport(v[0] as Sport)}>
                {ACTIVITIES.map((a) => (
                  <ToggleGroupItem key={a.value} value={a.value}>{t(a.key)}</ToggleGroupItem>
                ))}
              </ToggleGroup>
            </Field>
          </FieldGroup>
        </CardContent>
      </Card>

      {/* Results */}
      <div className="flex min-w-0 flex-col gap-6" aria-live="polite" aria-busy={loading}>
        {error ? (
          <Alert variant="destructive">
            <AlertTriangle aria-hidden />
            <AlertTitle>{t("error")}</AlertTitle>
            <AlertDescription>
              <Button size="sm" variant="outline" className="mt-2" onClick={() => load()}>
                <RefreshCw data-icon="inline-start" />
                {t("retry")}
              </Button>
            </AlertDescription>
          </Alert>
        ) : loading && !data ? (
          <div className="flex flex-col gap-4">
            <Skeleton className="h-48 w-full rounded-xl" />
            <Skeleton className="h-24 w-full rounded-xl" />
            <Skeleton className="h-72 w-full rounded-xl" />
          </div>
        ) : !current ? (
          <Empty className="border">
            <EmptyHeader>
              <EmptyMedia variant="icon"><Search /></EmptyMedia>
              <EmptyTitle>{t("title")}</EmptyTitle>
              <EmptyDescription>{t("empty")}</EmptyDescription>
            </EmptyHeader>
          </Empty>
        ) : (
          <>
            <Card className={cn("overflow-hidden", loading && "opacity-60 transition-opacity")}>
              <div className={cn("flex flex-col gap-4 p-5 md:flex-row md:items-end md:justify-between", ZONE_META[current.level].solid)}>
                <div className="flex flex-col gap-1">
                  <p className="text-sm font-medium opacity-90">{t("now")} · {place.name} · {regionLabel(region.id)}</p>
                  <p className="text-4xl font-semibold tracking-tight md:text-5xl">{tz(current.level)}</p>
                  <p className="text-sm opacity-90">{tz(`short.${current.level}`)}</p>
                </div>
                <p className="font-mono text-6xl font-semibold tabular-nums">
                  {current.planningF?.toFixed(1)}°
                  <span className="ml-1 text-base font-normal opacity-80">WBGT</span>
                </p>
              </div>
              <CardContent className="flex flex-col gap-3 pt-4">
                <div className="flex flex-wrap items-center gap-2">
                  <Badge variant="outline">{t("forecastBadge")}</Badge>
                  {current.range && (
                    <Badge variant="secondary" className="font-mono tabular-nums">
                      {current.range[0].toFixed(1)}° to {current.range[1].toFixed(1)}°
                    </Badge>
                  )}
                  {current.singleSource && <Badge variant="outline">{t("singleSource")}</Badge>}
                </div>
                {current.borderline && current.level !== "black" && (
                  <Alert>
                    <AlertTriangle aria-hidden />
                    <AlertDescription>
                      {t("borderline", { level: tz(({ green: "yellow", yellow: "orange", orange: "red", red: "black" } as const)[current.level as "green" | "yellow" | "orange" | "red"]) })}
                    </AlertDescription>
                  </Alert>
                )}
                <p className="text-sm">
                  {view?.change ? t("nextChange", { level: tz(view.change.level), time: formatTime(view.change.t, locale, place.timeZone) }) : t("noChange")}
                </p>
              </CardContent>
            </Card>

            <div className="grid gap-6 md:grid-cols-2">
              <Card>
                <CardHeader>
                  <CardTitle>{t("requirementsTitle")}</CardTitle>
                  <CardDescription className="flex items-center gap-2">
                    <ZoneBadge level={current.level} /> {rs.name}
                  </CardDescription>
                </CardHeader>
                <CardContent>{req && <RequirementsList req={req} showFootball={sport === "football"} />}</CardContent>
              </Card>

              <div className="flex flex-col gap-6">
                <Card size="sm">
                  <CardHeader>
                    <CardTitle className="flex items-center gap-2"><Wind className="size-4" aria-hidden />{t("aqiTitle")}</CardTitle>
                    {aqi ? (
                      <CardDescription>
                        <span className="font-mono text-2xl text-foreground tabular-nums">{aqi.aqi}</span>{" "}
                        <Badge variant={aqi.aqi > 150 ? "destructive" : "secondary"}>{ta(aqi.category)}</Badge>
                        <span className="mt-1 block">{ta(aqi.action)}</span>
                        <span className="mt-1 block text-xs">{ta("preliminary")}</span>
                      </CardDescription>
                    ) : (
                      <CardDescription>{t("unavailable")}</CardDescription>
                    )}
                  </CardHeader>
                </Card>
                <Card size="sm">
                  <CardHeader>
                    <CardTitle className="flex items-center gap-2"><CloudLightning className="size-4" aria-hidden />{t("thunderTitle")}</CardTitle>
                    <CardDescription>
                      <span className="font-mono text-2xl text-foreground tabular-nums">
                        {current.thunderPct !== null ? `${Math.round(current.thunderPct)}%` : t("unavailable")}
                      </span>
                    </CardDescription>
                  </CardHeader>
                </Card>
                <Card size="sm">
                  <CardHeader>
                    <CardTitle>{t("sourcesTitle")}</CardTitle>
                  </CardHeader>
                  <CardContent className="flex flex-col gap-1.5 text-sm">
                    <p className="flex justify-between gap-2"><span className="text-muted-foreground">{t("nws")}</span><span className="font-mono tabular-nums">{current.nwsF !== null ? `${current.nwsF.toFixed(0)}°` : t("unavailable")}</span></p>
                    <p className="flex justify-between gap-2"><span className="text-muted-foreground">{t("model")}</span><span className="font-mono tabular-nums">{current.modelSunF !== null ? `${current.modelSunF.toFixed(1)}°` : t("unavailable")}</span></p>
                    <p className="flex justify-between gap-2"><span className="text-muted-foreground">{t("shade")}</span><span className="font-mono tabular-nums">{current.modelShadeF !== null ? `${current.modelShadeF.toFixed(1)}°` : t("unavailable")}</span></p>
                  </CardContent>
                </Card>
              </div>
            </div>

            <Card>
              <CardHeader>
                <CardTitle>{t("timelineTitle")}</CardTitle>
              </CardHeader>
              <CardContent>
                <Tabs defaultValue="timeline">
                  <TabsList>
                    <TabsTrigger value="timeline">{t("timelineTitle")}</TabsTrigger>
                    <TabsTrigger value="chart">{t("chartTitle")}</TabsTrigger>
                  </TabsList>
                  <TabsContent value="timeline" className="pt-4">
                    <ZoneTimeline hours={view?.next24 ?? []} timeZone={place.timeZone} />
                  </TabsContent>
                  <TabsContent value="chart" className="pt-4">
                    <WbgtChart hours={view?.chartHours ?? []} bands={region.bands} timeZone={place.timeZone} />
                  </TabsContent>
                </Tabs>
              </CardContent>
            </Card>

            <Alert>
              <AlertTriangle aria-hidden />
              <AlertDescription className="flex flex-col gap-3">
                <span>{t("disclaimer")}</span>
                <Link
                  href={`/practice?lat=${place.lat}&lon=${place.lon}&region=${region.id}&sport=${sport}`}
                  className={cn(buttonVariants({ size: "sm" }), "w-fit")}
                >
                  {t("startPractice")}
                </Link>
              </AlertDescription>
            </Alert>
          </>
        )}
      </div>
    </div>
  )
}
