# Research Log And Evidence Base

> How we researched WarriorHacks 2.0, the problem space, the chosen domain (heat and smoke safety for school athletics) and the UI system (shadcn/ui). This file holds the methods, the raw numbers that other docs cite, the TypeSafe Jev scripts we used, and a consolidated source index.
>
> Research window: **2026-09-25** (three days before submissions open). Labels: **[V]** verified from a primary source or a live API call during research; **[I]** inferred or secondary; **[NF]** not found.

---

## 1. Method

### 1.1 Research streams

| Stream | Question | Output | Where it is used |
|---|---|---|---|
| A. Challenge | Everything on Devpost (all subpages), the organizer site, the Code of Conduct, schedules, prizes, judges, sponsors | Verified facts, prize arithmetic, timeline | [info.md](./info.md) |
| B. History | WarriorHacks 1.0 (2025): theme, schedule, judges, prizes, all 46 submissions, winners and why; unrelated events with the same name; the club | Winner patterns, 1.0 vs 2.0 comparison | [info.md](./info.md) section 11 |
| C. What wins | 17 comparable 2024 to 2026 student hackathons, 124 winning projects scraped; judge advice; Devpost mechanics; demo-video practice | Win patterns, category frequency, submission checklist | [info.md](./info.md) section 12, [solution.md](./solution.md) section 18 |
| D. Sponsors | Each sponsor's product, perk, trial terms, practical use | Sponsor usage plan | [info.md](./info.md) section 9 |
| E. Problems | 15 candidate problems with 3+ sources each, competitors, saturation on Devpost | Ranked shortlist | [problem.md](./problem.md) |
| F. Domain | UIL WBGT rules (chart transcribed from the official image), FAQ, acclimatization, lightning, AQI, WBGT computation and data sources, accuracy literature, competitors and prices, Texas incidents, Austin climate | Domain model, engine design, demo scenario | [solution.md](./solution.md), [build.md](./build.md) |
| G. UI system | Every page of ui.shadcn.com (via `llms.txt` and `.md` variants), the 2025 to 2026 changelog, the registry, CLI behavior; verified by generating a real project, adding all components, type-checking and building | Stack versions, tokens, component inventory, Base UI API notes | [build.md](./build.md) section 5 |
| H. TypeSafe Jev | Live docs (`llms.txt`, API, SDK, primitives, confidence, patterns); live API test | AI layer design; independent scoring of candidates | [problem.md](./problem.md) section 5.2, [build.md](./build.md) section 11 |

### 1.2 Tools

- Direct HTTP captures (curl with a browser User-Agent) of Devpost pages, the organizer site, UIL pages and images, NWS and Open-Meteo APIs, the UNC WBGT tool's JavaScript and data endpoint.
- The Devpost public API (`https://devpost.com/api/hackathons?search=...`) and project search counts (`https://devpost.com/software/search?query=...`).
- Web search and page fetches for news, studies, competitor pages and sponsor sites.
- Parallel research agents (one per stream), each writing a sourced dossier with [V]/[I]/[NF] labels.
- **TypeSafe Jev** (`jev-latest` resolving to `jev-1.13.0`) through its HTTP API for structured, independent scoring (section 4). The local `jev` CLI shim was broken (missing `@typesafe-ai/sdk` module), so we called `POST https://api.typesafe.ai/v1/systemone` directly.
- Local reproduction: a scratch Next.js 16 + shadcn project (`shadcn init -t next -d`, `add --all`, `tsc --noEmit`, `next build`: all green) and a Python run of ECMWF `thermofeel` Liljegren WBGT on Open-Meteo inputs for Austin.

### 1.3 Verification standards

- Facts that drive decisions (UIL thresholds, dates, deadlines, prize values, eligibility) were read from the primary source, not from summaries.
- The UIL WBGT chart is an image; it was downloaded and read directly (`https://www.uiltexas.org/files/athletics/25-26WBGTChart.png`), and cross-checked against the UNC tool's JavaScript constants (`txCategory-3: 92.1, 90.1, 87, 82`; `txCategory-2: 89.8, 87.7, 84.7, 79.7`).
- Where sources conflict, both are recorded and the more authoritative wins (for example UIL over vendor marketing on whether records are required).
- We did not research the personal lives of organizers, judges or participants (many are minors). Only roles published on hackathon pages are noted; 2025 participants are referred to by project name.

---

## 2. Key Verified Facts (Quick Reference)

### 2.1 Challenge

| Fact | Value | Source |
|---|---|---|
| Submission window | Sep 28, 2026 12:00am CDT to Oct 12, 2026 11:45pm CDT | Devpost `/details/dates` [V] |
| Judging | to Oct 15, 5:00pm CDT; winners Oct 15, 9:00pm CDT | Devpost [V] |
| Theme reveal | Sep 27, 2026 ("the day before the hackathon submission phase begins") | Devpost overview, organizer site [V] |
| Tracks | Hackathon (code) and Ideathon (no code) | Devpost [V] |
| Criteria | Impact, Feasibility, User Experience, Technical Craft (25% each in 2025) | Devpost, 2025 rules [V] |
| Eligibility | Ages 13+, students only (high school and undergraduates), no companies; teams up to 4 | Devpost overview and rules [V] |
| Prize total | $23,857 displayed; 85.5% is 300 participation packages at $68; no real cash | Devpost prize list + arithmetic [V/I] |
| Registrants | 461 to 466 on Sep 25 | Devpost [V] |
| Code of Conduct | Built during the event; AI allowed with disclosure; attribution required; PII minimization; youth safety | CoC Google Doc [V] |

### 2.2 WarriorHacks 1.0 (2025)

| Fact | Value | Source |
|---|---|---|
| Theme | "Build a tool that breaks down barriers to learning, making education more inclusive, accessible, and impactful." | Devpost, opening deck [V] |
| Scale | 128 participants, 51 teams, 46 submissions (120 Devpost registrants) | Winners deck [V] |
| Winners | 1st AutoNote, 2nd Chorus, 3rd Pathways; Best AI/ML: FocusAI, NeuroAdapt Learning; 7 Top Warrior; 12 honorable mentions | Devpost winners update, deck [V] |
| Recycled projects | 11 of 24 unplaced projects predated the event (submitted to 1 to 98 other hackathons); none placed | Project page timestamps [V] |

### 2.3 Domain (heat and smoke)

| Fact | Value | Source |
|---|---|---|
| UIL mandate | WBGT required for all UIL outdoor athletics and marching band from Aug 1, 2026 | UIL required plan page [V] |
| Timing | Reading within 15 minutes before practice; every 30 minutes during | UIL [V] |
| Class 3 bounds (F) | yellow 82.0, orange 87.0, red 90.1, black 92.1 | UIL chart image [V] |
| Class 2 bounds (F) | yellow 79.7, orange 84.7, red 87.7, black 89.8 | UIL chart image [V] |
| Austin | Class 3 | UIL map, CBS Austin [V] |
| Records | Recommended, not required | UIL FAQ [V] |
| Heat illness incidence | about 9,237 time-loss heat illnesses per year in US high school athletes; football 10x other sports | CDC MMWR 2010 [V] |
| EHS deaths | 67 secondary-school deaths 1982 to 2022; football 94%; South 74.6% | Stearns et al. 2025 [V] |
| Linemen | 97% of football EHS deaths; 100% during sustained high-intensity conditioning | NFHS SMAC 2026 [V] |
| Texas KSI rank | 16th, 61.38%; acclimatization 2/7; cool-before-transport 0/3 | KSI 2025-26 [V] |
| Coaches' view | Nearly 80% call the WBGT requirement too restrictive (Houston Chronicle survey) | Houston Public Media [V] |
| Trainer requirement | None in UIL | Houston Public Media [V] |
| App accuracy | Phone app about 1 C cool vs on-site Kestrel, 2 to 3 C cool at high WBGT | Grundstein et al. 2025 GeoHealth [V] |

---

## 3. Data Captured During Research

### 3.1 NWS WBGT forecast for Austin (gridpoint EWX/156,91), F, captured Sep 25 [V]

| Day | 7 AM | 10 AM | 1 PM | 3 PM | 4 PM | 5 PM | 7 PM |
|---|---|---|---|---|---|---|---|
| Fri 9/25 | 74 | 79 | 86 | 87 | 85 | 84 | 81 |
| Sat 9/26 | 71 | 78 | 85 | 86 | 85 | 84 | 81 |
| Sun 9/27 | 72 | 79 | 88 | 88 | 87 | 86 | 83 |
| Mon 9/28 | 75 | 81 | 88 | 88 | 87 | 85 | 83 |
| Tue 9/29 | 75 | 80 | 87 | 88 | 87 | 86 | 83 |
| Wed 9/30 | 74 | 78 | 85 | 85 | 84 | 82 | 79 |
| Thu 10/1 | 71 | 76 | 82 | 83 | 82 | 81 | 78 |
| Fri 10/2 | 69 | 75 | 83 | 83 | 82 | 80 | 77 |

Air temperature at the same hours was 97 to 99 F and heat index 100 to 107 F. The NWS series covered 189 hours at 1 F resolution and included `heatRisk` (1 to 3 in Austin this week) and `probabilityOfThunder`.

### 3.2 UNC Liljegren forecast sample, Austin, 7 AM run on Sep 25 (sun / shade, F) [V]

Thu 9/24 3 PM 89.2 / 84.7; Fri 3 PM 87.9 / 82.8; Sat noon 89.3 / 82.6; **Sun 4 PM 90.6 / 85.3 (red, Class 3, full sun)**; Mon 4 PM 89.0 / 84.6.

### 3.3 Our Liljegren (thermofeel on Open-Meteo) vs NWS, Austin (F) [V run, I interpretation]

| Time | Liljegren / Open-Meteo | NWS | Difference |
|---|---|---|---|
| Fri 10 AM | 85.7 | 79.0 | +6.7 |
| Fri 1 PM | 88.5 | 86 | +2.5 |
| Fri 3 PM | 87.8 | 87 | +0.8 |
| Fri 7 PM | 76.0 | 81 | -5.0 |
| Sat 1 PM | 90.5 | 85 | +5.5 |
| Sat 3 PM | 90.3 | 86 | +4.3 |
| Sun 3 PM | 85.8 | 88 | -2.2 |
| Sun 7 PM | 77.0 | 83 | -6.0 |
| Mon 3 PM | 85.7 | 88 | -2.3 |

Two reasonable model chains disagree by 2 to 6 F at practice hours, which is enough to cross a flag level. This is why Flagline shows both, flags with the higher and asks for on-site readings.

### 3.4 Austin climate for the hackathon window [V]

- NOAA 1991-2020 normals (Camp Mabry): Sep 28 high 88 F; Oct 12 high 84 F.
- 2016 to 2025, Sep 28 to Oct 12 (150 days): mean daily max 89.8 F; **57% of days reached 90 F or more**; 2024 mean max 94.8 F, 2025 93.7 F.
- ERA5-based WBGT climatology (likely 2 to 5 F cool vs field conditions): 4 PM mean 79.1 F, 90th percentile 83.8 F; daily-max Class 3 levels over the window: green 83 days, yellow 71, orange 6.

### 3.5 Competitor pricing [V]

| Product | Price |
|---|---|
| Perry Weather | Tulsa Public Schools: up to $55,000 year 1, $35,000 per year after, for 10 sites (about $3,500 per site per year); Forsyth County GA about $101,500 for 7 stations |
| Zelus WBGT | Club $49.99 per year, Pro $199, All-Star $299; free tier discontinued Jun 1, 2026 |
| Kestrel 5400 | $549; $629 with LiNK and vane mount |
| Texas WBGT (iOS) | $0.99, released Jul 22, 2026 |
| Klimo WBGT | Free basics; Plus from $5 per month |
| UNC WBGT tool | Free (no workflow, no records) |

### 3.6 Devpost saturation counts (Sep 25, 2026) [V]

mental health 13,515; sign language 6,434; food waste 4,925; carbon footprint 3,940; AI tutor 3,921; fact check 3,847; recycling 3,731; flashcards 2,740; financial literacy 2,727; misinformation 2,662; mental health chatbot 2,102; loneliness 1,783; screen reader 1,766; food bank 1,181; scam detection 1,136; study buddy 1,085; financial aid 1,061; food insecurity 974; study planner 816; medication reminder 775; voter 736; civic engagement 600; city council 320; elderly scam 224; FAFSA 67; IEP 61; heat illness 59; 504 plan 32; **WBGT 16**; chronic absenteeism 9; heat stroke athletes 5.

### 3.7 WarriorHacks 1.0: all 46 submissions (condensed) [V]

| # | Project | Award | Team | Video | Live link | Recycled (other hackathons) |
|---|---|---|---|---|---|---|
| 1 | AutoNote | 1st, Top Warrior | 1 | Yes | Beta build | No |
| 2 | Chorus | 2nd, Top Warrior | 2 | Yes | No | No |
| 3 | Pathways | 3rd | 4 | Yes | Vercel | No |
| 4 | FocusAI | Best AI/ML | 1 | Yes | Repo | No |
| 5 | NeuroAdapt Learning | Best AI/ML | 1 | Yes | Vercel | No |
| 6 | Skill Up | Top Warrior | 1 | Yes | Repo | No |
| 7 | EduShare | Top Warrior | 2 | No | Vercel | No |
| 8 | Navigate | Top Warrior | 1 | Yes | Figma Site | No |
| 9 | VisualLearn | Top Warrior | 1 | No | Repo | No (1 other) |
| 10 | Turbo | Top Warrior | 1 | Yes | Streamlit | No |
| 11 | DevNinja | HM | 1 | Yes | GitHub Pages | No |
| 13 | Code Colosseum | HM | 3 | Yes | Base44 | No |
| 14 | OpenCurricula | HM | 2 | Yes | Repo | No |
| 15 | Peer-to-Peer Tutoring | HM | 2 | No | Bubble | No |
| 17 | OmniNet | HM | 2 | Yes | Site | No |
| 18 | Bridg-ED | HM | 1 | Yes | Netlify | No |
| 20 | Online ACSL Club | HM | 1 | No | Site | No |
| 22 | CogniPath | HM | 1 | No | Vercel | No |
| 25 | ChatNinja 1.0 | HM | 1 | Other | Chatling | No |
| 27 | StudyBuddy AI | HM | 1 | Drive | No | No |
| 36 | Echolocate | HM | 1 | Yes | Netlify | No |
| 37 | JVA Math AI | HM | 1 | Yes | Streamlit | No |
| 12, 16, 19, 21, 23, 24, 28, 34, 35, 38, 41, 43, 45 | Thin or unfinished on-theme entries (periodic table quiz, Reddit for Teachers, Inspect, Study Planner, The Edu Tab, CineLearn, EduVerse and its duplicate, EduBridge, Test, Living Footprints, Business Learning Website, VVent) | None | 1 to 2 | Mixed | Mixed | No |
| 26, 29 to 33, 39, 40, 42, 44, 46 | YouMatter-AI (1), Neo Space Shooter (22), CardioAlert (53), BHOOMI (66), Safesteps (63), S.A.I (98), Medaid (1), TrueSight (3), Quantum CNN Weather (6), Fashion Visual Search (1), Smart Hearing Aid DSP (53) | **None placed** | 1 to 2 | Mostly yes | Repos | **Yes** |

### 3.8 Cross-hackathon winner sample [V data, I classification]

17 events (WarriorHacks 2025, Alameda Hacks, Bay2BayHacks 2025, BISV Hacks 2026, DVHacks 2025, FraserHacks 2024, HackJPS 2024, MEGA 2025, MEGA 2026, OneHacks V, PeddieHacks 2026, PeerBridge 2025, STEMINATE 2026, Vivid Hacks 1.5, HackAmerica 2026, NGN Hacks 2026, hackTAMS 2026), 124 winner-flagged projects:
- AI-powered: 90 of 124 (73%); top 3: 38 of 49 (78%).
- Solo: 56 of 124; top 3: 22 of 49.
- Non-GitHub live link: about 53% of all winners, about 57% of top 3.
- Top-3 categories: health about 13, education about 11, climate about 9, civic, legal or disaster safety about 8, accessibility-primary about 6, mental health about 4, dev tools about 3.

---

## 4. TypeSafe Jev Scripts

### 4.1 Why Jev for research scoring

Jev returns typed answers with calibrated probabilities, so we could ask the same atomic questions of every candidate and compare numbers instead of prose. We used it as an **independent sanity check** on our own analyst scores, not as ground truth.

### 4.2 Candidate scoring script (as run on 2026-09-25)

```python
# research-only script (not product code). Requires TYPESAFE_API_KEY in the environment.
import json, os, urllib.request, concurrent.futures as cf

KEY = os.environ["TYPESAFE_API_KEY"]
CTX = ("Event: WarriorHacks 2.0, an online student hackathon run by a high school CS club in Austin, Texas. "
       "Participants are high school and undergraduate students; judges are students. Build window is 2 weeks "
       "(Sep 28 to Oct 12, 2026). Judging criteria: Impact (meaningful problem, clear audience and value), "
       "Feasibility (technically achievable and sustainable), User Experience (accessible, intuitive), Technical "
       "Craft (architecture, code quality, originality, innovation). The team is a strong full-stack team building "
       "a Next.js web app with AI. The theme is not yet known.")

CANDIDATES = {  # one paragraph each; full text in problem.md section 4
  "heat_go_no_go": "Heat and wildfire-smoke go/no-go app for youth sports, marching band and outdoor PE ...",
  "aid_offer_decoder": "Financial aid offer decoder for first-generation college applicants ...",
  "benefits_navigator": "Benefits navigator for students and families ...",
  "civic_decoder": "Local government and school board decoder for teens ...",
  "teen_work_rights": "First-job rights checker for teen workers ...",
  "iep_navigator": "IEP/504 plain-language navigator for families ...",
  "mental_health_chatbot": "AI mental health chatbot companion for stressed high school students ...",
  "sleep_planner": "Teen sleep-aware homework planner ...",
}

Q = {
  "impact": {"type": "score", "instructions": "How meaningful is the problem in `candidate` and how clear is its audience and value, as a student judge would see it?",
             "criteria": ["Trivial or vague", "Minor problem, unclear audience", "Real problem, somewhat clear audience", "Important problem, clear audience and value", "Urgent, well-evidenced problem with a vivid audience"]},
  "feasibility": {"type": "score", "instructions": "How achievable is a polished, working version of `candidate` in 2 weeks for a strong team, using free data and APIs?",
                  "criteria": ["Not achievable", "Only a mockup is achievable", "A rough prototype is achievable", "A solid working MVP is achievable", "A polished, reliable product is clearly achievable"]},
  "ux_potential": {"type": "score", "instructions": "How strong a user experience and demo moment can `candidate` deliver (clear, intuitive, visual, accessible)?",
                   "criteria": ["Confusing", "Plain", "Decent", "Clear and satisfying", "Instantly understandable wow moment"]},
  "craft_potential": {"type": "score", "instructions": "How much room does `candidate` give to show technical craft: real architecture, non-trivial algorithms, well-integrated AI and originality?",
                      "criteria": ["None", "Little", "Some", "A lot", "Exceptional"]},
  "originality": {"type": "score", "instructions": "How original would `candidate` feel to student hackathon judges who have seen many projects?",
                  "criteria": ["Seen it many times", "Common", "Somewhat fresh", "Fresh", "Never seen before"]},
  "relatable_to_judges": {"type": "noul", "instructions": "Would high school student judges in Austin, Texas personally relate to the problem in `candidate`?"},
  "ai_is_essential": {"type": "noul", "instructions": "Does AI do real, essential work in `candidate` rather than being a gimmick?"},
  "high_harm_risk": {"type": "noul", "instructions": "Could a wrong output from `candidate` plausibly cause serious harm to a user?"},
}
WEIGHTS = {"impact": .25, "feasibility": .20, "ux_potential": .15, "craft_potential": .20, "originality": .20}

def run(key):
    body = json.dumps({"model": "jev-latest", "state": {"context": CTX, "candidate": CANDIDATES[key]}, "questions": Q}).encode()
    req = urllib.request.Request("https://api.typesafe.ai/v1/systemone", body,
                                 {"Authorization": "Bearer " + KEY, "Content-Type": "application/json"})
    return key, json.load(urllib.request.urlopen(req, timeout=60))

with cf.ThreadPoolExecutor(8) as ex:
    results = dict(ex.map(run, CANDIDATES))

for key, res in results.items():
    a = res["answers"]
    composite = sum(WEIGHTS[q] * (a[q]["score"] / 4 * 5) for q in WEIGHTS)   # Score index 0..4 rescaled to 0..5
    print(key, round(composite, 2))
```

### 4.3 Raw results [V]

Model reported: `jev-1.13.0` for every request. Usage: about 930 to 1,020 input tokens and 144 output tokens per candidate (eight questions in one request).

| Candidate | Composite | impact | feasibility | ux | craft | originality | relatable (p) | AI essential (p) | harm risk (p) |
|---|---|---|---|---|---|---|---|---|---|
| aid_offer_decoder | 4.07 | 3.89 (conf 0.91) | 2.95 (0.85) | 3.58 (0.65) | 2.95 (0.90) | 2.84 (0.77) | 0.44 | 0.84 | 0.81 |
| heat_go_no_go | 3.87 | 3.50 (0.58) | 2.97 (0.86) | 2.97 (0.87) | 2.97 (0.92) | 2.94 (0.89) | 0.74 | 0.66 | 0.87 |
| teen_work_rights | 3.73 | 3.73 (0.77) | 2.81 (0.76) | 3.19 (0.78) | 2.48 (0.57) | 2.56 (0.61) | 0.60 | 0.71 | 0.81 |
| benefits_navigator | 3.64 | 3.64 (0.70) | 1.99 (0.65) | 3.09 (0.75) | 3.01 (0.91) | 2.69 (0.70) | 0.56 | 0.78 | 0.86 |
| civic_decoder | 3.58 | 3.07 (0.86) | 2.76 (0.77) | 2.82 (0.79) | 2.94 (0.92) | 2.68 (0.71) | 0.69 | 0.72 | 0.54 |
| sleep_planner | 3.28 | 3.21 (0.80) | 3.04 (0.82) | 3.05 (0.87) | 2.15 (0.74) | 1.64 (0.60) | 0.89 | 0.56 | 0.39 |
| iep_navigator | 3.21 | 2.99 (0.93) | 2.60 (0.64) | 2.97 (0.86) | 2.28 (0.66) | 2.01 (0.73) | 0.30 | 0.71 | 0.76 |
| mental_health_chatbot | 2.43 | 2.80 (0.82) | 2.95 (0.87) | 2.57 (0.59) | 1.34 (0.69) | 0.02 (0.98) | 0.84 | 0.55 | 0.84 |

Interpretation is in [problem.md](./problem.md) section 5.2.

### 4.4 Theme-fit script for Sep 27 (run within 2 hours of the reveal)

```python
# research-only script. Paste the exact theme text into THEME and run.
import json, os, urllib.request

KEY = os.environ["TYPESAFE_API_KEY"]
THEME = "Create a project that solves an issue in your community, county, state, or nation."
CANDIDATES = {
  "flagline_heat_safety": "Free web app that runs heat (WBGT) and wildfire-smoke safety for school outdoor athletics and marching band: plans safe practice windows, runs 30-minute rechecks, routes athlete symptom check-ins to trainers, guides the heat stroke emergency protocol and keeps the compliance log required by Texas UIL since Aug 2026.",
  "aid_offer_decoder": "Web app that decodes college financial aid offer letters for first-generation students: labels every line as grant, loan type or work-study, finds missing costs, computes true net price and 4-year debt, and compares offers side by side.",
  "civic_decoder": "Web app that turns city council and school board agendas and meetings into neutral, cited summaries of what affects students, with ways to comment.",
  "benefits_navigator": "Web app that helps students and families find and keep benefits (SNAP including college student rules, WIC, school meals, Medicaid renewals) and reads confusing agency notices.",
  "teen_work_rights": "Web app that checks a teen worker's schedule or paystub against federal and state child labor and wage rules and explains rights in plain language.",
}
Q = {
  "fit": {"type": "score", "instructions": "How directly does `candidate` answer the hackathon theme in `theme`?",
          "criteria": ["Off-theme", "A stretch that needs heavy explanation", "Fits with one framing sentence", "Clearly on-theme", "A textbook answer to the theme"]},
  "obvious": {"type": "noul", "instructions": "Would a judge consider `candidate` on-theme for `theme` without any explanation?"},
}
for key, text in CANDIDATES.items():
    body = json.dumps({"model": "jev-latest", "state": {"theme": THEME, "candidate": text}, "questions": Q}).encode()
    req = urllib.request.Request("https://api.typesafe.ai/v1/systemone", body, {"Authorization": "Bearer " + KEY, "Content-Type": "application/json"})
    a = json.load(urllib.request.urlopen(req, timeout=60))["answers"]
    print(f"{key:24s} fit={a['fit']['score']:.2f} (conf {a['fit']['confidence']:.2f})  obvious={a['obvious']['noul']:.2f}")
```

Result on Sep 28, 2026 (`jev-1.13.0`): flagline_heat_safety fit 3.77 (conf 0.81), obvious 0.91; benefits_navigator 3.75 / 0.90; teen_work_rights 3.59 / 0.88; aid_offer_decoder 3.43 / 0.88; civic_decoder 3.43 / 0.89. Decision: build Flagline.

Decision rule (from [problem.md](./problem.md) section 7.2): build Flagline if its fit is at least 3 (on the 0 to 4 index) or `obvious` is at least 0.6; if fit is about 2, build Flagline with a bridge sentence; otherwise pivot to the best-fitting backup.

---

## 5. shadcn/ui Verification Notes

- Fetched every page in `https://ui.shadcn.com/llms.txt` as `.md`, all 2025 to 2026 changelog entries and registry JSON (`/r/styles/base-nova/registry.json`, `/r/colors/<name>.json`).
- Generated a real project with `pnpm dlx shadcn@latest init -t next -n demo -d -y`, then `add --all`; `tsc --noEmit` and `next build` passed. Versions installed: shadcn CLI 4.21.0, Next 16.3.4, React 19.2.8, Tailwind 4.3.3, `@base-ui/react` 1.8, `lucide-react` 1.48, `next-themes` 0.4.6, `recharts` 3.8.0, `react-hook-form` 7.88, `zod` 4.6.5, `@tanstack/react-table` 9.2.4.
- Key 2026 facts: Base UI is the default primitive library since 2026-07-02; styles are `{base}-{style}` (default `base-nova`; others vega, maia, lyra, mira, luma, rhea, sera); presets are codes (`b2fA` = nova, neutral, lucide, Geist); `cn` now comes from the `cn` package; `Field` replaces the old `Form`; Base UI projects use `toast` (Sonner for Radix and React Aria); 64 registry components; blocks `dashboard-01`, `sidebar-01` to `-16`, `login-01` to `-05`, `signup-01` to `-05`; chart blocks live only in the legacy `new-york-v4` registry and install by URL.
- Inconsistencies found: `/docs/v0` returns 404; Sidebar theming docs still show HSL variables; forms and dark-mode examples are Radix-flavored (Base UI versions were adapted and type-checked); theming docs show colorful chart defaults while nova generates grayscale charts.
- Default neutral tokens (`:root` and `.dark`) are reproduced in [build.md](./build.md) section 5.2; Flagline's zone tokens are in [build.md](./build.md) section 5.3 and their contrast checks in section 5.1 below.

### 5.1 Zone token contrast check [V, computed]

OKLCH converted to sRGB and WCAG relative luminance computed for each zone background and foreground:

| Mode | Green | Yellow | Orange | Red | Black |
|---|---|---|---|---|---|
| Light: text on zone | 5.41 | 9.60 | 6.71 | 5.85 | 16.97 |
| Light: zone vs white page | 5.65 | 1.53 (add ring) | 2.61 (add ring) | 6.11 | 17.72 |
| Dark: text on zone | 8.05 | 10.85 | 8.14 | 5.72 | 19.72 |
| Dark: zone vs dark page | 8.54 | 13.34 | 8.81 | 5.79 | 1.04 (add ring) |

All text contrasts exceed 4.5:1. Where the zone fill is close to the page background, `ZoneBadge` adds a `ring-1 ring-zone-edge` so the component boundary is visible (WCAG 1.4.11), and meaning is always carried by text and icon too.

---

## 6. TypeSafe Jev Notes (From The Live Docs)

- Endpoint `POST https://api.typesafe.ai/v1/systemone`, `Authorization: Bearer <key>`; body `{ state, model, questions }`; answers keyed by question id.
- Question types: **Noul** (yes/no probability), **Choice** (one of up to 255 options, with probabilities and confidence), **Score** (ordered rubric, 2 to 10 levels, expected score, probabilities, confidence).
- `jev-latest` and `jev-preview` both point to `jev-1.13.0` (Sep 2026). Price $0.042 per million input tokens (output free). Rate limits 250,000 tokens per second and 1,200 requests per minute (adjusting dynamically). Context 64k tokens per request; 32k for state plus the longest question. Text only.
- Most queries complete in about 100 ms; questions run in parallel and independently; outputs are calibrated and self-consistent.
- Design guidance applied: keep deterministic work in code; send only relevant state; use structured state with backticked paths in questions; ask atomic questions; gate on confidence; use speculative fan-out in one request.
- JavaScript SDK: `@typesafe-ai/sdk` (Node 20+), `new TypeSafeClient()` reads `TYPESAFE_API_KEY`; helpers `choice(instructions, criteria)`, `noul(instructions?, criteria?)`, `score(instructions, criteria[])`; `client.systemOne({ state, questions, model? })`; SDK retries 429 and 529 with backoff.

---

## 7. Unknowns And Limits

- The WarriorHacks 2.0 theme (revealed Sep 27).
- Whether Top Warrior is Westwood-only in 2026; whether prizes are per team or per member; whether there is a live demo round.
- Current NWS WBGT bias after algorithm revisions (the 2020 cool-bias study may predate fixes).
- There is no official UIL county list for Class 2 vs Class 3; our Class 2 polygon is a hand-digitized suggestion that always requires school confirmation.
- AirNow rate limits are documented only by third parties (about 500 requests per hour per service).
- Some Instagram content and a paywalled Hill Country News article could not be read.
- Scratchpad raw captures (HTML, JSON, images, scripts) from this research session are not committed to the repository; the facts they support are reproduced in these docs with source URLs.

---

## 8. Source Index

### 8.1 Challenge and organizer
- WarriorHacks 2.0 Devpost: https://warriorhacks-2-0.devpost.com/ ; rules `/rules` ; schedule `/details/dates` ; updates `/updates` ; discussions `/forum_topics` ; gallery `/project-gallery` ; participants `/participants`
- Devpost API listing: https://devpost.com/api/hackathons?search=warriorhacks
- Code of Conduct 2.0: https://docs.google.com/document/d/1g-o21ab84v7vmqpqpRk_RLHb8hrAFNw52n1-SQg9Eds/edit
- Organizer site: https://warriorhacks.vercel.app (script `js/countdown.js`)
- Club Discord: https://discord.gg/zNtaTNm58 (expires Oct 5, 2026) ; Instagram: https://www.instagram.com/westwoodcompsciclub/ ; club site: https://sites.google.com/view/wwhs-computer-science-club/
- Spike win: https://westwoodhorizon.com/2025/12/computer-science-club-earns-1000-in-spike-competition-win/ ; https://www.hillcountrynews.com/stories/westwood-computer-science-club-wins-national-tech-competition,228349
- Club profile: https://westwoodhorizon.com/2024/12/computer-science-club-networks-with-community/
- ReverieHacks: https://westwoodhorizon.com/2025/09/from-171-to-401-student-led-hackathon-reaches-global-heights/ ; https://reverie-hacks-2026.devpost.com/

### 8.2 WarriorHacks 1.0
- Overview: https://warriorhacks.devpost.com/ ; rules https://warriorhacks.devpost.com/rules ; schedule https://warriorhacks.devpost.com/details/dates ; gallery https://warriorhacks.devpost.com/project-gallery
- Winners update: https://warriorhacks.devpost.com/updates/38378-warriorhacks-2025-winners
- Opening slides update: https://warriorhacks.devpost.com/updates/38591-opening-ceremony-slides-important-links
- Checkpoints: https://warriorhacks.devpost.com/updates/38607-project-checkpoints-and-feedback ; final day: https://warriorhacks.devpost.com/updates/38618-final-day
- Winners deck: https://docs.google.com/presentation/d/1VzUFoMZrKSQr-_wltryZxirh9c_Jy5kZKU1-oB-7sFQ/edit
- 1.0 Code of Conduct: https://docs.google.com/document/d/14sSidg34ubfLZF4dx0tubHezrvlGaMF8BtozqqP-EOI/edit
- 1.0 site: https://warriorhacks.dev/
- Winning projects: https://devpost.com/software/autonotes-lg1dxp ; https://devpost.com/software/chorus-at52qw ; https://devpost.com/software/pathways-7xnhg8 ; https://devpost.com/software/focusai-7jzqre ; https://devpost.com/software/neuronadapt-leraning ; https://devpost.com/software/na-af9stx ; https://devpost.com/software/edushare-h14qbn ; https://devpost.com/software/navigate-s5y9f7 ; https://devpost.com/software/visuallearn ; https://devpost.com/software/turbo-zvaicx
- Unrelated same-name events: https://warriorhacks-2025.devpost.com/ ; https://homage-to-coolmath-games.devpost.com/ ; https://warrior-hacks.devpost.com/

### 8.3 Winning patterns, judging and Devpost mechanics
- Devpost help: https://help.devpost.com/article/119-registering-for-a-hackathon ; /75-participants-page-forming-a-team ; /121-teams-adding-teammates ; /122-how-to-enter-a-submission ; /126-know-your-submission-steps ; /123-how-to-edit-a-submission ; /193-markdown-tips ; /85-uploading-a-demo-video ; /84-video-making-best-practices ; /103-how-to-judge-an-online-hackathon ; /131-setting-up-judging ; /64-judging-public-voting ; /104-announcing-winners
- Devpost blog: https://info.devpost.com/blog/hackathon-judging-tips ; https://info.devpost.com/blog/6-tips-for-making-a-hackathon-demo-video ; https://info.devpost.com/blog/understanding-hackathon-submission-and-judging-criteria ; https://info.devpost.com/blog/how-to-present-a-successful-hackathon-demo
- Judge notes: https://blog.jetbrains.com/ai/2026/06/how-to-win-a-hackathon-notes-from-the-judging-table/ ; https://dev.to/kurbaitaev/what-judges-actually-score-notes-from-a-year-of-hackathon-judging-3p4l ; https://guide.mlh.io/general-information/judging-and-submissions/judging-plan
- Winner galleries (all `/project-gallery`): alameda-hacks, bay-2-bay-hacks, bisv-hacks-2026, dvhacks2025, fraserhacks24, hackjps-2024, mega-hackathon-2025, mega-hackathon-2026-students, onehacks-v, peddiehacks-2026, peerbridge-mental-health-hacks, steminate-hacks-2026, vividhacks-1-5, hackamerica, ngn-hacks-2026, hacktams-2026, warriorhacks (all `.devpost.com`)
- Regional themes: https://katy-youth-hacks-2026.devpost.com/ ; https://tripleh.devpost.com/ ; https://cosmohacks.devpost.com/ ; https://hackphs2026.devpost.com/ ; https://hook-em-hacks.devpost.com/

### 8.4 Sponsors
- CodeCrafters: https://codecrafters.io/ ; https://codecrafters.io/pricing ; https://docs.codecrafters.io/membership/content
- InterviewBuddy: https://interviewbuddy.net/
- Art of Problem Solving: https://artofproblemsolving.com/
- CleanShot X: https://cleanshot.com/features ; https://cleanshot.com/pricing ; https://setapp.com/apps/cleanshot
- DevSwarm: https://devswarm.ai/ ; https://devswarm.ai/pricing ; https://devswarm.ai/blog/devswarm-2-0-a-full-ide-for-parallel-ai-coding/
- .xyz: https://gen.xyz/
- Balsamiq: https://balsamiq.com/pricing/ ; https://balsamiq.com/givingback/sponsorships/

### 8.5 Problem landscape (candidates other than heat)
- Aid offers: https://www.gao.gov/products/gao-23-104708 ; https://www.uaspire.org/news-events/study-college-financial-aid-award-letters-lack-clarity,-transparency ; https://www.nasfaa.org/news-item/36182/NCAN_Unclaimed_Pell_Grants_Totaled_4_4_Billion_for_the_High_School_Class_of_2024 ; https://www.ncan.org/Web/Web/News/Class-of-2026-Sets-All-Time-High-FAFSA-Completion-Record.aspx ; https://www.schoolcounselor.org/about-school-counseling/school-counselor-roles-ratios ; https://collegescorecard.ed.gov/data/api-documentation/
- Benefits: https://www.ers.usda.gov/publications/pub-details?pubid=109895 ; https://www.gao.gov/products/gao-24-107074 ; https://www.cbpp.org/research/food-assistance/snap-tracker-people-are-losing-food-assistance-as-the-harmful-2025 ; https://www.kff.org/medicaid/medicaid-enrollment-and-unwinding-tracker/ ; https://www.policyengine.org/us
- Civic: https://knightfoundation.org/articles/portland-state-study-seniors-much-more-likely-cast-ballots-young-votes/ ; https://circle.tufts.edu/latest-research/barriers-and-hardships-why-some-youth-didnt-vote-2024 ; https://citymeetings.nyc/about/ ; https://austintexas.legistar.com/
- Teen work: https://www.bls.gov/news.release/archives/youth_08212025.htm ; https://usafacts.org/articles/is-child-labor-increasing-in-us/ ; https://webapps.dol.gov/elaws/whd/flsa/cl/t14.asp
- Absenteeism: https://www.aei.org/education/the-latest-chronic-absenteeism-numbers/ ; https://www.attendanceworks.org/what-do-families-think-about-attendance/
- IEP: https://nces.ed.gov/programs/coe/indicator/cgg/students-with-disabilities/ ; https://github.com/The-Burnes-Center/a-iep
- Accessibility: https://webaim.org/projects/million/ ; https://upcea.edu/doj-extends-accessibility-deadline-to-april-2027-policy-matters-april-2026/ ; https://www.ftc.gov/news-events/news/press-releases/2025/01/ftc-order-requires-online-marketer-pay-1-million-deceptive-claims-its-ai-product-could-make-websites
- Elder scams: https://www.ic3.gov/AnnualReport/Reports/2024_IC3Report.pdf
- Sleep, belonging, misinformation, literacy, mental health: https://www.cdc.gov/yrbs/youth-health-in-focus/sleep.html ; https://www.commonsensemedia.org/research/research-brief-teens-trust-and-technology-in-the-age-of-ai ; https://www.oecd.org/en/publications/pisa-2022-results-volume-iv-factsheets_34d60137-en/united-states_baf87dc7-en.html ; https://www.cdc.gov/yrbs/results/2023-yrbs-results.html ; https://www.apa.org/topics/artificial-intelligence-machine-learning/health-advisory-ai-adolescent-well-being
- Food: https://refed.org/food-waste/refed-us-food-waste-report-2026/

### 8.6 Heat, smoke and lightning domain
- UIL: https://www.uiltexas.org/health/info/heat-stress-and-athletic-participation ; chart https://www.uiltexas.org/files/athletics/25-26WBGTChart.png ; map https://www.uiltexas.org/files/health/WBGTMap.jpg ; FAQs https://www.uiltexas.org/health/info/heat-stress-and-athletic-participation-faqs ; resources https://www.uiltexas.org/health/info/heat-stress-information-and-resources ; football regulations https://www.uiltexas.org/files/athletics/Fall_Football_Practice_Regulations.pdf ; lightning https://www.uiltexas.org/health/info/lightning-safety ; NFHS linemen 2026 https://www.uiltexas.org/files/athletics/Preventing_EHS_in_High_School_Football_Linemen_-_NFHS_SMAC_EHS_Task_Force_-_FINAL_-_6-13-26.pdf
- UNC WBGT tool: https://convergence.unc.edu/tools/wbgt/ ; https://wbgt.oasis.unc.edu/wbgt_v6/index_v2.php ; Clark and Konrad 2020 https://cisa.sc.edu/Pubs_Presentations_Posters/Reports/2020_Clark%20and%20Konrad_WBGT%20Assessment.pdf
- NWS API: https://api.weather.gov/points/30.2672,-97.7431 ; https://api.weather.gov/gridpoints/EWX/156,91 ; NDFD WBGT algorithm https://vlab.noaa.gov/documents/6609493/0/NDFD+WBGT+Description+Document.pdf/158bd409-4433-4dc0-295a-6deba5c6754d?t=1704311112004
- Open-Meteo: https://open-meteo.com/en/docs ; https://open-meteo.com/en/terms ; https://open-meteo.com/en/pricing ; air quality https://air-quality-api.open-meteo.com/v1/air-quality
- WBGT methods: Liljegren et al. 2008 doi:10.1080/15459620802310770 ; thermofeel https://github.com/ecmwf/thermofeel ; pywbgt https://github.com/kwodzicki/pywbgt ; PyWBGT https://github.com/QINQINKONG/PyWBGT ; Kong and Huber 2022 https://agupubs.onlinelibrary.wiley.com/doi/full/10.1029/2021EF002334 ; Kong and Huber 2024 https://agupubs.onlinelibrary.wiley.com/doi/full/10.1029/2024GH001068
- Accuracy: Grundstein et al. 2025 https://agupubs.onlinelibrary.wiley.com/doi/10.1029/2025GH001347 ; Ahn et al. 2022 https://pmc.ncbi.nlm.nih.gov/articles/PMC8975719/ ; Grundstein et al. 2015 https://www.sciencedirect.com/science/article/abs/pii/S0143622814002513
- KSI: https://koreystringer.institute.uconn.edu/wet-bulb-globe-temperature-monitoring/ ; https://koreystringer.institute.uconn.edu/state-high-school-sports-safety-policies/ ; https://koreystringer.institute.uconn.edu/hsssp-texas/
- NATA: acclimatization https://www.nata.org/sites/default/files/2025-08/preseason_heat-acclimatization_guidelines_for_secondary_school_athletics.pdf ; exertional heat illness https://www.nata.org/sites/default/files/2025-08/exertional_heat_illnesses.pdf ; lightning https://www.nata.org/sites/default/files/2025-08/lightning_safety_for_athletics_and_recreation.pdf
- NFHS lightning 2024: https://assets.nfhs.org/umbraco/media/7213621/nfhs-smac-guidelines-on-handling-practices-and-contests-during-lightning-or-thunder-disturbances-final-10-30-24.pdf
- Statistics: CDC MMWR 2010 https://www.cdc.gov/mmwr/preview/mmwrhtml/mm5932a1.htm ; Stearns et al. 2025 https://journals.sagepub.com/doi/10.1177/19417381241298293 ; NFHS participation https://nfhs.org/stories/participation-in-high-school-sports-hits-record-high-with-sizable-increase-in-2024-25 ; Aspen Project Play https://projectplay.org/news/project-play-survey-youth-lose-one-week-of-sports-a-year-due-to-climate-change ; CDC HeatRisk https://www.cdc.gov/media/releases/2024/p0422-heat-protection.html
- AQI: EPA schools guide https://document.airnow.gov/air-quality-and-outdoor-guidance-for-schools.pdf ; AirNow API https://docs.airnowapi.org/ ; Washington DOH https://doh.wa.gov/sites/default/files/legacy/Documents/Pubs//334-332.pdf ; Oregon OHA https://www.oregon.gov/oha/erd/pages/oha-updates-guidance-for-youth-outdoor-activities-during-wildfire-smoke-air-pollution-events-06.08.2026.aspx ; NFHS smoke https://nfhs.org/stories/wildfires-and-air-quality-creating-clear-policies
- News: Houston Public Media https://www.houstonpublicmedia.org/articles/education/2026/08/03/558445/high-school-football-houston-texas-uil-heat-safety-rule/ ; TexasHSFootball https://www.texasfootball.com/article/2026/07/20/wet-bulb-txhsfb ; CBS Austin https://cbsaustin.com/news/local/new-uil-heat-rules-take-effect-for-outdoor-athletics-marching-band-activities ; KBTX https://www.kbtx.com/2026/08/04/new-heat-safety-guidelines-outdoor-activities-effect-august-1/ ; KPRC https://www.click2houston.com/news/local/2026/08/03/new-uil-heat-rules-are-now-in-effect-heres-what-they-mean-for-texas-football-players-and-marching-bands/ ; FOX 4 https://www.fox4news.com/news/lancaster-football-player-dies-preston-malone ; FOX 7 https://www.fox7austin.com/news/bowie-high-school-football-player-heat-stroke-austin-texas ; KCRG https://www.kcrg.com/2026/09/08/iowa-band-member-collapsed-heat-hawkeyes-football-game-taken-off-life-support/
- Competitors: https://perryweather.com/pricing/ ; https://apps.apple.com/us/app/zelus-wbgt/id1605250081 ; https://kestrelinstruments.com/kestrel-5400-heat-stress-tracker ; https://apps.apple.com/us/app/texas-wbgt/id6791031647 ; https://apps.apple.com/us/app/heatsafe-wbgt/id6781332510 ; https://apps.apple.com/us/app/klimo-wbgt/id6745461795 ; https://github.com/s-k-28/heatsense
- Legal context: Texas Education Code 22.0511 https://texas.public.law/statutes/tex._educ._code_section_22.0511 ; HB 206 (2023) https://capitol.texas.gov/tlodocs/883/billtext/html/HB00206I.htm

### 8.7 UI and AI platforms
- shadcn/ui: https://ui.shadcn.com/ ; https://ui.shadcn.com/llms.txt ; schema https://ui.shadcn.com/schema.json ; registry https://ui.shadcn.com/r/styles/base-nova/registry.json
- TypeSafe: https://docs.typesafe.ai/llms.txt ; https://docs.typesafe.ai/api.md ; https://docs.typesafe.ai/primitives.md ; https://docs.typesafe.ai/confidence.md ; https://docs.typesafe.ai/models.md ; https://docs.typesafe.ai/sdk/javascript.md ; https://docs.typesafe.ai/concepts/how-to-build-with-system-one.md
- Vercel Workflow SDK: https://workflow-sdk.dev ; https://vercel.com/docs/workflow
