CREATE TABLE "check_ins" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"practice_id" uuid NOT NULL,
	"at" timestamp with time zone DEFAULT now() NOT NULL,
	"alias" text,
	"locale" text DEFAULT 'en' NOT NULL,
	"symptoms" jsonb DEFAULT '[]'::jsonb NOT NULL,
	"text" text,
	"routing" text NOT NULL,
	"ai_flags" jsonb,
	"ai_model" text,
	"resolved_at" timestamp with time zone
);
--> statement-breakpoint
CREATE TABLE "practices" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"team_id" uuid NOT NULL,
	"planned_start" timestamp with time zone NOT NULL,
	"planned_minutes" integer NOT NULL,
	"status" text DEFAULT 'precheck' NOT NULL,
	"check_in_token" text NOT NULL,
	"state" jsonb NOT NULL,
	"max_level" text,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "teams" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"slug" text NOT NULL,
	"name" text NOT NULL,
	"school" text,
	"sport" text NOT NULL,
	"rule_set_id" text DEFAULT 'uil-2026-27' NOT NULL,
	"region_id" text DEFAULT 'class3' NOT NULL,
	"place_name" text NOT NULL,
	"lat" real NOT NULL,
	"lon" real NOT NULL,
	"time_zone" text DEFAULT 'America/Chicago' NOT NULL,
	"coach_token_hash" text NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
ALTER TABLE "check_ins" ADD CONSTRAINT "check_ins_practice_id_practices_id_fk" FOREIGN KEY ("practice_id") REFERENCES "public"."practices"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "practices" ADD CONSTRAINT "practices_team_id_teams_id_fk" FOREIGN KEY ("team_id") REFERENCES "public"."teams"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
CREATE INDEX "check_ins_practice_idx" ON "check_ins" USING btree ("practice_id","at");--> statement-breakpoint
CREATE INDEX "practices_team_idx" ON "practices" USING btree ("team_id","planned_start");--> statement-breakpoint
CREATE UNIQUE INDEX "practices_checkin_idx" ON "practices" USING btree ("check_in_token");--> statement-breakpoint
CREATE UNIQUE INDEX "teams_slug_idx" ON "teams" USING btree ("slug");--> statement-breakpoint
CREATE UNIQUE INDEX "teams_coach_token_idx" ON "teams" USING btree ("coach_token_hash");