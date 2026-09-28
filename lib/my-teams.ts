/** Teams this device has created or opened (coach links), kept in local storage only. */
export type MyTeam = { coachToken: string; name: string; slug: string }
const KEY = "flagline:teams:v1"

export function readMyTeams(): MyTeam[] {
  try {
    const raw = localStorage.getItem(KEY)
    return raw ? (JSON.parse(raw) as MyTeam[]) : []
  } catch {
    return []
  }
}

export function rememberTeam(team: MyTeam): void {
  try {
    const others = readMyTeams().filter((t) => t.coachToken !== team.coachToken)
    localStorage.setItem(KEY, JSON.stringify([team, ...others].slice(0, 10)))
  } catch {
    // Local storage unavailable; the coach link still works.
  }
}
