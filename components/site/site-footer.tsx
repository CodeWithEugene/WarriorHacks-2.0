import Link from "next/link"
import { useTranslations } from "next-intl"

import { Separator } from "@/components/ui/separator"

import { Brand } from "./brand"

export function SiteFooter() {
  const t = useTranslations("home")
  const nav = useTranslations("nav")
  return (
    <footer className="border-t">
      <div className="page-col flex flex-col gap-6 px-4 py-10 md:px-8 xl:px-16">
        <div className="flex flex-col justify-between gap-6 md:flex-row">
          <div className="flex max-w-md flex-col gap-3">
            <Brand />
            <p className="text-sm text-muted-foreground">{t("footerDisclaimer")}</p>
          </div>
          <nav aria-label="Footer" className="flex gap-6 text-sm">
            <Link className="text-muted-foreground hover:text-foreground" href="/check">{nav("check")}</Link>
            <Link className="text-muted-foreground hover:text-foreground" href="/practice">{nav("practice")}</Link>
            <Link className="text-muted-foreground hover:text-foreground" href="/emergency">{nav("emergency")}</Link>
          </nav>
        </div>
        <Separator />
        <div className="flex flex-col gap-2 text-xs text-muted-foreground md:flex-row md:justify-between">
          <p className="max-w-2xl">{t("footerAttribution")}</p>
          <p>{t("footerMade")}</p>
        </div>
      </div>
    </footer>
  )
}
