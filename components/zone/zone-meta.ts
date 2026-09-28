import { Ban, CircleCheck, CircleHelp, Clock, OctagonAlert, TriangleAlert, type LucideIcon } from "lucide-react"

import type { LevelOrUnknown } from "@/lib/rules/schema"

export type ZoneMeta = {
  icon: LucideIcon
  /** Solid fill: background + readable foreground (contrast verified). */
  solid: string
  /** Soft tint for large surfaces. */
  tint: string
  /** Dot or swatch color. */
  dot: string
}

export const ZONE_META: Record<LevelOrUnknown, ZoneMeta> = {
  green: { icon: CircleCheck, solid: "bg-zone-green text-zone-green-foreground", tint: "bg-zone-green/10", dot: "bg-zone-green" },
  yellow: { icon: TriangleAlert, solid: "bg-zone-yellow text-zone-yellow-foreground", tint: "bg-zone-yellow/15", dot: "bg-zone-yellow" },
  orange: { icon: Clock, solid: "bg-zone-orange text-zone-orange-foreground", tint: "bg-zone-orange/15", dot: "bg-zone-orange" },
  red: { icon: OctagonAlert, solid: "bg-zone-red text-zone-red-foreground", tint: "bg-zone-red/10", dot: "bg-zone-red" },
  black: { icon: Ban, solid: "bg-zone-black text-zone-black-foreground", tint: "bg-zone-black/10", dot: "bg-zone-black" },
  unknown: { icon: CircleHelp, solid: "bg-zone-unknown text-zone-unknown-foreground", tint: "bg-muted", dot: "bg-muted-foreground" },
}
