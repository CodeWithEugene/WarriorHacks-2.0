"use client"

import { useEffect, useReducer, useRef, useState } from "react"

import { syncPracticeAction } from "@/app/actions/coach"
import { LiveScreen } from "@/app/practice/live-screen"
import type { ForecastPoint } from "@/app/practice/practice-app"
import { PrecheckScreen } from "@/app/practice/precheck-screen"
import { SummaryScreen } from "@/app/practice/summary-screen"
import { practiceReducer, type PracticeState } from "@/lib/practice/state"

import { CheckInPanel } from "./check-in-panel"

const SYNC_DEBOUNCE_MS = 800

function useNow(): number {
  const [now, setNow] = useState(() => Date.now())
  useEffect(() => {
    const id = setInterval(() => setNow(Date.now()), 1000)
    return () => clearInterval(id)
  }, [])
  return now
}

export function SyncedPractice({
  coachToken,
  practiceId,
  initialState,
  forecast,
  checkInUrl,
  qrDataUrl,
}: {
  coachToken: string
  practiceId: string
  initialState: PracticeState
  forecast: ForecastPoint[]
  checkInUrl: string
  qrDataUrl: string
}) {
  const [state, dispatch] = useReducer(practiceReducer, initialState)
  const now = useNow()
  const first = useRef(true)

  // Save every change to the server (debounced). Offline edits stay in memory and sync on the next change.
  useEffect(() => {
    if (first.current) {
      first.current = false
      return
    }
    const id = setTimeout(() => {
      void syncPracticeAction(coachToken, practiceId, state)
    }, SYNC_DEBOUNCE_MS)
    return () => clearTimeout(id)
  }, [state, coachToken, practiceId])

  const panel = <CheckInPanel coachToken={coachToken} practiceId={practiceId} checkInUrl={checkInUrl} qrDataUrl={qrDataUrl} />

  if (state.phase === "precheck")
    return (
      <div className="flex flex-col gap-6">
        <PrecheckScreen state={state} now={now} forecast={forecast} dispatch={dispatch} />
        <div className="mx-auto w-full max-w-2xl">{panel}</div>
      </div>
    )
  if (state.phase === "active") return <LiveScreen state={state} now={now} forecast={forecast} dispatch={dispatch} extra={panel} />
  return <SummaryScreen state={state} onReset={() => window.history.back()} />
}
