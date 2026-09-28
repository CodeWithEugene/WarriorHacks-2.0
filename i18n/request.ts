import { cookies, headers } from "next/headers"
import { getRequestConfig } from "next-intl/server"

import { DEFAULT_LOCALE, isLocale, LOCALE_COOKIE, type Locale } from "./config"

async function resolveLocale(): Promise<Locale> {
  const fromCookie = (await cookies()).get(LOCALE_COOKIE)?.value
  if (isLocale(fromCookie)) return fromCookie
  const accept = (await headers()).get("accept-language") ?? ""
  return accept.toLowerCase().startsWith("es") ? "es" : DEFAULT_LOCALE
}

export default getRequestConfig(async () => {
  const locale = await resolveLocale()
  return {
    locale,
    timeZone: "America/Chicago",
    messages: (await import(`../messages/${locale}.json`)).default,
  }
})
