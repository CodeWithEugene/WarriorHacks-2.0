export const DEFAULT_TZ = "America/Chicago"

export function formatHour(t: number | Date, locale: string, timeZone = DEFAULT_TZ): string {
  return new Intl.DateTimeFormat(locale, { hour: "numeric", timeZone }).format(t)
}

export function formatTime(t: number | Date, locale: string, timeZone = DEFAULT_TZ): string {
  return new Intl.DateTimeFormat(locale, { hour: "numeric", minute: "2-digit", timeZone }).format(t)
}

export function formatDay(t: number | Date, locale: string, timeZone = DEFAULT_TZ): string {
  return new Intl.DateTimeFormat(locale, { weekday: "short", timeZone }).format(t)
}

export function formatClock(totalSeconds: number): string {
  const s = Math.max(0, Math.round(totalSeconds))
  const h = Math.floor(s / 3600)
  const m = Math.floor((s % 3600) / 60)
  const sec = s % 60
  const mm = String(m).padStart(h > 0 ? 2 : 1, "0")
  const ss = String(sec).padStart(2, "0")
  return h > 0 ? `${h}:${mm}:${ss}` : `${mm}:${ss}`
}

export function formatDuration(minutes: number): string {
  const m = Math.max(0, Math.round(minutes))
  return `${Math.floor(m / 60)}:${String(m % 60).padStart(2, "0")}`
}
