import type { Metadata } from "next"
import { getTranslations } from "next-intl/server"

import { Brand } from "@/components/site/brand"
import { LocaleToggle } from "@/components/site/locale-toggle"
import { Alert, AlertDescription } from "@/components/ui/alert"
import { getPracticeByCheckInToken } from "@/lib/teams"

import { CheckInForm } from "./check-in-form"

export const metadata: Metadata = { robots: { index: false, follow: false } }

export default async function CheckInPage({ params }: { params: Promise<{ token: string }> }) {
  const { token } = await params
  const t = await getTranslations("checkin")
  const found = await getPracticeByCheckInToken(token)
  const active = found && found.practice.status !== "ended"
  return (
    <main id="main" className="mx-auto flex min-h-svh w-full max-w-md flex-col gap-6 px-4 py-6">
      <div className="flex items-center justify-between">
        <Brand />
        <LocaleToggle />
      </div>
      {active ? (
        <>
          <div className="flex flex-col gap-1">
            <p className="text-sm text-muted-foreground">{found.team.name}</p>
            <h1 className="text-3xl font-semibold tracking-tight">{t("title")}</h1>
            <p className="text-muted-foreground">{t("lead")}</p>
          </div>
          <CheckInForm token={token} />
        </>
      ) : (
        <Alert><AlertDescription>{t("notFound")}</AlertDescription></Alert>
      )}
    </main>
  )
}
