import "server-only"

import { createHash, randomBytes } from "node:crypto"

/** 128-bit URL-safe random token. */
export function randomToken(bytes = 16): string {
  return randomBytes(bytes).toString("base64url")
}

export function sha256(value: string): string {
  return createHash("sha256").update(value).digest("hex")
}

export function slugify(name: string): string {
  const base = name
    .normalize("NFD")
    .replace(/\p{Diacritic}/gu, "")
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "")
    .slice(0, 40)
  return `${base || "team"}-${randomBytes(3).toString("hex")}`
}
