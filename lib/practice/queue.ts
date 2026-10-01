import type { Routing } from "@/lib/ai/triage-rules"

const ROUTING_RANK: Record<Routing, number> = { emergency: 0, check_now: 1, check_soon: 2 }
const rank = (routing: string) => ROUTING_RANK[routing as Routing] ?? ROUTING_RANK.check_soon

type Queued = { routing: string; at: Date | string; resolvedAt: Date | string | null }

/** Open check-ins first, most urgent first, newest first within a level. Returns a new array. */
export function sortQueue<T extends Queued>(items: readonly T[]): T[] {
  const time = (d: Date | string) => new Date(d).getTime()
  return [...items].sort(
    (a, b) =>
      Number(a.resolvedAt !== null) - Number(b.resolvedAt !== null) ||
      rank(a.routing) - rank(b.routing) ||
      time(b.at) - time(a.at),
  )
}

export type ReasonGroups = { tapped: string[]; keyword: boolean; ai: string[] }

/** Turn triage reason codes ("tapped:x", "keyword", "ai:y"), stored comma-joined, into groups the UI can label. */
export function groupReasons(reasons: unknown): ReasonGroups {
  const raw = typeof reasons === "string" ? reasons.split(",") : Array.isArray(reasons) ? reasons : []
  const list = raw.filter((r): r is string => typeof r === "string" && r.length > 0)
  return {
    tapped: list.filter((r) => r.startsWith("tapped:")).map((r) => r.slice("tapped:".length)),
    keyword: list.includes("keyword"),
    ai: list.filter((r) => r.startsWith("ai:")).map((r) => r.slice("ai:".length)),
  }
}
