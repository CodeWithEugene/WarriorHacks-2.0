import "server-only"

import { TypeSafeClient } from "@typesafe-ai/sdk"

let client: TypeSafeClient | null = null

/** Server-only TypeSafe client, or null when TYPESAFE_API_KEY is not configured. */
export function getJev(): TypeSafeClient | null {
  if (!process.env.TYPESAFE_API_KEY) return null
  client ??= new TypeSafeClient({ timeout: 2500, retry: { maxRetries: 1 }, logLevel: "off" })
  return client
}

export const JEV_MODEL = "jev-latest"
