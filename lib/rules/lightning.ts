/**
 * NFHS lightning guidance adopted by UIL as the minimum standard
 * (https://www.uiltexas.org/health/info/lightning-safety): suspend activity when
 * lightning is seen or thunder is heard (no-technology path), and resume only after
 * 30 minutes with no new strike or thunder. Every new event resets the clock.
 */

export const LIGHTNING_HOLD_MINUTES = 30

export type LightningEvent = { at: Date }
export type LightningState = { hold: boolean; resumesAt?: Date; lastEventAt?: Date }

export function lightningState(events: readonly LightningEvent[], now: Date): LightningState {
  if (events.length === 0) return { hold: false }
  const last = events.reduce((a, b) => (a.at > b.at ? a : b))
  const resumesAt = new Date(last.at.getTime() + LIGHTNING_HOLD_MINUTES * 60_000)
  return now < resumesAt ? { hold: true, resumesAt, lastEventAt: last.at } : { hold: false, lastEventAt: last.at }
}
