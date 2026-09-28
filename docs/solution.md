# Solution: Flagline

> **Flagline: heat and smoke safety for every outdoor practice. It tells coaches what today's practice is allowed to look like, runs the recheck routine for them and keeps the record.**
>
> This document describes the complete solution end to end: who it is for, what it does, how it works, why each decision was made, when it is used, how it stays safe, how it survives after the hackathon and how we will present it. The build specification (stack, pages, components, APIs, data model, tests, schedule) is in [build.md](./build.md). The problem and the evidence are in [problem.md](./problem.md). The challenge is in [info.md](./info.md).
>
> Status: **building** (from Sep 28, 2026). Theme: "Create a project that solves an issue in your community, county, state, or nation." Flagline was confirmed by the theme-fit protocol ([problem.md](./problem.md) section 7.4).
>
> **Theme bridge:** "Texas made heat safety mandatory for every outdoor practice this season. Flagline helps every school in our community, county and state follow it, free, so no student athlete dies of a preventable heat stroke."

---

## Table Of Contents

1. [The Solution In 60 Seconds](#1-the-solution-in-60-seconds)
2. [Audience](#2-audience)
3. [Value Proposition And Positioning](#3-value-proposition-and-positioning)
4. [Product Principles](#4-product-principles)
5. [Domain Model: The Rules We Implement](#5-domain-model-the-rules-we-implement)
6. [Features](#6-features)
7. [End-To-End Journeys](#7-end-to-end-journeys)
8. [How It Works: System Design](#8-how-it-works-system-design)
9. [The WBGT Engine](#9-the-wbgt-engine)
10. [The Rules Engine](#10-the-rules-engine)
11. [The AI Layer](#11-the-ai-layer)
12. [Safety Case](#12-safety-case)
13. [Privacy, Ethics And Accessibility](#13-privacy-ethics-and-accessibility)
14. [When: Usage Calendar And Moments](#14-when-usage-calendar-and-moments)
15. [Feasibility And Sustainability](#15-feasibility-and-sustainability)
16. [Impact And Measurement](#16-impact-and-measurement)
17. [Theme Bridges](#17-theme-bridges)
18. [How We Present It: Demo, Video, Devpost Story](#18-how-we-present-it)
19. [Judging Criteria Map](#19-judging-criteria-map)
20. [Risks, Assumptions, Open Questions](#20-risks-assumptions-open-questions)

---

## 1. The Solution In 60 Seconds

**Name:** Flagline (heat flags on the sideline).

**Tagline (Devpost, under 200 characters):** "Free heat and smoke safety for every outdoor practice. Flagline tells coaches what today's practice can look like, runs the 30-minute rechecks and keeps the UIL log."

**What it is:** a mobile-first web app (installable, works one-handed on a sideline) for Texas high school coaches, band directors, athletic trainers and PE teachers, and for their athletes and parents.

**What it does, in five verbs:**
1. **Plan:** shows the WBGT flag (green, yellow, orange, red, black) for each field, hour by hour for the next 7 days, and finds the safest window for a planned practice. Coaches can ask in plain words: "Can varsity go full pads 4 to 6 tomorrow?"
2. **Prepare:** before practice, tells you exactly what the rules require at the expected level (max length, breaks, football gear, cooling tub on site) as a checklist.
3. **Run:** "Start Practice" opens Practice Mode: the pre-practice reading, a big 30-minute recheck countdown, a break timer, time used against the level's maximum, and instant rule changes when the level rises. Logging an on-site reading takes 5 seconds (keypad or a photo of the meter).
4. **Protect:** athletes scan a QR code to check in privately ("I feel dizzy") in English or Spanish; red flags go straight to the trainer. One tap opens the Emergency protocol for exertional heat stroke: cool first, transport second, with a cooling timer. Smoke (AQI) and lightning are part of the same decision.
5. **Prove:** every reading, level change, modification, break, check-in and emergency action is recorded automatically into a signed, printable, bilingual practice log (PDF and CSV) for the athletic director.

**Why now:** UIL made WBGT monitoring mandatory for all outdoor athletics and marching band from Aug 1, 2026. This is the first season. Coaches are struggling (nearly 80% call it too restrictive), there is no trainer requirement, paid tools cost hundreds to thousands of dollars per site, the free forecast tool UIL recommends has no workflow and no records, and phone apps under-read WBGT when it matters most.

**Why it is credible:** the heat math is a real physics model (Liljegren 2008), cross-checked against the National Weather Service's own WBGT forecast; the rules are UIL's exact table with a conformance test suite; AI (TypeSafe Jev) handles only interpretation, with calibrated confidence and human confirmation; every number shows its source and whether it is a forecast or a measurement.

---

## 2. Audience

### 2.1 Primary users

| Persona | Context | Device and environment | Jobs to be done | What success feels like |
|---|---|---|---|---|
| **Head coach** (football, soccer, cross country, tennis, softball, baseball, track) | Teaches classes all day; practice 3:45 to 6:30 pm; 30 to 120 athletes; assistant coaches | Phone in hand or pocket, bright sun, sweat, noise, gloves or wet hands, spotty cell signal | Decide practice shape; stay compliant without thinking about it; not lose practice time unnecessarily; avoid a tragedy; show the AD it was done right | "I knew at lunch what practice would look like. The app buzzed me for every recheck. The log was done when I got to my car." |
| **Band director** | Marching rehearsal 4:00 to 7:00 pm on asphalt lots; 100 to 300 students; competition season Sep to Nov; often no trainer on site | Phone or tablet on a podium or tower | Plan rehearsal blocks around heat; run breaks for a huge group; meet the new UIL band requirement | "We moved block to 7 AM on the red day and still hit our run-throughs." |
| **Athletic trainer (AT)** | One AT for many teams and fields; the medical authority on site | Phone plus a laptop in the training room | See every field's status; get athlete red flags instantly; run the emergency protocol; keep cooling tubs ready | "I see all five fields on one screen and my phone buzzes the moment an athlete checks in with a red flag." |

### 2.2 Secondary users

| Persona | Jobs to be done |
|---|---|
| **Athletic director or campus coordinator** | Set the school's WBGT class for the year (locked); add fields and teams; review compliance across teams; export logs for the District Executive Committee |
| **PE teacher** | Quick check before taking a class outside |
| **Student athlete and band student** (13 to 18) | Know today's conditions and breaks; report symptoms privately and early; learn the warning signs |
| **Parent or guardian** | See whether practice is on, moved or modified, and why; trust the school's process |
| **Other states and organizations** (club, youth leagues, summer camps, colleges, outdoor workers in future) | Same workflow with their own rule set (AI-assisted policy import) |

### 2.3 Market size (for impact and feasibility)

- **Texas UIL:** every member high school and junior high with outdoor athletics or marching band falls under the mandate from Aug 1, 2026.
- **United States:** 8,266,244 high school sport participants in 2024-25 (NFHS record); Texas joins at least 17 other states that require WBGT to guide outdoor practices (Houston Public Media, Aug 2026).
- **Band:** no national standard; around 400 band members with exertional heat illness in news reports from 1990 to 2020.

### 2.4 Anti-personas (who we are not building for)

- Professional or college athletic departments with full sports medicine staffs and paid systems (they already have Perry Weather or on-site stations).
- Individual runners or outdoor workers (OSHA and NIOSH tools exist; a different rule set).
- Anyone expecting a medical diagnosis.

---

## 3. Value Proposition And Positioning

### 3.1 One sentence per persona

- **Coach:** "Know what practice can look like before you get to the field, and never miss a recheck."
- **Band director:** "The same safety routine the football staff has, built for a 200-person band on a parking lot."
- **Athletic trainer:** "Every field and every athlete red flag on one screen."
- **Athletic director:** "Compliance records for every outdoor practice, automatically."
- **Athlete:** "A private way to say you feel wrong, before it becomes an emergency."
- **Parent:** "See the conditions and the plan, not just a cancellation text."

### 3.2 Competitive positioning

| | Flagline | UNC WBGT forecast (UIL-recommended) | Zelus WBGT | Perry Weather | Kestrel 5400 meter | Texas WBGT app |
|---|---|---|---|---|---|---|
| Price | **Free** | Free | $49.99 to $299 per year (free tier ended Jun 2026) | About $3,500 per site per year | $549 to $629 | $0.99 |
| Hardware needed | No (meter optional) | No | No | Yes | It is the hardware | No |
| WBGT source | **Two independent forecasts + on-site readings** | Liljegren on NWS inputs, twice daily | Proprietary model (found ~1 C cool, 2 to 3 C cool when hot) | On-site sensor | Measured | Unknown |
| Texas UIL Class 2 and 3 rules, exact | **Yes, tested** | Plot bands yes; banner labels mismatch | Guidelines selectable | Yes | No | Claimed |
| Sport-specific outputs (football gear, conditioning ban, band) | **Yes** | No | Partial | Partial | No | Unknown |
| Practice workflow (pre-check, 30-minute rechecks, breaks, time in level) | **Yes** | No | Partial | Alerts | No | No |
| Compliance log (PDF/CSV, signed, audit trail) | **Yes, free** | No | Pro only | Plus tier | Via LiNK | Minimal |
| AQI (smoke, ozone) in the same decision | **Yes** | No | Top tier | Add-on | No | No |
| Lightning 30-minute resetting timer | **Yes (manual + thunder probability)** | No | Top tier | Yes (NLDN) | No | No |
| Athlete check-ins and red-flag routing | **Yes** | No | No | No | No | No |
| Emergency heat stroke protocol with cooling timer | **Yes** | No | No | No | No | No |
| Plain-language planning ("full pads at 4 tomorrow?") | **Yes (Jev)** | No | No | No | No | No |
| English and Spanish | **Yes** | No | Unknown | Unknown | No | Unknown |
| Install required | No (web, installable PWA) | No | App store | App + hardware | Device + app | App store |

**Positioning statement:** For Texas high school coaches and band directors who must follow the new UIL heat rule without an athletic trainer at every practice, Flagline is a free web app that turns the WBGT forecast and on-site readings into a practice plan, a recheck routine and a compliance record. Unlike the free UNC forecast, Flagline runs the practice; unlike paid systems, it needs no hardware or budget.

---

## 4. Product Principles

1. **The human decides; the app never says "safe".** Flagline shows what the rules require and what the data says. The coach, AT or director decides and can always stop practice. We never display "safe to practice", only the flag and its required modifications.
2. **Deterministic where it matters.** WBGT math and rule tables are plain code with tests. AI never decides a level, a time limit or that an athlete is fine.
3. **Honest numbers.** Every value says where it came from (NWS forecast, Flagline model, on-site meter), when it was issued and whether it is a forecast or a measurement. Ranges are shown, not hidden. When two forecasts disagree, the flag uses the higher one.
4. **The measured reading wins.** UIL expects readings where athletes practice. Forecasts are for planning; Practice Mode always asks for an on-site reading and labels any forecast-only decision.
5. **Conservative by default, exact when measured.** Measured readings use UIL's exact thresholds. Forecasts use the higher source and flag borderline values (within 1.0 F of the next level).
6. **Five seconds or less on the sideline.** Any action during practice (log a reading, start a break, mark thunder, open Emergency) is reachable in one or two taps with 44 px targets.
7. **Color is never the only signal.** Every level has a name, an icon and text; it works in sunlight, in dark mode, with color vision deficiency and with a screen reader.
8. **Bilingual from day one.** English and Spanish for every screen, the athlete check-in, the parent page and the PDF log.
9. **Privacy by default.** No athlete names required. Check-ins can be anonymous. Minimal retention.
10. **Works when the signal does not.** Practice Mode keeps running offline (timers, local log queue) and syncs later.

---

## 5. Domain Model: The Rules We Implement

All values below were read from primary sources on 2026-09-25 (UIL required plan page, UIL WBGT chart image, UIL FAQ, UIL football practice regulations, UIL lightning page, NATA, KSI, EPA). Full citations in [research.md](./research.md).

### 5.1 WBGT and why it is the right measure

Wet bulb globe temperature combines air temperature, humidity (through the natural wet bulb), wind and solar radiation (through the black globe). Outdoor WBGT = **0.7 x natural wet bulb + 0.2 x globe temperature + 0.1 x air temperature**. It is not the air temperature and not the heat index. On a typical Austin late-September afternoon the air is 97 to 99 F, the heat index 100 to 107 F, and the WBGT 85 to 88 F.

### 5.2 UIL WBGT Activity Guidelines (Texas, 2026-27)

UIL assigns every school to **Class 3** (almost all of Texas, including Austin, Houston, DFW, San Antonio, the Rio Grande Valley and El Paso) or **Class 2** (the Panhandle and South Plains lobe, for example Amarillo and Lubbock, extending toward the Permian Basin). There is no Class 1 in Texas. There is no official county list: schools near the boundary choose a class before the school year and must apply it consistently all year.

| Level | Class 3 (F WBGT) | Class 2 (F WBGT) | Activity guidelines (UIL wording, condensed) |
|---|---|---|---|
| **Green** | below 82.0 | below 79.7 | Normal activities. At least 3 separate rest breaks each hour, at least 3 minutes each. |
| **Yellow** | 82.0 to 86.9 | 79.7 to 84.6 | Use discretion for intense or prolonged exercise. At least 3 rest breaks each hour, at least 4 minutes each. **Mandatory on-site rapid cooling zone (tub or tarp).** |
| **Orange** | 87.0 to 90.0 | 84.7 to 87.6 | **Maximum practice 2 hours.** Football: helmet, shoulder pads and shorts only; if the level is reached during practice, players may continue in football pants. All sports: at least 4 rest breaks each hour, at least 4 minutes each. Cooling zone mandatory. |
| **Red** | 90.1 to 92.0 | 87.7 to 89.7 | **Maximum practice 1 hour.** Football: no protective equipment and no conditioning. All sports: 20 minutes of rest breaks distributed through the hour. Cooling zone mandatory. |
| **Black** | 92.1 and above | 89.8 and above | **No outdoor workouts.** Delay practice until a cooler WBGT. |

Engine encoding (lower bounds, readings rounded to 0.1 F): Class 3 yellow >= 82.0, orange >= 87.0, red >= 90.1, black >= 92.1. Class 2 yellow >= 79.7, orange >= 84.7, red >= 87.7, black >= 89.8. (The UNC tool uses exactly these bounds.)

**Non-Texas mode** uses the ACSM/KSI regional categories (Grundstein et al. 2015), which differ slightly from UIL:

| Level | Category 1 | Category 2 | Category 3 |
|---|---|---|---|
| Green | below 76.1 | below 79.7 | below 82.2 |
| Yellow | 76.2 to 81.1 | 79.8 to 84.6 | 82.3 to 87.0 |
| Orange | 81.2 to 84.1 | 84.7 to 87.6 | 87.1 to 90.0 |
| Red | 84.2 to 86.0 | 87.7 to 89.6 | 90.1 to 92.0 |
| Black | 86.1 and above | 89.7 and above | 92.1 and above |

### 5.3 Measurement and timing rules (UIL)

- WBGT monitoring is **required** for all UIL outdoor athletic and marching band activities. It also applies in covered pavilions and non-air-conditioned indoor facilities.
- Method: a scientifically approved WBGT instrument **or** a scientifically proven method such as internet-based weather station software or an application.
- On-site instrument: set up 30 minutes before practice; read 15 minutes before the start. Internet source: checked within 15 minutes before practice.
- **Readings every 30 minutes during practice.** When possible, the same person takes all readings.
- Practice time runs from when players report to the outdoor practice area until they leave it.
- When conditions **worsen** to a more restrictive level, everyone transitions to the more restrictive condition. The time already spent at a level informs decisions.
- When conditions **improve**, do not automatically extend practice beyond the original guidelines.
- Continuous monitoring is not expected; readings every 30 minutes are.
- Water may never be denied; rest breaks mean unlimited hydration and no activity.
- Rapid cooling zones (cold-water immersion tub or tarp) must be available at WBGT >= 82.0 (Class 3) or >= 79.7 (Class 2), for practices and contests. Shade, towels and misters supplement but do not replace immersion.
- Games: practice limits do not apply, but a cooling zone is required at those levels, and modifications (extra timeouts, longer halftime, start-time changes, shade, misters) are recommended.
- Records: UIL recommends keeping WBGT records on file (not required). Violations go to the District Executive Committee.

### 5.4 Football acclimatization (UIL fall practice regulations)

| Day | Gear | Contact | Time |
|---|---|---|---|
| Days 1 and 2 | T-shirts, shorts, helmets only | None | 1 practice, 3 hours max (plus up to a 1-hour break not counted, 4 hours total); optional 1-hour walkthrough with at least 2 hours between |
| Days 3 and 4 | Helmets, shoulder pads, girdles (shells) | No person-to-person contact | Same |
| Day 5 | Helmets, shoulder pads, shells | Person-to-person contact allowed, no full contact | Same |
| After day 5 | Full pads | Full contact allowed, max 90 minutes of full contact per week | Before school: 1 practice per day up to 3 hours; two-practice days up to 5 hours total with 2 hours rest, not on consecutive days. During school: 8 hours per school week outside the school day per activity |

Late joiners must complete their own 5-day period, so acclimatization is **per athlete**. NATA's best practice is 14 days; Flagline offers it as an optional stricter mode.

**Linemen:** 97% of football exertional heat stroke deaths are linemen, 100% occur during sustained high-intensity conditioning (usually in the first week), and 37% involve punishment drills (NFHS 2026). Flagline flags conditioning blocks and high-risk groups explicitly.

### 5.5 Exertional heat stroke emergency protocol (UIL, NATA)

1. Recognize: collapse, confusion or odd behavior (central nervous system dysfunction), very high body temperature; sweating may or may not be present.
2. **Cool first, transport second.** Remove equipment; whole-body cold-water immersion (35 to 58 F water, stirred, add ice) within 30 minutes; if no tub, the TACO method (tarp-assisted cooling oscillation).
3. After cooling has started, **call 911**.
4. Temperature: rectal only. Stop cooling at 101 to 102 F.
5. "Exertional heat stroke has had a 100% survival rate when immediate cooling ... was initiated within 10 minutes of collapse" (UIL resources).

### 5.6 Lightning (UIL adopts NFHS as the minimum)

- A designated weather monitor with authority to suspend activity.
- With detection technology: suspend when lightning is within 10 miles; resume only when there has been none within 10 miles for 30 minutes. **Each new strike or thunder resets the 30-minute clock.**
- Without technology: suspend when the flash-to-bang count is 30 seconds or less; NFHS treats any audible thunder as the trigger.
- Safe shelter: a substantial building or a fully enclosed metal-roof vehicle. Dugouts, bleachers and tents are not safe.

### 5.7 Air quality (smoke and ozone)

Default: EPA "Air Quality and Outdoor Activity Guidance for Schools".

| AQI | Category | School guidance (EPA) | Strict youth preset (Washington DOH May 2026, Oregon OHA June 2026) |
|---|---|---|---|
| 0 to 50 | Good | Great day to be active outside | Same |
| 51 to 100 | Moderate | Good day to be active outside; unusually sensitive students may have symptoms | Let students with health conditions opt out or stay indoors |
| 101 to 150 | Unhealthy for sensitive groups | OK for short activities; for longer activities like practice, take more breaks and do less intense activities; asthma action plans and inhalers ready | Limit to light intensity, or to 1 hour total at moderate intensity; otherwise consider canceling |
| 151 to 200 | Unhealthy | More breaks and less intensity for all; consider moving longer or intense activities indoors or rescheduling | Cancel outdoor activity or move to safer air |
| 201 and above | Very unhealthy or worse | Move all activities indoors or reschedule | Cancel |

Texas has no statewide youth AQI rule. Ozone peaks on hot sunny afternoons, the same window as heat, so combining heat and AQI matters in Texas.

### 5.8 Combining heat, smoke and lightning into one decision

Flagline computes each constraint separately, then presents the **most restrictive combined outcome**:
- Allowed duration = the minimum of the heat limit, the smoke limit and the remaining time.
- Required breaks = the most demanding of the heat and smoke break rules.
- Suspended if any of: black flag, AQI "cancel" level under the chosen preset, or an active lightning hold.
- The UI always shows which constraint is binding ("Limited by heat: orange, 2 hours max").

---

## 6. Features

Legend: **MVP** = must ship for the demo; **Core** = planned in the two weeks; **Stretch** = only if ahead of schedule.

### F1. Quick Check (public, no account) [MVP]

The fastest possible value, and what judges can try in 10 seconds.
- Enter a place (city, school address or ZIP) or tap "Use My Location".
- Pick a rule set: Texas UIL (class suggested from location: Class 2 polygon versus Class 3), or KSI Category 1, 2 or 3 elsewhere (default most protective if unknown).
- Pick an activity (football, band, other sport, PE).
- See: current forecast flag, a 12-hour timeline of flags, the next level change ("Orange from 1 PM to 5 PM"), the rules for the current level for that activity, AQI now and later, thunder probability, sources and a clear "planning estimate, not a measurement" label.
- Call to action: "Set Up Your School" or "Try The Demo School".

### F2. School setup and class lock [MVP]

- Onboarding with the shadcn Questionnaire: school name, address, role, sports, band.
- Class suggestion with an explanation, a "near boundary" warning when within about 40 km of the Class 2 lobe edge, and a required confirmation. **Locked for the school year**, recording who set it and when (UIL FAQ: choose before the year and apply consistently).
- Add fields: name, surface (natural grass, artificial turf, asphalt lot, track, covered pavilion, non-air-conditioned indoor), coordinates via "Use My Location While Standing On The Field" or address. Surface drives notes (turf and asphalt run hotter; pavilions and non-A/C indoor need readings too).
- Add teams: sport, level (varsity, JV, freshman, middle school), default field, default practice time, head coach, AT.
- Invite members by email with roles: owner (AD), coach, trainer, viewer.

### F3. Today dashboard [MVP]

- A card per field: current flag (forecast or last measured reading, labeled), trend arrow, next change, AQI, lightning hold status.
- Today's practices: time, team, field, expected flag during that window, readiness checklist status (cooling zone ready, water, reading owner).
- Alerts: athlete red flags, missed rechecks, level changes, lightning holds.
- Multi-field view for the AT and AD.

### F4. Planner (7 days) [MVP]

- A heatmap grid: rows are days, columns are hours (6 AM to 9 PM), each cell a flag with the WBGT range; tap for detail (sun versus shade, both sources, AQI, thunder probability).
- Overlay the team's scheduled practices on the grid.
- **Best Window finder:** for a planned duration and activity, rank start times by lowest flag, then shortest time at restrictive levels, then proximity to the preferred time. Example: "Move to 7:00 AM: green all session" or "4:00 to 5:30 PM is orange: 2 hours max, helmet and shoulder pads with shorts".
- **Ask Flagline** (Core): a text box where a coach types a plan in plain words; Jev maps it to typed parameters; the rules engine answers with the flag timeline, the required modifications and better windows (section 11.2).
- Chart: WBGT curve for the day with level bands (shadcn Chart, area and line), sun and shade range.

### F5. Practice scheduling [MVP]

- Create a practice: team, field, date, start, planned duration, activity blocks (warm-up, individual, team, conditioning, walkthrough, band block, full run), gear plan.
- Instant preview: expected flags per block, required modifications, conflicts ("Conditioning is not allowed at red for football"; "Planned 2.5 hours exceeds orange max of 2 hours").
- One-tap fixes: "Shorten To 2 Hours", "Move To 7 AM", "Switch To Shells", "Move Conditioning To Start".
- Notify the team page and parents (Core).

### F6. Practice Mode (the sideline screen) [MVP]

Full-screen, one-handed, high contrast. Designed for a phone in bright sun.
- **Pre-check:** within 15 minutes before start, the app prompts for a reading. Options: type the meter value (large keypad), photograph the meter (F7), or confirm the forecast value (labeled "internet-based estimate", allowed by UIL, with a gentle nudge to measure on-site when a meter exists).
- **Live banner:** the current level (color, icon, name), the WBGT value and source, what the level requires right now for this activity (max time, breaks, gear, cooling zone), and which constraint is binding.
- **Recheck countdown:** a big 30:00 countdown to the next required reading; vibration, sound and a push notification at 0; overdue state turns the banner into an "overdue" warning and the log records it.
- **Break timer:** at the required cadence (for example 4 breaks per hour of 4 minutes at orange), shows "Next Break In 7:12" and a "Start Break" button that runs a break countdown; breaks taken are logged.
- **Time used:** elapsed time versus the current level's maximum, and a breakdown of time spent at each level (UIL FAQ). When the level rises, the allowed remaining time recalculates immediately and conservatively (remaining = maximum for the new level minus elapsed time, never negative). When it falls, the app does not extend practice automatically and says why.
- **Level change sheet:** when a new reading moves the level up, a sheet lists exactly what changes now ("Football: remove shoulder pads? No: at orange, helmet, shoulder pads and shorts; players may continue in pants since orange was reached during practice.") and asks the coach to confirm the modifications applied (logged).
- **Cooling zone checklist:** tub filled and iced, water temperature, TACO tarp, trained person on site; required at yellow and above; unchecked items block nothing but are shown in red and logged.
- **Lightning:** a "Thunder Heard Or Strike Seen" button starts a 30-minute hold that resets on each new tap; shows shelter guidance.
- **Emergency** button always visible (F9).
- **End Practice:** summary, signature (typed initials or drawn), notes, and the log is finalized.
- **Offline:** timers and entries continue offline; a banner shows "Offline, saved on this device"; sync on reconnect.

### F7. Meter photo reading [Core]

- Photograph a handheld WBGT meter's display (for example a Kestrel 5400 screen).
- A vision model extracts the displayed numbers and labels; Jev selects which one is the WBGT and checks plausibility against the forecast; the value is shown large for confirmation before it is logged. Low confidence falls back to the keypad with the photo visible.
- The photo is processed in memory and discarded unless the user chooses to attach it to the log.

### F8. Athlete check-ins [Core]

- Each practice has a QR code (shown in Practice Mode and printable) that opens a no-login check-in page in English or Spanish.
- The athlete optionally enters a jersey number or initials (or stays anonymous), taps any symptoms from a short list (dizzy, headache, nausea or vomiting, cramps, very tired, confused, stopped sweating, trouble breathing, chest pain) and can type how they feel in their own words.
- Jev screens the text for red flags and severity; deterministic rules combine taps and Jev answers (section 11.3). Red flags trigger an immediate push and an alarm on the trainer's and coach's screens with the location and the emergency protocol; other check-ins go into a queue ("Check On #54, reports cramps").
- The athlete sees a calm, specific message: "Stop, sit in the shade, drink water, and tell a coach now. A coach has been notified." For red flags: "Stay where you are. Help is coming." Never "you are fine".
- Pre-practice readiness check-in (Stretch): "Slept under 6 hours? Sick in the last 48 hours? Taking medication? First week back?" to identify higher-risk athletes privately for the AT.

### F9. Emergency mode [MVP]

- One tap from anywhere in Practice Mode.
- Step-by-step exertional heat stroke protocol (section 5.5) in large type, in English and Spanish.
- A cooling timer from "Cooling Started", checkpoints for rectal temperature entries, water temperature, "911 Called" timestamp, and "Transported" timestamp.
- TACO instructions if no tub.
- Everything is timestamped into the practice log as an incident record.
- A "Call 911" button (tel link) placed after "Start Cooling" per protocol, with a note that calling can happen in parallel if another adult is present.

### F10. Compliance log [MVP]

- Automatic record per practice: school, class, field, surface, team, activity, planned and actual times, each reading (value, source, instrument, who, when, forecast issue time), level timeline, modifications applied and confirmed, breaks taken, cooling zone checklist, AQI and lightning holds, check-ins (anonymous summary), emergency events, notes, signature.
- An audit trail: any edit after the fact is recorded with who, when and what changed.
- **Log page:** a filterable, sortable table (TanStack via shadcn data table) across teams and dates; badges for missed rechecks and unconfirmed modifications.
- **Exports:** PDF per practice or per week (bilingual, school header, signatures), CSV for any range.
- Retention: 1 year by default.

### F11. Team status page for parents and athletes [Core]

- A public, read-only page per team (`/t/<team-slug>`): today's practice status (on, modified, moved, indoors, delayed), the flag and what it means in plain language, a reminder to bring water, and the schedule for the week. No personal data.
- Share link and QR; optional web push subscription for parents ("Practice moved to 7 AM tomorrow: red flag expected in the afternoon").

### F12. Rules library and AI policy import [Stretch, demo of scalability]

- Built-in rule sets: Texas UIL 2026-27 Class 2 and Class 3; KSI Categories 1, 2, 3; EPA school AQI; Strict youth AQI (WA/OR 2026); NFHS lightning.
- **Import a policy:** upload another state association's heat policy PDF; Flagline extracts candidate thresholds and clauses, Jev classifies them into the rule schema, and an admin reviews a side-by-side draft before activating (section 11.5). Nothing activates without human approval.

### F13. Notifications [Core]

- Web push (installable PWA): recheck due, break due, level change forecast for an upcoming practice ("Tomorrow 4 PM looks red"), athlete red flag, lightning hold ended, missed recheck.
- In-app toasts for the active screen.
- Email summary to the AD weekly (Stretch).

### F14. Acclimatization roster [Stretch]

- Per-athlete UIL day 1 to 5 counters (or NATA 14-day), gear allowed today, late-arrival handling, linemen and high-risk flags, full-contact minutes per week (90-minute cap).
- Practice Mode shows "3 athletes on acclimatization day 2: helmets only" when relevant.

### F15. Accessibility and display modes [MVP]

- Light, dark and **Sunlight** mode (maximum contrast, larger type, thicker borders for direct sun).
- WCAG 2.2 AA on core flows; full keyboard; screen reader labels; live regions for level changes; reduced motion.
- English and Spanish toggle everywhere; language remembered per device.

---

## 7. End-To-End Journeys

### 7.1 Journey A: Coach Ramirez, football, Monday Sep 28 (the demo day)

Scenario uses real forecast values published for Austin this week (NWS WBGT: 3 PM 88 F, 4 PM 87 F, 5 PM 85 F; UNC Liljegren sun value 89.0 F at 4 PM). Fictional school: **Pecan Creek High School, Austin, Travis County, Class 3.**

| Time | What happens | Screen |
|---|---|---|
| Sun 8:10 PM | Push: "Tomorrow 3:45 to 6:15 PM varsity: orange expected (87 to 89). Practice max 2 hours. Tap to plan." | Notification |
| Sun 8:12 PM | Coach opens the Planner. The grid shows orange from 1 PM to 5 PM and yellow after 5 PM. He types "can we go full pads 4 to 6 tomorrow". Jev maps: team varsity football, field turf, start 16:00, duration 120 min, gear full pads. The engine replies: "Orange until about 5 PM. At orange, football is limited to helmet, shoulder pads and shorts, and practice is capped at 2 hours. Options: 1) Keep 4:00 to 6:00 in shells and shorts with 4 breaks per hour of 4 minutes. 2) Start at 5:15 PM (yellow) in full pads." He picks option 1. | Planner + Ask |
| Mon 12:30 PM | Today dashboard: "Varsity 3:45 PM: orange expected. Cooling zone required. Reading owner: Coach Lee." Checklist shows tub not yet confirmed. | Today |
| Mon 3:30 PM | Push to the reading owner: "Pre-practice reading due by 3:45." | Notification |
| Mon 3:38 PM | Coach Lee photographs the Kestrel: 87.6 F. Flagline shows "87.6 F WBGT, Orange (Class 3: 87.0 to 90.0). Confirm?" Confirmed. Forecast for comparison: NWS 87, Flagline model 88.1. | Meter photo |
| Mon 3:45 PM | "Start Practice". Practice Mode: ORANGE banner, "2:00:00 max", "Next reading in 30:00", "Next break in 11:00", "Helmet, shoulder pads, shorts", "Cooling zone: required". | Practice Mode |
| Mon 4:15 PM | Recheck alert. Reading 87.2: still orange. Logged in 4 seconds. | Practice Mode |
| Mon 4:32 PM | An athlete scans the QR on the water table: "#54, head hurts and I feel kind of confused". Jev red-flag Noul for confusion is high; the check-in is routed as an **emergency**: the AT's phone alarms: "Red flag: #54 reports confusion at Turf Field. Open Emergency Protocol." The AT finds the athlete, opens Emergency, starts cooling in the tub, a second coach calls 911 after cooling starts. Timestamps are captured. | Check-in, Emergency |
| Mon 4:45 PM | Recheck: 86.3 F. Level falls to yellow. Flagline: "Conditions improved to yellow. UIL advises not to extend practice automatically. Your limit stays at the planned end, 5:45 PM." | Practice Mode |
| Mon 5:45 PM | End practice. Summary: 2 hours, 4 readings (all on time), 7 breaks, 1 emergency incident, cooling zone confirmed. Coach signs with initials. | Summary |
| Mon 5:46 PM | The AD sees the log entry; exports the PDF for the incident file. | Log |

### 7.2 Journey B: Ms. Nguyen, marching band, a red day

1. Sunday evening forecast: Tuesday 4 to 6 PM red in full sun (UNC 90.6 F), orange in shade.
2. The Planner's Best Window finder ranks 7:00 to 8:30 AM (green, 72 to 75 F) first. She moves block rehearsal to 7 AM and posts the change to the band's team page; parents get a push.
3. Tuesday 6:45 AM pre-check: 73.4 F measured. Green: 3 breaks per hour of 3 minutes.
4. The log records the move and the green practice. Compliance with the band rule is automatic.

### 7.3 Journey C: The athletic trainer on a busy afternoon

1. The Today dashboard shows five fields: turf (orange), practice field (orange), tennis courts (yellow, hard court), track (orange), band lot (red, asphalt).
2. A missed recheck on the track turns into a red "Overdue 6 minutes" badge; she taps it to message the coach (Stretch) or walks over.
3. A check-in "#12 cramps in both legs" arrives as "Check Soon" (not a red flag); she handles it and marks it resolved.
4. A lightning strike is reported by the band director: a lightning hold appears on all fields within 10 miles by default (school-level setting), with the 30-minute timer.

### 7.4 Journey D: The athletic director, start of the year and after

1. Onboarding: school, address, Class 3 suggested (Austin), confirmed and locked with her name and date.
2. Adds six fields by standing on each and tapping "Use My Location" (20 minutes of walking).
3. Adds 14 teams and invites coaches.
4. Weekly: filters the log for "missed rechecks" and "unconfirmed modifications", follows up, exports the weekly PDF to the district.

### 7.5 Journey E: A parent

Opens the team page from the booster club group chat: "Today: practice 4:00 to 6:00 PM, modified (orange flag: 2 hours max, shells and shorts, extra breaks). Send water. Flagline updates this page automatically." Subscribes to updates.

### 7.6 Journey F: A judge (the first 60 seconds)

Opens the live link, lands on the home page with a live Quick Check for Austin already computed ("Right now in Austin: yellow, 84 F WBGT. Orange from 1 to 5 PM."), clicks "Try The Demo School", sees the Today dashboard with seeded practices, taps "Start Practice", logs a reading, sees the level and rules update. No sign-up.

---

## 8. How It Works: System Design

### 8.1 Architecture overview

```
                        Browser (installable PWA, en/es, light/dark/sunlight)
   ┌───────────────────────────────────────────────────────────────────────────────┐
   │  Next.js 16 App Router UI (pure shadcn/ui, Base UI primitives, Tailwind v4)     │
   │  Practice Mode client: timers, offline queue (IndexedDB), service worker push   │
   └───────────────▲───────────────────────────────┬───────────────────────────────┘
                   │ Server Components / Actions    │ Route Handlers (JSON, PDF, CSV)
   ┌───────────────┴───────────────────────────────▼───────────────────────────────┐
   │                        Next.js server on Vercel (Node runtime)                   │
   │  ┌──────────────┐ ┌──────────────┐ ┌───────────────┐ ┌──────────────────────┐  │
   │  │ Conditions   │ │ WBGT engine  │ │ Rules engine  │ │ AI layer             │  │
   │  │ service      │ │ (Liljegren,  │ │ (UIL, KSI,    │ │ Jev: plan parsing,   │  │
   │  │ (fetch,cache,│ │ solar geom., │ │ AQI, light-   │ │ triage, meter value, │  │
   │  │ combine)     │ │ pure TS)     │ │ ning; pure TS)│ │ policy clauses       │  │
   │  └──────┬───────┘ └──────────────┘ └───────────────┘ │ Claude vision: meter │  │
   │         │                                            │ photo text only      │  │
   │  ┌──────▼───────┐ ┌──────────────┐ ┌───────────────┐ └──────────────────────┘  │
   │  │ Practice     │ │ Notifications│ │ Log and       │                            │
   │  │ session      │ │ (web push,   │ │ export (PDF,  │                            │
   │  │ workflow     │ │ in-app)      │ │ CSV, audit)   │                            │
   │  └──────┬───────┘ └──────────────┘ └───────────────┘                            │
   └─────────┼───────────────────────────────────────────────────────────────────────┘
             │
   ┌─────────▼──────────┐   ┌──────────────────────────────────────────────────────┐
   │ Postgres (Neon)     │   │ External data: NWS api.weather.gov (WBGT, HeatRisk,   │
   │ via Drizzle ORM     │   │ thunder), Open-Meteo forecast (Liljegren inputs) and  │
   │ + Redis rate limits │   │ air quality, AirNow (optional key), US Census geocoder│
   └─────────────────────┘   └──────────────────────────────────────────────────────┘
```

### 8.2 Data flow for "what is the flag at 4 PM on the turf field?"

1. The **Conditions service** looks up the field's coordinates and its cached NWS grid point (`/points/{lat},{lon}` resolved once per field).
2. It fetches, in parallel and cached for 30 minutes per grid cell: NWS gridpoint data (`wetBulbGlobeTemperature`, `heatRisk`, `probabilityOfThunder`, `temperature`, `dewpoint`, `relativeHumidity`, `skyCover`, `windSpeed`), Open-Meteo hourly and 15-minute forecast (`temperature_2m`, `relative_humidity_2m`, `surface_pressure`, `wind_speed_10m`, `shortwave_radiation_instant`, `direct_radiation_instant`, `diffuse_radiation_instant`), and air quality (AirNow if a key is configured, otherwise Open-Meteo `us_aqi`, `pm2_5`, `ozone`).
3. The **WBGT engine** computes the Flagline model value (Liljegren, sun) and a shade estimate for each hour from the Open-Meteo inputs.
4. The combiner produces, per hour: `nws`, `model_sun`, `model_shade`, `planning = max(nws, model_sun)`, `range = [min, max]`, `borderline` flag, and the source metadata (issue times, grid cell).
5. The **Rules engine** maps `planning` to a level with the school's locked rule set, then derives the activity requirements for the team's sport.
6. The UI renders the flag, the range and the rules, labeled "Forecast, planning only".
7. In Practice Mode, a measured reading replaces the forecast for the live decision; the forecast stays visible for comparison.

### 8.3 The practice session lifecycle

```
scheduled ──(15 min before start)──► precheck_due ──reading──► ready ──start──► active
   │                                                                      │
   │                                                     every 30 min: recheck_due ──reading──► active
   │                                                                      │  level up: apply stricter rules now
   │                                                                      │  level down: keep limit, no auto-extend
   │                                                                      │  black / lightning / AQI cancel: suspended ──clear──► active
   │                                                                      │  emergency: incident recorded (practice continues or ends)
   └──────────────────────────────────── cancelled                        ▼
                                                                      ended ──sign──► finalized (log locked; edits audited)
```

A durable server workflow schedules recheck and break reminders (push) for the active session; the client runs the same timers locally so the sideline works even with no signal.

---

## 9. The WBGT Engine

### 9.1 Why we compute WBGT ourselves and also use NWS

- **NWS** publishes a WBGT forecast in its gridpoint API (no key): hourly for 1 to 36 hours, coarser later, about 7 to 8 days, 1 F resolution. It uses the Dimiceli method, which a 2020 study found ran 4 to 6 F cool (the algorithm has since been revised; the current bias is unknown).
- The **Liljegren** method is the research standard (used by the UNC tool; about 1 to 2 F error in sun against ISO meters). Computing it ourselves from Open-Meteo's inputs gives an independent second estimate, a shade value, 15-minute resolution and full transparency.
- A 2025 KSI study showed an app estimate running 1 C cool on average and 2 to 3 C cool when it was hottest. Our own comparison this week (Liljegren on Open-Meteo versus NWS for Austin) showed differences of 2 to 6 F at practice hours, enough to cross a flag level.
- Therefore: **show both, flag with the higher, and prompt for an on-site reading.**

### 9.2 The model

Inputs per time step: air temperature Ta (C), relative humidity (%), surface pressure (hPa), 10 m wind speed (m/s), instantaneous global shortwave radiation (W/m2), direct-beam fraction fdir = direct / global (clamped 0 to 0.9), cosine of the solar zenith angle (computed from the NOAA solar position equations for the field's latitude, longitude and the timestamp).

Steps:
1. **Solar geometry:** cos(zenith) from NOAA equations; below the horizon, radiation terms are zero and fdir is 0 near sunset (cos zenith below 0.00873).
2. **Wind at 2 m:** convert 10 m wind with a Pasquill-Gifford stability class (from solar elevation, radiation and wind speed) and a power-law exponent; floor at 0.13 m/s.
3. **Globe temperature Tg:** solve the black globe's steady-state energy balance (globe diameter 0.0508 m, emissivity 0.95, albedo 0.05; surface albedo 0.45) by fixed-point iteration (tolerance 0.02 K, max 500 iterations).
4. **Natural wet bulb Tnwb:** solve the wick's energy balance (wick diameter 0.007 m, length 0.0254 m, emissivity 0.95, albedo 0.4) similarly.
5. **WBGT = 0.7 Tnwb + 0.2 Tg + 0.1 Ta**, converted to F.
6. **Shade estimate:** repeat with direct radiation removed (diffuse only), which approximates the sun-to-shade band the UNC tool shows.

Implementation: a TypeScript port of ECMWF's `thermofeel` Liljegren module (Apache-2.0, about 314 lines; attributed in the README), with unit tests against values produced by `thermofeel` itself on recorded inputs, plus property tests (WBGT increases with humidity and radiation, decreases with wind; night values have no solar term).

Stretch: the zero-iteration analytic approximation of Kong and Huber (2024), which differs from full Liljegren by less than 1 C in 99% of cases, as a fast path for the 7-day grid.

### 9.3 Combining sources

| Output | Rule |
|---|---|
| `planning_wbgt` (used for the forecast flag) | max(NWS, model sun) when both exist; otherwise whichever exists, with a "single source" note |
| `range` | [min of available sources and shade, max of sources] |
| `borderline` | planning value within 1.0 F below the next level's lower bound |
| `measured` | an on-site reading within the last 30 minutes overrides the forecast for the live decision |
| `stale` | forecast older than 3 hours or measurement older than 30 minutes is labeled stale |

### 9.4 Calibration loop (Stretch)

When a school logs on-site readings, Flagline stores the pair (forecast at that time, measured). A per-field bias estimate (median of recent residuals, bounded) can be shown ("Your turf reads about 1.5 F hotter than the forecast") and optionally applied to planning values. It is never applied to reduce a flag level below what the uncorrected forecast shows.

---

## 10. The Rules Engine

### 10.1 Design

- Rules are **data**, not code: versioned JSON documents validated by a Zod schema (`RuleSet`), each with source URLs, an effective date range and a checksum.
- The engine is a set of pure functions:
  - `levelFor(wbgtF, ruleSet, region): Level`
  - `requirementsFor(level, activity, ruleSet): Requirements` (max duration, break schedule, gear, conditioning allowed, cooling zone required, notes with source quotes)
  - `aqiRequirements(aqi, preset, durationMinutes): Requirements`
  - `lightningState(events, now): { hold: boolean, resumesAt?: Date }`
  - `combine(heat, aqi, lightning, session): Decision` (most restrictive, with the binding constraint named)
  - `sessionLimits(session, readings): { allowedEnd, timeInLevel, noAutoExtend }`
  - `acclimatization(athlete, date): { day, gearAllowed, contactAllowed }`
- Every output carries **provenance**: which rule, which source, which reading.

### 10.2 Conformance testing

- A table of at least 200 cases covering every boundary for UIL Class 2 and Class 3 and KSI 1 to 3 (for example 81.9, 82.0, 86.9, 87.0, 90.0, 90.1, 92.0, 92.1 for Class 3), every activity type, gear rules (including the "reached during practice, pants allowed" orange exception), the red conditioning ban, cooling-zone requirements, AQI presets and durations, lightning resets and time-in-level scenarios (worsening, improving, oscillating).
- CI blocks merges if any conformance case fails.

### 10.3 Session logic details

- **Pre-check window:** a reading must be within 15 minutes before the start; otherwise the start screen shows "Reading Required" (the coach can proceed with the forecast estimate, which is logged as such).
- **Recheck clock:** due every 30 minutes from the previous reading; overdue after 30 minutes plus a 2-minute grace; logged as late.
- **Worsening:** apply the stricter level immediately: `allowedEnd = min(currentAllowedEnd, start + maxDuration(newLevel))`; if already past, the app says "Maximum time at this level reached: end or move indoors."
- **Improving:** `allowedEnd` never increases automatically; the coach can manually extend only up to the original plan and the rule for the current level, with a logged reason.
- **Black, AQI cancel or lightning:** the session is suspended; the clock continues (practice time counts until players leave the area, per UIL); resume requires a new reading or the hold to expire.
- **Breaks:** the scheduler spreads the required number of breaks evenly across each hour; red uses 20 minutes distributed (for example 4 breaks of 5 minutes).

---

## 11. The AI Layer

### 11.1 Philosophy

AI does interpretation. Code does decisions. Each AI use is narrow, typed, confidence-gated, visible to the user, and replaceable by a manual action. Per our team rule, **semantic judgments use TypeSafe Jev** (`jev-latest`, currently `jev-1.13.0`): it returns typed answers with calibrated probabilities in about 100 ms, which is ideal for real-time UI and for safety gating. A text-generating model (Anthropic Claude) is used in exactly one place where Jev cannot work: **reading pixels** from a meter photo (Jev is text-only). No AI writes safety advice text; all user-facing guidance is authored copy from the rules engine.

### 11.2 Ask Flagline: plain-language planning (Core)

**Input:** "can varsity go full pads 4 to 6 tomorrow on the turf", plus the user's teams and fields and the current date.

**Pipeline:**
1. **Deterministic pre-parse:** a date and time parser extracts candidate times, dates and durations ("4 to 6", "tomorrow", "90 minutes"); a number finder extracts candidates.
2. **One Jev request** with `state = { request, teams[], fields[], candidates, today }` and parallel questions:
   - `intent` (Choice): `check_plan`, `find_best_window`, `rules_now`, `log_reading`, `other`.
   - `team` (Choice over the user's team ids, up to 255 options).
   - `field` (Choice over field ids plus `unspecified`).
   - `start_candidate` (Choice over the pre-parsed time candidates plus `none`).
   - `end_or_duration_candidate` (Choice over pre-parsed candidates plus `none`).
   - `day_candidate` (Choice over pre-parsed dates plus `today`).
   - `gear` (Choice): `full_pads`, `helmet_shoulder_pads_shorts`, `helmet_only`, `no_equipment`, `not_football`, `unspecified`.
   - `activity` (Choice): `football_practice`, `conditioning`, `walkthrough`, `band_rehearsal`, `other_sport_practice`, `pe_class`, `game_or_contest`.
   - `mentions_conditioning` (Noul).
3. **Confidence gating in code:** each answer with confidence below 0.6 becomes a clarification chip ("Which team: Varsity Or JV?"); nothing is guessed.
4. **The rules engine** evaluates the typed plan hour by hour and produces the answer from authored templates: the flag timeline, the modifications, conflicts and up to three better windows.
5. The UI shows the parsed plan as editable chips above the answer ("Varsity Football, Turf, Tomorrow 4:00 to 6:00 PM, Full Pads"), so the user sees exactly what was understood.

### 11.3 Athlete check-in triage (Core, safety-relevant)

**Inputs:** tapped symptoms (structured) and optional free text in English or Spanish.

**Jev request:** `state = { text, tapped_symptoms, practice_level }` with parallel Noul questions, each atomic:
- `confusion`: does the athlete describe confusion, disorientation, not knowing where they are, or acting strangely?
- `collapse_or_fainting`: did they collapse, faint, or nearly faint?
- `vomiting`: are they vomiting or unable to keep fluids down?
- `stopped_sweating_or_hot_dry_skin`
- `severe_headache`
- `seizure_or_unresponsive`
- `breathing_difficulty` (asthma or smoke)
- `chest_pain`
- `third_party_report`: is someone reporting on behalf of another athlete in distress?

plus a Score `severity` (none, mild, moderate, severe, emergency) and a Choice `category` (heat cramps, heat exhaustion signs, possible exertional heat stroke, breathing or smoke, dehydration, unrelated injury, other).

**Deterministic routing (recall first):**
- **Emergency** if any tapped red-flag symptom, **or** any red-flag Noul at or above **0.25**, **or** severity at or above 3.0, **or** the text contains a curated red-flag keyword in either language. Emergency alarms the AT and coach and links the Emergency protocol.
- **Check now** if severity is at or above 1.5 or any other symptom is tapped.
- **Check soon** otherwise. Nothing is ever auto-dismissed; every check-in is seen by an adult.
- The low 0.25 threshold is deliberate: false alarms cost a walk across the field; misses cost lives. The red-flag test set (about 150 phrases, English and Spanish, including slang and typos) must reach 100% recall in CI.

### 11.4 Meter photo reading (Core)

1. The photo is resized in the browser and sent to a server route.
2. **Claude vision** (the latest Sonnet model) is asked for a strict JSON list of every number visible on the display with its nearby label and unit (it does not interpret heat safety).
3. **Jev** selects which candidate is the WBGT (`Choice` over candidate ids plus `none`), and a Noul checks whether the display is a WBGT or heat stress screen.
4. **Code** validates: numeric range 40 to 110 F (or converts C), and plausibility against the forecast (difference over 8 F raises a "double-check" note, but a measured value is never rejected for being hotter).
5. The user confirms the big number before it is logged. Low confidence at any step falls back to the keypad with the photo shown.

### 11.5 Policy import for other states (Stretch)

1. PDF text extraction; split into clauses (headings, bullets, table rows).
2. Code finds numeric threshold candidates (temperatures, durations, counts).
3. Jev classifies each clause (`Choice`: measurement timing, level thresholds, max duration, rest breaks, equipment, cooling, acclimatization, other) and each threshold candidate's role (`Choice`: green upper bound, yellow lower bound, orange lower bound, red lower bound, black lower bound, duration limit, break count, break minutes, not a rule).
4. A draft RuleSet is assembled in code and shown side by side with the source clause for each value. An admin must approve every field. Unapproved rule sets cannot be selected.

### 11.6 Why Jev (and not a chat model) for these decisions

- **Typed answers by construction:** no JSON repair, no hallucinated options; answers are always one of our option keys.
- **Calibrated probabilities and confidence:** the basis for our gating and our recall-first triage thresholds.
- **Parallel atomic questions in one call:** the triage runs 11 questions in a single request, fast enough for a live alarm.
- **Cost:** about $0.042 per million input tokens; a check-in costs roughly one hundred-thousandth of a dollar.

### 11.7 AI failure behavior

| Failure | Behavior |
|---|---|
| Jev unavailable or slow (over 2 s) | Ask Flagline shows a manual form; triage falls back to tapped symptoms plus keyword rules (still recall-first); meter photo falls back to keypad |
| Low confidence | Clarification chips or manual entry |
| Vision model misreads | The user sees and confirms the value; plausibility note |
| Prompt injection in text or PDF | Text is data in `state`, never instructions; outputs are constrained to typed options |

---

## 12. Safety Case

### 12.1 Hazard analysis

| # | Hazard | Cause | Severity | Controls | Residual |
|---|---|---|---|---|---|
| H1 | App shows a lower level than reality | Forecast cool bias; wrong location; stale data | Critical | Two-source max; borderline flag; stale labels; on-site reading prompted every 30 minutes; field coordinates captured on site; surface notes | Medium, accepted with on-site readings |
| H2 | Rule encoded wrongly | Transcription error | Critical | Rules as versioned data with sources; 200+ conformance tests; review by two teammates; change requires source and test | Low |
| H3 | Missed recheck | Busy coach, no signal | High | Server and client timers, push, vibration, overdue banner, log flag | Low |
| H4 | Athlete red flag not escalated | AI miss, athlete does not report | Critical | Tapped red flags bypass AI; recall-first thresholds; keyword backstop; 100% recall test set; education copy for athletes; the app never clears a flag | Medium (reporting depends on the athlete) |
| H5 | Wrong emergency order (transport before cooling) | Panic | Critical | Emergency screen leads with cooling steps; 911 prompt after "Cooling Started"; bilingual; large type | Low |
| H6 | Over-trust ("the app said it was fine") | Automation bias | High | Never shows "safe"; human confirmation of modifications; language that frames the app as support | Medium |
| H7 | Wrong class for a school | Near boundary | Medium | Suggestion plus explicit confirmation; locked for the year with who and when | Low |
| H8 | Privacy breach of minors' data | Security bug | High | Data minimization; no names required; RBAC; retention limits; security headers; see SECURITY.md | Low |
| H9 | Outage during practice | Service down | High | Offline Practice Mode; local timers; queue and sync | Low |
| H10 | Misread meter photo | OCR error | Medium | User confirms; plausibility; manual fallback | Low |

### 12.2 Disclaimers (authored copy, shown wherever a number appears)

- Forecast values: "Planning estimate from National Weather Service and Open-Meteo forecasts. Not a measurement. Take a reading where athletes practice."
- Practice Mode footer: "Decisions remain with school staff under the UIL Heat Stress plan and your emergency action plan. In an emergency: cool first with cold-water immersion, then call 911."
- AQI: "Air quality data are preliminary."
- About page: "Flagline is not a medical device and does not diagnose illness. It is not a replacement for an athletic trainer, an on-site WBGT instrument or emergency services."

### 12.3 What we will not ship

- Any screen that says an athlete is fine or safe.
- Any automatic practice extension.
- Any rule set that has not passed conformance tests or human approval.

---

## 13. Privacy, Ethics And Accessibility

### 13.1 Privacy

- Minimal data about minors: no names required; jersey number or initials optional; check-ins can be anonymous; no photos of people.
- Check-in retention 30 days; practice logs 1 year; AI request payloads not stored beyond the structured result.
- Role-based access: owner (AD), coach (own teams), trainer (all teams, check-ins), viewer (read-only).
- Public team pages contain no personal data.
- Demo data is fictional (a fictional school).
- Student health information (asthma, sickle cell trait, prior heat illness) is out of scope for the MVP; if added later it follows FERPA with explicit consent.

### 13.2 Ethics

- Equity: free, no hardware, works on any phone; built for schools without athletic trainers or budgets.
- Honesty: we show uncertainty and sources; we do not overclaim compliance or accuracy.
- Autonomy: the coach decides; the app informs.
- Athlete voice: a private, low-stigma channel to report symptoms early.

### 13.3 Accessibility

- WCAG 2.2 AA; tested with axe in CI and manual screen reader passes (VoiceOver, NVDA).
- Level shown as color + icon + name + value.
- 44 px targets; one-handed layouts; no hover-only interactions.
- Sunlight mode; dark mode; reduced motion; captions on the demo video.
- English and Spanish for everything, including the PDF log and emergency protocol.

---

## 14. When: Usage Calendar And Moments

### 14.1 Across the year (Texas)

| Period | Activities | Heat and smoke profile | Flagline focus |
|---|---|---|---|
| Late July to August | Football preseason (acclimatization), band camp, cross country, volleyball | Peak WBGT; most deaths occur in August | Acclimatization, Practice Mode, Emergency |
| September to mid-October (**the hackathon window**) | Football season, marching band competition season (UIL region contests; area Oct 24 and 31; state Nov 1 to 3 and 8 to 10), cross country, tennis, soccer club | Still frequently orange and red in the afternoon in Austin (57% of recent days in this window reached 90 F air temperature; this week NWS shows 87 to 88 F WBGT at 3 to 4 PM) | Planner, Practice Mode, band |
| November to February | Basketball, soccer (outdoor), off-season | Mostly green | Log history, AQI |
| March to June | Track, baseball, softball, tennis, spring football, graduation | Heat returns in May and June; spring agricultural smoke; ozone | Planner, AQI |
| Summer | Camps, strength and conditioning | High | Same as August |

### 14.2 Across a day

- **Night before:** forecast push for tomorrow's practices.
- **Lunch:** Today dashboard; readiness checklist.
- **15 minutes before:** pre-check reading.
- **Every 30 minutes:** rechecks; breaks at the required cadence.
- **Any moment:** check-ins, lightning, emergency.
- **After practice:** sign and finalize; the log is ready.

---

## 15. Feasibility And Sustainability

### 15.1 Technical feasibility in two weeks

- All data sources are free and verified live this week: NWS gridpoint API (WBGT, no key), Open-Meteo forecast and air quality (no key, non-commercial free tier: 10,000 calls per day), AirNow (free key).
- The physics model is a small, well-documented port (about 314 lines in the reference implementation).
- The rules are a short table.
- The UI uses shadcn/ui components and blocks we have already verified build together (Next 16, React 19, Tailwind 4, Base UI).
- Detailed schedule in [build.md](./build.md) section 20.

### 15.2 Operating cost

| Item | Cost at pilot scale (50 schools) |
|---|---|
| Hosting (Vercel) | Free tier for a non-commercial student project; about $20 per month on Pro if needed |
| Database (Neon Postgres) | Free tier |
| Weather and AQI data | Free (NWS public domain; Open-Meteo non-commercial with CC BY 4.0 attribution; AirNow free key) |
| Jev | About $0.042 per million tokens: well under $1 per month |
| Claude vision (meter photos) | About a cent per photo: a few dollars per month |
| Total | Under $30 per month for dozens of schools |

Caching by NWS grid cell and Open-Meteo coordinates means many teams at one school share the same forecast calls.

### 15.3 Sustainability and adoption path

1. **Pilot:** 3 to 5 Austin-area schools (starting with teams we know), fall 2026, measured against the success metrics in [problem.md](./problem.md) section 6.5.
2. **Channels:** Texas High School Coaches Association (THSCA), Texas Music Educators Association (TMEA) for band directors, district athletic directors, Texas athletic trainer networks; the UIL already points coaches to internet-based WBGT sources.
3. **Model:** free forever for schools. Possible later district tier (SSO, SMS alerts, integrations) only if it never gates safety features. Open-Meteo commercial terms would apply at that point.
4. **Beyond Texas:** at least 17 other states require WBGT-guided practices; the rules library and AI policy import make each new state a data task, not a rewrite.
5. **Open source:** MIT-licensed so districts can self-host and audit the rules.

---

## 16. Impact And Measurement

| Outcome | Metric | How we measure |
|---|---|---|
| Faster, correct planning | Time from open to practice plan | Product analytics (privacy-preserving, no personal data) |
| Compliance | Rechecks on time (%), modifications confirmed (%) | Practice logs |
| Earlier symptom reporting | Check-ins per practice; time from check-in to adult response | Check-in records (anonymous) |
| Fewer lost practices | Practices moved instead of cancelled | Planner and log |
| Adoption | Schools, teams, weekly active coaches | Accounts |
| Safety | Emergency incidents with cooling started within 10 minutes | Incident records (if any) |

Long-term: fewer heat illnesses and zero heat deaths in participating programs (not measurable in two weeks; stated honestly).

---

## 17. Theme Bridges

One sentence for each likely theme family (used in the tagline, the first 10 seconds of the video, the README and the landing page once the theme is known):

| Theme family | Bridge sentence |
|---|---|
| **Actual theme: an issue in your community, county, state or nation** | "Texas made heat safety mandatory for every outdoor practice this season. Flagline helps every school in our community, county and state follow it, free, so no student athlete dies of a preventable heat stroke." |
| Health, wellness, safety | "Flagline prevents the most preventable death in high school sports by turning heat rules into a practice plan every coach can follow." |
| Climate, sustainability, resilience | "As hotter seasons and smoke days become normal, Flagline helps school sports adapt safely instead of cancelling." |
| Community, social good, tech for humanity | "Flagline gives every school, not just the ones that can afford sensors and trainers, the same heat safety routine." |
| Small problem, real impact; everyday life; efficiency | "A 30-minute recheck is a small task that gets forgotten; Flagline makes sure it never is." |
| Accessibility, equity, barriers | "Flagline removes the cost, expertise and language barriers to heat safety: free, no hardware, English and Spanish." |
| Education | "Flagline teaches athletes the warning signs and gives them a private voice, and keeps learning on the field safe." |
| Future, youth empowerment | "Flagline lets students speak up about how they feel before it becomes an emergency." |
| Sports, games, play | "Flagline keeps the game on: it finds the safe window instead of cancelling practice." |
| Data, AI | "Flagline combines two weather models, on-site readings and calibrated AI to make a life-or-death call clear in five seconds." |
| Time | "Every 30 minutes matters: Flagline runs the clock so coaches can coach." |

---

## 18. How We Present It

### 18.1 Demo video (target 2:40, hard cap 2:59)

| Time | Segment | Content | Criterion |
|---|---|---|---|
| 0:00 to 0:10 | Hook | Sideline shot or photo; line: "This August, Texas made a heat rule mandatory for every outdoor practice. Here is the app that runs it." Product visible immediately. | Impact |
| 0:10 to 0:30 | Problem | One statistic (exertional heat stroke is the top preventable cause of death in high school football; 80% of coaches call the rule too restrictive; no trainer requirement); the as-is workflow in three quick cuts (weather app, chart, forgotten clipboard). | Impact |
| 0:30 to 1:50 | Demo, one flow | Planner: "full pads 4 to 6 tomorrow?" answered; Start Practice; meter photo reading; orange rules; recheck countdown; athlete check-in "confused" triggers the AT alarm; Emergency protocol; level drops, "no auto-extend"; End Practice; PDF log. Spanish toggle and sunlight mode in two seconds. | UX |
| 1:50 to 2:20 | How it works | Architecture diagram: two WBGT sources plus our Liljegren physics port, rules engine with 200+ tests, Jev typed judgments with confidence, offline PWA. | Technical Craft |
| 2:20 to 2:45 | Feasibility | Free data, under $30 a month for dozens of schools, pilot plan, other states via rule import, honest limitation ("forecasts plan, meters decide"). | Feasibility |
| 2:45 to 2:59 | Close | Name, URL, team, theme bridge sentence. | All |

Production: recorded with CleanShot X (or OBS), 1080p, browser zoom 125%, captions, clear USB microphone, no sped-up audio, unlisted YouTube, "Not made for kids".

### 18.2 Devpost story outline

- **Inspiration:** the August 2026 UIL mandate; a Texas student athlete's perspective; the Austin 2023 game heat stroke; coaches' frustration.
- **What it does:** the five verbs, with screenshots.
- **How we built it:** stack, two-source WBGT, Liljegren port, rules as data, Jev question design, Claude vision for photos only, pure shadcn/ui, Balsamiq wireframes, AI-use disclosure.
- **Challenges:** forecast disagreement (2 to 6 F), boundary handling, offline timers, recall-first triage.
- **Accomplishments:** 200+ rule conformance tests, 100% red-flag recall on our test set, bilingual, WCAG 2.2 AA.
- **What we learned:** WBGT physics, UIL rules, calibrated AI for safety.
- **What's next:** pilot schools, other states, calibration with on-site readings, SMS for coaches without smartphones.
- **Built With:** next.js, react, typescript, tailwindcss, shadcn-ui, base-ui, postgresql, neon, drizzle, vercel, typesafe-jev, anthropic-claude, open-meteo, national-weather-service, airnow, recharts, playwright, vitest.

### 18.3 Gallery (8 to 10 images, 3:2)

1. Thumbnail: phone in Practice Mode (orange) on a field background.
2. Quick Check for Austin with the 12-hour timeline.
3. Planner heatmap with Best Window.
4. Ask Flagline answer with parsed chips.
5. Practice Mode with recheck countdown and break timer.
6. Meter photo confirmation.
7. Athlete check-in (Spanish) and the AT alarm.
8. Emergency protocol with cooling timer.
9. The PDF log.
10. Architecture diagram and "wireframe to final UI" (Balsamiq).

---

## 19. Judging Criteria Map

| Criterion | What judges look for | Where Flagline delivers | Evidence we will show |
|---|---|---|---|
| **Impact** | Meaningful problem; clear audience and value | Life safety; brand-new Texas mandate; coaches, band directors, ATs, athletes, parents; equity for under-resourced schools | Official UIL text; CDC, NFHS, KSI statistics; Texas incidents; coach survey |
| **Feasibility** | Achievable and sustainable | Working product on free data; near-zero cost; pilot path; other states via data | Live demo; cost table; rules library; open source |
| **User Experience** | Accessible, intuitive, user-friendly | Five-second actions; color plus icon plus text; sunlight mode; bilingual; offline; one-handed | Video flow; axe reports; Spanish toggle; mobile screenshots |
| **Technical Craft** | Architecture, code quality, originality, innovation | Physics model port; two-source combination; rules engine with conformance suite; durable session workflow; Jev typed judgments with confidence gating; vision plus Jev meter reading; offline PWA | Repo structure, tests and CI badge, architecture diagram, README |

---

## 20. Risks, Assumptions, Open Questions

### 20.1 Assumptions

- The theme allows a health and safety project (see [problem.md](./problem.md) section 7 if not).
- NWS gridpoint WBGT and Open-Meteo remain available during judging (both verified live on Sep 25; we cache and degrade gracefully).
- A teammate can reach a Kestrel or similar meter for a real photo; otherwise we use a clearly labeled sample image.

### 20.2 Risks

| Risk | Likelihood | Impact | Plan |
|---|---|---|---|
| Theme mismatch | Medium | High | Pivot protocol; shared architecture |
| Scope too large | Medium | High | MVP list is strict; Core and Stretch only after MVP is demo-ready (build.md section 20) |
| Liljegren port bugs | Medium | Medium | Test against thermofeel outputs; NWS as the second source |
| Push notifications unreliable on iOS | Medium | Medium | Installable PWA required on iOS for push; in-app timers and vibration always work while open |
| Judges question safety claims | Low | High | Conservative framing; disclaimers; sources everywhere |
| Rate limits (NWS, Open-Meteo) | Low | Medium | Cache by grid cell; stagger; fallbacks |

### 20.3 Open questions

1. Should the lightning hold be school-wide by default or per field? (Default school-wide within 10 miles; configurable.)
2. Should forecast-only practices be allowed to start without a warning when no meter exists? (Yes, it is allowed by UIL; we label it and nudge.)
3. Do we need SMS for coaches without data plans? (Post-hackathon.)
4. Should the calibration bias ever raise planning values automatically? (Only upward, and only when a field has at least 10 paired readings.)
