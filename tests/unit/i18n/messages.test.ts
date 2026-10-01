import { readdirSync, readFileSync, statSync } from "node:fs"
import { join } from "node:path"

import { describe, expect, it } from "vitest"

import en from "@/messages/en.json"
import es from "@/messages/es.json"

type Tree = { [key: string]: string | Tree }

function leafKeys(tree: Tree, prefix = ""): string[] {
  return Object.entries(tree).flatMap(([k, v]) => (typeof v === "string" ? [`${prefix}${k}`] : leafKeys(v, `${prefix}${k}.`)))
}

function has(tree: Tree, path: string): boolean {
  let cur: string | Tree | undefined = tree
  for (const part of path.split(".")) {
    if (typeof cur !== "object" || !(part in cur)) return false
    cur = cur[part]
  }
  return cur !== undefined
}

function sourceFiles(dir: string): string[] {
  return readdirSync(dir).flatMap((name) => {
    const path = join(dir, name)
    if (statSync(path).isDirectory()) return name === "ui" ? [] : sourceFiles(path)
    return /\.tsx?$/.test(name) ? [path] : []
  })
}

describe("messages", () => {
  it("has the same keys in English and Spanish", () => {
    expect(leafKeys(es as Tree).sort()).toEqual(leafKeys(en as Tree).sort())
  })

  it("defines every literal key the app asks for", () => {
    const missing: string[] = []
    for (const file of [...sourceFiles("app"), ...sourceFiles("components")]) {
      const src = readFileSync(file, "utf8")
      for (const [, name, ns] of src.matchAll(/const (\w+) = (?:await )?(?:useTranslations|getTranslations)\("(\w+)"\)/g)) {
        for (const [, key] of src.matchAll(new RegExp(`\\b${name}(?:\\.rich)?\\("([\\w.]+)"`, "g"))) {
          if (!has(en as Tree, `${ns}.${key}`)) missing.push(`${file}: ${ns}.${key}`)
        }
      }
    }
    expect(missing).toEqual([])
  })

  it("keeps em and en dashes out of user-facing copy", () => {
    const withDash = leafKeys(en as Tree).concat(leafKeys(es as Tree)).filter((k) => /[–—]/.test(String(k)))
    const values = [...JSON.stringify(en).matchAll(/[–—]/g), ...JSON.stringify(es).matchAll(/[–—]/g)]
    expect(withDash).toEqual([])
    expect(values.length).toBe(0)
  })
})
