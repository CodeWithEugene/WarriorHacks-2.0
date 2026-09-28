import type { Metadata } from "next"
import { getTranslations } from "next-intl/server"

import { SiteFooter } from "@/components/site/site-footer"
import { SiteHeader } from "@/components/site/site-header"

import { QuickCheck } from "./quick-check"

export async function generateMetadata(): Promise<Metadata> {
  const t = await getTranslations("check")
  return { title: t("title"), description: t("lead") }
}

export default async function CheckPage() {
  const t = await getTranslations("check")
  return (
    <>
      <SiteHeader />
      <main id="main" className="page-col px-4 py-12 md:px-8 xl:px-16 md:py-16">
        <h1 className="text-4xl font-light tracking-tight md:text-5xl">{t("title")}</h1>
        <p className="mt-3 max-w-2xl text-lg text-muted-foreground">{t("lead")}</p>
        <QuickCheck />
      </main>
      <SiteFooter />
    </>
  )
}
