import type { Metadata } from "next"
import { getTranslations } from "next-intl/server"

import { SiteHeader } from "@/components/site/site-header"

import { EmergencyProtocol } from "./emergency-protocol"

export async function generateMetadata(): Promise<Metadata> {
  const t = await getTranslations("emergency")
  return { title: t("title") }
}

export default function EmergencyPage() {
  return (
    <>
      <SiteHeader />
      <main id="main" className="page-col px-4 py-8 md:px-8 md:py-12 xl:px-16">
        <EmergencyProtocol />
      </main>
    </>
  )
}
