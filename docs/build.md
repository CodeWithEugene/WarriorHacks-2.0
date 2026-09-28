# Build Spec: Flagline

> The complete, end-to-end build specification for what we ship at WarriorHacks 2.0: stack, repository, design system (pure shadcn/ui), every page, components, data model, domain engines, APIs, AI integration, notifications, offline, i18n, security, testing, performance, the day-by-day plan and the submission kit.
>
> **This file is the source of truth for implementation.** Product reasoning lives in [solution.md](./solution.md); the problem and evidence in [problem.md](./problem.md); the challenge rules in [info.md](./info.md).
>
> **Rule zero:** nothing in this spec is implemented before the theme reveal on **Sep 27, 2026**. The repository's application code history starts after the reveal.

---

## Table Of Contents

0. [Scope And Definition Of Done](#0-scope-and-definition-of-done)
1. [Build Rules](#1-build-rules)
2. [Tech Stack](#2-tech-stack)
3. [Repository Layout](#3-repository-layout)
4. [Bootstrapping (Exact Commands)](#4-bootstrapping-exact-commands)
5. [Design System (Pure shadcn/ui)](#5-design-system-pure-shadcnui)
6. [Information Architecture And Routes](#6-information-architecture-and-routes)
7. [Page Specifications](#7-page-specifications)
8. [Data Model](#8-data-model)
9. [Domain Modules](#9-domain-modules)
10. [Server Actions And API Routes](#10-server-actions-and-api-routes)
11. [AI Integration (Jev And Claude Vision)](#11-ai-integration-jev-and-claude-vision)
12. [Auth, Roles And Permissions](#12-auth-roles-and-permissions)
13. [Notifications And Durable Practice Sessions](#13-notifications-and-durable-practice-sessions)
14. [Offline And PWA](#14-offline-and-pwa)
15. [Internationalization](#15-internationalization)
16. [Exports (PDF And CSV)](#16-exports-pdf-and-csv)
17. [Security Implementation](#17-security-implementation)
18. [Testing Strategy](#18-testing-strategy)
19. [Performance, Observability And Budgets](#19-performance-observability-and-budgets)
20. [Delivery Plan (Day By Day)](#20-delivery-plan-day-by-day)
21. [Backlog And Stretch](#21-backlog-and-stretch)
22. [Demo Data And Demo Mode](#22-demo-data-and-demo-mode)
23. [Submission Kit](#23-submission-kit)
24. [Pivot Kit](#24-pivot-kit)
25. [Appendices](#25-appendices)

---

## Build Log And Deviations (Updated Sep 28, 2026)

What is built so far (all after the theme reveal):

| Area | Status |
|---|---|
| `lib/heat` Liljegren WBGT port (thermofeel, Apache-2.0) + NOAA solar geometry | Done; matches thermofeel within 0.1 C on 288 live Texas cases |
| `lib/rules` UIL 2026-27 and KSI rule sets, AQI presets, lightning hold, session limits, Texas class suggestion | Done; conformance suite in `tests/conformance` |
| `lib/conditions` NWS gridpoint WBGT + Open-Meteo model + air quality, combined (higher source wins) | Done; parsers tested on recorded fixtures |
| Home page (Stripe-inspired: live eyebrow, two-tone headline, heat ribbon, bento, dark stats band) | Done |
| Quick Check (`/check`) with place search, UIL/KSI, class suggestion, requirements, timeline, chart, AQI, thunder, sources | Done |
| Practice Mode (`/practice`) client-side demo: setup, pre-check, recheck countdown, breaks, time used, level-change confirmation, cooling checklist, thunder hold, live log, end and sign, CSV export, wake lock, session restore | Done |
| Emergency protocol (`/emergency`) with cooling timer, 911 after cooling, temperature entries, incident timeline | Done |
| English and Spanish catalogs, light, dark and sunlight themes | Done |
| Neon Postgres + Drizzle (teams, practices, check-ins); capability links instead of accounts (only SHA-256 hashes of coach tokens stored) | Done |
| Coach dashboard (`/coach/<token>`): conditions, 7-day planner grid, Ask Flagline, start practice, recent practices | Done |
| Synced Practice Mode with check-in QR, check-in queue (10 s polling) and emergency alert dialog | Done |
| Athlete check-in (`/c/<token>`) with recall-first triage (tapped red flags, en/es keyword backstop, Jev Noul/Score/Choice) | Done; live eval 100% recall (25/25), 0/8 false alarms, 8 caught only by Jev |
| Ask Flagline (chrono-node candidates + one Jev request, confidence gated; deterministic plan evaluation and best windows) | Done |
| Public parent page (`/t/<slug>`) and demo team seed | Done |
| Production deploy | Done: https://flagline-seven.vercel.app |
| Web push, PDF export, meter photo (needs an Anthropic key), accounts | Next |

Deviations from the spec above (intentional):
- **Locale is cookie-based** (next-intl without `[locale]` URL segments). Simpler routing; `/` serves English or Spanish from the `NEXT_LOCALE` cookie or `Accept-Language`.
- **Layout is near full width**: a `page-col` utility (in `app/globals.css`) makes every page column fill the viewport minus a small inset (up to 1920 px) and draws the dashed left and right guide lines, including the header and footer.
- **Rate limiting** uses a small in-memory limiter (`lib/rate-limit.ts`) until Upstash Redis is provisioned.
- **Two Practice Modes:** `/practice` is a client-only demo (localStorage); team practices under `/coach/<token>/practice/<id>` sync every change to Postgres (debounced 800 ms).
- **No accounts yet:** access uses capability links (coach link, check-in token, public slug) because no email or OAuth provider is configured; Better Auth remains the plan in section 12.
- **Check-in alerts use polling** (every 10 s) until web push lands.
- **ESLint:** `eslint-plugin-react` version detection is broken under ESLint 10, so the React version is pinned in `eslint.config.mjs`; generated shadcn files (`components/ui`, `hooks/use-mobile.ts`) are excluded from lint.

## 0. Scope And Definition Of Done

### 0.1 Scope tiers

| Tier | Features ([solution.md](./solution.md) section 6) | Rule |
|---|---|---|
| **MVP** (must ship) | F1 Quick Check, F2 School setup and class lock, F3 Today, F4 Planner (grid + best window), F5 Practice scheduling, F6 Practice Mode, F9 Emergency, F10 Compliance log (table + PDF + CSV), F15 Accessibility and display modes | Demo-ready by **Oct 3** (milestone M2) |
| **Core** (planned) | F4 Ask Flagline (Jev), F7 Meter photo, F8 Athlete check-ins + triage, F11 Team page, F13 Push notifications + durable sessions, Spanish, offline Practice Mode, AQI + lightning in the decision | Built Oct 4 to Oct 9 |
| **Stretch** (only if ahead) | F12 Policy import, F14 Acclimatization roster, calibration loop, weekly AD email, parent push | Only after Core passes its checks |

### 0.2 Definition of done (every feature)

- Works end to end on the production URL on a phone (iOS Safari and Android Chrome) and desktop (Chrome, Safari, Firefox).
- Uses only shadcn/ui components and semantic tokens; light, dark and sunlight modes verified.
- Keyboard and screen reader pass; axe shows zero serious or critical violations.
- English and Spanish strings present.
- Loading, empty and error states designed (Skeleton, Empty, Alert).
- Unit and integration tests written; safety-critical logic tested first.
- Copy follows Title Case (titles, buttons) and has no em or en dashes.
- No secrets in code; inputs validated with Zod; authorization checked.

---

## 1. Build Rules

1. **No product code before Sep 27, 2026** (theme reveal). Planning docs only.
2. **pnpm only.** Never npm or yarn. Commit `pnpm-lock.yaml`. `"packageManager": "pnpm@<version>"` in `package.json`.
3. **Pure shadcn/ui.** Every UI element comes from the default `@shadcn` registry (components and blocks) and our semantic tokens. No other component libraries, no community registries (`@magicui`, `@aceternity` and so on), no custom widget that duplicates a shadcn component. Charts use the shadcn `chart` component (Recharts under the hood, as shadcn ships it).
4. **Semantic judgments use TypeSafe Jev** (`jev-latest`) via `@typesafe-ai/sdk`, server-side only. A text-generating model is used only where Jev cannot work (reading pixels in a meter photo). This exception is documented in section 11.
5. **Deterministic safety core.** The WBGT model and rules engine are pure TypeScript with tests; AI never sets a level, a limit or clears an athlete.
6. **Copy rules:** Title Case for page titles, headings, card titles and button labels; sentence case for body, helper and error text; no em dashes or en dashes in any user-facing text.
7. **Disclosure:** every AI tool used for code or content is listed in the README.
8. **Conventional commits**, small PRs, Vercel preview per PR, CI green before merge ([CONTRIBUTING.md](../CONTRIBUTING.md)).

---

## 2. Tech Stack

Versions are what `shadcn init` installs today (verified by generating a project on Sep 25, 2026) or the latest stable at scaffold time.

| Layer | Choice | Version | Why |
|---|---|---|---|
| Framework | **Next.js** (App Router, Turbopack, React Server Components, Server Actions) | 16.3.x | Fast full-stack TypeScript; first-class on Vercel; shadcn's primary template |
| UI runtime | **React** | 19.2.x | Required by Next 16 |
| Language | **TypeScript** (`strict`) | 5.9.x | Type safety across engine, API and UI |
| Styling | **Tailwind CSS v4** (CSS-first, no config file) | 4.3.x | shadcn's styling layer |
| Components | **shadcn/ui** CLI and registry, style **`base-nova`**, base color **neutral** | CLI 4.21.x | The required design system |
| Primitives | **Base UI** (`@base-ui/react`, shadcn's default since Jul 2026) | 1.8.x | Accessible headless primitives behind shadcn components |
| Icons | **lucide-react** (shadcn default `iconLibrary`) | 1.48.x | Consistent icon set |
| Fonts | **Geist** and **Geist Mono** via `next/font/google` (shadcn default) | | Clean UI type; mono for tabular numbers |
| Theming | **next-themes** (light, dark, sunlight) | 0.4.6 | shadcn's dark-mode pattern |
| Forms | **React Hook Form** + **Zod 4** + `@hookform/resolvers` + shadcn **Field** | 7.88 / 4.6 / 5.9 | shadcn's current forms pattern |
| Tables | **TanStack Table v9** with shadcn `table` (data table guide) | 9.2.x | Compliance log |
| Charts | shadcn **chart** (Recharts 3.8) | 3.8.0 | WBGT curves and bands |
| Toasts | shadcn **toast** (Base UI toast) | | Base UI projects use `toast` |
| Database | **Postgres** on **Neon** (Vercel Marketplace) | 16+ | Serverless Postgres, free tier |
| ORM | **Drizzle ORM** + drizzle-kit | latest | Typed schema and migrations, parameterized queries |
| Auth | **Better Auth** (email one-time code via Resend, Google OAuth, demo sign-in) | latest | Simple, self-hosted auth with roles |
| AI judgments | **TypeSafe Jev** via `@typesafe-ai/sdk` | 0.6.x | Typed Choice, Score and Noul answers with calibrated confidence |
| AI vision | **Anthropic Claude** (`claude-sonnet-5`) via `@anthropic-ai/sdk` | latest | Reads digits from meter photos (Jev is text-only) |
| Durable jobs | **Vercel Workflow SDK** (`workflow`, `workflow/next`) | latest | Durable practice-session timers (`sleep`, hooks) |
| Push | **Web Push** (VAPID) with `web-push` | latest | Recheck, break and red-flag alerts |
| PWA and offline | **Serwist** (`@serwist/next`) + IndexedDB (`idb`) | latest | Installable app; offline Practice Mode |
| i18n | **next-intl** | latest | English and Spanish |
| Dates | `date-fns` (already a shadcn dependency) + `@date-fns/tz` + **chrono-node** (NL time parsing) | | Time math in the field's time zone; plan parsing |
| PDF | **@react-pdf/renderer** | latest | Practice log PDFs |
| QR | **qrcode** | latest | Athlete check-in codes |
| Rate limiting | **@upstash/ratelimit** + Upstash Redis (Vercel Marketplace) | latest | Public and AI endpoints |
| PDF text (Stretch) | **unpdf** | latest | Policy import |
| Weather data | **NWS api.weather.gov** (no key), **Open-Meteo** forecast and air quality (no key), **AirNow** (free key, optional) | | Two-source WBGT and AQI |
| Geocoding | **US Census Geocoder** (addresses, no key) and **Open-Meteo Geocoding** (place names) | | School and field locations |
| Testing | **Vitest**, Testing Library, **MSW**, **Playwright**, `@axe-core/playwright` | latest | Unit, integration, e2e, accessibility |
| Lint and format | ESLint 10 (`eslint-config-next`), Prettier 3 + `prettier-plugin-tailwindcss` (shadcn template) | | Code quality |
| CI | **GitHub Actions** (`pnpm/action-setup`, `pnpm install --frozen-lockfile`) | | Lint, typecheck, test, build, e2e |
| Hosting | **Vercel** (production + preview per PR), Vercel Analytics and Speed Insights | | Zero-config deploys |
| Domain | Custom domain, for example `flagline.xyz` (sponsor .xyz; register ourselves during the event) | | Credible demo URL |

---

## 3. Repository Layout

```
.
├── app/
│   ├── [locale]/                        # next-intl locale segment: en | es
│   │   ├── (marketing)/
│   │   │   ├── page.tsx                 # Home (landing + live Quick Check teaser)
│   │   │   ├── check/page.tsx           # Quick Check (public)
│   │   │   ├── how-it-works/page.tsx
│   │   │   ├── sources/page.tsx         # Methodology, data sources, attribution
│   │   │   ├── safety/page.tsx          # Disclaimers, emergency protocol reference
│   │   │   ├── privacy/page.tsx
│   │   │   ├── terms/page.tsx
│   │   │   └── accessibility/page.tsx
│   │   ├── (auth)/
│   │   │   ├── sign-in/page.tsx
│   │   │   └── demo/route.ts            # one-click demo sign-in
│   │   ├── t/[teamSlug]/page.tsx        # Public team status (parents, athletes)
│   │   ├── c/[token]/page.tsx           # Athlete check-in (QR, no login)
│   │   └── app/
│   │       ├── layout.tsx               # Sidebar shell (authenticated)
│   │       ├── page.tsx                 # Today dashboard
│   │       ├── onboarding/page.tsx
│   │       ├── planner/page.tsx
│   │       ├── practices/page.tsx
│   │       ├── practices/new/page.tsx
│   │       ├── practices/[id]/page.tsx
│   │       ├── practices/[id]/live/page.tsx       # Practice Mode (full screen)
│   │       ├── practices/[id]/emergency/page.tsx
│   │       ├── check-ins/page.tsx                 # Trainer queue
│   │       ├── log/page.tsx                       # Compliance log
│   │       ├── roster/page.tsx                    # Stretch: acclimatization
│   │       └── settings/
│   │           ├── school/page.tsx                # Class lock
│   │           ├── fields/page.tsx
│   │           ├── teams/page.tsx
│   │           ├── members/page.tsx
│   │           ├── rules/page.tsx                 # Rule sets + Stretch policy import
│   │           ├── notifications/page.tsx
│   │           └── profile/page.tsx
│   ├── api/
│   │   ├── auth/[...all]/route.ts       # Better Auth handler
│   │   ├── conditions/route.ts          # GET combined forecast for lat/lon or field
│   │   ├── ai/ask/route.ts              # POST Ask Flagline
│   │   ├── ai/meter-photo/route.ts      # POST meter photo
│   │   ├── ai/policy-import/route.ts    # POST (Stretch)
│   │   ├── check-ins/[token]/route.ts   # POST athlete check-in (public, rate limited)
│   │   ├── push/subscribe/route.ts
│   │   ├── export/practice/[id]/route.ts  # ?format=pdf|csv
│   │   ├── export/log/route.ts            # ?from&to&team&format=csv|pdf
│   │   └── cron/prefetch/route.ts       # daily forecast warm-up for scheduled practices
│   ├── layout.tsx                       # html, fonts, ThemeProvider, TooltipProvider, Toaster
│   ├── globals.css                      # tokens (shadcn + zone tokens + sunlight theme)
│   ├── manifest.ts                      # PWA manifest
│   └── sw.ts                            # Serwist service worker source
├── components/
│   ├── ui/                              # shadcn generated primitives (do not edit casually)
│   ├── app-sidebar.tsx                  # from sidebar block, customized composition
│   ├── site-header.tsx
│   ├── zone/                            # ZoneBadge, ZoneBanner, ZoneLegend, ZoneTimeline, ZoneCell
│   ├── conditions/                      # ConditionsCard, SourceRange, AqiCard, LightningCard, WbgtChart
│   ├── planner/                         # PlannerGrid, BestWindowList, AskFlagline, ParsedPlanChips
│   ├── practice/                        # PracticeForm, PracticePreview, PracticeModeShell, RecheckCountdown,
│   │                                    # BreakTimer, TimeInLevel, LevelChangeSheet, CoolingChecklist,
│   │                                    # ReadingKeypad, MeterPhotoCapture, EndPracticeDialog, OfflineBanner
│   ├── emergency/                       # EhsProtocol, CoolingTimer, IncidentTimeline
│   ├── check-ins/                       # CheckInForm, CheckInQueue, RedFlagAlert, CheckInQr
│   ├── log/                             # LogTable (TanStack), LogFilters, ExportMenu
│   ├── onboarding/                      # OnboardingQuestionnaire, ClassLockCard, FieldLocator
│   ├── marketing/                       # Hero, FeatureGrid, HowItWorks, SourcesStrip, Faq
│   ├── mode-toggle.tsx                  # light / dark / sunlight
│   ├── locale-toggle.tsx
│   └── theme-provider.tsx               # generated by shadcn template, themes extended
├── lib/
│   ├── heat/                            # WBGT engine (pure)
│   │   ├── solar.ts                     # NOAA solar position, cos zenith
│   │   ├── liljegren.ts                 # port of thermofeel (Apache-2.0)
│   │   ├── wind.ts                      # 10 m to 2 m, stability class
│   │   ├── units.ts
│   │   └── index.ts
│   ├── rules/                           # rules engine (pure)
│   │   ├── schema.ts                    # Zod RuleSet schema
│   │   ├── rulesets/uil-2026-27.json
│   │   ├── rulesets/ksi-2015.json
│   │   ├── rulesets/aqi-epa-schools.json
│   │   ├── rulesets/aqi-strict-youth-2026.json
│   │   ├── rulesets/lightning-nfhs.json
│   │   ├── level.ts  requirements.ts  aqi.ts  lightning.ts  combine.ts  session.ts  acclimatization.ts
│   │   └── texas-class2.geo.json        # hand-digitized Class 2 lobe (suggestion only)
│   ├── conditions/                      # data fetching + caching + combination
│   │   ├── nws.ts  openmeteo.ts  airnow.ts  geocode.ts  combine.ts  cache.ts
│   ├── ai/
│   │   ├── jev.ts                       # TypeSafe client (server only)
│   │   ├── ask.ts                       # Ask Flagline questions + gating
│   │   ├── triage.ts                    # check-in red-flag screening
│   │   ├── meter.ts                     # vision + Jev selection
│   │   ├── policy.ts                    # Stretch
│   │   └── redflag-keywords.ts          # deterministic backstop (en, es)
│   ├── db/  schema.ts  index.ts  queries/*.ts  seed.ts
│   ├── auth/  server.ts  client.ts  permissions.ts
│   ├── push/  server.ts  client.ts
│   ├── workflows/  practice-session.ts
│   ├── offline/  queue.ts
│   ├── export/  practice-pdf.tsx  csv.ts
│   ├── i18n/  routing.ts  request.ts
│   ├── rate-limit.ts  log.ts  env.ts  utils.ts (shadcn cn re-export)
├── messages/  en.json  es.json
├── tests/
│   ├── unit/  heat/*.test.ts  rules/*.test.ts  ai/*.test.ts
│   ├── conformance/  uil-class3.csv  uil-class2.csv  ksi.csv  aqi.csv  sessions.json
│   ├── fixtures/  nws-gridpoint-ewx-156-91.json  openmeteo-austin.json  thermofeel-reference.json
│   ├── ai-evals/  redflags.en.jsonl  redflags.es.jsonl  ask-plans.jsonl  meter-photos/
│   └── e2e/  *.spec.ts
├── public/  icons/  og.png
├── docs/  (these planning docs)
├── .github/workflows/ci.yml
├── components.json  drizzle.config.ts  next.config.ts  postcss.config.mjs  tsconfig.json
├── vitest.config.ts  playwright.config.ts  .env.example  .prettierrc  eslint.config.mjs
├── README.md  CONTRIBUTING.md  CODE_OF_CONDUCT.md  SECURITY.md  CLAUDE.md  LICENSE.md
└── package.json  pnpm-lock.yaml  pnpm-workspace.yaml
```

---

## 4. Bootstrapping (Exact Commands)

Run **after the theme reveal**, from the repository root. The docs folder and root markdown files already exist; scaffold the app into a temporary folder and move it in, or scaffold in place with `init` on an existing Next.js app.

```bash
# 1. Scaffold Next.js + shadcn (base-nova, neutral, Base UI, Geist, lucide, next-themes)
pnpm dlx shadcn@latest init -t next -n flagline -d -y
# move the generated app into the repo root (keep our docs and root .md files)
rsync -a --exclude .git flagline/ ./ && rm -rf flagline

# 2. Add every shadcn component we use (explicit list, section 5.9)
pnpm dlx shadcn@latest add accordion alert alert-dialog avatar badge breadcrumb button button-group \
  calendar card chart checkbox collapsible combobox command dialog drawer dropdown-menu empty field \
  hover-card input input-group input-otp item kbd label native-select navigation-menu pagination \
  popover progress questionnaire radio-group scroll-area select separator sheet sidebar skeleton \
  slider spinner switch table tabs textarea toast toggle toggle-group tooltip -y

# 3. Blocks (dry run first: blocks write routes)
pnpm dlx shadcn@latest add sidebar-07 --dry-run
pnpm dlx shadcn@latest add sidebar-07 login-03 -y
# then move block pages under app/[locale]/... and compose into our shell

# 4. Runtime dependencies
pnpm add drizzle-orm @neondatabase/serverless better-auth next-intl @typesafe-ai/sdk @anthropic-ai/sdk \
  workflow web-push @serwist/next idb @react-pdf/renderer qrcode chrono-node @date-fns/tz \
  @upstash/ratelimit @upstash/redis react-hook-form zod @hookform/resolvers @tanstack/react-table \
  resend unpdf

# 5. Dev dependencies
pnpm add -D drizzle-kit serwist vitest @vitest/coverage-v8 @testing-library/react @testing-library/user-event \
  jsdom msw @playwright/test @axe-core/playwright @types/web-push @types/qrcode tsx

# 6. Tooling
pnpm dlx playwright install --with-deps chromium
pnpm dlx shadcn@latest mcp init --client claude   # shadcn MCP for agents (optional)
pnpm dlx shadcn@latest info --json                 # verify style base-nova, base base, icons lucide

# 7. Provision (Vercel Marketplace): Neon Postgres, Upstash Redis; link and pull env
pnpm dlx vercel link
pnpm dlx vercel env pull .env.local
pnpm db:generate && pnpm db:migrate && pnpm db:seed
pnpm dev
```

`package.json` scripts (excerpt):

```json
{
  "packageManager": "pnpm@10.x",
  "scripts": {
    "dev": "next dev --turbopack",
    "build": "next build",
    "start": "next start",
    "lint": "eslint .",
    "typecheck": "tsc --noEmit",
    "format": "prettier --write .",
    "test": "vitest run",
    "test:watch": "vitest",
    "test:rules": "vitest run tests/unit/rules tests/conformance",
    "test:ai": "vitest run tests/ai-evals --reporter=verbose",
    "test:e2e": "playwright test",
    "db:generate": "drizzle-kit generate",
    "db:migrate": "drizzle-kit migrate",
    "db:seed": "tsx lib/db/seed.ts"
  }
}
```

---

## 5. Design System (Pure shadcn/ui)

### 5.1 Foundations

| Decision | Value | Rationale |
|---|---|---|
| Style | `base-nova` (shadcn default) | Current default; compact, modern; Base UI primitives |
| Base color | `neutral` | Keeps the interface quiet so **the heat flag is the only strong color on screen** |
| Primary | neutral (near-black in light, near-white in dark) | Color is reserved for risk meaning |
| Radius | `--radius: 0.625rem` (default) | shadcn default scale (`rounded-sm` to `rounded-4xl` derived) |
| Fonts | Geist (sans, UI), Geist Mono (numbers, timers, readings) | shadcn default; mono gives stable tabular digits for countdowns |
| Icons | lucide-react | shadcn default |
| Dark mode | `next-themes`, `attribute="class"`, themes `light`, `dark`, `sunlight` | shadcn pattern extended with a sunlight theme |
| Density | Default nova sizes on desktop; **`lg` buttons and 44 px targets in Practice Mode** | Sideline use |

### 5.2 Tokens: shadcn defaults (unchanged)

We keep every default neutral token that `shadcn init -d` writes, exactly as generated (verified in a scaffolded project on Sep 25, 2026). For reference:

```css
:root {
  --background: oklch(1 0 0);              --foreground: oklch(0.145 0 0);
  --card: oklch(1 0 0);                    --card-foreground: oklch(0.145 0 0);
  --popover: oklch(1 0 0);                 --popover-foreground: oklch(0.145 0 0);
  --primary: oklch(0.205 0 0);             --primary-foreground: oklch(0.985 0 0);
  --secondary: oklch(0.97 0 0);            --secondary-foreground: oklch(0.205 0 0);
  --muted: oklch(0.97 0 0);                --muted-foreground: oklch(0.556 0 0);
  --accent: oklch(0.97 0 0);               --accent-foreground: oklch(0.205 0 0);
  --destructive: oklch(0.577 0.245 27.325);
  --border: oklch(0.922 0 0);              --input: oklch(0.922 0 0);            --ring: oklch(0.708 0 0);
  --chart-1: oklch(0.87 0 0);  --chart-2: oklch(0.556 0 0);  --chart-3: oklch(0.439 0 0);
  --chart-4: oklch(0.371 0 0); --chart-5: oklch(0.269 0 0);
  --radius: 0.625rem;
  --sidebar: oklch(0.985 0 0);             --sidebar-foreground: oklch(0.145 0 0);
  --sidebar-primary: oklch(0.205 0 0);     --sidebar-primary-foreground: oklch(0.985 0 0);
  --sidebar-accent: oklch(0.97 0 0);       --sidebar-accent-foreground: oklch(0.205 0 0);
  --sidebar-border: oklch(0.922 0 0);      --sidebar-ring: oklch(0.708 0 0);
}
.dark {
  --background: oklch(0.145 0 0);          --foreground: oklch(0.985 0 0);
  --card: oklch(0.205 0 0);                --card-foreground: oklch(0.985 0 0);
  --popover: oklch(0.205 0 0);             --popover-foreground: oklch(0.985 0 0);
  --primary: oklch(0.922 0 0);             --primary-foreground: oklch(0.205 0 0);
  --secondary: oklch(0.269 0 0);           --secondary-foreground: oklch(0.985 0 0);
  --muted: oklch(0.269 0 0);               --muted-foreground: oklch(0.708 0 0);
  --accent: oklch(0.269 0 0);              --accent-foreground: oklch(0.985 0 0);
  --destructive: oklch(0.704 0.191 22.216);
  --border: oklch(1 0 0 / 10%);            --input: oklch(1 0 0 / 15%);          --ring: oklch(0.556 0 0);
  --chart-1: oklch(0.87 0 0);  --chart-2: oklch(0.556 0 0);  --chart-3: oklch(0.439 0 0);
  --chart-4: oklch(0.371 0 0); --chart-5: oklch(0.269 0 0);
  --sidebar: oklch(0.205 0 0);             --sidebar-foreground: oklch(0.985 0 0);
  --sidebar-primary: oklch(0.488 0.243 264.376); --sidebar-primary-foreground: oklch(0.985 0 0);
  --sidebar-accent: oklch(0.269 0 0);      --sidebar-accent-foreground: oklch(0.985 0 0);
  --sidebar-border: oklch(1 0 0 / 10%);    --sidebar-ring: oklch(0.556 0 0);
}
```

Wiring (generated): `@import "tailwindcss"; @import "tw-animate-css"; @import "shadcn/tailwind.css"; @custom-variant dark (&:is(.dark *));` then `@theme inline` maps each token to `--color-*` and derives `--radius-sm` (0.6x) through `--radius-4xl` (2.6x) from `--radius`. There is no `--destructive-foreground` in current styles; destructive buttons use `bg-destructive/10 text-destructive`. We do not hand-edit these values; if a brand tint is ever wanted, use `pnpm dlx shadcn@latest apply <preset> --only theme`.

### 5.3 Tokens: Flagline additions (official shadcn custom-token pattern)

Added to `app/globals.css` using the documented pattern (define on `:root` and `.dark`, map in `@theme inline`). Contrast verified (OKLCH to sRGB): every zone foreground on its zone background is at least 5.4:1 (light) and 5.7:1 (dark).

```css
/* app/globals.css (additions after the generated tokens) */
:root {
  --zone-green: oklch(0.50 0.13 150);
  --zone-green-foreground: oklch(0.985 0 0);
  --zone-yellow: oklch(0.86 0.16 92);
  --zone-yellow-foreground: oklch(0.28 0.06 75);
  --zone-orange: oklch(0.72 0.17 55);
  --zone-orange-foreground: oklch(0.22 0.05 45);
  --zone-red: oklch(0.52 0.20 27);
  --zone-red-foreground: oklch(0.985 0 0);
  --zone-black: oklch(0.21 0 0);
  --zone-black-foreground: oklch(0.985 0 0);
  --zone-unknown: oklch(0.97 0 0);
  --zone-unknown-foreground: oklch(0.45 0 0);
  --zone-edge: oklch(0.145 0 0 / 18%);            /* hairline ring for yellow/orange on white */
}

.dark {
  --zone-green: oklch(0.72 0.17 150);
  --zone-green-foreground: oklch(0.18 0.04 150);
  --zone-yellow: oklch(0.87 0.16 92);
  --zone-yellow-foreground: oklch(0.25 0.06 75);
  --zone-orange: oklch(0.76 0.16 55);
  --zone-orange-foreground: oklch(0.20 0.05 45);
  --zone-red: oklch(0.66 0.20 25);
  --zone-red-foreground: oklch(0.16 0.04 25);
  --zone-black: oklch(0.10 0 0);
  --zone-black-foreground: oklch(0.985 0 0);
  --zone-unknown: oklch(0.269 0 0);
  --zone-unknown-foreground: oklch(0.708 0 0);
  --zone-edge: oklch(1 0 0 / 35%);               /* black zone needs a visible ring on dark */
}

/* Sunlight: light theme with maximum contrast and larger type for direct sun */
.sunlight {
  --background: oklch(1 0 0);
  --foreground: oklch(0 0 0);
  --muted-foreground: oklch(0.35 0 0);
  --border: oklch(0.45 0 0);
  --input: oklch(0.45 0 0);
  --ring: oklch(0.2 0 0);
  --zone-edge: oklch(0 0 0 / 60%);
  font-size: 112.5%;                              /* 18px base */
}

@theme inline {
  --color-zone-green: var(--zone-green);
  --color-zone-green-foreground: var(--zone-green-foreground);
  --color-zone-yellow: var(--zone-yellow);
  --color-zone-yellow-foreground: var(--zone-yellow-foreground);
  --color-zone-orange: var(--zone-orange);
  --color-zone-orange-foreground: var(--zone-orange-foreground);
  --color-zone-red: var(--zone-red);
  --color-zone-red-foreground: var(--zone-red-foreground);
  --color-zone-black: var(--zone-black);
  --color-zone-black-foreground: var(--zone-black-foreground);
  --color-zone-unknown: var(--zone-unknown);
  --color-zone-unknown-foreground: var(--zone-unknown-foreground);
  --color-zone-edge: var(--zone-edge);
}
```

Chart palette: WBGT charts use the zone tokens for level bands (`var(--color-zone-*)` in `ChartConfig`) and neutral `--chart-2`/`--chart-4` for the NWS and model lines (the nova default grayscale chart ramp), so color still only means risk.

Theme provider: extend the generated `components/theme-provider.tsx` with `themes={["light","dark","sunlight"]}` and `value={{ light: "light", dark: "dark", sunlight: "sunlight" }}`; keep `attribute="class"`, `defaultTheme="system"`, `enableSystem`, `disableTransitionOnChange`, and keep the template's `d` hotkey.

### 5.4 Zone vocabulary (color is never alone)

| Level | Token | Icon (lucide) | Label (en / es) | Short meaning (en) |
|---|---|---|---|---|
| Green | `zone-green` | `CircleCheck` | Green / Verde | Normal practice, 3 breaks per hour |
| Yellow | `zone-yellow` | `TriangleAlert` | Yellow / Amarillo | Caution, cooling zone required |
| Orange | `zone-orange` | `Clock` | Orange / Naranja | 2 hours max, limited gear |
| Red | `zone-red` | `OctagonAlert` | Red / Rojo | 1 hour max, no pads, no conditioning |
| Black | `zone-black` | `Ban` | Black / Negro | No outdoor practice |
| Unknown | `zone-unknown` | `CircleHelp` | No Data / Sin Datos | Take a reading |

`ZoneBadge` composition (a shadcn `Badge`, never a custom div):

```tsx
// components/zone/zone-badge.tsx
import { Badge } from "@/components/ui/badge"
import { cn } from "@/lib/utils"
import { ZONE_META, type Level } from "@/lib/rules/level"

export function ZoneBadge({ level, value, className }: { level: Level; value?: number; className?: string }) {
  const meta = ZONE_META[level]
  const Icon = meta.icon
  return (
    <Badge
      className={cn(meta.badgeClass, "ring-1 ring-zone-edge", className)}
      aria-label={`${meta.label} flag${value !== undefined ? `, ${value.toFixed(1)} degrees WBGT` : ""}`}
    >
      <Icon data-icon="inline-start" />
      {meta.label}
      {value !== undefined && <span className="font-mono tabular-nums">{value.toFixed(1)}°</span>}
    </Badge>
  )
}
// ZONE_META.orange.badgeClass = "bg-zone-orange text-zone-orange-foreground"
```

### 5.5 Typography

shadcn typography recipes (docs), plus:
- Page title (`h1`): `scroll-m-20 text-3xl font-semibold tracking-tight text-balance` (app) / `text-4xl font-extrabold` (marketing hero).
- Card titles: `CardTitle` default (`font-heading text-base font-medium`).
- **Reading value** (Practice Mode, Quick Check): `font-mono tabular-nums text-6xl font-semibold` (sunlight: `text-7xl`).
- **Countdown:** `font-mono tabular-nums text-5xl` with `aria-live="polite"` announcing only at 5:00, 1:00 and 0:00.
- Helper text: `text-sm text-muted-foreground`.
- Numbers always include units: "87.6° F WBGT" in UI, "87.6 degrees WBGT" in aria labels.

### 5.6 Layout and responsive rules

- Breakpoints: Tailwind defaults (`sm` 640, `md` 768, `lg` 1024, `xl` 1280).
- App shell: shadcn **Sidebar** (`variant="inset"`, `collapsible="icon"`) on `lg+`; on mobile it becomes a Sheet, and a bottom action bar (ButtonGroup) exposes Today, Planner, Practices, Log.
- Practice Mode: no sidebar; full-height single column on mobile; two columns on tablet landscape (banner + timers | readings + checklist).
- Content widths: marketing `max-w-6xl`; app pages fluid with `max-w-7xl`; forms `max-w-xl`.
- Spacing: `flex flex-col gap-4` / `gap-6` (never `space-y-*`), `size-*` for squares.
- Motion: `tw-animate-css` defaults only; shimmer utility for loading text; everything respects `prefers-reduced-motion`.

### 5.7 States

| State | Pattern |
|---|---|
| Loading | `Skeleton` blocks matching the final layout; `Spinner` inside buttons (`data-icon="inline-start"`) |
| Empty | `Empty` with `EmptyMedia variant="icon"`, a title in Title Case ("No Practices Yet") and one primary action |
| Error | `Alert variant="destructive"` with what happened and what to do; retry `Button` |
| Offline | `Alert` banner "Offline, saved on this device" with `WifiOff` icon |
| Stale data | `Badge variant="outline"` "Forecast From 2 Hours Ago" + refresh `Button variant="ghost" size="icon-sm"` |
| Success | `toast.add({ type: "success", ... })` |
| Destructive confirm | `AlertDialog` |

### 5.8 Copy style

- Titles and buttons in Title Case: "Start Practice", "Log A Reading", "Take A Break", "Thunder Heard", "Open Emergency Protocol", "End Practice", "Download Practice Log", "Set Up Your School", "Try The Demo School".
- Body copy calm, specific, second person, sentence case: "Orange until about 5 PM. Practice can run 2 hours. Football: helmet, shoulder pads and shorts."
- Never "safe". Say what the rules require.
- No em or en dashes. Use "to" in ranges ("87.0 to 90.0"), commas, colons or parentheses.
- Spanish reviewed by a fluent speaker; UIL terms kept consistent ("Zona de enfriamiento rápido").

### 5.9 shadcn component inventory (what we use, where)

| Component | Where it is used |
|---|---|
| `accordion` | FAQ (marketing), rule details per level, sources page |
| `alert` | Disclaimers, stale data, offline, borderline warning, binding-constraint notes |
| `alert-dialog` | End practice confirmation, delete field, unlock class (owner only, with reason) |
| `avatar` | Member list, sidebar user |
| `badge` | ZoneBadge, source badges ("NWS", "Model", "Measured"), status (Late, Missed, Confirmed) |
| `breadcrumb` | Settings and practice detail headers |
| `button` | Everywhere (variants default, outline, secondary, ghost, destructive, link; sizes lg in Practice Mode) |
| `button-group` | Mobile bottom action bar; reading keypad quick actions; export options |
| `calendar` | Practice date picker; log date range (with popover = date picker composition) |
| `card` | Field cards, practice cards, rule cards, Quick Check result, summary |
| `chart` | WBGT day curve with level bands; time-in-level stacked bar; log trends (area, bar) |
| `checkbox` | Cooling zone checklist, symptom list, table row selection |
| `collapsible` | Sidebar groups, "Why this level" details |
| `combobox` | Place search (geocoding), team and field pickers |
| `command` | Command palette (Cmd/Ctrl K): jump to practice, start practice, open emergency |
| `dialog` | Log a reading (desktop), meter photo preview, share team page |
| `drawer` | Mobile sheets from the bottom: log a reading, level change sheet, break timer |
| `dropdown-menu` | Row actions, mode toggle, locale toggle, export menu |
| `empty` | Empty states |
| `field` | All forms (with RHF + Zod) |
| `hover-card` | Source details on hover (desktop) for a WBGT value |
| `input`, `input-group` | Forms; reading value with unit suffix (`InputGroupText` "° F") |
| `input-otp` | Email sign-in code |
| `item` | Lists: practices, check-in queue, members, sources |
| `kbd` | Shortcut hints (Cmd K, D for dark mode) |
| `label` | Forms (via Field) |
| `native-select` | Mobile-friendly selects in Practice Mode (surface type, instrument) |
| `navigation-menu` | Marketing header |
| `pagination` | Log table |
| `popover` | Date picker, zone legend |
| `progress` | Time used versus max, cooling timer progress, onboarding progress |
| `questionnaire` | Onboarding flow and athlete check-in steps |
| `radio-group` | Class choice, AQI preset, activity type |
| `scroll-area` | Planner grid horizontal scroll, long lists |
| `select` | Team, field, sport, level, role (Base UI `items` API) |
| `separator` | Section dividers |
| `sheet` | Mobile sidebar, filters |
| `sidebar` | App shell (from `sidebar-07` block) |
| `skeleton` | Loading states |
| `slider` | Planned duration in the plan form |
| `spinner` | Button loading, inline loading |
| `switch` | Settings toggles (notifications, strict AQI, NATA 14-day mode) |
| `table` | Compliance log (TanStack data table), rules tables, conformance display on sources page |
| `tabs` | Planner (Grid, Chart, Ask), practice detail (Plan, Live Log, Check-Ins), settings sections |
| `textarea` | Notes, check-in free text, Ask Flagline input (inside InputGroup) |
| `toast` | Confirmations and non-blocking alerts |
| `toggle`, `toggle-group` | Activity blocks, sun or shade view, units (F or C), day selector in the planner |
| `tooltip` | Icon buttons, zone legend hints (app wrapped in `TooltipProvider`) |

Blocks: `sidebar-07` (collapsible-to-icons app shell), `login-03` (sign-in with Field), `dashboard-01` patterns (section cards, interactive area chart) adapted for the Today page.

### 5.10 Visual direction: Stripe-inspired, shadcn-only

Studied stripe.com on Sep 28, 2026 (desktop 1440 px). We borrow **layout and typographic patterns**, not assets, fonts, colors or code. Everything is still built from shadcn components and our tokens.

| Stripe pattern (observed) | Flagline translation (shadcn + tokens) |
|---|---|
| Live counter eyebrow above the hero ("Global GDP running on Stripe: 1.72...%") | Live eyebrow: "Right now in Austin: 87.2° WBGT, Orange" rendered server-side from real forecasts with a pulsing dot (`size-2 rounded-full bg-zone-*`) |
| Two-tone hero headline: a dark statement then a muted continuation, light weight (300), 48 px, tight tracking (-0.96 px), 1.15 line height | `h1` with `<span className="text-foreground">` + `<span className="text-muted-foreground">`, `font-light tracking-tight text-5xl/[1.1] md:text-6xl`, Geist |
| Primary CTA with a chevron plus a secondary outline CTA side by side | `Button size="lg"` "Check Conditions Now" + `ChevronRight data-icon="inline-end"`; `buttonVariants({ variant: "outline", size: "lg" })` "Try The Demo School" |
| Vertical hairline guide lines framing the content column, horizontal rules between sections | Container `max-w-6xl border-x border-dashed border-border`; sections separated by `Separator` or `border-t` |
| Colorful gradient wave as hero art | **Heat ribbon**: an abstract diagonal band using the five zone tokens in order (`bg-linear-to-r from-zone-green via-zone-orange to-zone-red`), blurred and masked, decorative only (`aria-hidden`) |
| Logo strip under the hero | "Built on official sources" strip: text badges for UIL, NFHS, NWS, Open-Meteo, AirNow (text, not logos) |
| Bento grid of product cards, each showing real UI inside | `Card` grid (`grid md:grid-cols-6`, spans 4/2/3/3) each containing a live mini-UI: ZoneBadge timeline, recheck countdown, check-in alert, PDF log preview |
| Dark statistics band ("135+", "$1.9T", "99.999%") | A `dark`-scoped section (`className="dark bg-background text-foreground"`) with 4 stats: "9,237 heat illnesses a year", "30 minutes between rechecks", "2 forecast sources", "$0 for schools" |
| Section headings "Bold statement. Muted continuation." | Same two-tone treatment for every `h2` on marketing pages |
| Cards with generous padding, 1 px borders, soft shadow on hover | `Card` defaults (ring), `hover:ring-foreground/20 transition` only |

Rules: marketing pages only get the ribbon and bento; the app itself stays calm and dense (sidebar shell, cards, tables). Color still only means risk.


---

## 6. Information Architecture And Routes

All routes are prefixed with the locale (`/en`, `/es`); the default locale is detected and `/` redirects.

| Route | Access | Purpose | Main components | Data |
|---|---|---|---|---|
| `/` | Public | Landing: hero with a live Quick Check for Austin, features, how it works, sources, FAQ, CTAs | NavigationMenu, Card, Chart, Accordion, Button | `GET /api/conditions?lat&lon` |
| `/check` | Public | Quick Check (F1) | Combobox, RadioGroup, Card, ZoneTimeline, Chart, Alert | conditions API |
| `/how-it-works` | Public | Visual explanation (flag levels, sources, AI) | Card, Tabs, Table | static |
| `/sources` | Public | Methodology, data sources, attribution, rules tables, conformance status | Table, Accordion, Badge | rulesets JSON |
| `/safety` | Public | Disclaimers and the emergency protocol reference | Alert, Card | static |
| `/privacy`, `/terms`, `/accessibility` | Public | Policies | typography | static |
| `/sign-in` | Public | Email code or Google; "Try The Demo School" | login-03 block, InputOTP, Button | Better Auth |
| `/demo` | Public | Signs in to the seeded demo school (read-mostly, resettable) | route handler | seed |
| `/t/[teamSlug]` | Public | Team status for parents and athletes (F11) | Card, ZoneBadge, Item, Button | team + today's practice |
| `/c/[token]` | Public (token) | Athlete check-in (F8) | Questionnaire, Checkbox, Textarea, Button | `POST /api/check-ins/[token]` |
| `/app` | Member | Today dashboard (F3) | Sidebar, Card, ZoneBadge, Item, Alert | fields, practices, alerts |
| `/app/onboarding` | New owner | School setup (F2) | Questionnaire, Field, Combobox, RadioGroup | actions |
| `/app/planner` | Member | 7-day planner, best window, Ask Flagline (F4) | Tabs, ScrollArea, ToggleGroup, Chart, InputGroup, Item | conditions + practices |
| `/app/practices` | Member | List of practices | Tabs, Item, Badge, Empty | practices |
| `/app/practices/new` | Coach+ | Schedule a practice with live preview (F5) | Field, Calendar, Select, Slider, ToggleGroup, Card, Alert | actions + conditions |
| `/app/practices/[id]` | Member | Practice detail: plan, live log, check-ins, export | Tabs, Table, Badge, Button | practice |
| `/app/practices/[id]/live` | Coach, trainer | Practice Mode (F6) | custom compositions of Card, Button, Drawer, Progress, Badge, Alert, Checkbox | practice session |
| `/app/practices/[id]/emergency` | Coach, trainer | Emergency protocol (F9) | Card, Button, Progress, Item | incident |
| `/app/check-ins` | Trainer, coach | Check-in queue (F8) | Item, Badge, Tabs, Empty | check-ins |
| `/app/log` | Member | Compliance log (F10) | data table (Table + TanStack), Popover + Calendar, Select, DropdownMenu, Pagination | readings, sessions |
| `/app/roster` | Coach+ (Stretch) | Acclimatization (F14) | Table, Badge, Switch | athletes |
| `/app/settings/school` | Owner | School details and class lock | Card, RadioGroup, Alert, AlertDialog | school |
| `/app/settings/fields` | Owner, coach | Fields | Item, Dialog, Field, Button | fields |
| `/app/settings/teams` | Owner, coach | Teams | Item, Dialog, Field, Select | teams |
| `/app/settings/members` | Owner | Invite and roles | Table, Select, Dialog | members |
| `/app/settings/rules` | Owner | Active rule sets, AQI preset, lightning scope; Stretch policy import | RadioGroup, Switch, Table, Card | rulesets |
| `/app/settings/notifications` | Member | Push subscription and preferences | Switch, Button, Alert | push |
| `/app/settings/profile` | Member | Name, locale, theme | Field, Select | user |

Sidebar navigation (Title Case): **Today**, **Planner**, **Practices**, **Check-Ins**, **Log**, **Roster** (Stretch), **Settings**. Header: CommandPalette trigger (Kbd Cmd K), locale toggle, mode toggle, user menu. A persistent "Start Practice" button in the sidebar header when a practice is within 30 minutes.

---

## 7. Page Specifications

Wireframes are low fidelity (ASCII here; Balsamiq versions on day 0). All copy shown is final-intent English; Spanish in the catalogs.

### 7.1 Home `/`

```
┌───────────────────────────────────────────────────────────────┐
│ Flagline        How It Works  Sources  Safety   [Sign In] [Try The Demo School] │
├───────────────────────────────────────────────────────────────┤
│  Heat Rules, Handled On The Sideline                           │
│  Free WBGT and smoke safety for every outdoor practice.        │
│  [Check Conditions Now]  [Try The Demo School]                 │
│  ┌─ Live In Austin ─────────────────────────────────────────┐ │
│  │ [Yellow 84.2°]  Forecast, planning only                    │ │
│  │ 12-hour timeline: ■■■■ yellow ■■■■ orange 1 PM to 5 PM ... │ │
│  └───────────────────────────────────────────────────────────┘ │
│  Plan  ·  Prepare  ·  Run  ·  Protect  ·  Prove  (5 cards)      │
│  How It Works (3 steps) · Built On Official Rules (UIL, NFHS)  │
│  Sources strip (NWS, Open-Meteo, AirNow) · FAQ (Accordion)      │
│  Footer: Safety, Privacy, Accessibility, Terms, attribution     │
└───────────────────────────────────────────────────────────────┘
```
- Hero title "Heat Rules, Handled On The Sideline"; subtitle sentence case.
- The live card is a Server Component rendering the Austin forecast (cached 30 minutes) with `ZoneBadge`, a compact `ZoneTimeline` and a link "See Full Check".
- Five `Card`s for the verbs, each with a lucide icon (`CalendarClock`, `ClipboardCheck`, `Timer`, `ShieldPlus`, `FileCheck`).
- CTA buttons: `Button size="lg"` and `buttonVariants({ variant: "outline", size: "lg" })` on `Link`.

### 7.2 Quick Check `/check`

- Form (Field): **Location** (`Combobox` with geocoding suggestions; `Button variant="outline"` "Use My Location"), **Rules** (`RadioGroup`: "Texas UIL" with a suggested class and "Other State (KSI Categories)" with Category 1, 2, 3 and a helper "Not sure? Category 1 is the most protective."), **Activity** (`ToggleGroup`: Football, Band, Other Sport, PE).
- Result `Card`: large `ZoneBadge` and value, source range ("NWS 87 · Model 88.1 · Shade 83.4"), `Badge variant="outline"` "Forecast, Planning Only", next change sentence, requirements list for the activity (Item rows with icons: max time, breaks, gear, cooling zone), AQI card, thunder probability.
- `Tabs`: **Next 12 Hours** (ZoneTimeline, horizontal ScrollArea of hour cells) and **Chart** (Chart area with zone bands, NWS line, model line, shade band).
- Footer `Alert`: disclaimer + "Set Up Your School" CTA.
- States: loading Skeleton; geocode not found (Empty "No Matching Place"); data unavailable (Alert with retry, and the other source if one works).

### 7.3 Sign in `/sign-in`

- From `login-03` block: email `Field`, "Send Code" button, `InputOTP` for the 6-digit code, "Continue With Google", divider, "Try The Demo School" (`Button variant="secondary"`).
- Copy: title "Sign In To Flagline", description "Use your school email. We will send a 6-digit code."

### 7.4 Onboarding `/app/onboarding` (Questionnaire)

Steps (`Questionnaire` with progress):
1. **Your Role:** Athletic Director, Coach, Athletic Trainer, Band Director, PE Teacher.
2. **Your School:** name, address (`Combobox` with US Census geocoder), time zone (auto).
3. **Heat Class:** `ClassLockCard`: "Suggested: Class 3 (Austin area)". Explanation, "Near the Class 2 boundary" warning if applicable, `RadioGroup` Class 2 or Class 3, checkbox "I confirm this class applies to all outdoor activities for the 2026-27 school year", button "Lock Class For 2026-27". Stores who and when.
4. **Your Fields:** add at least one: name, surface (`NativeSelect`), "Use My Location" or address; list of added fields (Item).
5. **Your Teams:** sport, level, default field and time; band preset.
6. **Invite Your Staff** (optional): emails and roles.
7. **Done:** "Your School Is Ready" with "Plan Your Next Practice" and "Open Today".

### 7.5 Today `/app`

```
┌ Sidebar ┬──────────────────────────────────────────────────────┐
│ Today   │ Today, Monday September 28          [Start Practice ▸]│
│ Planner │ ┌ Alerts ─────────────────────────────────────────┐   │
│ ...     │ │ ⚠ Red flag check-in: #54 at Turf Field (2 min)    │   │
│         │ └─────────────────────────────────────────────────┘   │
│         │ Fields: [Turf: Orange 87.2 ↑] [Practice Field: Orange] │
│         │         [Band Lot: Red 90.4] [Tennis: Yellow]          │
│         │ Today's Practices                                      │
│         │  3:45 PM Varsity Football · Turf · Orange expected ·   │
│         │         Cooling zone ✓ · Reading owner Coach Lee  [Open]│
│         │  4:00 PM Marching Band · Band Lot · Red expected ·     │
│         │         Suggest: move to 7 AM tomorrow         [Plan]  │
│         │ Day Chart (WBGT curve with bands, practices overlaid)  │
└─────────┴──────────────────────────────────────────────────────┘
```
- Field cards (`Card size="sm"`): name, surface badge, `ZoneBadge`, trend icon (`TrendingUp`/`TrendingDown`), "Measured 3:38 PM" or "Forecast", AQI chip, lightning hold chip.
- Practice list (`Item` rows) with expected level range across the window, readiness checklist summary, owner, and actions.
- Alerts (`Alert`) sorted by severity; red flags use `variant="destructive"` with an `AlertAction` "Open".
- Polling every 15 seconds while visible (client component) for alerts and field status; push handles background.

### 7.6 Planner `/app/planner`

- `Tabs`: **Grid**, **Chart**, **Ask Flagline**.
- **Grid:** rows = next 7 days, columns = hours 6 AM to 9 PM; each cell a `ZoneCell` (a `Button variant="ghost"` with zone background token, value, and aria label "Tuesday 4 PM, orange, 88 degrees"). Scheduled practices outlined. `ToggleGroup`: Sun / Shade, Field selector (`Select`). Tap a cell: `Popover` (desktop) or `Drawer` (mobile) with the source breakdown, AQI, thunder probability.
- **Best Window** panel: inputs (team, duration `Slider` 30 to 180 minutes, activity, preferred time); results as `Item` list with ZoneBadge sequence and "Schedule This" button.
- **Chart:** day selector (`ToggleGroup`), area chart with zone bands (reference areas), NWS line, model line, shade range.
- **Ask Flagline:** `InputGroup` with `InputGroupTextarea` (placeholder "Can varsity go full pads 4 to 6 tomorrow?") and `InputGroupButton` "Ask"; below, `ParsedPlanChips` (Badges, editable via Popover), then the answer `Card` with the timeline and options, each with "Schedule This".

### 7.7 New practice `/app/practices/new`

- Form (Field + RHF + Zod): Team (`Select`), Field (`Select`), Date (`Popover` + `Calendar`), Start time (`Input type="time"`), Planned duration (`Slider` + value), Activity blocks (`ToggleGroup multiple` + ordered list), Gear plan (`RadioGroup` for football), Reading owner (`Select` of members), Notes (`Textarea`).
- Live `PracticePreview` (right column on desktop, below on mobile): expected levels by block, conflicts as `Alert`s with one-tap fixes (`Button size="sm"`): "Shorten To 2 Hours", "Move To 7:00 AM", "Use Helmet, Shoulder Pads And Shorts", "Move Conditioning To Start".
- Submit "Schedule Practice"; success toast; route to practice detail.

### 7.8 Practice detail `/app/practices/[id]`

- Header: team, field, date and time, ZoneBadge (expected or live), status badge (Scheduled, Live, Ended, Finalized), buttons "Start Practice" (primary, when within 15 minutes) and "Share Check-In QR".
- `Tabs`: **Plan** (preview), **Live Log** (readings, level changes, breaks, holds in a timeline of `Item`s), **Check-Ins** (anonymous list), **Export** (PDF, CSV).

### 7.9 Practice Mode `/app/practices/[id]/live` (the most important screen)

```
┌──────────────────────────────────────────┐
│ ◂ Varsity Football · Turf       [Emergency]│  ← destructive, always visible
├──────────────────────────────────────────┤
│  ORANGE   87.6° WBGT  Measured 3:38 PM     │  ← ZoneBanner (full width, zone color)
│  Limited by heat. 2 hours max.             │
├──────────────────────────────────────────┤
│  Next Reading In     29:41                 │  ← RecheckCountdown (mono, huge)
│  [Log A Reading]  [Photo Of Meter]         │  ← lg buttons, ButtonGroup
├──────────────────────────────────────────┤
│  Next Break In 7:12        [Start Break]   │  ← BreakTimer
│  Breaks this hour: 1 of 4 (4 min each)     │
├──────────────────────────────────────────┤
│  Time Used 0:48 of 2:00  ▓▓▓▓░░░░░░        │  ← Progress
│  Orange 0:48 · Yellow 0:00                 │  ← TimeInLevel
├──────────────────────────────────────────┤
│  Right Now                                 │
│  ◉ Helmet, shoulder pads and shorts        │
│  ◉ 4 breaks per hour, 4 minutes each       │
│  ◉ Cooling zone required  [Checklist 3/4]  │
│  ◉ Water always available                  │
├──────────────────────────────────────────┤
│  AQI 61 Moderate · Thunder 10%  [Thunder Heard] │
│  Check-In QR  ·  [End Practice]            │
│  Footer: decisions remain with staff ...   │
└──────────────────────────────────────────┘
```
- **ZoneBanner:** `Card` with the zone background token, icon, level name, value, source badge, binding constraint. `role="status"`; level changes announced with `aria-live="assertive"` once.
- **RecheckCountdown:** mono digits; at 2:00 it pulses (reduced-motion aware); at 0 it vibrates (`navigator.vibrate`), plays a short tone (user-enabled), shows "Reading Due" and turns to "Overdue 1:12" in destructive styling.
- **Log A Reading:** opens a `Drawer` (mobile) or `Dialog` (desktop) with `ReadingKeypad` (a grid of `Button size="lg"` digits and decimal, `InputGroup` with "° F" suffix), instrument `NativeSelect` (Kestrel 5400, Other Meter, Internet Source), "Save Reading" button. Validation 40 to 120 F.
- **Photo Of Meter:** file input with `capture="environment"`; preview; "Reading Detected: 87.6° F" with confidence; "Use This Reading" or "Enter Manually".
- **LevelChangeSheet:** on a level increase: a `Drawer` titled "Level Changed To Red" listing changes as `Checkbox` items to confirm ("Remove all protective equipment", "Stop conditioning", "20 minutes of rest this hour", "Practice ends by 4:45 PM") and "Confirm Changes"; unconfirmed changes remain as a warning and in the log.
- **CoolingChecklist:** `Checkbox` group in a `Collapsible`: "Tub filled with ice water", "Water temperature 35 to 58° F", "TACO tarp available", "Trained person on site".
- **Thunder Heard:** starts a 30-minute hold; banner switches to "Lightning Hold, Resume At 5:12 PM" with a Progress bar; each tap resets.
- **End Practice:** `AlertDialog`; then summary `Card` with signature (initials `Input`), notes, "Finalize Log".
- **Offline:** `Alert` "Offline, saved on this device. Syncing when you are back online."
- **Wake lock:** `navigator.wakeLock.request("screen")` while in Practice Mode (with a toggle), so the phone does not sleep.
- Performance: the page is a thin client shell; all timers are local; network is used only for readings, check-ins and sync.

### 7.10 Emergency `/app/practices/[id]/emergency`

- Title "Exertional Heat Stroke Protocol"; `Alert variant="destructive"`: "Cool first, transport second."
- Steps as numbered `Card`s with large `Button`s:
  1. "Start Cooling" (records the time; starts the cooling timer with Progress to 30 minutes and elapsed display).
  2. Instructions: "Remove equipment. Immerse the whole body in ice water (35 to 58° F). Stir the water and keep adding ice." If no tub: TACO method steps (Accordion).
  3. "Call 911" (`tel:911` link styled with `buttonVariants({ variant: "destructive", size: "lg" })`), recorded when tapped. Note: "If another adult is present, they can call now."
  4. "Record Temperature" (rectal, `Input` with ° F), guidance "Stop cooling at 101 to 102° F."
  5. "EMS Arrived" and "Transported" timestamps.
- `IncidentTimeline` (Item list) at the bottom; "Add Note".
- Language toggle prominent (Spanish instructions for bystanders).

### 7.11 Athlete check-in `/c/[token]`

- No login. Language auto-detected with a toggle.
- Title "How Are You Feeling?"; description "This goes to your coach and athletic trainer. You can stay anonymous."
- `Questionnaire`: (1) optional jersey number or initials `Input`; (2) symptom `Checkbox` list with icons; (3) `Textarea` "Tell us in your own words" (optional); (4) "Send To My Coach".
- Result screen, by routing: emergency ("Stay where you are. Help is coming. Tell the nearest adult now."), check now ("Stop, sit in the shade, drink water and tell a coach now. A coach has been notified."), check soon ("Thanks. Drink water and rest at your next break. A coach will check on you.").
- Education accordion: "Warning Signs To Watch For" (in simple words).

### 7.12 Check-ins queue `/app/check-ins`

- `Tabs`: **Open**, **Resolved**. Each check-in an `Item`: routing badge (Emergency, Check Now, Check Soon), practice and field, time, jersey or "Anonymous", tapped symptoms, text, and the AI flags that fired (transparency). Actions: "Open Emergency Protocol", "Mark Checked", "Add Note".
- Emergency items also appear as a blocking `AlertDialog` on any open app screen of the trainer and coach.

### 7.13 Log `/app/log`

- Data table (TanStack v9 features: filtering, sorting, pagination, visibility, selection):
  columns: Date, Team, Field, Activity, Planned, Actual, Max Level, Readings (on time / total), Missed Rechecks, Modifications Confirmed, Cooling Zone, Holds (AQI, lightning), Check-Ins, Incidents, Signed By, Actions.
- Filters: date range (Popover + Calendar range), team (`Select`), level (`ToggleGroup`), issues only (`Switch`).
- Badges for issues ("2 Late Readings", "Unconfirmed Changes").
- Export menu (`DropdownMenu`): "Download PDF (Selected)", "Download CSV (Filtered)".
- Row click opens practice detail.

### 7.14 Team page `/t/[teamSlug]`

- Title: team name; today status `Card`: "Practice Today 4:00 To 6:00 PM", status badge (On, Modified, Moved, Indoors, Delayed, Cancelled), `ZoneBadge`, plain-language explanation ("Orange flag: shorter practice, lighter gear and extra water breaks."), "Bring a full water bottle."
- This week list (`Item`s).
- "Get Updates" button (web push subscription, Core); share button (copy link, QR in a Dialog).
- No personal data. `noindex` meta.

### 7.15 Settings pages

- **School:** details `Card`; `ClassLockCard` showing "Class 3, locked for 2026-27 by A. Director on Aug 1, 2026"; owner-only "Request Class Change" (`AlertDialog` requiring a reason; logged).
- **Fields:** `Item` list with surface badges; add or edit in `Dialog` with "Use My Location".
- **Teams:** sport, level, default field and time, slug for the team page, "Show Public Page" switch.
- **Members:** table with role `Select`; invite `Dialog`.
- **Rules:** active heat rule set (`RadioGroup`), AQI preset (EPA schools, strict youth), lightning scope (school-wide 10 miles or per field), NATA 14-day acclimatization `Switch`; Stretch: "Import A Policy" card.
- **Notifications:** enable push (`Button` with permission flow), preference `Switch`es (recheck, break, level forecast, red flag, lightning), iOS install instructions `Alert`.
- **Profile:** name, language (`Select`), theme (`RadioGroup` Light, Dark, Sunlight, System).

### 7.16 Command palette

`CommandDialog` (Cmd/Ctrl K): groups "Go To" (Today, Planner, Log, Settings), "Practices" (today's practices), "Actions" (Start Practice, Log A Reading, Open Emergency Protocol, Toggle Sunlight Mode).

---

## 8. Data Model

### 8.1 Entity relationships

```
school 1───* field
school 1───* team *───1 field(default)
school 1───* membership *───1 user
school 1───1 class_lock (per school year)
team 1───* practice 1───* practice_block
practice 1───* reading
practice 1───* level_change
practice 1───* break_event
practice 1───* hold_event (lightning | aqi | black)
practice 1───* check_in
practice 1───* incident 1───* incident_event
practice 1───1 practice_signoff
practice 1───* audit_event
field 1───* forecast_snapshot
user 1───* push_subscription
school 1───* ruleset_selection ; ruleset (global, versioned)
team 1───* athlete (Stretch, pseudonymous) 1───* acclimatization_day
```

### 8.2 Drizzle schema (abridged but complete in columns)

```ts
// lib/db/schema.ts
import { pgTable, pgEnum, uuid, text, timestamp, integer, real, boolean, jsonb, date, index, uniqueIndex } from "drizzle-orm/pg-core"

export const roleEnum = pgEnum("role", ["owner", "coach", "trainer", "viewer"])
export const surfaceEnum = pgEnum("surface", ["natural_grass", "artificial_turf", "asphalt", "track", "hard_court", "covered_pavilion", "indoor_no_ac", "other"])
export const levelEnum = pgEnum("level", ["green", "yellow", "orange", "red", "black", "unknown"])
export const sportEnum = pgEnum("sport", ["football", "marching_band", "soccer", "cross_country", "track_field", "tennis", "baseball", "softball", "volleyball_outdoor", "golf", "pe", "other"])
export const practiceStatusEnum = pgEnum("practice_status", ["scheduled", "precheck_due", "active", "suspended", "ended", "finalized", "cancelled"])
export const readingSourceEnum = pgEnum("reading_source", ["onsite_meter", "meter_photo", "internet_nws", "internet_model", "internet_other"])
export const routingEnum = pgEnum("routing", ["emergency", "check_now", "check_soon"])
export const holdKindEnum = pgEnum("hold_kind", ["lightning", "aqi", "black_flag"])

export const schools = pgTable("schools", {
  id: uuid("id").primaryKey().defaultRandom(),
  name: text("name").notNull(),
  address: text("address"),
  lat: real("lat").notNull(),
  lon: real("lon").notNull(),
  timeZone: text("time_zone").notNull().default("America/Chicago"),
  state: text("state").notNull().default("TX"),
  isDemo: boolean("is_demo").notNull().default(false),
  createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
})

export const classLocks = pgTable("class_locks", {
  id: uuid("id").primaryKey().defaultRandom(),
  schoolId: uuid("school_id").notNull().references(() => schools.id, { onDelete: "cascade" }),
  schoolYear: text("school_year").notNull(),            // "2026-27"
  rulesetId: text("ruleset_id").notNull(),              // "uil-2026-27"
  region: text("region").notNull(),                     // "class3" | "class2" | "ksi1" ...
  suggestedRegion: text("suggested_region"),
  nearBoundary: boolean("near_boundary").notNull().default(false),
  lockedBy: text("locked_by").notNull(),                // user id
  lockedAt: timestamp("locked_at", { withTimezone: true }).notNull().defaultNow(),
  reason: text("reason"),
}, (t) => [uniqueIndex("class_lock_school_year").on(t.schoolId, t.schoolYear)])

export const fields = pgTable("fields", {
  id: uuid("id").primaryKey().defaultRandom(),
  schoolId: uuid("school_id").notNull().references(() => schools.id, { onDelete: "cascade" }),
  name: text("name").notNull(),
  surface: surfaceEnum("surface").notNull(),
  lat: real("lat").notNull(),
  lon: real("lon").notNull(),
  nwsGrid: jsonb("nws_grid").$type<{ wfo: string; x: number; y: number }>(),
  createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
})

export const teams = pgTable("teams", {
  id: uuid("id").primaryKey().defaultRandom(),
  schoolId: uuid("school_id").notNull().references(() => schools.id, { onDelete: "cascade" }),
  name: text("name").notNull(),                          // "Varsity Football"
  sport: sportEnum("sport").notNull(),
  level: text("level"),                                  // varsity | jv | freshman | middle_school
  defaultFieldId: uuid("default_field_id").references(() => fields.id),
  defaultStart: text("default_start"),                   // "15:45"
  slug: text("slug").notNull(),
  publicPage: boolean("public_page").notNull().default(true),
}, (t) => [uniqueIndex("team_slug").on(t.slug)])

export const memberships = pgTable("memberships", {
  id: uuid("id").primaryKey().defaultRandom(),
  schoolId: uuid("school_id").notNull().references(() => schools.id, { onDelete: "cascade" }),
  userId: text("user_id").notNull(),                     // Better Auth user id
  role: roleEnum("role").notNull(),
  teamIds: jsonb("team_ids").$type<string[]>().notNull().default([]),  // coach scope
}, (t) => [uniqueIndex("membership_unique").on(t.schoolId, t.userId)])

export const practices = pgTable("practices", {
  id: uuid("id").primaryKey().defaultRandom(),
  teamId: uuid("team_id").notNull().references(() => teams.id, { onDelete: "cascade" }),
  fieldId: uuid("field_id").notNull().references(() => fields.id),
  plannedStart: timestamp("planned_start", { withTimezone: true }).notNull(),
  plannedMinutes: integer("planned_minutes").notNull(),
  gearPlan: text("gear_plan"),                           // full_pads | shells_shorts | helmet_only | none | na
  status: practiceStatusEnum("status").notNull().default("scheduled"),
  actualStart: timestamp("actual_start", { withTimezone: true }),
  actualEnd: timestamp("actual_end", { withTimezone: true }),
  readingOwnerId: text("reading_owner_id"),
  checkInToken: text("check_in_token").notNull(),        // random 128-bit, url-safe
  workflowRunId: text("workflow_run_id"),
  notes: text("notes"),
  createdBy: text("created_by").notNull(),
  createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
}, (t) => [index("practice_team_start").on(t.teamId, t.plannedStart), uniqueIndex("practice_token").on(t.checkInToken)])

export const practiceBlocks = pgTable("practice_blocks", {
  id: uuid("id").primaryKey().defaultRandom(),
  practiceId: uuid("practice_id").notNull().references(() => practices.id, { onDelete: "cascade" }),
  order: integer("order").notNull(),
  kind: text("kind").notNull(),                          // warmup | individual | team | conditioning | walkthrough | band_block | full_run
  minutes: integer("minutes").notNull(),
})

export const readings = pgTable("readings", {
  id: uuid("id").primaryKey().defaultRandom(),
  practiceId: uuid("practice_id").references(() => practices.id, { onDelete: "cascade" }),
  fieldId: uuid("field_id").notNull().references(() => fields.id),
  takenAt: timestamp("taken_at", { withTimezone: true }).notNull(),
  wbgtF: real("wbgt_f").notNull(),
  level: levelEnum("level").notNull(),
  source: readingSourceEnum("source").notNull(),
  instrument: text("instrument"),                        // "Kestrel 5400"
  forecastNwsF: real("forecast_nws_f"),
  forecastModelF: real("forecast_model_f"),
  forecastIssuedAt: timestamp("forecast_issued_at", { withTimezone: true }),
  aiConfidence: real("ai_confidence"),                   // meter photo only
  kind: text("kind").notNull(),                          // precheck | recheck | adhoc
  onTime: boolean("on_time").notNull().default(true),
  takenBy: text("taken_by").notNull(),
}, (t) => [index("reading_practice_time").on(t.practiceId, t.takenAt)])

export const levelChanges = pgTable("level_changes", {
  id: uuid("id").primaryKey().defaultRandom(),
  practiceId: uuid("practice_id").notNull().references(() => practices.id, { onDelete: "cascade" }),
  at: timestamp("at", { withTimezone: true }).notNull(),
  from: levelEnum("from").notNull(),
  to: levelEnum("to").notNull(),
  requiredChanges: jsonb("required_changes").$type<string[]>().notNull(),
  confirmedChanges: jsonb("confirmed_changes").$type<string[]>().notNull().default([]),
  confirmedBy: text("confirmed_by"),
  confirmedAt: timestamp("confirmed_at", { withTimezone: true }),
})

export const breakEvents = pgTable("break_events", {
  id: uuid("id").primaryKey().defaultRandom(),
  practiceId: uuid("practice_id").notNull().references(() => practices.id, { onDelete: "cascade" }),
  startedAt: timestamp("started_at", { withTimezone: true }).notNull(),
  endedAt: timestamp("ended_at", { withTimezone: true }),
})

export const holdEvents = pgTable("hold_events", {
  id: uuid("id").primaryKey().defaultRandom(),
  practiceId: uuid("practice_id").notNull().references(() => practices.id, { onDelete: "cascade" }),
  kind: holdKindEnum("kind").notNull(),
  startedAt: timestamp("started_at", { withTimezone: true }).notNull(),
  resumesAt: timestamp("resumes_at", { withTimezone: true }),
  endedAt: timestamp("ended_at", { withTimezone: true }),
  detail: jsonb("detail"),                               // { aqi: 162, pollutant: "PM2.5" } | { resets: 2 }
})

export const checkIns = pgTable("check_ins", {
  id: uuid("id").primaryKey().defaultRandom(),
  practiceId: uuid("practice_id").notNull().references(() => practices.id, { onDelete: "cascade" }),
  at: timestamp("at", { withTimezone: true }).notNull().defaultNow(),
  alias: text("alias"),                                  // jersey number or initials, optional
  locale: text("locale").notNull().default("en"),
  symptoms: jsonb("symptoms").$type<string[]>().notNull().default([]),
  text: text("text"),
  routing: routingEnum("routing").notNull(),
  aiFlags: jsonb("ai_flags").$type<Record<string, number>>(),   // noul probabilities, severity, category
  resolvedAt: timestamp("resolved_at", { withTimezone: true }),
  resolvedBy: text("resolved_by"),
  note: text("note"),
}, (t) => [index("checkin_practice_time").on(t.practiceId, t.at)])

export const incidents = pgTable("incidents", {
  id: uuid("id").primaryKey().defaultRandom(),
  practiceId: uuid("practice_id").notNull().references(() => practices.id, { onDelete: "cascade" }),
  checkInId: uuid("check_in_id").references(() => checkIns.id),
  openedAt: timestamp("opened_at", { withTimezone: true }).notNull().defaultNow(),
  openedBy: text("opened_by").notNull(),
})

export const incidentEvents = pgTable("incident_events", {
  id: uuid("id").primaryKey().defaultRandom(),
  incidentId: uuid("incident_id").notNull().references(() => incidents.id, { onDelete: "cascade" }),
  at: timestamp("at", { withTimezone: true }).notNull().defaultNow(),
  kind: text("kind").notNull(),                          // cooling_started | called_911 | temp_recorded | ems_arrived | transported | note
  value: jsonb("value"),
  by: text("by").notNull(),
})

export const practiceSignoffs = pgTable("practice_signoffs", {
  practiceId: uuid("practice_id").primaryKey().references(() => practices.id, { onDelete: "cascade" }),
  initials: text("initials").notNull(),
  signedBy: text("signed_by").notNull(),
  signedAt: timestamp("signed_at", { withTimezone: true }).notNull().defaultNow(),
  notes: text("notes"),
})

export const auditEvents = pgTable("audit_events", {
  id: uuid("id").primaryKey().defaultRandom(),
  schoolId: uuid("school_id").notNull(),
  entity: text("entity").notNull(),                      // "reading" | "practice" | ...
  entityId: text("entity_id").notNull(),
  action: text("action").notNull(),                      // create | update | delete
  before: jsonb("before"),
  after: jsonb("after"),
  by: text("by").notNull(),
  at: timestamp("at", { withTimezone: true }).notNull().defaultNow(),
})

export const forecastSnapshots = pgTable("forecast_snapshots", {
  id: uuid("id").primaryKey().defaultRandom(),
  fieldId: uuid("field_id").notNull().references(() => fields.id, { onDelete: "cascade" }),
  fetchedAt: timestamp("fetched_at", { withTimezone: true }).notNull().defaultNow(),
  nwsIssuedAt: timestamp("nws_issued_at", { withTimezone: true }),
  hours: jsonb("hours").notNull(),                       // CombinedHour[]
}, (t) => [index("snapshot_field_time").on(t.fieldId, t.fetchedAt)])

export const pushSubscriptions = pgTable("push_subscriptions", {
  id: uuid("id").primaryKey().defaultRandom(),
  userId: text("user_id"),                               // null for anonymous parent subscriptions
  teamId: uuid("team_id"),                               // parent subscriptions
  endpoint: text("endpoint").notNull(),
  keys: jsonb("keys").$type<{ p256dh: string; auth: string }>().notNull(),
  prefs: jsonb("prefs").$type<Record<string, boolean>>().notNull().default({}),
  createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
}, (t) => [uniqueIndex("push_endpoint").on(t.endpoint)])

// Stretch
export const athletes = pgTable("athletes", {
  id: uuid("id").primaryKey().defaultRandom(),
  teamId: uuid("team_id").notNull().references(() => teams.id, { onDelete: "cascade" }),
  alias: text("alias").notNull(),                        // jersey number or initials only
  firstPracticeDate: date("first_practice_date"),
  highRisk: boolean("high_risk").notNull().default(false), // linemen, returning from illness (no reason stored)
})
```

Retention jobs (daily cron): delete `check_ins` older than 30 days (keep anonymized counts on the practice), delete `forecast_snapshots` older than 1 year except those referenced by readings, delete meter photos (never stored by default).

---

## 9. Domain Modules

### 9.1 `lib/heat` (pure)

```ts
export type WbgtInputs = {
  time: Date; lat: number; lon: number
  tempC: number; rhPct: number; pressureHpa: number
  wind10mMs: number; shortwaveWm2: number; directWm2: number
}
export function cosZenith(time: Date, lat: number, lon: number): number          // NOAA solar position
export function wind2m(wind10mMs: number, stability: StabilityClass): number     // floor 0.13 m/s
export function stabilityClass(cosZ: number, shortwave: number, wind10m: number, isDay: boolean): StabilityClass
export function globeTempC(i: DerivedInputs): number                              // fixed point, tol 0.02 K, max 500 it.
export function naturalWetBulbC(i: DerivedInputs): number
export function wbgtLiljegren(i: WbgtInputs, opts?: { shade?: boolean }): { wbgtC: number; tgC: number; tnwbC: number }
export const cToF = (c: number) => (c * 9) / 5 + 32
```

Constants (from thermofeel, Apache-2.0): globe diameter 0.0508 m, globe emissivity 0.95, globe albedo 0.05; wick diameter 0.007 m, wick length 0.0254 m, wick emissivity 0.95, wick albedo 0.4; surface albedo 0.45, surface emissivity 0.999; Stefan-Boltzmann 5.6696e-8; min wind 0.13 m/s; fdir clamped to 0 to 0.9 and 0 when cos zenith is below 0.00873.

Tests: `tests/fixtures/thermofeel-reference.json` (inputs and expected outputs generated by running thermofeel on 200 recorded Open-Meteo hours for Austin, Houston, Lubbock and El Paso); tolerance 0.1 C. Property tests with fast-check style generators (implemented with Vitest loops): monotonic in RH and shortwave, non-increasing in wind above 1 m/s, no NaN for any valid input, night equals shade.

### 9.2 `lib/rules` (pure)

RuleSet schema (Zod):

```ts
export const LevelBand = z.object({ level: z.enum(["green","yellow","orange","red","black"]), minF: z.number().nullable() })
export const LevelRequirement = z.object({
  level: z.enum(["green","yellow","orange","red","black"]),
  maxPracticeMinutes: z.number().int().nullable(),        // null = normal limits
  breaks: z.discriminatedUnion("kind", [
    z.object({ kind: z.literal("count"), perHour: z.number().int(), minMinutes: z.number() }),
    z.object({ kind: z.literal("total"), minutesPerHour: z.number() }),
    z.object({ kind: z.literal("none") }),
  ]),
  coolingZoneRequired: z.boolean(),
  outdoorAllowed: z.boolean(),
  football: z.object({ gear: z.enum(["full", "helmet_shoulder_pads_shorts", "none"]), pantsIfReachedMidPractice: z.boolean(), conditioningAllowed: z.boolean() }).optional(),
  discretionNote: z.string().optional(),
  sourceQuote: z.string(),
})
export const RuleSet = z.object({
  id: z.string(), name: z.string(), version: z.string(),
  effectiveFrom: z.string(), effectiveTo: z.string().nullable(),
  sources: z.array(z.object({ title: z.string(), url: z.url(), retrieved: z.string() })),
  regions: z.array(z.object({ id: z.string(), label: z.string(), bands: z.array(LevelBand) })),
  requirements: z.array(LevelRequirement),
  timing: z.object({ precheckWithinMinutes: z.number(), recheckEveryMinutes: z.number(), graceMinutes: z.number() }),
})
```

`rulesets/uil-2026-27.json` (values from the UIL chart, verified Sep 25, 2026):

```json
{
  "id": "uil-2026-27",
  "name": "Texas UIL Heat Stress And Athletic Participation (Required)",
  "version": "2026.1",
  "effectiveFrom": "2026-08-01",
  "effectiveTo": null,
  "sources": [
    { "title": "UIL 2026-2027 Heat Stress & Athletic Participation REQUIRED Plan", "url": "https://www.uiltexas.org/health/info/heat-stress-and-athletic-participation", "retrieved": "2026-09-25" },
    { "title": "UIL WBGT Activity Guidelines chart", "url": "https://www.uiltexas.org/files/athletics/25-26WBGTChart.png", "retrieved": "2026-09-25" },
    { "title": "UIL Heat Stress FAQs", "url": "https://www.uiltexas.org/health/info/heat-stress-and-athletic-participation-faqs", "retrieved": "2026-09-25" }
  ],
  "regions": [
    { "id": "class3", "label": "Class 3", "bands": [
      { "level": "green", "minF": null }, { "level": "yellow", "minF": 82.0 }, { "level": "orange", "minF": 87.0 },
      { "level": "red", "minF": 90.1 }, { "level": "black", "minF": 92.1 } ] },
    { "id": "class2", "label": "Class 2", "bands": [
      { "level": "green", "minF": null }, { "level": "yellow", "minF": 79.7 }, { "level": "orange", "minF": 84.7 },
      { "level": "red", "minF": 87.7 }, { "level": "black", "minF": 89.8 } ] }
  ],
  "requirements": [
    { "level": "green", "maxPracticeMinutes": null, "breaks": { "kind": "count", "perHour": 3, "minMinutes": 3 },
      "coolingZoneRequired": false, "outdoorAllowed": true,
      "football": { "gear": "full", "pantsIfReachedMidPractice": false, "conditioningAllowed": true },
      "sourceQuote": "Normal Activities - Provide at least three separate rest breaks each hour with a minimum duration of 3 min each during the workout." },
    { "level": "yellow", "maxPracticeMinutes": null, "breaks": { "kind": "count", "perHour": 3, "minMinutes": 4 },
      "coolingZoneRequired": true, "outdoorAllowed": true,
      "football": { "gear": "full", "pantsIfReachedMidPractice": false, "conditioningAllowed": true },
      "discretionNote": "Use discretion for intense or prolonged exercise.",
      "sourceQuote": "Use discretion for intense or prolonged exercise; Provide at least three separate rest breaks each hour with a minimum duration of 4 min each. MANDATORY ONSITE RAPID COOLING ZONE (INCLUDING TUB OR TARP)" },
    { "level": "orange", "maxPracticeMinutes": 120, "breaks": { "kind": "count", "perHour": 4, "minMinutes": 4 },
      "coolingZoneRequired": true, "outdoorAllowed": true,
      "football": { "gear": "helmet_shoulder_pads_shorts", "pantsIfReachedMidPractice": true, "conditioningAllowed": true },
      "sourceQuote": "Maximum practice time is 2 hours; For Football: players are restricted to helmet, shoulder pads, and shorts during practice. If the WBGT rises to this level during practice, players may continue to work out wearing football pants without changing to shorts. For All Sports: Provide at least four separate rest breaks each hour with a minimum duration of 4 min each. MANDATORY ONSITE RAPID COOLING ZONE (INCLUDING TUB OR TARP)" },
    { "level": "red", "maxPracticeMinutes": 60, "breaks": { "kind": "total", "minutesPerHour": 20 },
      "coolingZoneRequired": true, "outdoorAllowed": true,
      "football": { "gear": "none", "pantsIfReachedMidPractice": false, "conditioningAllowed": false },
      "sourceQuote": "Maximum practice time is 1 hour; For Football: No protective equipment may be worn during practice, and there may be no conditioning activities. For All Sports: There must be 20 min of rest breaks distributed throughout the hour of practice. MANDATORY ONSITE RAPID COOLING ZONE (INCLUDING TUB OR TARP)" },
    { "level": "black", "maxPracticeMinutes": 0, "breaks": { "kind": "none" },
      "coolingZoneRequired": true, "outdoorAllowed": false,
      "sourceQuote": "No outdoor workouts. Delay practices until a cooler WBGT is reached." }
  ],
  "timing": { "precheckWithinMinutes": 15, "recheckEveryMinutes": 30, "graceMinutes": 2 }
}
```

`ksi-2015.json` uses the KSI table (Category 1: 76.2, 81.2, 84.2, 86.1; Category 2: 79.8, 84.7, 87.7, 89.7; Category 3: 82.3, 87.1, 90.1, 92.1 as lower bounds for yellow, orange, red, black) with the same guideline text.

Engine functions and signatures:

```ts
export function levelFor(wbgtF: number, rs: RuleSet, regionId: string): Level        // round to 0.1 then >= lower bounds
export function requirementsFor(level: Level, sport: Sport, rs: RuleSet, ctx: { reachedMidPractice: boolean }): Requirements
export function aqiRequirements(aqi: number, preset: AqiPreset, plannedMinutes: number): AqiRequirements
export function lightningState(events: LightningEvent[], now: Date): { hold: boolean; resumesAt?: Date }
export function combine(heat: Requirements, aqi: AqiRequirements, lightning: LightningResult): Decision
export function sessionLimits(s: SessionState, rs: RuleSet): { allowedEnd: Date; timeInLevel: Record<Level, number>; noAutoExtend: boolean; overdue: boolean }
export function breakSchedule(level: Level, rs: RuleSet, hourStart: Date): BreakSlot[]
export function bestWindows(hours: CombinedHour[], plan: PlanInput, rs: RuleSet, region: string): WindowOption[]
export function suggestTexasClass(lat: number, lon: number): { region: "class2" | "class3"; nearBoundary: boolean }
```

`bestWindows` scoring: for each candidate start between 6 AM and 9 PM in 15-minute steps, compute the level per 15-minute slice; reject windows containing black or requiring more minutes than the most restrictive level allows; rank by (max level, total minutes at orange or above, distance from preferred start, planned gear feasibility).

### 9.3 `lib/conditions`

| Function | Source | Details | Cache |
|---|---|---|---|
| `resolveNwsGrid(lat, lon)` | `GET https://api.weather.gov/points/{lat},{lon}` | returns `gridId`, `gridX`, `gridY`; store on the field | permanent per field |
| `fetchNwsGrid(grid)` | `GET https://api.weather.gov/gridpoints/{wfo}/{x},{y}` | parse `wetBulbGlobeTemperature` (degC, ISO-8601 intervals like `.../PT2H`, expand to hours), `heatRisk`, `probabilityOfThunder`, `temperature`, `dewpoint`, `relativeHumidity`, `skyCover`, `windSpeed`, `updateTime` | 30 min per grid cell (`"use cache"` + `cacheLife`) |
| `fetchOpenMeteo(lat, lon)` | `GET https://api.open-meteo.com/v1/forecast?latitude&longitude&hourly=temperature_2m,relative_humidity_2m,surface_pressure,wind_speed_10m,shortwave_radiation_instant,direct_radiation_instant,diffuse_radiation_instant&minutely_15=...&wind_speed_unit=ms&timezone=UTC&forecast_days=8` | inputs for Liljegren; attribution CC BY 4.0 | 30 min per rounded coordinate (0.01 degree) |
| `fetchAirQuality(lat, lon)` | AirNow `GET https://www.airnowapi.org/aq/observation/latLong/current/?format=application/json&latitude&longitude&distance=25&API_KEY=...` and forecast `/aq/forecast/latLong/`; fallback Open-Meteo `https://air-quality-api.open-meteo.com/v1/air-quality?latitude&longitude&current=us_aqi,pm2_5,ozone,us_aqi_pm2_5,us_aqi_ozone&hourly=us_aqi` | observation = max AQI over monitors; label "preliminary" | 60 min |
| `geocodeAddress(q)` | US Census `https://geocoding.geo.census.gov/geocoder/locations/onelineaddress?address={q}&benchmark=Public_AR_Current&format=json` | schools and fields | 1 day |
| `searchPlace(q)` | Open-Meteo `https://geocoding-api.open-meteo.com/v1/search?name={q}&count=8&country_code=US` | Quick Check place names | 1 day |
| `combineHours(nws, model, aqi)` | code | `CombinedHour = { t, nwsF?, modelSunF?, modelShadeF?, planningF, range: [min,max], borderline, level, aqi?, thunderPct?, heatRisk? , sources }` | n/a |

Every outbound request sets `User-Agent: Flagline (https://flagline.xyz, contact@flagline.xyz)` (NWS requires an identifying UA), a 5-second timeout, one retry with jitter, and Zod validation of the response. If one source fails, the other is used with a "single source" badge; if both fail, the UI shows the last snapshot with its age.

### 9.4 `lib/rules/session.ts` state machine

States: `scheduled`, `precheck_due`, `ready`, `active`, `suspended`, `ended`, `finalized`, `cancelled`.

| Event | From | To | Effects |
|---|---|---|---|
| `TIME_PRECHECK` (start minus 15 min) | scheduled | precheck_due | notify reading owner |
| `READING` (precheck) | precheck_due | ready | level computed; required changes listed |
| `START` | ready or precheck_due (forecast allowed, labeled) | active | `actualStart`; timers begin; workflow started |
| `READING` (recheck) | active | active | level recompute; if up: stricter rules now, LevelChangeSheet; if down: no auto-extend |
| `RECHECK_OVERDUE` | active | active | overdue flag, push, log |
| `HOLD_START` (lightning, AQI cancel, black) | active | suspended | hold event; practice clock continues |
| `HOLD_END` | suspended | active | requires a reading if the hold was black |
| `END` | active or suspended | ended | `actualEnd`; summary |
| `SIGN` | ended | finalized | log locked; later edits audited |
| `CANCEL` | scheduled or precheck_due | cancelled | team page updated |

---

## 10. Server Actions And API Routes

All inputs validated with Zod; all mutations check membership and role (section 12); all public endpoints rate limited.

### 10.1 Server Actions (`app/**/actions.ts`)

| Action | Role | Input | Output |
|---|---|---|---|
| `createSchool` | authenticated | name, address, lat, lon | school id; caller becomes owner |
| `lockClass` | owner | schoolYear, rulesetId, region, confirm: true | class lock |
| `upsertField` | owner, coach | name, surface, lat, lon | field |
| `upsertTeam` | owner, coach | name, sport, level, defaultFieldId, defaultStart, publicPage | team |
| `inviteMember` | owner | email, role, teamIds | invite |
| `schedulePractice` | coach+ | teamId, fieldId, date, start, plannedMinutes, blocks[], gearPlan, readingOwnerId, notes | practice + preview |
| `previewPractice` | member | same as schedule without saving | preview decision per block |
| `startPractice` | coach, trainer | practiceId, useForecastIfNoReading | session state |
| `logReading` | coach, trainer | practiceId, wbgtF, source, instrument, takenAt, clientId (idempotency) | reading + decision |
| `confirmLevelChange` | coach, trainer | levelChangeId, confirmedChanges[] | updated change |
| `startBreak` / `endBreak` | coach, trainer | practiceId, clientId | break event |
| `markThunder` | coach, trainer | practiceId (and school scope option) | hold with resumesAt |
| `endPractice` | coach, trainer | practiceId | summary |
| `signPractice` | coach, trainer | practiceId, initials, notes | finalized |
| `openIncident` / `addIncidentEvent` | coach, trainer | practiceId, kind, value, clientId | incident events |
| `resolveCheckIn` | coach, trainer | checkInId, note | resolved |
| `updateRulesSettings` | owner | aqiPreset, lightningScope, nata14 | settings |
| `updateProfile` | self | name, locale, theme | user |

Idempotency: sideline actions accept a client-generated `clientId` (UUID) so offline replays never duplicate records.

### 10.2 Route Handlers

| Method and path | Auth | Input | Output | Rate limit |
|---|---|---|---|---|
| `GET /api/conditions?lat&lon&rules&region` or `?fieldId` | public (lat/lon) or member (fieldId) | query | `CombinedHour[]`, sources, issue times | 60 per min per IP |
| `POST /api/ai/ask` | member | `{ text, locale }` | parsed plan + confidence + answer | 20 per min per user |
| `POST /api/ai/meter-photo` | coach, trainer | multipart image (max 4 MB, jpeg/png/webp/heic) | `{ valueF, confidence, candidates }` | 10 per min per user |
| `POST /api/ai/policy-import` | owner (Stretch) | PDF (max 10 MB) | draft RuleSet + clause map | 3 per hour per school |
| `POST /api/check-ins/[token]` | public (token) | `{ alias?, symptoms[], text?, locale }` | `{ routing, message }` | 6 per min per IP per token |
| `POST /api/push/subscribe` | member or public (team page) | subscription JSON, prefs, teamId? | ok | 10 per min per IP |
| `GET /api/export/practice/[id]?format=pdf|csv` | member | | file | 30 per min per user |
| `GET /api/export/log?from&to&teamId&format=csv|pdf` | member | | file | 10 per min per user |
| `GET /api/cron/prefetch` | Vercel Cron secret | | warms forecasts for practices in the next 36 hours; sends "tomorrow" pushes at 8 PM local | daily |
| `/.well-known/workflow/*` | Workflow SDK | | durable workflow endpoints (generated by `withWorkflow`) | n/a |

Response envelope for JSON routes: `{ ok: true, data } | { ok: false, error: { code, message } }`. Error messages are user-safe; details go to logs.

---

## 11. AI Integration (Jev And Claude Vision)

### 11.1 Client setup

```ts
// lib/ai/jev.ts  (server only)
import "server-only"
import { TypeSafeClient } from "@typesafe-ai/sdk"

export const jev = new TypeSafeClient()      // reads TYPESAFE_API_KEY from env; SDK retries 429/529 with backoff
export const JEV_MODEL = "jev-latest"       // log response.model (e.g. "jev-1.13.0") with every decision
```

Rules: server-only import; per-request timeout 2 s for interactive paths (fallbacks in 11.6); every call logs `model`, token usage and latency (no user text in logs).

### 11.2 Ask Flagline request (one call, parallel questions)

```ts
// lib/ai/ask.ts
import { choice, noul } from "@typesafe-ai/sdk"

export async function parsePlan(input: { text: string; teams: Team[]; fields: Field[]; candidates: Candidates; today: string }) {
  const teamOptions = Object.fromEntries(input.teams.map((t) => [t.id, `${t.name} (${t.sport})`]))
  const fieldOptions = { ...Object.fromEntries(input.fields.map((f) => [f.id, `${f.name}, ${f.surface}`])), unspecified: "No field mentioned" }
  const startOptions = { ...Object.fromEntries(input.candidates.times.map((c) => [c.id, c.label])), none: "No start time mentioned" }
  const durOptions = { ...Object.fromEntries(input.candidates.durations.map((c) => [c.id, c.label])), none: "No end time or duration mentioned" }
  const dayOptions = { ...Object.fromEntries(input.candidates.days.map((c) => [c.id, c.label])), today: "Today" }

  return jev.systemOne({
    model: "jev-latest",
    state: { request: input.text, today: input.today },
    questions: {
      intent: choice("What does the coach in `request` want to do?", {
        check_plan: "Check whether a specific planned practice is allowed and what must change",
        find_best_window: "Find the best time to hold a practice",
        rules_now: "Know the rules or conditions right now",
        log_reading: "Record a WBGT reading",
        other: "Something else",
      }),
      team: choice("Which team does `request` refer to?", teamOptions),
      field: choice("Which field does `request` refer to?", fieldOptions),
      start: choice("Which option is the start time the coach means in `request`?", startOptions),
      end_or_duration: choice("Which option is the end time or duration the coach means in `request`?", durOptions),
      day: choice("Which day does `request` refer to?", dayOptions),
      gear: choice("What equipment does `request` plan for the players to wear?", {
        full_pads: "Full pads", helmet_shoulder_pads_shorts: "Helmet, shoulder pads and shorts (shells)",
        helmet_only: "Helmets only", no_equipment: "No protective equipment",
        not_football: "Not a football practice", unspecified: "Equipment not mentioned",
      }),
      activity: choice("What kind of activity is planned in `request`?", {
        football_practice: null, conditioning: "Conditioning or sprints", walkthrough: null,
        band_rehearsal: "Marching band rehearsal", other_sport_practice: null, pe_class: "PE class", game_or_contest: "A game or contest",
      }),
      mentions_conditioning: noul("Does `request` include conditioning, sprints or gassers?"),
    },
  })
}
```

Gating in code: `CONFIDENCE_MIN = 0.6` for each Choice; below it, the UI shows chips for the top two options by probability. `team` defaults to the user's only team if they have one. Unresolved `start` means `intent` becomes `find_best_window`. The typed plan goes to `bestWindows` and `requirementsFor`; the answer text is assembled from authored message templates (i18n), never generated.

Eval set `tests/ai-evals/ask-plans.jsonl`: 120 plans (60 en, 60 es) with expected typed outputs; CI reports accuracy per field; the target is at least 95% exact match on intent, team, gear and activity, and every miss must be low confidence (so it becomes a question, not a wrong answer).

### 11.3 Check-in triage request

```ts
// lib/ai/triage.ts
import { choice, noul, score } from "@typesafe-ai/sdk"

const RED_FLAGS = {
  confusion: "Does `report.text` describe confusion, disorientation, not knowing where they are, slurred speech, or acting strangely?",
  collapse_or_fainting: "Does `report.text` say the athlete collapsed, fainted, nearly fainted, or cannot stand?",
  vomiting: "Does `report.text` describe vomiting or being unable to keep fluids down?",
  hot_dry_skin: "Does `report.text` describe stopped sweating or very hot, dry skin?",
  severe_headache: "Does `report.text` describe a severe or worsening headache?",
  seizure_or_unresponsive: "Does `report.text` describe a seizure, twitching, or someone not responding?",
  breathing_difficulty: "Does `report.text` describe trouble breathing, wheezing, or an asthma attack?",
  chest_pain: "Does `report.text` describe chest pain or a racing, pounding heart?",
  third_party_distress: "Is `report.text` written by someone reporting another person who is in distress?",
} as const

export async function triage(report: { text: string; symptoms: string[]; level: string; locale: string }) {
  return jev.systemOne({
    model: "jev-latest",
    state: { report },
    questions: {
      ...Object.fromEntries(Object.entries(RED_FLAGS).map(([k, q]) => [k, noul(q)])),
      severity: score("How serious is the situation described in `report`?", [
        "No symptoms", "Mild discomfort", "Moderate symptoms that need a check", "Severe symptoms", "Life-threatening emergency",
      ]),
      category: choice("Which category best fits `report`?", {
        heat_cramps: "Muscle cramps", heat_exhaustion_signs: "Heavy sweating, weakness, dizziness, nausea, headache",
        possible_heat_stroke: "Confusion, collapse, very hot skin, vomiting or other signs of heat stroke",
        breathing_or_smoke: "Breathing trouble, asthma or smoke", dehydration: "Thirst, dry mouth, dark urine",
        unrelated_injury: "An injury not caused by heat", other: null,
      }),
    },
  })
}
```

Routing (code, recall first):

```ts
export const RED_FLAG_NOUL_MIN = 0.25
export function route(r: TriageResult, symptoms: string[], text: string): Routing {
  const tappedRedFlag = symptoms.some((s) => TAPPED_RED_FLAGS.has(s))            // confused, fainted, vomiting, stopped_sweating, trouble_breathing, chest_pain
  const keywordRedFlag = matchesRedFlagKeywords(text)                               // en + es curated list, typo tolerant
  const nouls = Object.keys(RED_FLAGS).some((k) => (r.answers[k]?.noul ?? 0) >= RED_FLAG_NOUL_MIN)
  const severe = (r.answers.severity?.score ?? 0) >= 3.0 || r.answers.category?.choice === "possible_heat_stroke"
  if (tappedRedFlag || keywordRedFlag || nouls || severe) return "emergency"
  if ((r.answers.severity?.score ?? 0) >= 1.5 || symptoms.length > 0) return "check_now"
  return "check_soon"
}
// If Jev fails or times out (> 2 s): route using tapped symptoms + keywords only; empty text with no symptoms => "check_soon".
```

Eval set: `redflags.en.jsonl` and `redflags.es.jsonl` (about 150 phrases total: explicit, slang, typos, third-person reports, negations like "I'm not dizzy anymore" labeled for review), plus 100 non-red-flag phrases. CI gate: **100% recall** on red-flag phrases; false-positive rate reported (no gate).

### 11.4 Meter photo pipeline

```ts
// lib/ai/meter.ts
import "server-only"
import Anthropic from "@anthropic-ai/sdk"
import { choice, noul } from "@typesafe-ai/sdk"
import { jev } from "./jev"
const anthropic = new Anthropic()                    // ANTHROPIC_API_KEY, server only

export async function readMeter(imageBase64: string, mediaType: "image/jpeg" | "image/png" | "image/webp", forecastF?: number) {
  // Step 1: transcription only (vision). No safety interpretation.
  const msg = await anthropic.messages.create({
    model: "claude-sonnet-5",
    max_tokens: 400,
    system: "You transcribe instrument displays. Return only JSON.",
    messages: [{ role: "user", content: [
      { type: "image", source: { type: "base64", media_type: mediaType, data: imageBase64 } },
      { type: "text", text: 'List every number shown on this device display with the label or unit printed next to it. JSON: {"device": string|null, "readings":[{"id":"r1","value":number,"unit":string|null,"label":string|null}]}' },
    ] }],
  })
  const parsed = MeterTranscription.parse(JSON.parse(textOf(msg)))       // Zod
  if (parsed.readings.length === 0) return { status: "manual" as const }

  // Step 2: Jev selects which transcribed reading is the WBGT and checks the screen type.
  const options = Object.fromEntries(parsed.readings.map((r) => [r.id, `${r.value} ${r.unit ?? ""} (${r.label ?? "no label"})`]))
  const sel = await jev.systemOne({
    model: "jev-latest",
    state: { device: parsed.device, readings: parsed.readings },
    questions: {
      wbgt: choice("Which reading in `readings` is the wet bulb globe temperature (WBGT)?", { ...options, none: "None of them is WBGT" }),
      is_heat_screen: noul("Do `device` and `readings` look like a WBGT or heat stress meter display?"),
    },
  })
  // Step 3: code validates range (40 to 120 F, or converts C), plausibility vs forecast (> 8 F diff => double-check note), confidence >= 0.7 else manual.
}
```

The image is resized client-side to at most 1280 px, sent once, never stored unless the user attaches it to the log. Eval: 30 photos (real meter screens we capture plus labeled samples) with expected values; target 90% auto-read, 100% of misreads caught by confirmation or low confidence.

### 11.5 Policy import (Stretch)

- `unpdf` extracts text; code splits clauses and extracts numeric candidates with regex (`/(\d{2,3}(?:\.\d)?)\s*°?\s*F/`, durations, counts).
- One Jev request per chunk of up to 40 clauses: a Choice per clause (category) and a Choice per numeric candidate (role), with the clause text as structured `instructions` context.
- Code assembles a draft `RuleSet`, validates with Zod, and renders a review table (value, role, source clause, confidence); every row must be approved; an unapproved or invalid rule set cannot be activated.

### 11.6 Fallbacks, costs and logging

| Feature | Fallback | Approx. cost per use |
|---|---|---|
| Ask Flagline | Manual plan form | Jev about 800 input tokens: about $0.00003 |
| Triage | Tapped symptoms + keyword rules (recall-first) | Jev about 600 tokens: about $0.00003 |
| Meter photo | Keypad with the photo visible | Claude vision about 1 to 2 cents; Jev negligible |
| Policy import | Manual rule entry | a few Jev calls |

Log per call: feature, model id returned, latency, tokens, confidence summary, routing outcome. Never log free text or images.

### 11.7 Why this satisfies the TypeSafe rule

Every semantic judgment (intent, entity selection, value selection, red-flag detection, severity, category, clause and threshold classification) is a Jev Choice, Score or Noul question. The only text-generating model call is image transcription, which Jev cannot do because it is text-only. No LLM output is shown to users as advice.

---

## 12. Auth, Roles And Permissions

- **Better Auth** with: email one-time code (Resend), Google OAuth, sessions in Postgres (Drizzle adapter), secure cookies, CSRF protection. Demo sign-in creates a session for the seeded demo coach in the demo school (read-mostly; nightly reset).
- Membership per school with a role.

| Capability | Owner (AD) | Coach | Trainer | Viewer |
|---|---|---|---|---|
| Lock or change class | Yes (change requires reason, audited) | No | No | No |
| Manage fields and teams | Yes | Own teams | No | No |
| Invite members, set roles | Yes | No | No | No |
| Schedule practices | Yes | Own teams | Yes | No |
| Run Practice Mode, log readings, breaks, holds | Yes | Own teams | All teams | No |
| Open emergency, add incident events | Yes | Own teams | All teams | No |
| See check-ins | Yes | Own teams | All teams | No |
| View log and export | Yes | Own teams | All teams | Read-only |
| Rules settings | Yes | No | No | No |

`lib/auth/permissions.ts` exposes `can(user, action, resource)`; every Server Action and route calls it first and returns a 403 envelope otherwise.

---

## 13. Notifications And Durable Practice Sessions

### 13.1 Web push

- VAPID keys in env (`VAPID_PUBLIC_KEY`, `VAPID_PRIVATE_KEY`, `VAPID_SUBJECT`).
- Client: `Notification.requestPermission()` only after a user gesture on the Notifications settings or the Practice Mode prompt; iOS requires the PWA to be installed (show the install `Alert`).
- Server: `web-push` `sendNotification(subscription, payload)`; payloads contain no personal data (for example `{ type: "recheck_due", practiceId, url }`), and the service worker renders localized text.
- Types: `recheck_due`, `recheck_overdue`, `break_due`, `level_forecast` (evening before), `red_flag`, `lightning_clear`, `practice_changed` (parents).

### 13.2 Durable practice session (Vercel Workflow SDK)

```ts
// lib/workflows/practice-session.ts
import { sleep, createHook } from "workflow"

type SessionEvent = { type: "reading"; at: string } | { type: "ended" }

export async function practiceSession(practiceId: string) {
  "use workflow"
  const events = createHook<SessionEvent>({ token: `practice:${practiceId}` })
  let lastReadingAt = await getLastReadingAt(practiceId)
  while (true) {
    const dueAt = new Date(new Date(lastReadingAt).getTime() + 30 * 60_000)
    const next = await Promise.race([events, sleep(dueAt)])           // wake on a new reading, an end, or the due time
    if (next && typeof next === "object" && "type" in next) {
      if (next.type === "ended") return
      lastReadingAt = next.at
      continue
    }
    await notifyRecheckDue(practiceId)                                // step
    const overdue = await Promise.race([events, sleep("2m")])
    if (!(overdue && typeof overdue === "object" && "type" in overdue)) await notifyRecheckOverdue(practiceId)  // step
  }
}

async function getLastReadingAt(practiceId: string) { "use step"; /* db query */ }
async function notifyRecheckDue(practiceId: string) { "use step"; /* web-push to reading owner + coach */ }
async function notifyRecheckOverdue(practiceId: string) { "use step"; /* web-push to coach + trainer, mark overdue */ }
```

- Started by `startPractice` with `start(practiceSession, [practiceId])` (from `workflow/api`); `logReading` and `endPractice` call `resumeHook("practice:<id>", event)`.
- `next.config.ts` wraps the config with `withWorkflow` from `workflow/next`.
- Break reminders are scheduled client-side (the break cadence depends on the live level and coach actions); the server only handles rechecks and red flags, which must work with the phone locked.
- Before implementing, read the installed docs in `node_modules/workflow/docs/` (the API is versioned; this sketch follows the current SDK reference).

### 13.3 Red-flag fan-out

`POST /api/check-ins/[token]` stores the check-in, routes it, and for `emergency` sends pushes immediately to the practice's coach and every trainer at the school; the open app polls every 15 seconds as a backup and shows a blocking `AlertDialog`.

---

## 14. Offline And PWA

- `app/manifest.ts`: name "Flagline", short name "Flagline", `display: "standalone"`, theme and background colors from tokens, icons 192 and 512 (maskable), start URL `/en/app`.
- **Serwist** service worker: precache the app shell and Practice Mode route; runtime cache for `/api/conditions` (stale-while-revalidate, 30 minutes); network-first for pages; push event handling and notification click routing.
- **Offline queue** (`lib/offline/queue.ts`, IndexedDB via `idb`): Practice Mode actions (`logReading`, `startBreak`, `endBreak`, `markThunder`, incident events) are written locally first with a `clientId`, applied optimistically to the local session state, and replayed in order when online (`navigator.onLine` + `online` event + periodic retry). Server actions are idempotent on `clientId`.
- Timers use wall-clock timestamps (not intervals) so they stay correct after the tab sleeps.
- Screen wake lock during Practice Mode (user toggle).

---

## 15. Internationalization

- **next-intl** with `[locale]` segment (`en`, `es`), middleware for detection, `NextIntlClientProvider` for client components.
- Catalog structure (`messages/en.json`):

```json
{
  "zone": { "green": "Green", "yellow": "Yellow", "orange": "Orange", "red": "Red", "black": "Black", "unknown": "No Data" },
  "practiceMode": {
    "title": "Practice Mode",
    "nextReadingIn": "Next Reading In",
    "logReading": "Log A Reading",
    "photoOfMeter": "Photo Of Meter",
    "startBreak": "Start Break",
    "thunderHeard": "Thunder Heard",
    "emergency": "Emergency",
    "endPractice": "End Practice",
    "limitedBy": "Limited by {constraint}. {minutes, plural, =0 {No practice time left.} other {# minutes max.}}",
    "noAutoExtend": "Conditions improved. UIL advises not to extend practice automatically. Your limit stays at {time}.",
    "footer": "Decisions remain with school staff under the UIL Heat Stress plan and your emergency action plan. In an emergency: cool first with cold-water immersion, then call 911."
  },
  "checkIn": {
    "title": "How Are You Feeling?",
    "emergencyResult": "Stay where you are. Help is coming. Tell the nearest adult now."
  }
}
```

- Spanish (`es.json`) mirrors keys: for example `"practiceMode.logReading": "Registrar Lectura"`, `"practiceMode.thunderHeard": "Se Escuchó Un Trueno"`, `"checkIn.title": "¿Cómo Te Sientes?"`. Title Case applies to titles and buttons in both languages (team style choice), sentence case to body text.
- Dates and numbers via `Intl` in the field's time zone (`@date-fns/tz`).
- The PDF log renders in the locale of the person exporting, with a toggle for bilingual output.
- A CI check fails if any key is missing in `es.json`.

---

## 16. Exports (PDF And CSV)

- **Practice PDF** (`@react-pdf/renderer`, server route): header (school, class and lock info, field and surface, team, date), summary (planned versus actual, max level, readings on time), level timeline table, readings table (time, value, level, source, instrument, forecast comparison, who), modifications required and confirmed, breaks, cooling checklist, holds, check-ins (anonymous counts and routings), incident timeline, notes, signature, sources and disclaimers, a QR code linking back to the record, page numbers. Fonts: Geist embedded.
- **CSV** (`lib/export/csv.ts`): one row per reading or per practice (two export shapes), RFC 4180 quoting, UTF-8 BOM for Excel, ISO timestamps plus local time columns.
- File names: `flagline-practice-2026-09-28-varsity-football.pdf`.

---

## 17. Security Implementation

(Policy in [SECURITY.md](../SECURITY.md).)

- **Headers** (`next.config.ts` `headers()`): `Content-Security-Policy` (default-src 'self'; img-src 'self' data: blob:; connect-src 'self' to our own routes only, since all third-party calls happen server-side; script-src 'self' with nonces for Next; frame-ancestors 'none'), `Strict-Transport-Security`, `X-Content-Type-Options: nosniff`, `Referrer-Policy: strict-origin-when-cross-origin`, `Permissions-Policy: camera=(self), geolocation=(self), microphone=()`.
- **Validation:** Zod on every input and every external response (`lib/conditions/*` parse functions).
- **Authorization:** `can()` in every action and route; row scoping by school and team in queries.
- **Rate limiting:** `@upstash/ratelimit` sliding windows (section 10.2).
- **Tokens:** check-in tokens are 128-bit random, per practice, expire 2 hours after practice end.
- **Secrets:** `lib/env.ts` validates required env vars at startup with Zod; keys never reach the client (only `NEXT_PUBLIC_VAPID_PUBLIC_KEY` and the app URL are public).
- **Uploads:** MIME sniffing, size limits, image decode in memory, EXIF stripped, not persisted.
- **Dependencies:** `pnpm audit` and Dependabot in CI; lockfile committed.
- **Logging:** structured logs without personal data or free text.

---

## 18. Testing Strategy

| Suite | Tool | Contents | Gate |
|---|---|---|---|
| Heat engine | Vitest | thermofeel reference fixtures (tolerance 0.1 C), solar geometry against NOAA examples, properties | 95% line coverage on `lib/heat` |
| Rules conformance | Vitest + CSV tables | `uil-class3.csv`, `uil-class2.csv`, `ksi.csv` (every boundary and neighbors, for example 81.9 / 82.0 / 86.9 / 87.0 / 90.0 / 90.1 / 92.0 / 92.1), requirements by sport, orange pants exception, red conditioning ban, AQI presets by duration, lightning resets | 100% pass, blocks merge |
| Session logic | Vitest + `sessions.json` scenarios | worsening, improving (no auto-extend), oscillation, black suspension, overdue, offline replay ordering | 100% pass |
| Conditions | Vitest + MSW with recorded NWS and Open-Meteo fixtures | parsing intervals, unit conversion, source failure fallbacks, combination and borderline | pass |
| AI adapters | Vitest with recorded Jev responses | gating, routing, fallbacks, schema errors | pass |
| AI evals (live) | `pnpm test:ai` (nightly and pre-submission, uses real Jev) | red-flag recall 100% (en and es), Ask accuracy, meter photo accuracy | recall gate |
| Server actions | Vitest integration with a test Postgres (Docker or Neon branch) | permissions, validation, idempotency | pass |
| E2E | Playwright (Chromium, WebKit, mobile viewport) | Quick Check; demo sign-in; onboarding; schedule with conflict fix; Practice Mode full run (precheck, recheck, level up with confirm, break, thunder hold, end, sign); check-in emergency routing to trainer; emergency flow; export PDF and CSV; Spanish toggle; sunlight mode | pass |
| Accessibility | `@axe-core/playwright` on every page in light, dark, sunlight | zero serious or critical | blocks merge |
| Manual | VoiceOver iOS, NVDA Windows, keyboard-only, sunlight readability outdoors on a real phone | checklist in PR | before freeze |

CI (`.github/workflows/ci.yml`): checkout, `pnpm/action-setup`, Node 22, `pnpm install --frozen-lockfile`, lint, typecheck, unit + conformance, build, Playwright against the build with MSW fixtures, upload traces on failure. Preview deploys via Vercel Git integration.

---

## 19. Performance, Observability And Budgets

| Metric | Budget |
|---|---|
| LCP (mobile, 4G) on `/`, `/check`, `/app` | under 2.0 s |
| INP | under 200 ms |
| CLS | under 0.05 |
| Practice Mode JS (route) | under 150 KB gzipped |
| `/api/conditions` p95 (warm cache) | under 150 ms; cold under 2 s |
| Jev call p95 | under 500 ms (typical about 100 ms) |
| Time to log a reading (tap to saved, online) | under 1 s |

Techniques: Server Components by default; client components only for interactive islands (timers, forms, charts); `next/font`; images via `next/image`; forecast cached per grid cell; the 7-day grid computed server-side; dynamic import for the chart and PDF preview.

Observability: Vercel Analytics and Speed Insights (no personal data); structured logs; an internal `/app/settings/status` panel (owner) showing data source health (last successful NWS and Open-Meteo fetch, AirNow status, Jev latency).

---

## 20. Delivery Plan (Day By Day)

Team roles (for a team of 4; merge roles for smaller teams):
- **A, Lead and platform:** repo, CI, deploy, DB, auth, workflows, push, offline, security.
- **B, Domain engine:** WBGT port, solar geometry, conditions service, rules engine, conformance tests, session logic.
- **C, Frontend and UX:** design system, all pages, accessibility, i18n, sunlight mode, Balsamiq wireframes.
- **D, AI, integrations and story:** Jev features, meter photo, check-ins, exports, demo data, video, Devpost, README.

| Day | Date (2026) | A | B | C | D | Milestone |
|---|---|---|---|---|---|---|
| D0 | **Sun Sep 27** | Theme reveal protocol ([problem.md](./problem.md) 7.2). After the reveal: create repo scaffold (section 4), Vercel project, Neon, CI skeleton | Port plan for thermofeel; fixture generation script (Python, run locally) | Balsamiq wireframes of Quick Check, Practice Mode, Today, Planner (start trial) | Register domain; Devpost draft project; theme bridge sentence | Decision locked, repo live |
| D1 | Mon Sep 28 | Auth (Better Auth), DB schema v1, env validation | `solar.ts`, `liljegren.ts` with reference tests | Tokens (zone + sunlight), ZoneBadge, layout, marketing shell | NWS and Open-Meteo recorded fixtures; demo school seed v1 | Hello world deployed |
| D2 | Tue Sep 29 | Conditions route + caching | `nws.ts`, `openmeteo.ts`, `combine.ts`, rules `levelFor`, UIL JSON + conformance CSVs | Quick Check page end to end | AQI fetchers; sources page copy | **M1: Quick Check live on prod** |
| D3 | Wed Sep 30 | Onboarding actions, class lock, fields, teams | `requirementsFor`, `suggestTexasClass`, KSI rules | Onboarding Questionnaire, settings pages | Seed v2 (teams, practices, forecast snapshot for demo) | |
| D4 | Thu Oct 1 | Schedule practice action, preview | `bestWindows`, planner grid data | Planner grid + chart, Today dashboard | Demo mode plumbing | |
| D5 | Fri Oct 2 | Practice session state machine persistence, idempotent actions | `sessionLimits`, break schedule, session scenarios | Practice Mode UI (banner, countdown, keypad, breaks) | LevelChangeSheet copy, cooling checklist copy | |
| D6 | Sat Oct 3 | End, sign, audit events | Hold logic (black, lightning), combine | Emergency page, End Practice, log table v1 | PDF export v1, CSV | **M2: MVP core flow end to end** |
| D7 | Sun Oct 4 | Workflow SDK recheck reminders + web push | Test hardening, coverage | Bug bash fixes, mobile polish | Internal demo run, record rough video for timing | Internal demo |
| D8 | Mon Oct 5 | Check-in route, rate limits, token lifecycle | Keyword red-flag list (en, es) | Check-in page, trainer queue, red-flag AlertDialog | Jev triage + eval sets, Ask Flagline parse + templates | |
| D9 | Tue Oct 6 | Upload handling, security headers | AQI requirements, combined decision, thunder hold UI hooks | Ask Flagline UI, AQI + lightning cards | Meter photo pipeline + eval photos | |
| D10 | Wed Oct 7 | Offline queue + Serwist | Calibration data capture (Stretch) | Team public page, share QR, log filters | PDF v2 (bilingual), parent push (Core) | |
| D11 | Thu Oct 8 | Performance budget pass | Final conformance review (two reviewers) | Spanish catalog complete, sunlight mode, axe zero, screen reader pass | Devpost story draft, gallery shots list | |
| D12 | Fri Oct 9 | Stretch or hardening | Stretch: acclimatization roster or policy import | Polish, empty and error states | Script final; architecture diagram | |
| D13 | Sat Oct 10 | **Feature freeze** at noon CDT; release candidate | Regression tests | Final UI polish (no new features) | **Record video**, captions, screenshots | Feature freeze |
| D14 | Sun Oct 11 | Seed reset, prod checks | Rules sign-off | Final a11y check | Devpost complete: story, gallery, video (unlisted), Built With, links | Devpost draft complete |
| D15 | **Mon Oct 12** | Tag `v1.0.0-warriorhacks`, freeze `main` | | | Final proofread; **submit by 18:00 CDT** | **Submitted** |

Cut lines:
- If M1 slips past Sep 30: drop the model source for the MVP and use NWS only (label "single source"), finish Liljegren later.
- If M2 slips past Oct 4: drop F12 and F14 entirely; Ask Flagline becomes Stretch; keep check-ins.
- If Core slips past Oct 8: keep meter photo manual-only; keep push for rechecks and red flags only.
- Never cut: Practice Mode correctness, Emergency, log export, accessibility, disclaimers.

Daily rituals: 15-minute standup (async in Discord if needed), one deploy per day minimum, end-of-day demo on production.

---

## 21. Backlog And Stretch

- F12 AI policy import for other states.
- F14 Acclimatization roster (UIL 5-day, NATA 14-day), full-contact minutes, 8-hour weekly cap.
- Forecast calibration per field from logged readings.
- Automated lightning data (NOAA GOES GLM) with the 10-mile rule.
- SMS alerts for coaches without data plans.
- Weekly AD email digest.
- District dashboard across schools.
- Indoor non-A/C facility mode with indoor WBGT (no solar term) guidance.
- Game-day mode (contest modifications, cooling zone at games).
- Apple Watch or wearable integrations (post-hackathon).

---

## 22. Demo Data And Demo Mode

- **Fictional school:** "Pecan Creek High School", Austin, Travis County, Class 3 (locked "Aug 1, 2026 by Demo Director"). Clearly labeled "Demo School" in the header.
- Fields: Turf Stadium (artificial turf), Practice Field (natural grass), Band Lot (asphalt), Tennis Courts (hard court), Track.
- Teams: Varsity Football, JV Football, Marching Band, Girls Soccer, Cross Country.
- Practices: today and the next 7 days at realistic times (3:45 PM football, 4:00 PM band, 7:00 AM band on the red day).
- **Frozen forecast snapshot** for demo determinism: the real NWS and Open-Meteo values captured for Austin for Sep 27 to Oct 3, 2026 (for example Monday Sep 28: NWS 3 PM 88, 4 PM 87, 5 PM 85; Sunday UNC sun 90.6 at 4 PM for a red example). Demo Mode reads the snapshot so the video and judges see the same story; a "Live Data" toggle switches to real-time forecasts.
- Seeded history: two weeks of finalized practices with readings, one missed recheck, one level change, one resolved check-in, so the log and charts are meaningful.
- Demo users: Demo Coach (coach, football), Demo Trainer (trainer), Demo Director (owner). "Try The Demo School" signs in as Demo Coach; a switcher lets judges view as Trainer.
- Nightly reset (cron) restores the seed.
- All names and data fictional.

---

## 23. Submission Kit

### 23.1 README requirements (written during the build)

1. Title, one-line tagline, live demo link, video link, badges (CI, license).
2. Theme bridge paragraph (after the reveal).
3. Screenshots (Practice Mode, Quick Check, Planner, Log).
4. What it does (five verbs) and who it is for.
5. How it works (architecture diagram), the WBGT method, rules as data, AI design.
6. Tech stack.
7. Getting started (pnpm commands, env vars from `.env.example`).
8. Testing (how to run conformance and e2e).
9. Data sources and attribution: NWS (public domain), Open-Meteo (CC BY 4.0, link), AirNow ("preliminary"), US Census geocoder, UNC CISA/SERCC (if used for comparison), thermofeel (Apache-2.0) port notice.
10. Safety disclaimer.
11. **AI Use Disclosure:** coding assistants used (for example Claude Code, DevSwarm if used), in-product AI (TypeSafe Jev for typed judgments; Claude for meter-photo transcription), and what AI did not do.
12. Pre-existing code disclosure (none, apart from libraries and the attributed port).
13. Team and roles; license (MIT).

### 23.2 Devpost fields

- Name: Flagline. Tagline (under 200 characters). Thumbnail 3:2 under 5 MB.
- Story headings filled from [solution.md](./solution.md) section 18.2.
- Built With (up to 25): next.js, react, typescript, tailwindcss, shadcn-ui, base-ui, postgresql, neon, drizzle, better-auth, vercel, vercel-workflow, typesafe, jev, anthropic, claude, open-meteo, national-weather-service, airnow, recharts, next-intl, serwist, playwright, vitest, web-push.
- Try it out: production URL (custom domain), GitHub repo.
- Video: unlisted YouTube, 2:00 to 2:59, captions.
- Gallery: section 18.3 of [solution.md](./solution.md).
- Additional info: Hackathon track; repo URL.

### 23.3 Final checks (Oct 12)

- [ ] Production is up, seeded, and the demo sign-in works in a private window.
- [ ] Video plays logged out; under 3:00.
- [ ] Repo is public; README complete; license present; no secrets (`git log -p | grep -i key` sanity check plus secret scanning).
- [ ] Tag `v1.0.0-warriorhacks` created; `main` frozen.
- [ ] Devpost "Submitted" confirmation visible; every teammate accepted.

---

## 24. Pivot Kit

If the theme forces the backup (financial aid offer decoder), reuse:

| Layer | Flagline | Aid decoder |
|---|---|---|
| Shell, design system, i18n, auth, PWA | Same | Same |
| Deterministic engine | WBGT + UIL rules | Net price, 4-year debt, loan types rules |
| Interpretation layer (Jev) | Plan parsing, triage, meter value selection, policy clauses | Line-item classification (grant, subsidized loan, unsubsidized loan, Parent PLUS, work-study, unknown), cost detection, missing-cost Nouls |
| Vision transcription | Meter photo | Aid letter photo or PDF |
| Records and export | Practice log PDF | Side-by-side comparison PDF and questions for the aid office |
| Data sources | NWS, Open-Meteo, AirNow | College Scorecard API |

Replace `lib/heat`, `lib/rules`, `lib/conditions` and the domain pages; keep everything else. Estimated pivot cost: 1 day.

---

## 25. Appendices

### 25.1 `.env.example`

```bash
# App
NEXT_PUBLIC_APP_URL=http://localhost:3000
APP_CONTACT_EMAIL=contact@example.com            # used in the NWS User-Agent

# Database (Neon via Vercel Marketplace)
DATABASE_URL=postgres://user:password@host/db

# Auth (Better Auth)
BETTER_AUTH_SECRET=replace-with-32-plus-random-chars
BETTER_AUTH_URL=http://localhost:3000
GOOGLE_CLIENT_ID=
GOOGLE_CLIENT_SECRET=
RESEND_API_KEY=

# AI
TYPESAFE_API_KEY=                                 # TypeSafe Jev (server only)
ANTHROPIC_API_KEY=                                # Claude vision for meter photos (server only)

# Data
AIRNOW_API_KEY=                                   # optional; falls back to Open-Meteo air quality

# Push (web-push generate-vapid-keys)
NEXT_PUBLIC_VAPID_PUBLIC_KEY=
VAPID_PRIVATE_KEY=
VAPID_SUBJECT=mailto:contact@example.com

# Rate limiting (Upstash Redis via Vercel Marketplace)
UPSTASH_REDIS_REST_URL=
UPSTASH_REDIS_REST_TOKEN=

# Cron
CRON_SECRET=
```

### 25.2 `components.json` (as generated, unchanged)

```json
{
  "$schema": "https://ui.shadcn.com/schema.json",
  "style": "base-nova",
  "rsc": true,
  "tsx": true,
  "tailwind": { "config": "", "css": "app/globals.css", "baseColor": "neutral", "cssVariables": true, "prefix": "" },
  "iconLibrary": "lucide",
  "rtl": false,
  "aliases": { "components": "@/components", "utils": "@/lib/utils", "ui": "@/components/ui", "lib": "@/lib", "hooks": "@/hooks" },
  "menuColor": "default",
  "menuAccent": "subtle",
  "registries": {}
}
```

### 25.3 CI workflow

```yaml
# .github/workflows/ci.yml
name: CI
on: [push, pull_request]
jobs:
  build:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v4
      - uses: pnpm/action-setup@v4
      - uses: actions/setup-node@v4
        with: { node-version: 22, cache: pnpm }
      - run: pnpm install --frozen-lockfile
      - run: pnpm lint
      - run: pnpm typecheck
      - run: pnpm test -- --coverage
      - run: pnpm build
      - run: pnpm dlx playwright install --with-deps chromium webkit
      - run: pnpm test:e2e
      - uses: actions/upload-artifact@v4
        if: failure()
        with: { name: playwright-traces, path: test-results }
```

### 25.4 Base UI reminders (from the shadcn research)

- Triggers use `render={<Button />}` (not `asChild`); non-button renders add `nativeButton={false}`.
- `Select` needs an `items` prop; placeholder is an item with `value: null`.
- `ToggleGroup` uses `multiple`; `Slider` single thumb takes a number.
- Links styled as buttons: `buttonVariants()` on `next/link`.
- Toasts: `toast.add(...)` from `@/components/ui/toast` (Base UI projects); if a block imports `sonner`, rewrite it to `toast`.
- `TooltipProvider` wraps the app (sidebar tooltips).
- TanStack v9: register `columnVisibilityFeature` if using `row.getVisibleCells()`.

### 25.5 Source quick reference (for implementers)

- UIL plan: https://www.uiltexas.org/health/info/heat-stress-and-athletic-participation
- UIL chart: https://www.uiltexas.org/files/athletics/25-26WBGTChart.png
- UIL FAQs: https://www.uiltexas.org/health/info/heat-stress-and-athletic-participation-faqs
- UIL lightning: https://www.uiltexas.org/health/info/lightning-safety
- UIL football regulations: https://www.uiltexas.org/files/athletics/Fall_Football_Practice_Regulations.pdf
- NWS API: https://api.weather.gov (points, gridpoints)
- Open-Meteo: https://open-meteo.com/en/docs ; terms https://open-meteo.com/en/terms
- AirNow API: https://docs.airnowapi.org/
- EPA school AQI guide: https://document.airnow.gov/air-quality-and-outdoor-guidance-for-schools.pdf
- thermofeel (Liljegren reference): https://github.com/ecmwf/thermofeel
- TypeSafe docs: https://docs.typesafe.ai/llms.txt ; API https://docs.typesafe.ai/api.md
- shadcn/ui: https://ui.shadcn.com/llms.txt
- Workflow SDK: https://workflow-sdk.dev
