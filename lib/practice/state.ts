/**
 * Practice Mode session state (client-side demo). Pure reducer so it can be tested and
 * persisted to localStorage; the same shape will back the server-side session later.
 */
import { LEVEL_RANK, levelFor, type RegionRef, type Sport } from "@/lib/rules"
import type { Level } from "@/lib/rules/schema"

export type ReadingSource = "measured" | "forecast"

export type PracticeReading = { id: string; at: number; wbgtF: number; source: ReadingSource; level: Level; onTime: boolean }
export type PracticeBreak = { id: string; start: number; end: number | null }
export type LogKind = "start" | "reading" | "level" | "confirm" | "break" | "thunder" | "end"
export type LogEntry = { id: string; at: number; kind: LogKind; data: Record<string, string | number> }

export type PracticeState = {
  phase: "setup" | "precheck" | "active" | "ended"
  team: string
  sport: Sport
  region: RegionRef
  plannedMinutes: number
  plannedStart: number
  start: number | null
  end: number | null
  readings: PracticeReading[]
  breaks: PracticeBreak[]
  thunder: number[]
  pendingLevelChange: { from: Level; to: Level; at: number } | null
  cooling: { tub: boolean; temp: boolean; tarp: boolean; person: boolean }
  initials: string | null
  log: LogEntry[]
}

export type PracticeAction =
  | { type: "setup"; team: string; sport: Sport; region: RegionRef; plannedMinutes: number; plannedStart: number }
  | { type: "reading"; wbgtF: number; source: ReadingSource; at: number }
  | { type: "start"; at: number }
  | { type: "confirmLevel"; at: number }
  | { type: "dismissLevel" }
  | { type: "breakStart"; at: number }
  | { type: "breakEnd"; at: number }
  | { type: "thunder"; at: number }
  | { type: "cooling"; key: keyof PracticeState["cooling"]; value: boolean }
  | { type: "end"; at: number; initials: string }
  | { type: "reset" }
  | { type: "hydrate"; state: PracticeState }

export const RECHECK_MS = 30 * 60_000
export const GRACE_MS = 2 * 60_000

let counter = 0
const id = () => `${Date.now().toString(36)}-${(counter++).toString(36)}`

export function initialState(partial: Partial<PracticeState> = {}): PracticeState {
  return {
    phase: "setup",
    team: "",
    sport: "football",
    region: { ruleSetId: "uil-2026-27", regionId: "class3" },
    plannedMinutes: 120,
    plannedStart: Date.now(),
    start: null,
    end: null,
    readings: [],
    breaks: [],
    thunder: [],
    pendingLevelChange: null,
    cooling: { tub: false, temp: false, tarp: false, person: false },
    initials: null,
    log: [],
    ...partial,
  }
}

function maxLevel(readings: readonly PracticeReading[]): Level | null {
  return readings.reduce<Level | null>((m, r) => (m === null || LEVEL_RANK[r.level] > LEVEL_RANK[m] ? r.level : m), null)
}

export function practiceReducer(state: PracticeState, action: PracticeAction): PracticeState {
  switch (action.type) {
    case "setup":
      return { ...initialState(), phase: "precheck", team: action.team, sport: action.sport, region: action.region, plannedMinutes: action.plannedMinutes, plannedStart: action.plannedStart }
    case "reading": {
      const level = levelFor(action.wbgtF, state.region)
      const last = state.readings.at(-1)
      const onTime = !last || action.at - last.at <= RECHECK_MS + GRACE_MS
      const reading: PracticeReading = { id: id(), at: action.at, wbgtF: action.wbgtF, source: action.source, level, onTime }
      const prevMax = maxLevel(state.readings)
      const worsened = state.phase === "active" && prevMax !== null && LEVEL_RANK[level] > LEVEL_RANK[prevMax]
      const log: LogEntry[] = [
        ...state.log,
        { id: id(), at: action.at, kind: "reading", data: { value: action.wbgtF.toFixed(1), source: action.source, level } },
        ...(worsened ? [{ id: id(), at: action.at, kind: "level" as const, data: { level } }] : []),
      ]
      return {
        ...state,
        readings: [...state.readings, reading],
        pendingLevelChange: worsened ? { from: prevMax, to: level, at: action.at } : state.pendingLevelChange,
        log,
      }
    }
    case "start":
      return { ...state, phase: "active", start: action.at, log: [...state.log, { id: id(), at: action.at, kind: "start", data: {} }] }
    case "confirmLevel":
      return { ...state, pendingLevelChange: null, log: [...state.log, { id: id(), at: action.at, kind: "confirm", data: {} }] }
    case "dismissLevel":
      return { ...state, pendingLevelChange: null }
    case "breakStart":
      if (state.breaks.some((b) => b.end === null)) return state
      return { ...state, breaks: [...state.breaks, { id: id(), start: action.at, end: null }] }
    case "breakEnd": {
      const open = state.breaks.find((b) => b.end === null)
      if (!open) return state
      const minutes = Math.round((action.at - open.start) / 60_000)
      return {
        ...state,
        breaks: state.breaks.map((b) => (b.id === open.id ? { ...b, end: action.at } : b)),
        log: [...state.log, { id: id(), at: action.at, kind: "break", data: { minutes } }],
      }
    }
    case "thunder":
      return { ...state, thunder: [...state.thunder, action.at], log: [...state.log, { id: id(), at: action.at, kind: "thunder", data: {} }] }
    case "cooling":
      return { ...state, cooling: { ...state.cooling, [action.key]: action.value } }
    case "end":
      return {
        ...state,
        phase: "ended",
        end: action.at,
        initials: action.initials,
        breaks: state.breaks.map((b) => (b.end === null ? { ...b, end: action.at } : b)),
        log: [...state.log, { id: id(), at: action.at, kind: "end", data: { initials: action.initials } }],
      }
    case "reset":
      return initialState()
    case "hydrate":
      return action.state
  }
}

/** Breaks started within the current clock hour of practice. */
export function breaksThisHour(state: PracticeState, now: number): number {
  if (state.start === null) return 0
  const hourStart = state.start + Math.floor((now - state.start) / 3_600_000) * 3_600_000
  return state.breaks.filter((b) => b.start >= hourStart).length
}

function csvCell(v: string | number): string {
  const s = String(v)
  return /[",\n]/.test(s) ? `"${s.replace(/"/g, '""')}"` : s
}

export function toCsv(state: PracticeState): string {
  const header = ["timestamp_iso", "event", "wbgt_f", "source", "level", "on_time", "detail"]
  const readingById = new Map(state.readings.map((r) => [r.at, r]))
  const rows = state.log.map((e) => {
    const r = e.kind === "reading" ? readingById.get(e.at) : undefined
    return [
      new Date(e.at).toISOString(),
      e.kind,
      r ? r.wbgtF.toFixed(1) : "",
      r ? r.source : "",
      r ? r.level : String(e.data.level ?? ""),
      r ? String(r.onTime) : "",
      e.kind === "break" ? `${e.data.minutes} min` : e.kind === "end" ? `signed ${e.data.initials}` : "",
    ]
  })
  const meta = [
    ["# Flagline practice log"],
    [`# team`, state.team],
    [`# sport`, state.sport],
    [`# rules`, `${state.region.ruleSetId} ${state.region.regionId}`],
    [`# planned_minutes`, String(state.plannedMinutes)],
  ]
  return [...meta, header, ...rows].map((row) => row.map(csvCell).join(",")).join("\n") + "\n"
}
