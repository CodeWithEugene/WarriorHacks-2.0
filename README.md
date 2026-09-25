# Flagline

**Free heat and smoke safety for every outdoor practice.** Flagline tells coaches what today's practice can look like, runs the 30-minute WBGT rechecks and keeps the UIL log.

Built for **[WarriorHacks 2.0](https://warriorhacks-2-0.devpost.com/)** (Westwood Computer Science Club, Austin, Texas; online, Sep 28 to Oct 12, 2026), Hackathon track.

> **Status: planning.** The WarriorHacks 2.0 theme is revealed on **Sep 27, 2026** and projects must be built during the event, so this repository currently contains **planning documents only**. Application code starts after the theme reveal. See [docs/problem.md](./docs/problem.md) section 7 for the theme-fit protocol.

---

## Why Flagline

From **August 1, 2026**, Texas UIL requires wet bulb globe temperature (WBGT) monitoring for every outdoor athletic practice and marching band rehearsal: a reading within 15 minutes before practice, a reading every 30 minutes during it, and specific limits on practice length, rest breaks, football equipment and cooling zones at each flag level. Most schools have no athletic trainer at every practice, paid systems cost hundreds to thousands of dollars per site, and the free forecast tool UIL recommends has no workflow and keeps no records. Exertional heat stroke is the leading preventable cause of death in high school football.

Flagline turns the forecast and on-site readings into a practice plan, a sideline routine and a compliance record, free and with no hardware.

## What It Will Do

| | |
|---|---|
| **Plan** | Hour-by-hour WBGT flags for each field for 7 days, the best window for a practice, and plain-language questions like "can varsity go full pads 4 to 6 tomorrow?" |
| **Prepare** | Exactly what the rules require at the expected level: max length, breaks, football gear, cooling tub on site |
| **Run** | Practice Mode: pre-practice reading, a 30-minute recheck countdown, a break timer, time used against the level's max, and instant rule changes when the level rises. Log a reading in 5 seconds by keypad or meter photo |
| **Protect** | Private athlete check-ins (English and Spanish) with red flags routed to the trainer; a one-tap exertional heat stroke protocol (cool first, transport second); smoke (AQI) and lightning in the same decision |
| **Prove** | An automatic, signed, bilingual practice log (PDF and CSV) for the athletic director |

## Documentation

| Doc | Contents |
|---|---|
| [docs/info.md](./docs/info.md) | Everything about the challenge: rules, dates, prizes, judges, sponsors, Devpost mechanics, WarriorHacks 1.0 history, what wins |
| [docs/problem.md](./docs/problem.md) | 15 candidate problems with evidence, scoring (ours and TypeSafe Jev's), the chosen problem and the theme contingency plan |
| [docs/solution.md](./docs/solution.md) | The full solution: audience, principles, the UIL rules we implement, features, journeys, system design, WBGT engine, rules engine, AI layer, safety case, feasibility, demo plan |
| [docs/build.md](./docs/build.md) | The build spec: stack, repo layout, pure shadcn/ui design system, every page, data model, APIs, AI integration, notifications, offline, i18n, security, testing, day-by-day plan |
| [docs/research.md](./docs/research.md) | Research methods, captured data, Jev scripts and a full source index |

## Planned Stack

Next.js 16 (App Router) · React 19 · TypeScript · Tailwind CSS v4 · **shadcn/ui** (base-nova, Base UI primitives, lucide icons, Geist fonts) · Postgres (Neon) with Drizzle ORM · Better Auth · **TypeSafe Jev** for typed AI judgments · Claude vision for meter photos only · Vercel Workflow SDK for durable practice timers · Web Push · Serwist PWA (offline Practice Mode) · next-intl (English, Spanish) · Vitest, Playwright and axe · Vercel.

Data: National Weather Service gridpoint WBGT (no key), Open-Meteo forecast and air quality (no key), AirNow (free key, optional), US Census geocoder.

## Getting Started (After The Theme Reveal)

Requires Node 22+ and **pnpm** (the only package manager for this repo).

```bash
pnpm install
cp .env.example .env.local
pnpm db:migrate
pnpm db:seed
pnpm dev
```

Full bootstrapping commands are in [docs/build.md](./docs/build.md) section 4.

## Safety Notice

Flagline will provide planning estimates and workflow support. It is not a medical device, does not diagnose illness, and does not replace an athletic trainer, an on-site WBGT instrument, your emergency action plan or emergency services. Forecast values are estimates; take readings where athletes practice. In an emergency: cool first with cold-water immersion, then call 911.

## Data Sources And Attribution (Planned)

- National Weather Service API (public domain), https://api.weather.gov
- Open-Meteo forecast and air quality, CC BY 4.0, https://open-meteo.com
- AirNow (data are preliminary), https://docs.airnowapi.org
- US Census Geocoder, https://geocoding.geo.census.gov
- WBGT method: Liljegren et al. (2008), ported from ECMWF thermofeel (Apache-2.0), https://github.com/ecmwf/thermofeel
- Rules: Texas UIL Heat Stress and Athletic Participation Required Plan (2026-27), NFHS lightning guidelines, EPA school air quality guidance, KSI regional WBGT categories

## AI Use Disclosure

WarriorHacks allows AI tools with disclosure. So far:
- **Planning and research:** Claude (Anthropic) via Claude Code assisted with research, analysis and drafting of the documents in `docs/`. TypeSafe Jev was used to independently score candidate problems ([docs/research.md](./docs/research.md) section 4).
- **In the product (planned):** TypeSafe Jev for typed judgments (plan parsing, athlete check-in red-flag screening, meter value selection); Claude vision only to transcribe digits from meter photos. AI never decides a heat level, a practice limit or that an athlete is fine.
- Coding assistants used during the build will be listed here.

## Contributing

See [CONTRIBUTING.md](./CONTRIBUTING.md), [CODE_OF_CONDUCT.md](./CODE_OF_CONDUCT.md) and [SECURITY.md](./SECURITY.md).

## License

MIT (license file added with the first code commit after the theme reveal).
