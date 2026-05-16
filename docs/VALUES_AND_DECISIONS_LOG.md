# XProHub — Values & Decisions Log

**Created:** 2026-05-16
**Purpose:** Living document capturing WHY decisions were made, not just what was decided. Future-Paata, future-chat-Claude, and future-Claude-Code read this to understand the reasoning behind the platform's direction.

**Source:** Conversations between Paata and chat-Claude across the 2026-05-15 and 2026-05-16 sessions, plus Claude Code investigation findings.

---

## 1. MISSION

> Someone who lives next door and worked for plumbing company for 15
> years who could very well fix his issues for the fraction of the cost.

The constituency: people stretched between billing cycles, customers
dreading expensive service calls, workers between jobs or working
under the table because no platform welcomed them.

The light: **"Real Work. Fair Pay. For Everyone."** — lived, not
marketed.

The standard: never cut corners, always tell the truth no matter how
difficult.

---

## 2. WHO THE PLATFORM IS FOR

Each of these scenarios is a design constraint, not marketing. The
platform must work for all of them with equal dignity:

- **The 15-year plumber** — skilled trade worker, between jobs or
  working informally because no platform welcomes them.

- **The skilled-but-out-of-work professional** — laid-off engineer,
  teacher, healthcare worker. Needs dignified bridge income. The
  platform's category breadth means they can use different skills for
  different needs.

- **The student** — around-class-schedule flexibility, skills they
  actually have, not just rideshare.

- **The immigrant** — credentials not recognized, missing US credit
  history. Platform offers a path to verifiable 1099 income that helps
  build credit, housing applications, eventual formal employment. Belt
  System functions as a reference letter.

- **The elder / retired professional** — capable, bored, wants
  meaningful part-time work. Rejected by other gig platforms. The
  literal 15-year-plumber.

- **The hobbyist** — day job + weekend work in something they enjoy.
  Gardening, pet care, organizing — humans with interests, not
  economic units.

- **The customer who saves $300** — hires a neighbor with 15 years of
  plumbing experience instead of a $400 service call.

- **The elderly customer on fixed income** — needs help but can't
  afford full market rates.

### Design implications

- Profile page must gracefully handle no-traditional-credentials AND
  PhD holders — both should look dignified
- Belt System matters precisely BECAUSE traditional credentials aren't
  required
- Workers may bounce between active and dormant periods — account
  suspension should not be punitive
- Fee structure must accommodate "I'm doing this for $40 to make rent"
  without humiliating cuts
- Future internationalization (i18n) is implied by serving immigrant
  communities
- No age discrimination in any UI, copy, or algorithm

---

## 3. PRICING PHILOSOPHY

**10% standard rate** as the public number. Predictability is trust.

Worker-favorable variations are the platform's character, not a
marketing tactic:

- **Holiday Worker Bonus Weeks** — fee drops to 5% for a week, worker
  keeps more
- **Belt-tier discounts** for high-performing workers (Brown Belt and
  above pay reduced platform commission)
- **First-job-free** for Newcomer Belt workers — critical for
  immigrants, formerly incarcerated, returning parents
- **Customer retention reward** — 10th job at 0% fee
- **Senior / accessibility consideration** — bounded mechanism, not
  unbounded

**Avoid:**
- Customer flash sales (trains customers to wait for deals)
- Hidden fees
- Fee creep

**Math reality:** 10% headline rate → ~6.55% net after Stripe
processing fees (~3.45% eaten by payment processing on every
transaction).

**Transparency rule:** Fee must be visible at hire time. "$100 job ·
$90 to worker · $10 platform fee."

**ToS language target:** 10% standard, subject to promotional
reductions and tier-based modifications at platform discretion, with
30-day notice for permanent rate changes.

---

## 4. FUTURE EXPLORATION: COMMUNITY & VOLUNTEERING

Post-v1, not building now. Three directions raised by Paata, worth
capturing for future thinking:

- **Hours-banked volunteering:** Workers donate hours to verified
  nonprofits or community causes. Platform waives fee on volunteer
  work. Workers earn XP, "Community Service" badge visible on profile.

- **Pay-it-forward fund:** Small percentage of every transaction
  (0.5-1%) funds subsidized services for people who can't afford them
  (elderly on fixed income, single parents in emergencies). Worker
  still gets full price — fund covers the gap.

- **Skill-share / mentorship:** Black Belt and Legend workers mentor
  newer workers in their category at no fee. "Mentor" badge. Newer
  workers learn the trade.

**Build this when:** After core marketplace is proven and stable.
These become differentiators establishing XProHub as something other
gig platforms aren't. Not v1 priority.

### Voice-first job posting (post-launch)

Idea (Paata, 2026-05-17): Reduce friction on Post a Job by accepting
spoken input. User taps mic, speaks naturally ("I need someone to help
move a couch next Saturday, I can pay $150"), app uses speech-to-text
+ LLM extraction to pre-fill the job form. User reviews and edits
before posting (never auto-submit).

**Strategic value:**
- Accessibility: serves non-native English speakers, elderly users,
  users with limited literacy or mobility/dexterity issues
- Friction reduction: typing on mobile is high-friction; voice is
  faster for most users
- Platform character: "the marketplace that's actually easy to use"

**Technical sketch:**
- iOS built-in speech-to-text (no API cost for transcription)
- LLM API for structured extraction (OpenAI/Anthropic, ~200-500
  tokens per job, cents per job)
- Always confirmation/edit screen before posting (accuracy > speed)
- Text input remains equally prominent (not all users want voice)
- Privacy Policy must disclose audio data leaves device

**Honest concerns:**
- API dependency (need graceful fallback if LLM service down)
- Cost at scale (cents/day at v1, real money at 10K jobs/day)
- Multi-language extraction quality varies (relevant for immigrant
  constituency)

**Build this when:** Post-NYC-test-launch. After watching real users
struggle with the typed form, decide if voice solves a real complaint.
Not v1.

### Vocabulary: "job" vs "task"

Words shape the platform. The codebase uses "job" as user-facing
vocabulary — that was the right instinct. "Job" carries dignity;
"task" implies mechanical labor. Internal `task_library` vocabulary is
fine (it's the catalog from which jobs are created). The distinction
stays:

- **User-facing:** "job" (Post a Job, My Jobs, job card, job detail)
- **Internal/schema:** "task" (task_library, task_categories,
  task_code, job_post_tasks)

### User-selectable visual themes (post-launch)

Decision (Paata, 2026-05-17): Stay with current Dark Gold direction
through Chunk G and App Store submission. Post-launch, explore
user-selectable visual themes as a platform feature.

Context: A design exploration on 2026-05-17 (file: XProHub Visual
Directions, four directions — Chalk iconography study, Hall refined
dark + mustard, Ledger cream/ink/brick editorial, Ticket
black/bone/safety-orange work-order) revealed that each direction
tells a different story about the platform's mission. All three
"real" directions (Hall, Ledger, Ticket) aligned strongly with the
platform's stated values; none was definitively superior.

Strategic insight: Different visual directions map to different
worker/customer constituencies the platform serves. Themes are not
just aesthetic variety — they are another form of platform welcome.
User opens the app, sees a theme that says "this is for me."

Constituency-to-theme mapping (initial hypothesis, to be validated
post-launch):
- 15-year tradesperson, union worker → Ticket (work-order aesthetic,
  native to their world)
- Retired professional, elderly user → Ledger (broadsheet, dignified,
  familiar)
- Student, younger urban user → Hall or current Dark Gold (modern,
  app-shaped)
- Immigrant, ESL user → Ticket likely (universal work-order language)
- Hobbyist → user's choice

Architectural precedent: CLAUDE.md already references 5
user-selectable feed card themes (Broadsheet, Western, Gold Press,
Dispatch, Chronicle). Theme selection is not a new concept — it's an
expansion of an existing design system pattern.

Pre-launch polish opportunity (optional, between Chunk G and App
Store submission): small refinements within Dark Gold inspired by the
explorations — line-iconography replacing emoji on category cards
(already noted in CLAUDE.md as "Gold Forge custom duotone icons"),
typography hierarchy refinements, ornament restraint per Hall's
framing. Not a redesign — minor polish. Maybe 2-3 days of focused
work.

Build this when: Post-NYC-test-launch. v1.1 or v2 timeframe. Start
with Dark Gold + one alternative based on user feedback; add others
over time. Each theme release is a feature signal — platform vitality.

Strategic framing for the log: "The marketplace where the app looks
like you. Everyone is welcome — the visual choice acknowledges that
respect."

Reference: Design file (XProHub Visual Directions, 2026-05-17) shows
the four directions in detail. File is not in repo — held externally
for future reference.

---

## 5. RISK ASSESSMENT

Five-category framework with probability and severity estimates for v1
(first 100 active users):

### Worker classification lawsuit
- **Probability:** Very low
- **Severity:** Existential
- **Mitigation:** Arbitration clauses + class action waivers in ToS
  from day one. Marketplace safe harbor laws (AZ, FL, IN, IA, KY).
  Genuine worker autonomy in our model (workers set prices, choose
  jobs, control methods, no dispatch).

### Property damage / bodily injury incidents
- **Probability:** Moderate
- **Severity:** High (per incident), manageable (with limits)
- **Mitigation:** ToS liability limits. Future insurance plan.

### Fraud and scams
- **Probability:** High
- **Severity:** Moderate per incident, compounding at scale
- **Mitigation:** Stripe escrow model (funds held until completion).
  Tier 1 proactive filters (see Section 6). Report + block mechanisms
  (G-4, G-5).

### Regulatory / consumer protection
- **Probability:** Low
- **Severity:** Moderate
- **Mitigation:** Accurate Privacy Policy matching actual data
  collection. No earnings claims in marketing — FTC v Arise 2024
  lesson.

### Tax / IRS
- **Probability:** Very low
- **Severity:** Low (process burden, not existential)
- **Mitigation:** Stripe Connect handles 1099-K issuance for workers
  earning above threshold. Platform does not set prices or control
  payroll.

### Real-world data points

| Platform | Incident | Amount/Impact |
|---|---|---|
| Uber + Lyft | NY Attorney General settlement (worker classification) | $328M |
| Uber + Lyft | MA Attorney General settlement | $175M |
| Craigslist | Homicides linked to platform | 130+ since 2007 |
| Facebook Marketplace | Homicides linked to platform | 13+ since pandemic start |
| TaskRabbit | "Happiness Pledge" damage cap | $10K per occurrence (no actual insurance) |
| Thumbtack | Property damage guarantee | $100K |

**Strategic framing:** "We must survive." What kills platforms:
bleeding cash on disputes pre-revenue, one viral bad incident before
moderation infrastructure exists, compounding lawsuits past visibility
thresholds, Apple removal for compliance.

---

## 6. CONTENT MODERATION POSITION

**v1 (locked):** Reactive-only via report (G-4) + block (G-5)
mechanisms, 24-hour SLA via hello@xprohub.com. Defensible for Apple
at low volume.

**BUT:** Reactive-only is fragile. The first abuse incident hits
harder than necessary because nothing catches it before publication.

**Tier 1 proactive protections — ship before NYC test launch:**
1. Profanity/slur word list filter on job titles, descriptions,
   reviews, chat (~50 lines)
2. Rate limiting on job posts and bids (~30 lines)
3. Required minimum content length on job descriptions

**Tier 2 (deferred, post-launch):**
- Image moderation API (AWS Rekognition, Google Vision)
- LLM-based moderation on job/review text (OpenAI Moderation API is
  free)
- Behavioral pattern detection (new accounts posting suspiciously)

**Tier 3 (deferred, at scale):**
- Human moderation team
- Custom ML models

**Future proactive filter target:** Reviews are the first surface for
proactive filtering — they are public and permanent, unlike chat
(private) and jobs (ephemeral after 7-day expiry).

---

## 7. GEOGRAPHIC SCOPE

- **US-only for v1.** Avoids GDPR exposure, simplifies Stripe Connect
  availability, USD-only code.
- **NOT NYC-restricted** — testing focused on NYC but platform
  available to all US users.
- Schema defaults reference New York (`city = 'New York'`,
  `state = 'NY'`) but do not constrain user location.
- International expansion is a Series A problem, not a v1 problem
  (~6-7 figures + 12-18 months to do properly).
- **ToS language target:** "Operates in the United States, available
  in all US states and territories, international users not supported
  in this version."

---

## 8. WORKER CLASSIFICATION FRAMING

**XProHub is a marketplace platform**, not classifieds. Classifieds is
too thin given escrow + fee + dispute mediation — that's active
intermediation, which is the marketplace model.

**Workers are 1099 independent contractors**, not employees.

Strong structural defense:
- Workers set their own prices (`proposed_price` on bids)
- Workers choose which jobs to apply for
- Workers control their own work methods and schedule
- Workers are not required to accept any specific job
- Workers can work on multiple platforms simultaneously
- XProHub does not provide tools, equipment, or training
- XProHub does not set work hours or schedules
- Payment is per-job, not salary or hourly wage from XProHub

The marketplace contractor safe harbor laws in AZ, FL, IN, IA, KY
explicitly protect this model.

**Mandatory mitigation:** Arbitration clauses + class action waivers
in ToS from day one.

---

## 9. LEGAL DOCS STRATEGY

**Privacy Policy + ToS via Termly free tier** — defensible, free,
Apple-accepted.

**Process:**
1. Platform fact sheet (`docs/PLATFORM_FACT_SHEET_FOR_LEGAL.md`) is
   the input to Termly questionnaire
2. Paata reviews fact sheet on paper, revises
3. Claude Code amends fact sheet in single commit
4. Paata completes Termly questionnaire with chat-Claude coaching
5. Host on Cloudflare Pages at `xprohub.com/privacy` and
   `xprohub.com/terms`
6. Swap URLs in `lib/legal.ts` (one-line change per URL)

**Reading list for Paata's education before Termly:**
- TaskRabbit (closest model match to XProHub)
- Airbnb (industry gold standard for marketplace ToS)
- Etsy or eBay (peer-to-peer language baseline)

**Future upgrade:** Real marketplace/gig-platform lawyer ($3K-$10K)
before scaling beyond test mode or taking real money out of test mode.
Termly is the bootstrap solution; professional legal review is the
Series A solution.

---

## 10. OPERATIONAL COMMITMENTS

These practices emerged organically during the Chunk C through G build
and proved their value:

- **Step-by-step approval mode:** Investigate → present findings →
  STOP → approval → draft → STOP → approval → save → verify → STOP →
  approval → commit. Every STOP is a checkpoint where bad assumptions
  get caught.
- **OLD/NEW diffs before every save.** Show exactly what's changing,
  in context. Never describe a change abstractly when you can show it
  literally.
- **Honest pushback in all directions, no ego.** Claude Code pushed
  back on pre-E-7 refactor. Chat-Claude pushed back on lazy
  auto-release (Worker Dignity violation). Paata pushed back on
  Alert.prompt (iOS-only). The code got better each time.
- **Investigation before drafting.** Read the files. Confirm the
  signatures. Check the constraints. Present findings. THEN draft.
- **Real architectural review before each milestone.** The Chunk E
  design doc went through v1 → v2 → three amendments before a single
  line of code was written.
- **Single copyable code blocks** for Claude Code prompts (no inline
  commentary that breaks copy-paste).
- **Short responses, trust Paata's judgment**, explain only major
  points.
- **Chat-Claude commitment:** "I will name both paths
  (cheap-and-easy vs right-but-harder) clearly so Paata can choose.
  I won't sugarcoat the harder path. I won't let the easy path win
  just because we're tired or rushed."

---

## 11. WHAT'S NEXT (snapshot at end of 2026-05-16 session)

**Paata's parallel track:**
- Reviewing platform fact sheet on paper
- Reading TaskRabbit + Airbnb + Etsy/eBay ToS for education
- Then: fact sheet revisions → Claude Code amends in single commit
- Then: Termly questionnaire with chat-Claude coaching
- Then: host Privacy Policy + ToS on Cloudflare Pages, swap URLs in
  `lib/legal.ts`

**Claude Code build track:**
- EAS dev build → iPhone verification of recent commits (biometric
  SecureStore fix, account screen, signup legal text, profile.tsx
  auto-discovery test)
- G-4 + G-5 design pass and build (report + block)
- G-1 implementation (design locked)
- G-9 pre-submission checklist
- Tier 1 proactive moderation filters before NYC test launch
- App Store submission (expect one rejection cycle — normal)
