"use client"

import { ChevronRight, MapPin, Search } from "lucide-react"
import { useRouter } from "next/navigation"
import { useTranslations } from "next-intl"
import { useEffect, useState, useTransition } from "react"

import { createTeamAction } from "@/app/actions/coach"
import { Alert, AlertDescription } from "@/components/ui/alert"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardFooter } from "@/components/ui/card"
import { Field, FieldDescription, FieldError, FieldGroup, FieldLabel } from "@/components/ui/field"
import { Input } from "@/components/ui/input"
import { InputGroup, InputGroupAddon, InputGroupInput } from "@/components/ui/input-group"
import { Item, ItemContent, ItemDescription, ItemGroup, ItemMedia, ItemTitle } from "@/components/ui/item"
import { NativeSelect, NativeSelectOption } from "@/components/ui/native-select"
import { Spinner } from "@/components/ui/spinner"
import { ToggleGroup, ToggleGroupItem } from "@/components/ui/toggle-group"
import type { ApiEnvelope } from "@/lib/api"
import type { Place } from "@/lib/conditions/geocode"
import { rememberTeam } from "@/lib/my-teams"
import { SPORTS, type Sport } from "@/lib/rules"
import { suggestTexasClass } from "@/lib/rules/texas-class"

export function NewTeamForm() {
  const t = useTranslations("teams")
  const tc = useTranslations("check")
  const ts = useTranslations("sports")
  const router = useRouter()
  const [pending, startTransition] = useTransition()
  const [name, setName] = useState("")
  const [school, setSchool] = useState("")
  const [sport, setSport] = useState<Sport>("football")
  const [regionId, setRegionId] = useState<"class2" | "class3">("class3")
  const [query, setQuery] = useState("")
  const [search, setSearch] = useState<{ q: string; items: Place[] } | null>(null)
  const [place, setPlace] = useState<Place | null>(null)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    const q = query.trim()
    if (q.length < 2) return
    const ctrl = new AbortController()
    const id = setTimeout(() => {
      fetch(`/api/geocode?q=${encodeURIComponent(q)}`, { signal: ctrl.signal })
        .then((r) => r.json() as Promise<ApiEnvelope<Place[]>>)
        .then((j) => setSearch({ q, items: j.ok ? j.data : [] }))
        .catch(() => undefined)
    }, 300)
    return () => {
      clearTimeout(id)
      ctrl.abort()
    }
  }, [query])
  const results = query.trim().length >= 2 && search?.q === query.trim() ? search.items : null

  function submit(e: React.FormEvent) {
    e.preventDefault()
    setError(null)
    if (name.trim().length < 2) return setError(t("errorName"))
    if (!place) return setError(t("errorPlace"))
    startTransition(async () => {
      const res = await createTeamAction({
        name,
        school,
        sport,
        regionId,
        placeName: `${place.name}, ${place.region}`,
        lat: place.lat,
        lon: place.lon,
        timeZone: place.timeZone,
      })
      if (!res.ok) return setError(t("errorGeneric"))
      rememberTeam({ coachToken: res.data.coachToken, name, slug: res.data.slug })
      router.push(`/coach/${res.data.coachToken}`)
    })
  }

  return (
    <Card>
      <CardContent>
        <form id="new-team" onSubmit={submit}>
          <FieldGroup>
            <Field>
              <FieldLabel htmlFor="team-name">{t("name")}</FieldLabel>
              <Input id="team-name" className="h-11" value={name} onChange={(e) => setName(e.target.value)} placeholder={t("namePlaceholder")} maxLength={60} />
            </Field>
            <Field>
              <FieldLabel htmlFor="school">{t("school")}</FieldLabel>
              <Input id="school" className="h-11" value={school} onChange={(e) => setSchool(e.target.value)} placeholder={t("schoolPlaceholder")} maxLength={80} />
            </Field>
            <Field>
              <FieldLabel htmlFor="sport">{t("sport")}</FieldLabel>
              <NativeSelect id="sport" className="h-11" value={sport} onChange={(e) => setSport(e.target.value as Sport)}>
                {SPORTS.map((s) => <NativeSelectOption key={s} value={s}>{ts(s)}</NativeSelectOption>)}
              </NativeSelect>
            </Field>
            <Field>
              <FieldLabel htmlFor="place">{t("location")}</FieldLabel>
              <InputGroup className="h-11">
                <InputGroupInput id="place" value={query} onChange={(e) => setQuery(e.target.value)} placeholder={tc("placePlaceholder")} autoComplete="off" />
                <InputGroupAddon><Search aria-hidden /></InputGroupAddon>
              </InputGroup>
              <FieldDescription>{t("locationHelp")}</FieldDescription>
              {results && (
                <ItemGroup aria-live="polite">
                  {results.map((p) => (
                    <Item
                      key={p.id}
                      size="xs"
                      variant={place?.id === p.id ? "muted" : "outline"}
                      render={<button type="button" onClick={() => { setPlace(p); setQuery(""); setRegionId(suggestTexasClass(p.lat, p.lon).regionId) }} />}
                    >
                      <ItemMedia variant="icon"><MapPin aria-hidden /></ItemMedia>
                      <ItemContent>
                        <ItemTitle>{p.name}</ItemTitle>
                        <ItemDescription>{p.region}</ItemDescription>
                      </ItemContent>
                    </Item>
                  ))}
                </ItemGroup>
              )}
              {place && (
                <p className="flex items-center gap-1.5 text-sm"><MapPin className="size-4" aria-hidden /><span className="font-medium">{place.name}</span><span className="text-muted-foreground">{place.region}</span></p>
              )}
            </Field>
            <Field>
              <FieldLabel>{t("region")}</FieldLabel>
              <ToggleGroup variant="outline" value={[regionId]} onValueChange={(v) => v[0] && setRegionId(v[0] as "class2" | "class3")}>
                <ToggleGroupItem value="class3">{tc("class3")}</ToggleGroupItem>
                <ToggleGroupItem value="class2">{tc("class2")}</ToggleGroupItem>
              </ToggleGroup>
            </Field>
            {error && <FieldError>{error}</FieldError>}
          </FieldGroup>
        </form>
      </CardContent>
      <CardFooter className="flex flex-col items-stretch gap-3">
        <Button type="submit" form="new-team" size="lg" className="h-11" disabled={pending}>
          {pending ? <Spinner data-icon="inline-start" /> : null}
          {pending ? t("creating") : t("create")}
          {!pending && <ChevronRight data-icon="inline-end" />}
        </Button>
        <Alert><AlertDescription>{t("privacyNote")}</AlertDescription></Alert>
      </CardFooter>
    </Card>
  )
}
