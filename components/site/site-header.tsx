import { ChevronRight, Menu } from "lucide-react"
import Link from "next/link"
import { useTranslations } from "next-intl"

import { buttonVariants } from "@/components/ui/button"
import { Sheet, SheetContent, SheetHeader, SheetTitle, SheetTrigger } from "@/components/ui/sheet"
import { Button } from "@/components/ui/button"
import { cn } from "@/lib/utils"

import { Brand } from "./brand"
import { LocaleToggle } from "./locale-toggle"
import { ModeToggle } from "./mode-toggle"

export function SiteHeader() {
  const t = useTranslations("nav")
  const links = [
    { href: "/#how", label: t("howItWorks") },
    { href: "/check", label: t("check") },
    { href: "/teams/new", label: t("setupTeam") },
    { href: "/practice", label: t("practice") },
    { href: "/emergency", label: t("emergency") },
  ]
  return (
    <header className="sticky top-0 z-40 border-b bg-background/80 backdrop-blur supports-backdrop-filter:bg-background/70">
      <a href="#main" className="sr-only focus:not-sr-only focus:absolute focus:top-2 focus:left-2 focus:rounded-md focus:bg-background focus:px-3 focus:py-2">
        {t("skip")}
      </a>
      <div className="page-col flex h-14 items-center gap-4 px-4 md:px-8 xl:px-16">
        <Brand />
        <nav aria-label="Main" className="hidden flex-1 items-center gap-1 md:flex">
          {links.map((l) => (
            <Link key={l.href} href={l.href} className={buttonVariants({ variant: "ghost", size: "sm" })}>
              {l.label}
            </Link>
          ))}
        </nav>
        <div className="ml-auto flex items-center gap-1">
          <LocaleToggle />
          <ModeToggle />
          <Link href="/check" className={cn(buttonVariants({ size: "sm" }), "hidden sm:inline-flex")}>
            {t("checkNow")}
            <ChevronRight data-icon="inline-end" />
          </Link>
          <Sheet>
            <SheetTrigger render={<Button variant="ghost" size="icon" className="md:hidden" aria-label={t("menu")} />}>
              <Menu />
            </SheetTrigger>
            <SheetContent side="right">
              <SheetHeader>
                <SheetTitle>{t("brand")}</SheetTitle>
              </SheetHeader>
              <nav aria-label="Mobile" className="flex flex-col gap-1 px-4">
                {links.map((l) => (
                  <Link key={l.href} href={l.href} className={cn(buttonVariants({ variant: "ghost", size: "lg" }), "justify-start")}>
                    {l.label}
                  </Link>
                ))}
              </nav>
            </SheetContent>
          </Sheet>
        </div>
      </div>
    </header>
  )
}
