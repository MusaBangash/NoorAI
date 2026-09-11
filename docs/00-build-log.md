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
