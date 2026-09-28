"use client"

import { Copy, Users } from "lucide-react"
import Link from "next/link"
import { useTranslations } from "next-intl"
import { useEffect } from "react"

import { Button, buttonVariants } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { toast } from "@/components/ui/toast"
import { rememberTeam } from "@/lib/my-teams"

export function CoachLinkCard({ coachToken, slug, name }: { coachToken: string; slug: string; name: string }) {
  const t = useTranslations("coach")
  useEffect(() => {
    rememberTeam({ coachToken, name, slug })
  }, [coachToken, slug, name])
  return (
    <Card size="sm">
      <CardHeader>
        <CardTitle>{t("privateLink")}</CardTitle>
        <CardDescription>{t("privateLinkHelp")}</CardDescription>
      </CardHeader>
      <CardContent className="flex flex-wrap gap-2">
        <Button
          variant="outline"
          onClick={async () => {
            await navigator.clipboard.writeText(window.location.href)
            toast.add({ type: "success", title: t("copied") })
          }}
        >
          <Copy data-icon="inline-start" />
          {t("copy")}
        </Button>
        <Link href={`/t/${slug}`} className={buttonVariants({ variant: "ghost" })} target="_blank">
          <Users data-icon="inline-start" />
          {t("teamPage")}
        </Link>
      </CardContent>
    </Card>
  )
}
