# Problem: What We Could Solve, The Evidence, And What We Will Build

> Written 2026-09-25. The WarriorHacks 2.0 theme is revealed on **Sep 27, 2026**, so this document does two jobs:
> 1. It surveys every problem we seriously considered, with evidence, and ranks them against the four judging criteria plus originality.
> 2. It commits to one problem now (so design and planning can be finished before the build window opens) **and** defines a strict, fast protocol for confirming or pivoting on Sep 27 once the theme is known.
>
> Companion docs: [info.md](./info.md) (the challenge), [solution.md](./solution.md) (the full solution for the chosen problem), [build.md](./build.md) (the build spec), [research.md](./research.md) (methods and sources).

---

## 1. The Decision In One Paragraph

We will build **Flagline**: a free web app that tells high school coaches, athletic trainers, band directors and PE teachers exactly what their outdoor practice is allowed to look like right now and later today under heat (WBGT) and wildfire-smoke (AQI) rules, runs the practice-day safety routine for them (pre-practice reading, 30-minute rechecks, breaks, gear limits, cooling-zone readiness), and produces the compliance log schools are told to keep. It is built for Texas first because **the University Interscholastic League (UIL) made WBGT monitoring mandatory for every outdoor athletic and marching band activity starting August 1, 2026**, which is the first season this rule has ever been in force, in the judges' own state. About **9,237 high school athletes** suffer time-loss heat illness every year (CDC) and exertional heat stroke is one of the leading causes of death in high school sports. The problem is original on Devpost (only 16 projects mention WBGT), relatable to student judges (they or their friends are athletes and band members living under this rule), visually demoable, technically deep (a real physics model plus a rules engine plus AI), and buildable in two weeks on free public data.

If the Sep 27 theme makes this a poor fit, section 7 defines the pivot, with a ranked backup (the **financial aid offer decoder**) that reuses most of the same architecture.

---

## 2. What We Optimized For

### 2.1 The scoring function

Judges score 1 to 5 stars on four equally weighted criteria ([info.md](./info.md) section 7). We added a fifth factor, **originality versus Devpost saturation**, because student judges who build and judge hackathons pattern-match overdone ideas in seconds.

| Factor | Weight | What earns a 5 |
|---|---|---|
| Impact | 25% | A meaningful, well-evidenced problem with a vivid, named audience and a clear value |
| Feasibility | 20% | A polished, reliable product is clearly achievable in 2 weeks on free data, and it is sustainable after the event |
| User Experience | 15% | An instantly understandable "wow" moment; accessible and intuitive |
| Technical Craft | 20% | Real architecture, non-trivial algorithms, well-integrated AI, originality |
| Originality | 20% | Judges have not seen it before |

### 2.2 Hard constraints

1. **Theme unknown until Sep 27.** The pick must fit the widest range of plausible themes, and the plan must survive a pivot.
2. **Built during the event.** No product code before the reveal ([info.md](./info.md) section 6.1). Planning is allowed.
3. **Two weeks, one team of up to 4.** The scope must allow one polished end-to-end flow plus depth.
4. **Hackathon track.** Must be working code with a live demo, not slides.
5. **Pure shadcn/ui front end** (team decision, see [build.md](./build.md)).
6. **Semantic judgments go through TypeSafe Jev** (team rule); free-form generation only where it is genuinely required.
7. **Safety.** The product must not cause harm when it is wrong, so any safety-critical output needs deterministic rules, conservative defaults and clear human authority.

### 2.3 Lessons from what wins (evidence in [info.md](./info.md) sections 11 and 12)

- Every 2025 WarriorHacks winner was squarely on theme, built during the event, aimed at a **named, specific group with a concrete barrier**, and demoable. Recycled projects never placed.
- Across 17 comparable student hackathons (124 winning projects), about 78% of top-3 placements were AI-powered, but what won was **"AI plus something"**: a real algorithm, CV, speech, retrieval over real documents, on-device models. Chatbot wrappers became honorable mentions.
- Top-3 categories: health (~13), education (~11), climate (~9), civic, legal or safety (~8), accessibility (~6).
- The 2026 panel appears to be mostly student builders who know Next.js and AI. They will open the repo.

---

## 3. What Judges Have Already Seen Too Often

Devpost project-search totals on 2026-09-25 (loose keyword matching, so these are upper bounds on how often judges have seen a topic):

| Topic | Devpost projects | Reading |
|---|---|---|
| mental health | 13,515 | Saturated |
| sign language | 6,434 | Saturated |
| food waste | 4,925 | Saturated |
| carbon footprint | 3,940 | Saturated |
| AI tutor | 3,921 | Saturated |
| fact check | 3,847 | Saturated |
| recycling | 3,731 | Saturated |
| flashcards | 2,740 | Saturated |
| financial literacy | 2,727 | Saturated |
| misinformation | 2,662 | Saturated |
| mental health chatbot | 2,102 | Saturated |
| loneliness | 1,783 | Saturated |
| screen reader | 1,766 | Saturated |
| food bank | 1,181 | Common |
| scam detection | 1,136 | Common |
| study buddy | 1,085 | Common |
| financial aid | 1,061 | Common (mostly scholarship finders) |
| food insecurity | 974 | Common |
| study planner | 816 | Common |
| medication reminder | 775 | Common |
| voter | 736 | Common |
| civic engagement | 600 | Common |
| city council | 320 | Uncommon |
| elderly scam | 224 | Uncommon |
| FAFSA | 67 | Rare |
| IEP | 61 | Rare |
| heat illness | 59 | Rare |
| 504 plan | 32 | Rare |
| **WBGT** | **16** | **Very rare** |
| chronic absenteeism | 9 | Very rare |
| heat stroke athletes | 5 | Very rare |

**Rule we adopted:** avoid any idea whose core loop is "chat with an AI about X" or whose topic count is above ~1,500, unless the theme forces it and we have a sharp twist.

---

## 4. The Candidate Problems (15)

Each candidate lists the problem, who suffers, hard evidence with sources, existing solutions and their gaps, why AI genuinely helps, feasibility, theme fit and risks. Scores are in section 5.

### 4.1 Heat and wildfire-smoke practice safety for school athletics and band (CHOSEN)

**Problem.** Every afternoon from August to October, a coach or band director decides whether and how to run an outdoor practice in dangerous heat, often with a phone weather app. The correct measure is **wet bulb globe temperature (WBGT)**, which combines air temperature, humidity, wind and sun. It is not the number on a weather app. Rules tie WBGT levels to practice length, rest breaks, gear and when to stop. Many schools lack an athletic trainer at every practice, cannot afford sensor hardware for every field, and have no easy way to run the recheck routine or keep records.

**Who suffers.** Student athletes (a record 8,266,244 US high school sport participants in 2024-25, per NFHS), marching band students, PE classes, middle school athletes and the adults responsible for them (coaches, band directors, athletic trainers, athletic directors), plus parents.

**Evidence.**
- **Texas made this mandatory this season.** UIL: "Beginning with the 2026-2027 school year, the use of Wet Bulb Globe Temperature (WBGT) to monitor environmental conditions and guide activity modifications is no longer a recommendation, but a required standard for all UIL outdoor athletic and marching band activities." Effective **August 1, 2026**. Readings must be taken "within 15 minutes prior to the start of practice" and "every 30 minutes during practice". Rapid cooling zones (cold-water immersion) are required at WBGT of 79.7 F (Class 2 regions) or 82 F (Class 3 regions) and above. "It is recommended that schools record and keep on file the WBGT temperatures associated for outside practices." https://www.uiltexas.org/health/info/heat-stress-and-athletic-participation [V, read directly]
- About **9,237** time-loss heat illnesses occur among US high school athletes each year; football's rate is **10 times** the average of eight other sports, and 66% of cases happen in August. CDC MMWR 59(32), 2010. https://www.cdc.gov/mmwr/preview/mmwrhtml/mm5932a1.htm . A record **9** high schoolers died of exertional heat stroke in 2021. https://www.espn.com/espn/story/_/id/38122126/extreme-heat-poor-air-quality-raises-concerns-young-athlete-safety
- Exertional heat stroke is "the No. 1 cause of preventable death in youth, high school and collegiate football players, with an average of nearly three deaths per season"; 97% of those fatalities are linemen and 37% involve punishment drills. NFHS SMAC Task Force, June 2026 (hosted by UIL). https://www.uiltexas.org/files/athletics/Preventing_EHS_in_High_School_Football_Linemen_-_NFHS_SMAC_EHS_Task_Force_-_FINAL_-_6-13-26.pdf
- Texas cases: a 15-year-old Lancaster (Dallas area) player died of heat stroke in August 2025 after conditioning at an **indoor, non-air-conditioned** practice (FOX 4, https://www.fox4news.com/news/lancaster-football-player-dies-preston-malone); an **Austin** Bowie High School player suffered heat stroke in a 2023 game and spent time in the ICU (FOX 7, https://www.fox7austin.com/news/bowie-high-school-football-player-heat-stroke-austin-texas). Band is at risk too: about 400 marching band members with exertional heat illness were reported in the news from 1990 to 2020, with no national band standard (Grundstein and Merchant 2021, doi:10.1007/s00484-021-02183-0), and a university band member died after collapsing at a 91 F game on Sep 5, 2026 (KCRG, https://www.kcrg.com/2026/09/08/iowa-band-member-collapsed-heat-hawkeyes-football-game-taken-off-life-support/).
- **Compliance is hard and contested:** in a Houston Chronicle survey reported by Houston Public Media, nearly **80%** of coaches called the WBGT requirement too restrictive; coaches worry about 4 PM practices falling in peak WBGT, about losing decision authority and about enforcement (TexasHSFootball, Jul 20, 2026, https://www.texasfootball.com/article/2026/07/20/wet-bulb-txhsfb). There is **no UIL requirement to employ an athletic trainer**, so coaches and band directors often take the readings themselves (Houston Public Media).
- **Texas ranks 16th** of 50 states on the Korey Stringer Institute's 2025-26 high school sports safety policy evaluation (61.38%), scoring **2/7 on heat acclimatization** and **0/3 on requiring cold-water immersion before transport**. https://koreystringer.institute.uconn.edu/hsssp-texas/
- **67** exertional heat stroke deaths in US secondary school sports from 1982 to 2022; football accounted for 63 (94%). Stearns et al., *Sports Health*, 2025. https://journals.sagepub.com/doi/10.1177/19417381241298293
- Youth sports parents estimate their kids lost about **one week** of practices and games in 2024 to heat, wildfire smoke, flooding or changing winters. Aspen Institute Project Play. https://projectplay.org/news/project-play-survey-youth-lose-one-week-of-sports-a-year-due-to-climate-change
- About **1,220** Americans die from extreme heat each year; CDC and NWS launched HeatRisk in April 2024 after record 2023 heat. https://www.cdc.gov/media/releases/2024/p0422-heat-protection.html
- States have adopted **nearly 200** heat-illness prevention policies since 2017, many keyed to WBGT. Korey Stringer Institute. https://koreystringer.institute.uconn.edu/state-high-school-sports-safety-policies/
- Wildfire smoke: guidance commonly says modify activity at AQI 101 to 150 and cancel youth practice at 151+; Oregon tightened youth thresholds because smoke harms children at lower exposures. https://oregoncapitalchronicle.com/briefs/oregon-health-officials-issue-tougher-air-quality-guidance-for-youth-sports-outdoor-activities/ , https://nfhs.org/stories/wildfires-and-air-quality-creating-clear-policies
- News coverage of the new rule in the build window's own season: Houston Public Media, Aug 3, 2026. https://www.houstonpublicmedia.org/articles/education/2026/08/03/558445/high-school-football-houston-texas-uil-heat-safety-rule/

**Existing solutions and gaps.**
- **Perry Weather** (on-site WBGT hardware plus subscription, 5,000+ organizations): paid hardware, out of reach for many under-resourced schools and club teams. https://perryweather.com/use-cases/schools-districts/
- **UNC Convergence WBGT forecast tool** (free, the tool UIL itself recommends; has "Texas UIL Class 2/Class 3" flag guidelines): gives a twice-daily forecast WBGT curve with a sun-to-shade band for a location. It does not run the practice: no current-reading workflow, no 15-minute pre-check or 30-minute recheck timer, no sport-specific gear and length rules applied to *your* plan, no log, no saved fields, no alerts, no AQI or lightning, no Spanish, not mobile-first. Its summary banner even uses generic flag names that disagree with UIL's colors (it says "yellow flag" where UIL says orange). https://convergence.unc.edu/tools/wbgt/
- **Zelus WBGT** (phone app): the free tier was discontinued June 1, 2026; compliance documentation needs Pro at $199 per year; a 2025 Korey Stringer Institute study found it read about 1 C cooler than on-site meters and 2 to 3 C cooler at high WBGT, under-calling activity categories (Grundstein et al., GeoHealth 2025, doi:10.1029/2025GH001347).
- **Kestrel 5400** handheld meter: $549, or $629 with the LiNK logging kit. **Perry Weather** in a large district: up to $55,000 in year 1 and $35,000 per year after for 10 sites (about $3,500 per site per year, Tulsa Public Schools board Q&A, Feb 2026).
- **Closest concepts:** *Texas WBGT* (iOS, $0.99, released July 2026, 0 ratings, minimal logging) and *HeatSense* (a student React Native app started Sep 16, 2026 for the Congressional App Challenge, WBGT-first practice management). We differentiate on Texas UIL precision (exact class thresholds, football gear, band, acclimatization), two-source WBGT with honest uncertainty, the timed practice workflow, the compliance log, AQI and lightning in one decision, bilingual support, athlete check-ins and a web app that needs no install.
- **Klimo WBGT, HeatSafe WBGT, HeatAlert, Heat Safety (Qvyshift), Flash Weather AI, WBGT App**, the OSHA-NIOSH Heat Safety Tool (heat index only, not WBGT), NWS WBGT and CDC HeatRisk: generic forecasts or worker-oriented tools, not mapped to a state association's sport and band rules, and without a practice workflow or records.
- **The gap:** nothing free says "at 4:30 pm on *this* field, under *your* state's rules, for *this* team in *full pads*, you may practice 2 hours with 4 breaks of 4 minutes; cooling tubs must be filled; your next reading is due at 5:00", and then keeps the record automatically. Plus AQI in the same decision.

**Why AI genuinely helps (not a gimmick).**
- The safety-critical math and rules stay **deterministic** (WBGT physics model, rule tables). AI does the parts code cannot:
  1. **Plain-language planning:** a coach types "can we do full pads at 4 tomorrow for two hours?" and TypeSafe Jev maps it to typed parameters (intent, gear, activity, time, duration) with calibrated confidence; the rules engine answers. Low confidence asks a clarifying question instead of guessing.
  2. **Reading the meter:** photo of a handheld WBGT meter display gets turned into a logged reading (vision model extracts candidates, Jev verifies plausibility), so logging takes 5 seconds.
  3. **Athlete check-ins:** students report how they feel in their own words (English or Spanish). Jev screens for exertional heat stroke red flags (confusion, collapse, stopped sweating, vomiting) and routes them to the trainer instantly with the "cool first, transport second" protocol. Deterministic escalation thresholds are biased toward safety.
  4. **Policy ingestion for other states:** Jev classifies clauses of a state association's heat policy PDF into the rule schema, so the product scales past Texas.
  5. **Forecast calibration (stretch):** a small regression corrects forecast WBGT toward logged on-site readings per location.

**Feasibility.** High. Free data: Open-Meteo forecast API (temperature, humidity, wind, shortwave radiation; no key), api.weather.gov (no key), AirNow (free key), Nominatim/Open-Meteo geocoding. The WBGT physics (Liljegren method) has open-source reference implementations. The UIL rule table is public. Demo works anywhere in the US with the Texas rules as the showcase.

**Theme fit.** Health and wellness, safety, climate and resilience, community, sports, "small problem real impact", "tech for humanity", access and equity (free for schools without trainers or hardware), everyday problems.

**Risks.** A wrong "safe" answer could contribute to harm. Mitigations: forecast is labeled planning only; an on-site reading is prompted before every practice and every 30 minutes; forecasts use the higher of two independent sources and borderline values show the stricter level's preparations; uncertainty displayed; clear disclaimers; emergency protocol always one tap away; no medical diagnosis. Low privacy exposure (no athlete names required; check-ins can be anonymous by jersey number).

### 4.2 Financial aid offer decoder for first-generation students (BACKUP 1)

**Problem.** College aid offers mix grants, loans and work-study under inconsistent names and often omit or understate the net price. First-generation families without someone to decode them are hit hardest.

**Evidence.**
- About **91%** of colleges fail to include or understate net price in aid offers (41% omit, 50% understate). GAO-23-104708, Dec 2022. https://www.gao.gov/products/gao-23-104708
- **136** different terms were used for the unsubsidized loan across 455 colleges; 24 did not use the word "loan"; 70% of letters lumped aid together without definitions. uAspire and New America, 2018. https://www.uaspire.org/news-events/study-college-financial-aid-award-letters-lack-clarity,-transparency
- The class of 2024 left **$4.4B** in Pell Grants unclaimed; about 830,000 Pell-eligible graduates did not file a FAFSA. NCAN via NASFAA. https://www.nasfaa.org/news-item/36182/NCAN_Unclaimed_Pell_Grants_Totaled_4_4_Billion_for_the_High_School_Class_of_2024
- FAFSA completion reached an all-time high of only **54.7%** for the class of 2026 by May 1, 2026. https://www.ncan.org/Web/Web/News/Class-of-2026-Sets-All-Time-High-FAFSA-Completion-Record.aspx
- **54%** of US undergraduates are first-generation. https://www.crimsonbridge.org/post/center-for-first-generation-student-success-releases-new-national-data
- Student-to-counselor ratio **376:1** in 2023-24 vs 250:1 recommended. https://www.schoolcounselor.org/about-school-counseling/school-counselor-roles-ratios
- The 2027-28 FAFSA opened Sep 23, 2026, right at the start of the build window. https://www.ed.gov/about/news/press-release/us-department-of-education-announces-earliest-fafsa-launch-program-history-second-consecutive-year

**Existing solutions and gaps.** NY HESC comparison worksheet and uAspire guides (manual; you must already know which line is a loan), net price calculators and College Scorecard (pre-offer estimates, not your letter), Edmit (defunct). Gap: upload your real letters and get a normalized, apples-to-apples comparison with flagged missing costs, 4-year debt and questions to email the aid office.

**Why AI helps.** Unstructured PDFs and photos to a strict schema: classify each line (grant, subsidized loan, unsubsidized loan, Parent PLUS, work-study, unknown) with Jev Choice questions and confidence; code computes net price and debt; Scorecard validates cost of attendance.

**Feasibility.** Good (College Scorecard API is free; needs 15 to 20 synthetic letters modeled on published examples).

**Theme fit.** Education, access, equity, "barriers", future, financial literacy.

**Risks.** Financial-advice framing (show math, not advice), PII in documents (process in memory), extraction errors (user confirms every line). Relatability to judges is lower until senior year (Jev rated 0.44 vs 0.74 for heat).

### 4.3 Benefits navigator for students and families

**Problem.** Families and college students miss SNAP, WIC, school meals and Medicaid renewals because rules are complex, recently changed, and paperwork trips them up.

**Evidence.** 47.4M people in food-insecure households in 2023, 13.8M children (USDA ERS ERR-337, https://www.ers.usda.gov/publications/pub-details?pubid=109895). 23% of college students food insecure; ~59% of potentially SNAP-eligible ones did not receive it (GAO-24-107074, https://www.gao.gov/products/gao-24-107074). WIC reached 53.5% of eligible people in 2022 (USDA FNS). March 2026 SNAP participation ~4.7M below the FY2025 average after the 2025 law (CBPP tracker, https://www.cbpp.org/research/food-assistance/snap-tracker-people-are-losing-food-assistance-as-the-harmful-2025). Medicaid unwinding: 25M+ disenrolled, 69% for procedural reasons (KFF, https://www.kff.org/medicaid/medicaid-enrollment-and-unwinding-tracker/).

**Existing.** GetCalFresh (California, SNAP only), PolicyEngine and MyFriendBen (adult screening), findhelp.org, mRelief, USAGov benefit finder. Gap: student-specific SNAP exemptions and reading renewal notices with deadlines.

**Why AI helps.** Notice reading and deadline extraction, mapping free-text life situations to rule inputs, multilingual explanations; eligibility stays in a rules engine.

**Feasibility.** Moderate (rules are hard to get exactly right). **Risks.** Wrong eligibility causes harm; immigration-status sensitivity; PII. Highest impact, hardest to be correct.

### 4.4 Local government and school board decoder for teens

**Problem.** Councils and school boards decide on phones in class, start times, transit and budgets in 4-hour meetings and 300-page agendas teens cannot follow.

**Evidence.** Only **9%** of registered 18 to 34 year olds voted in the last mayoral election in the 30 largest US cities vs 46.7% of those 65+ (Portland State via Knight Foundation, https://knightfoundation.org/articles/portland-state-study-seniors-much-more-likely-cast-ballots-young-votes/). 14% of youth non-voters in 2024 lacked information (CIRCLE, https://circle.tufts.edu/latest-research/barriers-and-hardships-why-some-youth-didnt-vote-2024). Demand proof: citymeetings.nyc draws 10,000+ monthly visitors (https://citymeetings.nyc/about/).

**Existing.** citymeetings.nyc (NYC, adult), Ballotpedia, Vote411, BallotReady (elections). Gap: teen-focused "what changed that affects you and how to comment".

**Why AI helps.** Segmenting transcripts, cited summaries, "affects students?" classification. **Feasibility.** Good (Austin Legistar). **Risks.** Neutrality, hallucinated civic facts.

### 4.5 First-job rights for teen workers

**Problem.** Teens starting part-time jobs do not know hour limits, breaks, minimum wage or how to read a paystub.

**Evidence.** 21.1M 16 to 24 year olds employed in July 2025 (BLS, https://www.bls.gov/news.release/archives/youth_08212025.htm). 5,792 children employed in violation of child labor laws in FY2023, up 88% since 2019 (USAFacts, https://usafacts.org/articles/is-child-labor-increasing-in-us/). 87% of people who experienced an illegal wage practice did not recognize it (SDSU, https://ccre.sdsu.edu/_resources/docs/reports/labor/unpaid-unaware.pdf).

**Existing.** DOL YouthRules!, state youth worker hubs (static). **Why AI helps.** Paystub and schedule extraction, task classification against hazardous-occupation rules. **Feasibility.** Good for federal plus 2 to 3 states. **Risks.** Legal-advice liability, retaliation fears.

### 4.6 Chronic absenteeism re-engagement

**Evidence.** 23.5% of students chronically absent in 2023-24 (AEI, https://www.aei.org/education/the-latest-chronic-absenteeism-numbers/); parents underestimate absences (Attendance Works); personalized nudges cut chronic absence 10 to 15% in an RCT of 28,080 students (Rogers and Feller). **Gap.** Free tooling for small districts. **Risks.** FERPA, no real data (synthetic demo), surveillance feel, low student excitement.

### 4.7 IEP/504 plain-language navigator for families

**Evidence.** 7.5M students (15%) served under IDEA in 2022-23 (NCES, https://nces.ed.gov/programs/coe/indicator/cgg/students-with-disabilities/); language barriers for families (ERIC EJ955935; Understood.org). **Existing.** AIEP (open source, Burnes Center), free multilingual IEP tools. **Risks.** Highly sensitive child data, "already built" critique.

### 4.8 Accessible course materials fixer (ADA Title II)

**Evidence.** DOJ Title II rule requires WCAG 2.1 AA for public schools and universities, deadlines extended to Apr 26, 2027 and Apr 26, 2028 (https://upcea.edu/doj-extends-accessibility-deadline-to-april-2027-policy-matters-april-2026/); 95.9% of top home pages fail WCAG checks (WebAIM Million 2026, https://webaim.org/projects/million/); FTC fined accessiBe $1M for overclaiming AI compliance (https://www.ftc.gov/news-events/news/press-releases/2025/01/ftc-order-requires-online-marketer-pay-1-million-deceptive-claims-its-ai-product-could-make-websites). **Risks.** Teacher-facing (less relatable), overclaiming.

### 4.9 Elder scam defense with student tech buddies

**Evidence.** 147,000+ victims over 60 reported $4.8B in losses to FBI IC3 in 2024 (https://www.ic3.gov/AnnualReport/Reports/2024_IC3Report.pdf). **Risks.** Saturated ("scam detection" 1,136) with many look-alikes.

### 4.10 Teen sleep-aware workload planner

**Evidence.** 77% of high schoolers slept under 8 hours on school nights in 2023 (CDC YRBS, https://www.cdc.gov/yrbs/youth-health-in-focus/sleep.html). **Risks.** Planners are common; value is mostly scheduling, not AI.

### 4.11 Youth belonging and third-place matcher

**Evidence.** Only 55% of high schoolers felt close to people at school in 2023, down from 62% in 2021 (EdWeek on CDC YRBS). **Risks.** Cold start, minors meeting strangers, saturated.

### 4.12 Misinformation and AI-image literacy

**Evidence.** 35% of teens report being deceived by fake content (Common Sense Media 2025). **Risks.** Saturated, unreliable detectors.

### 4.13 Teen financial literacy

**Evidence.** 17% of US 15-year-olds below baseline financial literacy (OECD PISA 2022). **Risks.** Saturated, looks like a toy.

### 4.14 Mental-health chatbot or AI study buddy (control: avoid)

**Evidence of need.** 40% of high schoolers had persistent sadness or hopelessness in 2023 (CDC YRBS). **Why avoid.** Most saturated category; Common Sense Media and the APA warn against AI companions for minors (https://www.apa.org/topics/artificial-intelligence-machine-learning/health-advisory-ai-adolescent-well-being).

### 4.15 Food rescue marketplace

**Evidence.** 70M tons of US surplus food in 2024 (ReFED 2026). **Risks.** Most saturated ("food waste" 4,925), two-sided cold start, food-safety liability.

---

## 5. Scoring

### 5.1 Research rubric (analyst scores, 1 to 5)

| Rank | Candidate | Impact | Feas. | UX | Craft | Orig. | **Weighted** |
|---|---|---|---|---|---|---|---|
| **1** | **Heat and smoke practice safety** | 4 | 5 | 5 | 4 | 5 | **4.55** |
| 2 | Financial aid offer decoder | 5 | 4 | 4 | 5 | 4 | **4.45** |
| 3 | Benefits navigator | 5 | 3.5 | 4 | 4.5 | 4 | 4.25 |
| 4 | Local government decoder | 4 | 4 | 4 | 5 | 4 | 4.20 |
| 5 | First-job rights | 4 | 4 | 4 | 4 | 5 | 4.20 |
| 6 | Chronic absenteeism | 4.5 | 3 | 3.5 | 4 | 5 | 4.05 |
| 7 | IEP/504 navigator | 4.5 | 4 | 4 | 4 | 3.5 | 4.03 |
| 8 | Accessible materials fixer | 4 | 3.5 | 4 | 5 | 3.5 | 4.00 |
| 9 | Elder scam defense | 5 | 4 | 4 | 4 | 2 | 3.85 |
| 10 | Sleep planner | 4 | 5 | 4 | 3.5 | 2.5 | 3.80 |
| 11 | Belonging matcher | 4.5 | 3.5 | 4 | 3 | 2 | 3.43 |
| 12 | Misinformation literacy | 4 | 4 | 4 | 3.5 | 1.5 | 3.40 |
| 13 | Financial literacy | 3.5 | 5 | 4 | 3 | 1.5 | 3.38 |
| 14 | Mental-health chatbot (control) | 5 | 4 | 4 | 2.5 | 1 | 3.35 |
| 15 | Food rescue | 4.5 | 3.5 | 4 | 3 | 1.5 | 3.33 |

### 5.2 Independent check with TypeSafe Jev

To reduce our own bias, we asked **Jev** (`jev-latest`, which resolved to `jev-1.13.0`) the same questions in a structured way: one request per candidate, with the event context and a one-paragraph candidate description as `state`, and eight atomic questions (five Score questions on 5-level rubrics mirroring the criteria, and three Noul yes/no questions). Composite = weighted sum of the five Score answers, each rescaled from Jev's 0 to 4 level index to a 0 to 5 scale, with the weights in section 2.1. The script and raw outputs are reproduced in [research.md](./research.md) sections 4.2 and 4.3.

| Candidate | **Jev composite** | Impact | Feas. | UX | Craft | Orig. | Relatable to judges (p) | AI essential (p) | Harm risk if wrong (p) |
|---|---|---|---|---|---|---|---|---|---|
| Financial aid offer decoder | **4.07** | 3.89 | 2.95 | 3.58 | 2.95 | 2.84 | 0.44 | 0.84 | 0.81 |
| **Heat practice safety** | **3.87** | 3.50 | 2.97 | 2.97 | 2.97 | 2.94 | **0.74** | 0.66 | 0.87 |
| First-job rights | 3.73 | 3.73 | 2.81 | 3.19 | 2.48 | 2.56 | 0.60 | 0.71 | 0.81 |
| Benefits navigator | 3.64 | 3.64 | 1.99 | 3.09 | 3.01 | 2.69 | 0.56 | 0.78 | 0.86 |
| Local government decoder | 3.58 | 3.07 | 2.76 | 2.82 | 2.94 | 2.68 | 0.69 | 0.72 | 0.54 |
| Sleep planner | 3.28 | 3.21 | 3.04 | 3.05 | 2.15 | 1.64 | 0.89 | 0.56 | 0.39 |
| IEP navigator | 3.21 | 2.99 | 2.60 | 2.97 | 2.28 | 2.01 | 0.30 | 0.71 | 0.76 |
| Mental-health chatbot (control) | **2.43** | 2.80 | 2.95 | 2.57 | 1.34 | **0.02** | 0.84 | 0.55 | 0.84 |

(Score columns are on Jev's 0 to 4 level index; composites are on a 0 to 5 scale.)

**Reading the two rankings together:**
- Both methods put the **same two candidates at the top** (heat safety and the aid decoder) and the control idea at the bottom (Jev gave the mental-health chatbot an originality score of 0.02 out of 4 with 0.98 confidence). The instrument behaves sensibly.
- Jev slightly prefers the aid decoder on Impact and "AI is essential". It prefers heat safety on **relatability to student judges** (0.74 vs 0.44) and originality.
- Both flag **harm-if-wrong** as high for both leaders. That is the price of meaningful problems, and it dictates the architecture: deterministic rules for anything safety-critical, AI only for interpretation, human authority at every decision (section 6.4).
- Jev rated heat safety's "AI is essential" at only 0.66. We took that seriously and **strengthened the AI story** in the solution (typed natural-language planning, meter-photo reading, athlete check-in triage, multi-state policy ingestion), so AI is load-bearing without touching the safety math.

---

## 6. The Chosen Problem

### 6.1 Problem statement

> **Every outdoor practice in Texas now has to follow a WBGT heat-safety protocol, but the people running those practices are coaches and band directors, not meteorologists or athletic trainers. They have no free, fast, reliable way to know what the rules allow for their field, their team and their plan right now and later today, to run the 30-minute recheck routine without forgetting, to act correctly when an athlete shows warning signs, and to prove afterward that they did it right. The cost of getting it wrong is a preventable death.**

### 6.2 The people

| Persona | Who | Their day | What hurts today |
|---|---|---|---|
| **Coach Ramirez** (primary) | Head football or cross-country coach at a Texas 5A/6A school or a small rural 1A/2A school | Teaches all day, runs practice 3:45 to 6:00 pm, 60 to 120 athletes | Checks a weather app, guesses; UNC tool gives a number but not "what does my practice look like"; forgets 30-minute rechecks when practice gets busy; no records |
| **Ms. Nguyen, band director** (primary) | Marching band director, 150+ students on a hot parking lot | Rehearsal 4:00 to 7:00 pm; competition season Sep to Nov | UIL rules now cover band too; band culture is less used to heat protocols; no trainer on site |
| **Jordan, athletic trainer (AT)** (secondary) | One AT covering several sports on several fields | Moves between fields; responsible for emergencies | Cannot be at every field; needs to see every field's status and every athlete red flag in one place |
| **Athletic director** (secondary) | Oversees compliance across a campus or district | Signs off on the emergency action plan | Needs evidence that every practice followed the protocol |
| **Student athlete / band student** (end beneficiary and a user) | 14 to 18 years old | Practices in the heat | Pressured not to "complain"; no low-friction, private way to say "I feel wrong" |
| **Parent** (viewer) | Wants to know practice is safe | Gets texts about cancellations | No visibility into conditions or decisions |

### 6.3 Current workflow and failure points (as-is)

1. **Planning (morning or the day before):** coach glances at a weather app (air temperature and maybe heat index, which is not WBGT). *Failure:* wrong measure; no plan to move practice earlier or change gear.
2. **Pre-practice (15 minutes before):** UIL requires a WBGT reading. If the school has a meter, someone must set it up 30 minutes early. If not, the coach uses an internet source. *Failure:* nobody owns the task; reading is skipped or taken at the wrong spot.
3. **Translating the reading into rules:** look up the zone in a chart for the right regional class (Class 2 vs Class 3), then apply practice length, work to rest ratio, gear and cooling-zone requirements. *Failure:* wrong class, wrong row, forgetting gear limits.
4. **During practice (every 30 minutes):** retake the reading and adjust. *Failure:* forgotten in the flow of practice, especially as conditions change (clouds clear, wind drops).
5. **Warning signs:** an athlete feels dizzy, confused, stops sweating. *Failure:* delayed recognition; transport before cooling, which is the wrong order for exertional heat stroke.
6. **Records:** UIL recommends keeping WBGT records on file. *Failure:* no record, or a clipboard lost in a locker room; no evidence in an incident review.
7. **Smoke days:** AQI is a separate app and a separate decision. *Failure:* not checked at all.

### 6.4 Root causes

- **Wrong tool for the job.** Consumer weather apps show air temperature and heat index, not WBGT, and do not know sport rules.
- **Hardware cost and availability.** Meters cost hundreds of dollars and need a person to run them; full systems are subscriptions.
- **Cognitive load at the worst time.** The recheck routine competes with coaching 100 teenagers.
- **Rules are tables, not workflows.** The UIL chart is a lookup table; nobody turns it into a timeline for today's practice.
- **No closed loop for athlete symptoms.** Students under-report, and adults may not recognize early signs.
- **No records by default.** Compliance evidence is an afterthought.

### 6.5 Success metrics (how we will know it works)

| Metric | Target for the demo and pilot |
|---|---|
| Time from opening the app to "what my practice must look like" | Under 10 seconds (one tap from the home screen) |
| Time to log an on-site reading | Under 5 seconds (keypad or meter photo) |
| Recheck adherence | 100% of 30-minute rechecks prompted; missed rechecks visible in the log |
| Rule correctness | 100% agreement with the UIL chart (Class 2 and Class 3 lower bounds 79.7/84.7/87.7/89.8 and 82.0/87.0/90.1/92.1 F) on a 200-case test table (unit tests) |
| WBGT estimate honesty | Two independent sources (NWS gridpoint WBGT and our own Liljegren model on Open-Meteo inputs) shown as a range; the flag always uses the higher value; every number labeled forecast or measured with its source and issue time |
| Red-flag check-in routing | 100% of red-flag test phrases routed to "emergency" (recall first); false alarms allowed |
| Accessibility | WCAG 2.2 AA on core flows; full keyboard support; screen-reader labels; English and Spanish |
| Records | One-click PDF log per practice with every reading, decision and modification |

### 6.6 Why this problem wins, criterion by criterion

- **Impact (25%).** Life-safety problem with official, current evidence; a named audience (every UIL member high school and junior high with outdoor athletics or a marching band, and the 8.27 million US high school sport participants nationally); a brand-new mandate in the judges' own state that creates immediate, concrete value. It also serves equity: schools without trainers or hardware budgets benefit most.
- **Feasibility (25%).** Free public weather and air-quality APIs, published rules, open-source physics references; runs as a web app on free hosting; no hardware; sustainable at near-zero cost per school. Clear adoption path (coaches already use phones at practice; UIL already points to internet-based WBGT sources).
- **User Experience (25%).** One glanceable answer (a colored flag with text, not color alone), a practice timeline, a big recheck timer, a 5-second log, bilingual, dark-mode and sunlight-readable, one-handed on a phone on a sideline. The demo has a visceral moment: the timeline turns from green to red as the afternoon heats up and the plan rewrites itself.
- **Technical Craft (25%).** A real physics model (Liljegren WBGT with solar geometry), a typed rules engine with tests against the official table, uncertainty handling, confidence-gated AI (Jev) for natural language, meter photos, symptom triage and policy ingestion, an audit log, offline-tolerant PWA. Original: very few Devpost projects exist in this space.

### 6.7 Risks and mitigations

| Risk | Mitigation |
|---|---|
| Forecast WBGT differs from on-site reality (forecast apps read 1 to 3 C cool at high WBGT) | Forecast is labeled "planning"; the logged on-site reading drives the live decision; forecasts combine two independent sources and the flag uses the higher one; values within 1.0 F of the next level are marked "borderline" and the stricter level's preparations are shown; we show the range |
| Users trust the app over their own judgment | Copy and UI always make the human the decision-maker; "Stop practice" is always available; emergency protocol is one tap away |
| Rule table errors | Rules are data, versioned, with source links and a 200-case unit test table built from the official chart |
| AI misreads a plan or a photo | Jev confidence gating: low confidence triggers a clarifying question or manual entry; every AI-derived value is shown and editable before it is used |
| Symptom triage misses a red flag | Deterministic keyword and Jev Noul checks are combined with an OR; thresholds favor recall; any "yes" routes to the emergency protocol; the app never says an athlete is fine |
| Minors' data | No names required; jersey numbers or initials; check-ins can be anonymous; data minimization and retention limits |
| Theme mismatch | Section 7 protocol |

### 6.8 What we are explicitly not doing

- Not a medical device, not a diagnosis tool, not a replacement for an athletic trainer or an on-site meter.
- Not a general weather app or a chatbot.
- Not hardware.
- Not all 50 states on day one: Texas UIL fully, plus a generic ACSM/NATA regional-category mode for any US location, plus the AI policy-ingestion path to show how other states get added.

---

## 7. Theme Contingency Protocol (Sep 27)

### 7.1 Theme-fit matrix

Fit scale: 3 = strong and natural, 2 = good with a clear framing sentence, 1 = stretch, 0 = off-theme.

| Likely theme family | Heat practice safety | Aid decoder | Benefits navigator | Civic decoder | First-job rights |
|---|---|---|---|---|---|
| Health, wellness, safety | **3** | 0 | 2 | 0 | 2 |
| Climate, sustainability, environment, resilience | **3** | 0 | 1 | 1 | 0 |
| Community, connection, social good, tech for humanity | **2** | 2 | **3** | **3** | 2 |
| Small problem, real impact; everyday life; efficiency | **3** | 2 | 2 | 2 | **3** |
| Accessibility, inclusion, equity, barriers | 2 | **3** | **3** | 2 | 2 |
| Education, learning | 1 | **3** | 1 | 2 | 1 |
| Future, opportunity, youth empowerment | 2 | **3** | 1 | **3** | **3** |
| Finance, business | 1 | **3** | 1 | 0 | 2 |
| Sports, games, play, recreation | **3** | 0 | 0 | 0 | 0 |
| Data, AI, prediction (open-ended tech) | **3** | 2 | 2 | 2 | 1 |
| Time, speed, "in the moment" | **3** | 1 | 1 | 1 | 1 |
| Abstract prompt (for example "Into the Skies", "Retro") | Case by case | Case by case | Case by case | Case by case | Case by case |

### 7.2 Decision procedure (run within 2 hours of the reveal)

1. **Capture the exact theme text** from Devpost updates, the organizer site, Discord and Instagram. Paste it into `docs/info.md` section 0.
2. **Score fit with Jev.** Run the theme-fit script ([research.md](./research.md) section 4.4): `state` = theme text plus each candidate's one-paragraph description; questions = a Score "How directly does this candidate answer the theme?" (0 to 4) and a Noul "Would a judge consider this on-theme without explanation?".
3. **Apply the rule:**
   - Heat safety matrix fit is 3 (section 7.1), or Jev fit score is at least 3.0 on its 0 to 4 index, or the Jev Noul is at least 0.6: **build Flagline** (default).
   - Heat safety matrix fit is 2 (Jev fit about 2.0 to 3.0) and a single framing sentence makes it obviously on-theme: **build Flagline** with that sentence as the tagline and first line of the video.
   - Otherwise: switch to the backup with the highest fit (usually the aid decoder for education, access or finance themes; the civic decoder or benefits navigator for community themes).
4. **Write the one-sentence theme bridge** ("Flagline answers *<theme>* by ...") and put it in the Devpost tagline, the first 10 seconds of the video, the README and the landing page.
5. **Lock the name, domain and repo**, then start the build (after the reveal only).

### 7.3 Why a pivot stays cheap

The solution architecture ([solution.md](./solution.md) section 8, [build.md](./build.md)) is deliberately split into reusable layers: a Next.js + shadcn/ui shell, a typed deterministic rules engine, a Jev "interpretation layer" (natural language to typed parameters with confidence gating; document or photo to typed fields; red-flag screening), an audit log and a PDF report generator. The aid decoder reuses every layer (letters instead of weather, aid rules instead of heat rules, a comparison report instead of a practice log). A pivot loses only the domain code, not the platform or the design system.

---

## 8. Evidence Quality Notes

- The central claim (UIL mandate, thresholds, timing, record-keeping recommendation) was read directly from the UIL page on 2026-09-25.
- National incidence and mortality figures come from CDC MMWR (2010, a national estimate of 9,237 time-loss heat illnesses per year based on 2005 to 2009 surveillance), a peer-reviewed 2025 review (Stearns et al.), the NFHS 2026 task force and the Korey Stringer Institute. The CDC figure is older surveillance; we present it as an estimate.
- Devpost saturation counts are loose keyword matches, not exact duplicates; we use them as relative signals.
- Jev scores are model judgments over short descriptions. We use them as an independent sanity check, not as ground truth. Both methods agree on the top two and the bottom.
- The full domain dossier (UIL chart values by class, UNC tool details, WBGT computation, AQI guidance, competitors, Austin climate) is summarized in [solution.md](./solution.md) and sourced in [research.md](./research.md).

### 7.4 Outcome (Sep 28, 2026)

The theme is **"Create a project that solves an issue in your community, county, state, or nation."**

Jev theme-fit results (`jev-1.13.0`, script in [research.md](./research.md) section 4.4):

| Candidate | Fit (0 to 4) | Confidence | On-theme without explanation (p) |
|---|---|---|---|
| **Flagline heat safety** | **3.77** | 0.81 | **0.91** |
| Benefits navigator | 3.75 | 0.79 | 0.90 |
| First-job rights | 3.59 | 0.66 | 0.88 |
| Aid offer decoder | 3.43 | 0.53 | 0.88 |
| Civic decoder | 3.43 | 0.60 | 0.89 |

Decision: **build Flagline** (rule: fit at least 3.0 or Noul at least 0.6; both met, and Flagline is the top candidate). Theme bridge used everywhere (tagline, first 10 seconds of the video, README, landing page):

> "Texas made heat safety mandatory for every outdoor practice this season. Flagline helps every school in our community, county and state follow it, free, so no student athlete dies of a preventable heat stroke."
