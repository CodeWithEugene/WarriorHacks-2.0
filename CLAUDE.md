# CLAUDE.md: Flagline (WarriorHacks 2.0)

Project instructions for AI coding agents working in this repository.

## What This Repo Is

**Flagline**, our WarriorHacks 2.0 Hackathon-track entry: a free web app that runs heat (WBGT) and wildfire-smoke safety for school outdoor athletics and marching band under the Texas UIL rule (mandatory from Aug 1, 2026). It plans practices, runs the 30-minute recheck routine, routes athlete symptom check-ins, guides the heat stroke emergency protocol and keeps the compliance log.

Read before doing anything:
1. [docs/build.md](./docs/build.md): **the source of truth** for stack, layout, design system, pages, data model, APIs, AI, tests and schedule.
2. [docs/solution.md](./docs/solution.md): product behavior and the domain rules.
3. [docs/info.md](./docs/info.md): hackathon rules and deadlines.
4. [docs/problem.md](./docs/problem.md): why this problem, and the theme pivot protocol.
5. [CONTRIBUTING.md](./CONTRIBUTING.md): workflow, standards, PR checklist.

## Hard Rules

1. **Theme (revealed Sep 27, 2026):** "Create a project that solves an issue in your community, county, state, or nation." Flagline was confirmed ([docs/problem.md](./docs/problem.md) section 7.4). Build window: Sep 28 to Oct 12, 2026 11:45pm CDT (plus a 1-day extension announced by organizers; we still target Oct 12).
2. **pnpm only.** Never npm or yarn. Commit `pnpm-lock.yaml`.
3. **Pure shadcn/ui.** Only components and blocks from the default `@shadcn` registry (`pnpm dlx shadcn@latest add ...`), semantic tokens and our documented zone tokens. No other UI libraries or community registries. Do not casually edit `components/ui/*`; compose in `components/*`.
4. **Base UI APIs** (the project uses `base-nova`): `render={<Button />}` on triggers, not `asChild`; `Select` needs `items`; links styled as buttons use `buttonVariants()` on `next/link`; toasts use `toast` from `@/components/ui/toast`. Run `pnpm dlx shadcn@latest docs <component>` when unsure.
5. **Safety core is deterministic.** `lib/heat` (Liljegren WBGT) and `lib/rules` (UIL, KSI, AQI, lightning, session logic) are pure TypeScript with tests. Thresholds live in versioned JSON with source URLs. Never change a threshold without a source and a passing conformance test. AI never sets a level, a limit, or clears an athlete.
6. **Semantic judgments use TypeSafe Jev** (`jev-latest`) via `@typesafe-ai/sdk`, server-side only. Design questions as Choice, Score or Noul; ask independent questions in one request; gate on confidence. The only text-generating model call is OpenRouter vision (Kimi K3, `OPENROUTER_VISION_MODEL`) for meter-photo transcription. Read https://docs.typesafe.ai/llms.txt before changing AI code.
7. **Copy rules** for user-facing text: Title Case for page titles, headings, card titles and button labels; sentence case for body, helper and error text; **no em dashes or en dashes** anywhere users can read. All strings go in `messages/en.json` and `messages/es.json`.
8. **Never say "safe".** Show the level and what the rules require. Keep every disclaimer and the Emergency action.
9. **Accessibility:** WCAG 2.2 AA; color is never the only signal (icon + label + value); 44 px targets in Practice Mode; axe must pass.
10. **Privacy:** no real minors' data in code, fixtures, screenshots or seeds; demo data is fictional ("Pecan Creek High School").
11. **Secrets** only in env (`.env.local`, Vercel env). Never commit keys. AI keys are server-only.
12. **Disclose AI use** in PR descriptions; the README keeps the running list. No `Co-Authored-By` trailers for AI tools.

## Commands (after scaffolding)

```bash
pnpm dev          # dev server
pnpm lint         # ESLint
pnpm typecheck    # tsc --noEmit
pnpm test         # Vitest
pnpm test:rules   # rules conformance suite (must stay 100%)
pnpm test:ai      # live AI evals (red-flag recall must be 100%)
pnpm test:e2e     # Playwright + axe
pnpm build        # production build
```

Always run lint, typecheck and tests after changes; verify the build before committing.

## Where Things Go

- Pages: `app/[locale]/...` (marketing, auth, public team and check-in pages, `app/` for the signed-in app).
- API routes: `app/api/...`. Server Actions next to their routes (`actions.ts`).
- Domain: `lib/heat`, `lib/rules`, `lib/conditions`, `lib/ai`, `lib/workflows`, `lib/db`.
- UI compositions: `components/<feature>/...`; primitives in `components/ui` (generated).
- Tests: `tests/unit`, `tests/conformance`, `tests/ai-evals`, `tests/e2e`. Never write tests or scratch files to the repo root.

## Key Numbers (UIL 2026-27, verify against `lib/rules/rulesets/uil-2026-27.json`)

- Class 3 (most of Texas, including Austin): yellow at 82.0, orange 87.0, red 90.1, black 92.1 F WBGT.
- Class 2 (Panhandle and South Plains): yellow 79.7, orange 84.7, red 87.7, black 89.8 F WBGT.
- Reading within 15 minutes before practice, every 30 minutes during; orange max 2 hours; red max 1 hour (football: no protective equipment, no conditioning); black: no outdoor workouts; cooling zone required at yellow and above.
