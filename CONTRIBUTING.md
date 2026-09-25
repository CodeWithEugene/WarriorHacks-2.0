# Contributing To Flagline

Thanks for helping build **Flagline** for WarriorHacks 2.0. This guide is the team's working agreement: how we plan, branch, code, test, review and ship during the two-week build window (Sep 28 to Oct 12, 2026).

Read these first:
- [docs/info.md](./docs/info.md): the challenge, rules, deadlines and judging.
- [docs/problem.md](./docs/problem.md): the problem and why we chose it.
- [docs/solution.md](./docs/solution.md): the full solution.
- [docs/build.md](./docs/build.md): the build spec. **It is the source of truth for architecture, UI and scope.**
- [CODE_OF_CONDUCT.md](./CODE_OF_CONDUCT.md) and [SECURITY.md](./SECURITY.md).

---

## 1. Ground Rules For The Hackathon

1. **No product code before the theme reveal (Sep 27, 2026).** Git history for application code must start after the reveal. Planning docs in `docs/` are the only pre-event work.
2. **Disclose AI use.** If an AI tool wrote or substantially shaped code, content or assets, note it in your PR description. The README keeps the running disclosure list.
3. **Attribute everything pre-existing:** libraries (automatic via `package.json`), code snippets (link in a comment and the README), datasets, rule tables (source URL in the data file).
4. **Safety first.** Heat and smoke thresholds live in versioned data files with source links and tests. Never change a threshold without a source and a passing rules test. Never remove a disclaimer or the emergency action.
5. **Scope discipline.** One polished core flow beats five half features. New ideas go to the backlog (`docs/build.md` section 21), not into the current sprint, unless the team lead agrees.

## 2. Tooling

| Tool | Version | Notes |
|---|---|---|
| Node.js | 22 LTS or newer (we develop on 24+) | `node -v` |
| **pnpm** | 10+ | **The only package manager.** Never use npm or yarn; never commit `package-lock.json` or `yarn.lock` |
| Git | 2.40+ | |
| Vercel CLI | latest | `pnpm dlx vercel` |
| A Postgres database | Neon (Vercel Marketplace) or local Docker Postgres 16 | See `.env.example` |

Setup (after the repo is scaffolded post-reveal):

```bash
git clone https://github.com/CodeWithEugene/WarriorHacks-2.0.git
cd WarriorHacks-2.0
pnpm install
cp .env.example .env.local   # fill in your own keys; never commit this file
pnpm db:migrate
pnpm db:seed                 # fictional demo school, teams and practices
pnpm dev
```

Common scripts:

```bash
pnpm dev            # Next.js dev server
pnpm build          # production build
pnpm lint           # ESLint
pnpm typecheck      # tsc --noEmit
pnpm test           # Vitest unit and integration tests
pnpm test:rules     # the heat and smoke rules conformance suite only
pnpm test:e2e       # Playwright end-to-end tests (includes axe accessibility checks)
pnpm format         # Prettier (with the Tailwind plugin)
pnpm db:generate    # Drizzle migration from schema changes
pnpm db:migrate     # apply migrations
pnpm db:seed        # seed demo data
```

## 3. Branching And Workflow

- `main` is always deployable and is auto-deployed to production on Vercel. Protected: PRs only, CI must pass, at least one approval.
- Branch names: `feat/<short-name>`, `fix/<short-name>`, `chore/<short-name>`, `docs/<short-name>`, `test/<short-name>`. Example: `feat/recheck-timer`.
- Every PR gets a Vercel preview deployment. Reviewers test the preview, not just the diff.
- Keep PRs small (under ~400 changed lines where possible). Draft PRs early.
- Rebase on `main` before merging; squash merge with a conventional commit title.
- **Freeze:** after the submission release is tagged (Oct 12), nothing merges to `main` until winners are announced (Oct 15, 21:00 CDT).

Parallel work with DevSwarm (optional sponsor tool): one workspace per branch, each with its own port. Merge through normal PRs so history stays reviewable.

## 4. Commit Messages

Conventional commits:

```
<type>: <description>

<optional body explaining why>
```

Types: `feat`, `fix`, `refactor`, `docs`, `test`, `chore`, `perf`, `ci`. Examples:

```
feat: add 30-minute recheck timer with web push reminder
fix: round WBGT to the stricter zone at band boundaries
test: add UIL class 3 conformance cases for 87 to 90 F
```

Do not add `Co-Authored-By` trailers for AI tools. Disclose AI help in the PR description and README instead.

## 5. Code Standards

### 5.1 TypeScript
- `strict: true`. No `any` (use `unknown` and narrow). No non-null assertions without a comment explaining why.
- Validate every external boundary with **Zod**: form input, Server Actions, Route Handlers, weather and AQI API responses, AI responses.
- Prefer pure functions and immutable data. The WBGT model and the rules engine are pure and side-effect free.
- Functions under ~50 lines, files under ~400 lines where practical. Split by feature (`lib/heat`, `lib/rules`, `lib/ai`), not by type.
- Named constants for every threshold and interval (`RECHECK_INTERVAL_MINUTES = 30`), never magic numbers.
- Handle errors explicitly. User-facing messages are friendly and actionable; server logs carry the detail. Never swallow errors.
- No `console.log` in committed code (use the logger in `lib/log.ts`).

### 5.2 UI: pure shadcn/ui
- **Only shadcn/ui components** from the default `@shadcn` registry, added with `pnpm dlx shadcn@latest add <name>`. No other component libraries, no community registries, no hand-rolled replacements for something shadcn already provides.
- `components/ui/*` is generated vendor code. Do not edit it casually; compose in `components/*`. If a primitive truly must change, keep the diff minimal and note it in the PR.
- Semantic tokens only (`bg-primary`, `text-muted-foreground`, and our documented custom zone tokens such as `bg-zone-red`). No raw palette classes (`bg-red-500`) and no hex values in components.
- Base UI APIs: `render={<Button />}` on triggers (not `asChild`); `Select` needs `items`; links styled as buttons use `buttonVariants()` on `next/link`.
- Forms: `Field` + React Hook Form + Zod. Toasts: the shadcn `toast` component. Icons: `lucide-react` only.
- Layout with `flex` and `gap-*`, not `space-y-*`. `size-*` when width equals height.
- **Color is never the only signal.** Every zone shows its name, an icon and text, not just a color.

### 5.3 Copy rules (user-facing text)
- **Title Case** for every page title, heading, card title and button label: "Start Practice", "Log A Reading", "Download Practice Log".
- Body text, descriptions, helper and error text stay in sentence case.
- **No em dashes or en dashes** in any user-facing text (UI, emails, metadata, alt text, toasts, PDFs). Rewrite with a comma, colon, period or parentheses. Hyphens in compound words ("30-minute", "on-site") are fine.
- Plain, calm, direct language. Safety text is specific: say what to do, not just that something is risky.
- Every user-facing string lives in the message catalogs (`messages/en.json`, `messages/es.json`). Spanish is reviewed by a fluent speaker before merge.

### 5.4 Accessibility (required, not optional)
- WCAG 2.2 AA for all core flows.
- Every interactive element is keyboard reachable with a visible focus ring. Icon-only buttons have `aria-label`.
- Minimum touch target 44 by 44 px on mobile (sideline use with sweaty hands and gloves).
- Text contrast at least 4.5:1, including zone badges in both themes. Test in bright-sunlight mode.
- Live values (current zone, countdown) use appropriate `aria-live` regions, throttled to avoid noise.
- Respect `prefers-reduced-motion`.
- Charts include `accessibilityLayer` and a text summary.

### 5.5 AI
- Semantic judgments (classifying, routing, extracting a value, yes/no screening, scoring) use **TypeSafe Jev** (`jev-latest`) through `@typesafe-ai/sdk`, server-side only.
- Design questions as Choice, Score or Noul; ask independent questions in one request; keep rules, math and lookups in code.
- Every AI result is confidence-gated: below threshold, ask the user or fall back to manual input.
- A text-generating model (Claude) is used only where Jev cannot do the job (reading digits from a meter photo). Such uses are documented in `docs/build.md` section 11.
- AI never decides a heat zone, a practice limit or that an athlete is fine.

## 6. Testing

| Layer | Tool | What must be covered |
|---|---|---|
| WBGT physics | Vitest | Reference values from published implementations, solar geometry, edge cases (night, zero wind, extreme humidity), monotonicity properties |
| Rules engine | Vitest (`pnpm test:rules`) | Every row and boundary of every rule table (UIL Class 1, 2, 3; ACSM generic; AQI), rounding to the stricter zone, gear and duration outputs |
| AI adapters | Vitest with recorded fixtures | Confidence gating, fallbacks, schema validation, red-flag recall on the test phrase set |
| Server Actions and routes | Vitest integration with a test database | Auth and role checks, validation errors, happy paths |
| UI flows | Playwright | Onboarding, plan a practice, start practice, log a reading, recheck, athlete check-in escalation, download the log; axe accessibility scan on every page |

Targets: 90%+ coverage on `lib/heat` and `lib/rules`; 80%+ overall. Write the test first for anything safety-critical.

## 7. Pull Request Checklist

- [ ] Linked to a task in the build plan (`docs/build.md` section 20) or an issue.
- [ ] `pnpm lint`, `pnpm typecheck`, `pnpm test` pass locally; CI is green.
- [ ] New or changed thresholds have a source link and conformance tests.
- [ ] UI uses only shadcn components and semantic tokens; tested in light, dark and sunlight modes; keyboard-only pass done.
- [ ] Copy follows Title Case and no-dash rules; strings are in both `en` and `es` catalogs.
- [ ] No secrets, no real personal data, no `console.log`.
- [ ] Screenshots or a short clip of the Vercel preview for UI changes.
- [ ] AI assistance disclosed in the PR description if used.

## 8. Reporting Bugs

Open a GitHub issue with steps to reproduce, expected versus actual behavior, device and browser, and screenshots. **Safety bugs** (the app shows a less protective answer than the rules) and **security issues** are reported privately per [SECURITY.md](./SECURITY.md).

## 9. License And Attribution

By contributing you agree that your contributions are licensed under the repository's license (MIT, see `LICENSE` once added). Third-party data keeps its own terms (for example Open-Meteo's CC BY 4.0 attribution requirement), recorded in the README.
