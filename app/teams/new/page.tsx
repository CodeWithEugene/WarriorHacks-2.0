import type { Metadata } from "next"
import { getTranslations } from "next-intl/server"

import { SiteFooter } from "@/components/site/site-footer"
import { SiteHeader } from "@/components/site/site-header"

import { NewTeamForm } from "./new-team-form"

export async function generateMetadata(): Promise<Metadata> {
  const t = await getTranslations("teams")
  return { title: t("title") }
}

export default async function NewTeamPage() {
  const t = await getTranslations("teams")
  return (
    <>
      <SiteHeader />
      <main id="main" className="page-col px-4 py-12 md:px-8 md:py-16 xl:px-16">
        <div className="mx-auto flex w-full max-w-xl flex-col gap-6">
          <div className="flex flex-col gap-2">
            <h1 className="text-4xl font-light tracking-tight">{t("title")}</h1>
            <p className="text-muted-foreground">{t("lead")}</p>
          </div>
          <NewTeamForm />
        </div>
      </main>
      <SiteFooter />
    </>
  )
}
