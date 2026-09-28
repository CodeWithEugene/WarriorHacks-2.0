"use client"

import { useEffect, useReducer, useState } from "react"

import { initialState, practiceReducer, type PracticeState } from "@/lib/practice/state"
import type { Sport } from "@/lib/rules"

import { LiveScreen } from "./live-screen"
import { PrecheckScreen } from "./precheck-screen"
import { SetupForm } from "./setup-form"
import { SummaryScreen } from "./summary-screen"

export type ForecastPoint = { t: number; wbgtF: number }

const STORAGE_KEY = "flagline:practice:v1"

/** Restore an in-progress session (for example after a reload on the sideline). Client-only. */
function loadState(): PracticeState {
  try {
    const raw = localStorage.getItem(STORAGE_KEY)
    return raw ? (JSON.parse(raw) as PracticeState) : initialState()
  } catch {
    return initialState()
  }
}

/** Ticks once per second; timers are computed from the wall clock so they stay correct after sleep. */
function useNow(): number {
  const [now, setNow] = useState(() => Date.now())
  useEffect(() => {
    const id = setInterval(() => setNow(Date.now()), 1000)
    return () => clearInterval(id)
  }, [])
  return now
}

export default function PracticeApp({ forecast, defaultRegion, defaultSport }: { forecast: ForecastPoint[]; defaultRegion: "class2" | "class3"; defaultSport: Sport }) {
  const [state, dispatch] = useReducer(practiceReducer, undefined, loadState)
  const now = useNow()

  useEffect(() => {
    try {
      if (state.phase === "setup") localStorage.removeItem(STORAGE_KEY)
      else localStorage.setItem(STORAGE_KEY, JSON.stringify(state))
    } catch {
      // Storage may be unavailable (private mode); the session still runs in memory.
    }
  }, [state])

  if (state.phase === "setup") return <SetupForm defaultRegion={defaultRegion} defaultSport={defaultSport} onSubmit={dispatch} />
  if (state.phase === "precheck") return <PrecheckScreen state={state} now={now} forecast={forecast} dispatch={dispatch} />
  if (state.phase === "active") return <LiveScreen state={state} now={now} forecast={forecast} dispatch={dispatch} />
  return <SummaryScreen state={state} onReset={() => dispatch({ type: "reset" })} />
}
