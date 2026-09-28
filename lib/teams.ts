import "server-only"

import { and, desc, eq } from "drizzle-orm"

import { db } from "@/lib/db"
import { checkIns, practices, teams, type CheckIn, type CheckInFlags, type Practice, type Team } from "@/lib/db/schema"
import { initialState, practiceReducer, type PracticeState } from "@/lib/practice/state"
import type { Sport } from "@/lib/rules"
import { LEVEL_RANK } from "@/lib/rules"
import type { Level } from "@/lib/rules/schema"
import { randomToken, sha256, slugify } from "@/lib/tokens"

export type NewTeam = {
  name: string
  school: string | null
  sport: Sport
  regionId: "class2" | "class3"
  placeName: string
  lat: number
  lon: number
  timeZone: string
}

export async function createTeam(input: NewTeam): Promise<{ team: Team; coachToken: string }> {
  const coachToken = randomToken(18)
  const [team] = await db
    .insert(teams)
    .values({ ...input, slug: slugify(input.name), ruleSetId: "uil-2026-27", coachTokenHash: sha256(coachToken) })
    .returning()
  return { team: team!, coachToken }
}

export async function getTeamByCoachToken(token: string): Promise<Team | null> {
  if (!/^[A-Za-z0-9_-]{16,64}$/.test(token)) return null
  const [team] = await db.select().from(teams).where(eq(teams.coachTokenHash, sha256(token))).limit(1)
  return team ?? null
}

export async function getTeamBySlug(slug: string): Promise<Team | null> {
  if (!/^[a-z0-9-]{3,60}$/.test(slug)) return null
  const [team] = await db.select().from(teams).where(eq(teams.slug, slug)).limit(1)
  return team ?? null
}

function maxLevelOf(state: PracticeState): Level | null {
  return state.readings.reduce<Level | null>((m, r) => (m === null || LEVEL_RANK[r.level] > LEVEL_RANK[m] ? r.level : m), null)
}

export async function createPractice(team: Team, input: { team: string; plannedStart: number; plannedMinutes: number }): Promise<Practice> {
  const state = practiceReducer(initialState(), {
    type: "setup",
    team: input.team,
    sport: team.sport as Sport,
    region: { ruleSetId: team.ruleSetId as "uil-2026-27", regionId: team.regionId },
    plannedMinutes: input.plannedMinutes,
    plannedStart: input.plannedStart,
  })
  const [row] = await db
    .insert(practices)
    .values({
      teamId: team.id,
      plannedStart: new Date(input.plannedStart),
      plannedMinutes: input.plannedMinutes,
      status: state.phase,
      checkInToken: randomToken(12),
      state,
    })
    .returning()
  return row!
}

export async function getPractice(team: Team, practiceId: string): Promise<Practice | null> {
  if (!/^[0-9a-f-]{36}$/.test(practiceId)) return null
  const [row] = await db.select().from(practices).where(and(eq(practices.id, practiceId), eq(practices.teamId, team.id))).limit(1)
  return row ?? null
}

export async function listPractices(team: Team, limit = 10): Promise<Practice[]> {
  return db.select().from(practices).where(eq(practices.teamId, team.id)).orderBy(desc(practices.plannedStart)).limit(limit)
}

export async function savePracticeState(team: Team, practiceId: string, state: PracticeState): Promise<boolean> {
  const rows = await db
    .update(practices)
    .set({ state, status: state.phase, maxLevel: maxLevelOf(state), updatedAt: new Date() })
    .where(and(eq(practices.id, practiceId), eq(practices.teamId, team.id)))
    .returning({ id: practices.id })
  return rows.length > 0
}

export async function getPracticeByCheckInToken(token: string): Promise<{ practice: Practice; team: Team } | null> {
  if (!/^[A-Za-z0-9_-]{12,32}$/.test(token)) return null
  const rows = await db.select().from(practices).innerJoin(teams, eq(practices.teamId, teams.id)).where(eq(practices.checkInToken, token)).limit(1)
  const row = rows[0]
  return row ? { practice: row.practices, team: row.teams } : null
}

export async function addCheckIn(input: {
  practiceId: string
  alias: string | null
  locale: string
  symptoms: string[]
  text: string | null
  routing: string
  aiFlags: CheckInFlags | null
  aiModel: string | null
}): Promise<CheckIn> {
  const [row] = await db.insert(checkIns).values(input).returning()
  return row!
}

export async function listCheckIns(team: Team, practiceId: string): Promise<CheckIn[]> {
  const practice = await getPractice(team, practiceId)
  if (!practice) return []
  return db.select().from(checkIns).where(eq(checkIns.practiceId, practiceId)).orderBy(desc(checkIns.at)).limit(100)
}

export async function resolveCheckIn(team: Team, practiceId: string, checkInId: string): Promise<boolean> {
  const practice = await getPractice(team, practiceId)
  if (!practice || !/^[0-9a-f-]{36}$/.test(checkInId)) return false
  const rows = await db
    .update(checkIns)
    .set({ resolvedAt: new Date() })
    .where(and(eq(checkIns.id, checkInId), eq(checkIns.practiceId, practiceId)))
    .returning({ id: checkIns.id })
  return rows.length > 0
}

/** Latest practice for the public team page (no personal data). */
export async function latestPractice(team: Team): Promise<Practice | null> {
  const [row] = await db.select().from(practices).where(eq(practices.teamId, team.id)).orderBy(desc(practices.plannedStart)).limit(1)
  return row ?? null
}
