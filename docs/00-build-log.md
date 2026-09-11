# 00 — Build log

Chronological record of NoorAI's build, phase by phase, from an empty
folder to deployment. Updated as work happens — this is a running log,
not a plan written up front. See `README.md` for the living plan/spec;
this file is the "what actually happened and when."

## Phase 0 — Planning (pre-dates this log)

- `README.md` written: vision, branding (5-color palette, logo mark,
  Literata/Public Sans/JetBrains Mono type system), full feature list,
  architecture decisions (Next.js + Prisma + PostgreSQL + NextAuth,
  multi-tenant layer deliberately deferred), and build order.
- Logo assets delivered: `noorai-mark.svg`, `noorai-logo-light.svg`,
  `noorai-logo-dark.svg`.
- Reference project identified: STLab v1 (`stlab.zip` /
  `Downloads/stlab`), the original single-lab system NoorAI rebuilds
  from — used for feature/UI reference, not forked directly.

## Phase 1 — Direction: UI-first (2026-09-11)

- Original plan read backend-first (login → attendance → results).
  Revised to **UI first → auth → attendance → results**.
- Decision (asked, not assumed): build fresh Next.js UI rather than
  copying STLab's code and re-skinning it — avoids inheriting STLab's
  own documented CSS debt (`stlab/docs/07-design-system.md`: 353
  inline `style={{}}` uses, thin token set, etc.). STLab stays a
  structural/feature reference only.
- Decision: UI-first pages use static/mock data — no DB/API wiring
  until the auth phase.

## Phase 2 — Project scaffold (2026-09-11)

- Scaffolded via `create-next-app`: Next.js 16, TypeScript, App
  Router, `src/` dir, ESLint, no Tailwind (plain global CSS instead,
  matching the token-driven approach below) — into a temp dir, then
  merged into this folder so the existing `README.md` and logo SVGs
  weren't clobbered.

## Phase 3 — Design system foundation (2026-09-11)

- `src/styles/tokens.css` — the 5-color brand palette as CSS custom
  properties, mapped to semantic tokens (`--bg`, `--surface`, `--ink`,
  `--accent`, ...) for light and dark, plus an 8px spacing scale and a
  radius scale.
- `src/styles/base.css` — shared primitives (`.card`, `.btn`, `.field`,
  `.chip`): a small reused class set, no utility framework. Convention
  borrowed from STLab, tokens and values are NoorAI's own.
- Fonts wired in `src/app/layout.tsx` via `next/font/google`: Literata
  (display/wordmark), Public Sans (UI/body), JetBrains Mono (code/data).

## Phase 4 — Login screen, UI only (2026-09-11)

- `src/app/(auth)/login/page.tsx` + `src/components/auth/LoginForm.tsx`.
- No backend yet, by design (UI-first). Submitting previews the
  pending state only; a note tells the viewer sign-in isn't wired up.
- Verified in an actual browser: dev server started, headless Chrome
  screenshots taken in both light and dark to confirm the palette,
  fonts, and card layout render correctly before calling it done.

## Phase 5 — Git + GitHub (2026-09-11)

- `git init`, initial commit (full scaffold + login UI), branch
  renamed to `main`.
- Remote added: `https://github.com/MusaBangash/NoorAI.git`.
- `gh` CLI had two logged-in accounts; switched the active one to
  `MusaBangash` to match the repo owner before pushing (the other,
  `aishacahncollege`, wasn't guaranteed write access).
- Pushed. Commit `096efbb` — "Initial commit: NoorAI project scaffold
  and login UI".

## Phase 6 — Favicon + manual theme toggle (2026-09-11)

- Requested: the browser tab should show the NoorAI mark, and light
  theme should be reachable on demand (not just inferred from OS
  setting).
- `src/app/icon.svg` added (Next.js App Router icon convention, picked
  up automatically); default Next.js `favicon.ico` removed.
- `src/components/shell/ThemeToggle.tsx` — explicit light/dark toggle,
  persisted to `localStorage`, with `data-theme` overrides added to
  `tokens.css` so an explicit choice wins over `prefers-color-scheme`
  in both directions. An inline script in the root layout sets
  `data-theme` before paint to avoid a flash of the wrong theme.
- Committed and pushed. Commit `8d152e6` — "Add NoorAI favicon and
  manual light/dark theme toggle".

## Phase 6.1 — Build log added (2026-09-11)

- This file. Commit `1426562`.

## Phase 6.2 — Login identifier: username, not email (2026-09-11)

- Decision: login by **username**, not email. Reasoning — accounts are
  admin-created with no self-registration or email-based
  verification/reset flow, and not every student has a personal email
  (many won't, especially younger ones). A username assigned by the
  admin works for every role without assuming a resource students may
  not have.
- `email` stays on the `User` model as an **optional** field for staff
  who have one — useful later (report exports, etc.) but not the login
  credential.
- Updated `README.md`'s draft `User` shape and `LoginForm.tsx`
  (`Email` field → `Username`, `type="email"` → `type="text"`).

## Phase 7 — Teacher dashboard (2026-09-11)

- Decision: focus on the **teacher side first**. The dashboard is the
  post-login landing page — data at a glance, to-dos, reminders — not
  a separate "feature" page, so it's built before Attendance/Results
  detail screens even though it depends conceptually on both.
- Scope call (asked, not assumed): dashboard widgets cover **only
  features that exist in the near-term build order** (Attendance,
  Quiz/Results) — no "coming soon" cards for Messages/Doubts/Exams.
  Keeps it from repeating STLab's own flagged mistake (page bloat from
  additive, un-pruned sections).
- New app shell: `src/components/shell/Sidebar.tsx` (nav + user block +
  logout) and `src/app/teacher/layout.tsx`, styled via
  `src/styles/shell.css`. Nav: Dashboard, Attendance, Classes, Results.
- `src/app/teacher/dashboard/page.tsx` — stat row, to-do panel,
  reminders (urgent/important weight variants, borrowed from STLab's
  `.feed-item` idea but scoped fresh here), classes grid, recent
  activity feed. Backed by `src/lib/mock/teacher-dashboard.ts`.
- `src/app/teacher/{attendance,classes,results}/page.tsx` and
  `src/app/student/dashboard/page.tsx` — minimal "not built yet" stubs
  so the nav and the demo student login don't dead-end in a 404.
- `LoginForm` now routes on a successful demo match instead of just
  showing an inline note: `teacher` → `/teacher/dashboard`, `student`
  → `/student/dashboard`.
- Bug fix: `a { text-decoration: none }` had been dropped when
  `globals.css` was rewritten in Phase 3 — nav links were rendering
  underlined. Caught via the dashboard screenshot check, fixed in
  `base.css`.
- Verified in-browser (dev server + headless Chrome screenshot) before
  calling it done.

## Phase 7.1 — Real class structure + broader to-do + responsive fixes (2026-09-11)

- Context from the actual school (Aisha Cahn College of Computer
  Science and Design Technology, a Muslim Hands project): one teacher
  covers one subject across up to **four sections split by shift
  (Morning/Evening) and gender (Boys/Girls)** — not grade-school-style
  single classes. Course catalog (from the program brochure) is
  organized as Future-Ready Digital Careers / Creative & Professional
  Skills / Digital Innovation, each with Foundation (3mo) / Professional
  (6mo) / sometimes Diploma (1yr) tracks.
- Mock data + UI reworked to match: "Your classes" → **"Your
  sections"**, named `AI Engineering — Morning (Boys)` etc. instead of
  `Class 8A`.
- To-do broadened beyond attendance/quiz — now carries a `type`
  (attendance/quiz/meeting/document/other) shown as a small label chip,
  since a teacher's day includes meetings and paperwork too.
- To-do and Reminders panels both got a "Today, [date]" heading, per
  request to scope them to the current day.
- New panel: **Today's schedule** — a timetable of the day's sections
  with time and room, made possible by (and directly motivated by) the
  shift/gender section structure above.
- Responsive pass: tested the dashboard down to the narrowest width the
  local headless-Chrome tooling could actually render (~504px CSS
  layout width — smaller `--window-size` requests were silently
  floored, which briefly looked like an overflow bug via cropped
  screenshots before that floor was diagnosed with a temporary
  `getBoundingClientRect()` debug readout). Fixed for real: merged two
  near-duplicate breakpoints into one `max-width: 640px` block so the
  sidebar-nav wrap and the schedule/to-do row wrap apply together
  instead of leaving a 480–640px gap where neither did; added
  `min-width: 0` where needed to stop flex/grid items from forcing
  their container wider than the viewport. Verified clean at every
  width the tooling could reach (520/640/768/1024/1400).

## Phase 7.2 — Visual polish pass (2026-09-11)

- Feedback: the dashboard "didn't give a good vibe" — not symmetric,
  not professional enough for a product meant to be resold to
  thousands of schools/colleges, not just our own pilot.
- Root cause of the asymmetry: **4 sections in a fixed 3-column grid**
  stranded the 4th card alone on its own row with two-thirds of that
  row empty. Fixed by switching `.class-grid` from CSS Grid to Flexbox
  (`flex-wrap: wrap` + `flex: 1 1 220px` per card) — any card count now
  distributes evenly across rows instead of leaving dead space, and it
  no longer needs per-breakpoint column-count overrides.
- Added a small shared icon set (`src/components/shell/Icons.tsx`) —
  clock, checklist, bell, grid, activity, users, check-circle, pencil —
  used as icon badges on every panel header and stat tile. Previously
  every panel was just a heading over a plain list; the icons give the
  eye something to anchor on and make the panels feel designed rather
  than templated.
- Color-coded the to-do type chips (attendance/quiz/meeting use
  distinct soft tints via `color-mix()` against the existing palette;
  document/other stay neutral) instead of one flat gray chip for every
  type — easier to scan, still restrained (STLab's own design-system
  audit warned against a color-per-feature palette; this reuses the
  existing 5 colors rather than adding new ones).
- Replaced two ad-hoc inline `style={{ marginTop: ... }}` / font-size
  overrides with real classes (`.section-title`, `.dash-block`) so
  section spacing is consistent by rule instead of by one-off patch —
  the kind of drift STLab's own audit flagged (353 inline styles across
  74 files) is worth avoiding from the start here.
- Verified in light mode via headless-Chrome screenshot; dark mode
  spot-checked (Chrome's own forced-dark heuristic double-applies on
  top of our real dark theme in headless testing, which shifts some
  colors — the token-based dark mode itself was already confirmed
  correct on the login screen in Phase 4/6).

## Phase 7.3 — Equal-height panels + bounded lists (2026-09-11)

- Feedback: To-do and Reminders don't look equal — and separately, a
  real concern about scale: a day with ~20 to-dos would make the panel
  grow indefinitely.
- One fix covers both. `.dash-grid`'s items now stretch to match each
  other's height (removed an `align-items: start` from the prior pass
  that had been silently causing the mismatch), `.panel` is a flex
  column, and list content lives in a new `.panel-body` — capped at
  `max-height: 320px` with `overflow-y: auto` and a themed thin
  scrollbar. Net effect: To-do and Reminders are always the same
  height as each other regardless of item count, and neither can grow
  past that cap — a long list scrolls internally instead of pushing
  the page down. Applied the same `.panel-body` treatment to Today's
  Schedule and Recent Activity for consistency.
- Considered pagination instead (user's other suggestion) but a
  dashboard widget is meant to be a glance, not a full list to page
  through — that belongs on a dedicated list/log page later. Bounded
  scroll keeps today's summary compact without hiding anything.
- Stress-tested with a temporary 12-item to-do list to confirm the cap
  holds and the panel stays equal-height with Reminders; reverted to
  the real 6-item mock set before committing.

## Phase 7.4 — Nav polish + Settings page (2026-09-11)

- Sidebar nav items now carry an icon (`src/components/shell/Icons.tsx`
  grew Home/CheckCircle/Users/BarChart/Settings) and the active item
  gets a left accent bar (`box-shadow: inset 3px 0 0 var(--accent)`)
  instead of just a background tint — reads more like a real product
  nav, less like a plain link list.
- Hit a real server/client-component boundary error building this:
  `TeacherLayout` (a server component) was passing icon *component
  references* as props into `Sidebar` (a client component) — React
  can't serialize functions across that boundary. Fixed by making
  `TeacherLayout` a client component too (it was always a trivial shell
  wrapper with no server-only work, so no downside).
- New `/teacher/settings` page: profile photo, editable name/email/
  language (username shown read-only — admin-assigned, per Phase 6.2),
  and a change-password form with basic client-side validation (min
  length, confirmation match). Same UI-only phase as the rest of the
  app — nothing persists to a real backend yet.
- One deliberate exception: the avatar *does* persist, via a new
  `src/lib/useAvatar.ts` hook backed by `localStorage` (same pattern
  `ThemeToggle` already uses). Reasoning: a photo picker that doesn't
  visibly do anything anywhere else would undersell the feature: this
  way picking a photo in Settings actually shows up in the sidebar
  right away, previewing the real end-to-end behavior even before
  there's a database to store it in.
- Sidebar's user block (avatar + name) is now a link to Settings too,
  alongside the dedicated nav item — two entry points to the same
  page, a standard pattern (nav for discoverability, avatar for
  muscle-memory return visits).

## Phase 7.5 — Engagement / rank system design (2026-09-11, not yet built)

Design-only session, ahead of when this actually gets built (README's
Engagement phase, after Curriculum/Homework/Exams) — captured here so
the thinking isn't lost before then. Sparked by discussing Attendance
analytics: the idea is a holistic scorecard instead of judging students
by exam marks alone.

- **Seven categories**: Attendance & punctuality, Classroom
  presence/participation, Academics (quiz/exam marks), Assignments/
  homework, Projects, Teamwork, Initiative. The first two categories
  (Attendance, Academics) are auto-computable once those systems have
  real data; the rest (participation, teamwork, initiative) can't be
  measured automatically and need the teacher to award a point/star in
  the moment — same model ClassDojo built its whole product around.
- **Two-tier system**: per-category **badges** (Bronze/Silver/Gold,
  thresholds TBD per category) are permanent achievements — once
  earned, kept forever, even if a later period is worse. The overall
  **Rank** is a single aggregate computed from a rolling window
  (current term), so it stays meaningful and keeps motivating
  improvement rather than resting on old badges.
- **Rank ladder (decided)** — themed on the brand's own palette/name
  instead of generic tiers, ending on the platform's own name as the
  aspirational top rank: Spark → Ember → First Light → Beacon → Dawn
  Gold → **Noor**.
- **Visibility (decided)**: private per student — each student sees
  only their own rank/badges/progress, never a ranked list of
  classmates. The teacher gets a private class-wide overview. Chosen
  over a public leaderboard because leaderboards tend to discourage
  students who are behind and cut against the "command AI, don't
  depend on it" / individualized-coaching philosophy already in
  `README.md`. "Most-improved" (student vs. their own past self) is
  the safer way to surface positive movement.
- **Rollout is incremental, not one big-bang phase**: ship the
  Attendance badge as soon as real Attendance data exists, the
  Academics badge once Results is real, etc. — matches how this whole
  project is being built (one real data source at a time), rather than
  waiting for every category to exist before any badge does.
- Prior art worth reusing conceptually (not code) from STLab v1:
  `Certificate.tsx` and `/student/certificate/{badge,rank}` routes — a
  printable/shareable certificate on reaching a rank tier is a good,
  concrete "artifact" for a kid to be proud of, worth carrying over
  when this gets built.

## Where things stand

| Area | Status |
|---|---|
| Branding / design tokens | Done |
| Login UI | Done (mock credentials — no auth backend) |
| Favicon | Done |
| Light/dark theme | Done (manual toggle + system default) |
| Teacher dashboard | Done (mock data) |
| Attendance UI (real grid) | Stub only |
| Results (quiz marks) UI | Stub only |
| Classes UI | Stub only |
| Student dashboard | Stub only |
| Authentication (NextAuth + `User` model) | Not started |
| Database (PostgreSQL + Prisma schema) | Not started |
| Deployment | Not started |

## Up next (planned, not yet done)

8. **Attendance UI** — replace the `/teacher/attendance` stub with the
   real daily marking grid (per class, present/absent/late, date jump).
9. **Results UI** — replace the `/teacher/results` stub with weekly
   quiz mark entry.
10. **Classes UI** — replace the `/teacher/classes` stub with roster
    management.
11. **Authentication** — NextAuth + Prisma `User` model (id, name,
    username, optional email, hashed password, role, lab, language,
    created date — see Phase 6.2), wired into the login screen built in
    Phase 4, replacing `DEMO_ACCOUNTS`. Admin-created accounts only, no
    self-registration (per `README.md`).
12. **Database** — PostgreSQL + Prisma schema/migrations backing the
    User model and, incrementally, Attendance/Quiz.
13. **Wire UI to real data** — replace the Phase 7–9 mock data with
    live queries once auth + DB are in place.
14. **Deployment** — target per `README.md` is self-hosted on the
    existing Dell R730 (Docker), LAN-only for the pilot's 8 labs; no
    internet exposure needed until onboarding schools outside that
    network. Exact deploy steps to be logged here once reached.

This file gets a new entry per phase as work continues — check back
here for the current state instead of re-deriving it from chat history.
