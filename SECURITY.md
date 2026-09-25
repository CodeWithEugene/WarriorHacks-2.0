# Security Policy

Flagline is a hackathon project for WarriorHacks 2.0. It gives heat and air-quality guidance for school outdoor activities, and it may handle information about minors (anonymous athlete check-ins, team names, practice schedules). We treat security and privacy as part of safety.

## Supported Versions

| Version | Supported |
|---|---|
| `main` (latest deployment) | Yes |
| Tagged submission release `v1.0.0-warriorhacks` | Yes, for the judging period (Oct 12 to Oct 15, 2026) |
| Anything older | No |

## Reporting A Vulnerability

**Please do not open a public GitHub issue for security problems.**

1. Use GitHub's private vulnerability reporting: the repository's **Security** tab, then **Report a vulnerability** (https://github.com/CodeWithEugene/WarriorHacks-2.0/security/advisories/new).
2. If that is unavailable, contact the maintainer through the email on their GitHub profile with the subject line `SECURITY: Flagline`.

Please include:
- A description of the issue and its impact.
- Steps to reproduce, or a proof of concept.
- The affected URL, route, API endpoint or file.
- Whether any real personal data may have been exposed.

What to expect:
- Acknowledgement within **48 hours** (faster during the hackathon window, Sep 28 to Oct 15, 2026).
- An initial assessment within **5 days**.
- A fix or mitigation as fast as the severity requires. Safety-affecting issues (for example, anything that could make the app show a less protective heat zone than the rules require) are treated as **critical** and fixed first.
- Credit in the release notes if you want it.

Please act in good faith: do not access other people's data beyond what is needed to demonstrate the issue, do not degrade the service for others, and give us reasonable time to fix before disclosure.

## Safety-Critical Bugs

A bug that makes Flagline show a **less** protective recommendation than the official rules (a wrong zone, a missing break, a practice length that is too long, a missed recheck prompt, an athlete red flag not escalated) is a safety bug, even if it is not a classic security vulnerability. Report it the same way, privately, and mark it **SAFETY**.

## Our Security Practices

### Secrets
- No secrets in the repository, ever. API keys (`TYPESAFE_API_KEY`, `ANTHROPIC_API_KEY`, `AIRNOW_API_KEY`, database URLs) live in environment variables: `.env.local` locally (git-ignored) and Vercel project environment variables in deployment.
- `.env.example` documents every variable with placeholder values only.
- Secret scanning (GitHub push protection and a pre-commit check) is enabled. Any leaked key is rotated immediately, even if the commit is removed.
- AI provider keys are used **server-side only** (Route Handlers and Server Actions). They are never sent to the browser.

### Data minimization (privacy by design)
- No athlete names are required. Check-ins use a jersey number or initials, and can be fully anonymous.
- No health records are stored. A check-in stores the minimum needed for the trainer to act (time, practice, free-text note, triage result) and is deleted after the retention period.
- Location is stored at field level (a named field and coordinates chosen by the coach), never a student's personal location.
- Default retention: practice logs 1 year (compliance records); athlete check-ins 30 days; AI request payloads are not stored beyond the request, apart from structured results.
- Demo and test data are fictional.

### Application security
- Input validation at every boundary with Zod schemas (forms, Route Handlers, Server Actions, external API responses).
- Authorization checks on every server action and route handler (team membership and role: owner, coach, trainer, viewer).
- Parameterized queries only (Drizzle ORM). No string-built SQL.
- Output encoding by React by default; no `dangerouslySetInnerHTML` with user content.
- CSRF protection via Server Actions' built-in origin checks and same-site cookies.
- Rate limiting on all AI-backed and public endpoints.
- Security headers: Content-Security-Policy, Strict-Transport-Security, X-Content-Type-Options, Referrer-Policy, Permissions-Policy (camera allowed only on the meter-photo route).
- Uploaded images (meter photos) are size- and type-checked, processed in memory for extraction, and not stored unless the user opts in.
- Error messages shown to users never include stack traces, keys or internal identifiers.
- Dependencies are pinned through `pnpm-lock.yaml`; Dependabot and `pnpm audit` run in CI.

### AI safety
- AI output never overrides the deterministic heat and smoke rules. It can only fill in typed parameters, which the user sees and can edit, or raise an escalation.
- Prompt-injection resistance: text from users, uploaded documents and photos is treated as data. It is placed in the model's `state`, never concatenated into system instructions, and outputs are constrained to typed schemas (Jev Choice, Score and Noul answers).
- Athlete red-flag screening is biased toward escalation. It can raise an alarm, but it can never clear one.

## Scope

In scope: this repository, the production deployment and its API routes. Out of scope: third-party services (Open-Meteo, NWS, AirNow, TypeSafe, Anthropic, Vercel, GitHub, Devpost), which have their own disclosure programs; social engineering; denial-of-service testing.
