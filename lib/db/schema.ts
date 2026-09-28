import { index, integer, jsonb, pgTable, real, text, timestamp, uniqueIndex, uuid } from "drizzle-orm/pg-core"

import type { PracticeState } from "@/lib/practice/state"

/**
 * v1 schema (hackathon): access is by capability links instead of accounts.
 * - A team has a secret coach link (only its SHA-256 hash is stored) and a public slug.
 * - A practice has a check-in token that athletes use from a QR code.
 * No athlete names are stored; a check-in carries an optional jersey number or initials.
 */
export const teams = pgTable(
  "teams",
  {
    id: uuid("id").primaryKey().defaultRandom(),
    slug: text("slug").notNull(),
    name: text("name").notNull(),
    school: text("school"),
    sport: text("sport").notNull(),
    ruleSetId: text("rule_set_id").notNull().default("uil-2026-27"),
    regionId: text("region_id").notNull().default("class3"),
    placeName: text("place_name").notNull(),
    lat: real("lat").notNull(),
    lon: real("lon").notNull(),
    timeZone: text("time_zone").notNull().default("America/Chicago"),
    coachTokenHash: text("coach_token_hash").notNull(),
    createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
  },
  (t) => [uniqueIndex("teams_slug_idx").on(t.slug), uniqueIndex("teams_coach_token_idx").on(t.coachTokenHash)],
)

export const practices = pgTable(
  "practices",
  {
    id: uuid("id").primaryKey().defaultRandom(),
    teamId: uuid("team_id")
      .notNull()
      .references(() => teams.id, { onDelete: "cascade" }),
    plannedStart: timestamp("planned_start", { withTimezone: true }).notNull(),
    plannedMinutes: integer("planned_minutes").notNull(),
    status: text("status").notNull().default("precheck"),
    checkInToken: text("check_in_token").notNull(),
    state: jsonb("state").$type<PracticeState>().notNull(),
    maxLevel: text("max_level"),
    createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
    updatedAt: timestamp("updated_at", { withTimezone: true }).notNull().defaultNow(),
  },
  (t) => [index("practices_team_idx").on(t.teamId, t.plannedStart), uniqueIndex("practices_checkin_idx").on(t.checkInToken)],
)

export type CheckInFlags = Record<string, number | string>

export const checkIns = pgTable(
  "check_ins",
  {
    id: uuid("id").primaryKey().defaultRandom(),
    practiceId: uuid("practice_id")
      .notNull()
      .references(() => practices.id, { onDelete: "cascade" }),
    at: timestamp("at", { withTimezone: true }).notNull().defaultNow(),
    alias: text("alias"),
    locale: text("locale").notNull().default("en"),
    symptoms: jsonb("symptoms").$type<string[]>().notNull().default([]),
    text: text("text"),
    routing: text("routing").notNull(),
    aiFlags: jsonb("ai_flags").$type<CheckInFlags>(),
    aiModel: text("ai_model"),
    resolvedAt: timestamp("resolved_at", { withTimezone: true }),
  },
  (t) => [index("check_ins_practice_idx").on(t.practiceId, t.at)],
)

export type Team = typeof teams.$inferSelect
export type Practice = typeof practices.$inferSelect
export type CheckIn = typeof checkIns.$inferSelect
