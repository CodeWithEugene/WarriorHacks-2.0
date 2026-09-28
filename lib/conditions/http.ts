const APP_URL = process.env.NEXT_PUBLIC_APP_URL ?? "https://flagline.xyz"
const CONTACT = process.env.APP_CONTACT_EMAIL ?? "contact@flagline.xyz"

/** NWS requires an identifying User-Agent with a contact. */
export const USER_AGENT = `Flagline (${APP_URL}, ${CONTACT})`

export class UpstreamError extends Error {
  constructor(
    readonly source: string,
    message: string,
  ) {
    super(`${source}: ${message}`)
  }
}

const TIMEOUT_MS = 6000

export async function getJson(source: string, url: string, revalidateSeconds: number, init: RequestInit = {}): Promise<unknown> {
  let lastError: unknown
  for (let attempt = 0; attempt < 2; attempt++) {
    try {
      const res = await fetch(url, {
        ...init,
        headers: { "User-Agent": USER_AGENT, Accept: "application/geo+json, application/json", ...init.headers },
        signal: AbortSignal.timeout(TIMEOUT_MS),
        next: { revalidate: revalidateSeconds },
      })
      if (!res.ok) throw new UpstreamError(source, `HTTP ${res.status}`)
      return await res.json()
    } catch (err) {
      lastError = err
      if (attempt === 0) await new Promise((r) => setTimeout(r, 250 + Math.random() * 250))
    }
  }
  throw lastError instanceof Error ? lastError : new UpstreamError(source, "request failed")
}
