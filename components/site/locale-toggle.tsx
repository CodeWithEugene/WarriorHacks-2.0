"use client"

import { Languages } from "lucide-react"
import { useLocale, useTranslations } from "next-intl"
import { useRouter } from "next/navigation"
import { useTransition } from "react"

import { setLocale } from "@/app/actions/preferences"
import { Button } from "@/components/ui/button"

export function LocaleToggle() {
  const t = useTranslations("prefs")
  const locale = useLocale()
  const router = useRouter()
  const [pending, startTransition] = useTransition()
  const next = locale === "es" ? "en" : "es"
  return (
    <Button
      variant="ghost"
      size="sm"
      title={t("toggleLanguage")}
      disabled={pending}
      onClick={() =>
        startTransition(async () => {
          await setLocale(next)
          router.refresh()
        })
      }
    >
      <Languages data-icon="inline-start" />
      {/* The visible word is the accessible name (WCAG 2.5.3), spoken in its own language. */}
      <span lang={next}>{next === "es" ? "Español" : "English"}</span>
    </Button>
  )
}
