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

## Phase 8 — Attendance: agreed spec (2026-09-11, not yet built)

Discussed and settled before writing any code, given how much this
touches (marking flow, student view, analytics, and later feeds the
Engagement badges above). Still UI-first with mock data, per the
overall build order.

- **States**: Present / Absent / Late / **Excused** (4, not 3) — kept
  distinct from Absent so an approved absence (e.g. sick leave) doesn't
  look identical to an unexplained one, which matters once this feeds
  attendance-badge eligibility.
- **Marking flow**: teacher picks a section (one of their 4) + a date,
  roster defaults everyone to Present, teacher taps only the
  exceptions — much faster than click-through for 20-30 students.
  Bulk "mark all present / all absent" for edge cases.
- **Backfill window**: today + past 7 days are editable; older than
  that is locked. Balances fixing real mistakes against turning
  attendance into an indefinitely-rewritable log (relevant later once
  badges/rank depend on it).
- **Holidays**: a teacher can mark a whole section+day as **"No
  class"** — excluded from attendance-percentage math, instead of
  either silently counting it or leaving an ambiguous gap that looks
  like a forgotten entry.
- **Student view**: a month heatmap (present/absent/late/excused
  color-coded per day, following STLab v1's approach) plus a stat row
  — overall %, current streak, counts per state.
- **Teacher analytics**: per-section attendance trend, and a flagged
  list of students below a threshold — this becomes the real data
  source behind the dashboard's "Reminders" panel (currently mock).
- **Filters**: section (essential — one teacher, four sections), date /
  date-range (single date to mark, range presets for history), status
  (e.g. "show today's absentees only"), and student search for larger
  sections.

### Export (agreed)

- **Formats**: CSV, XLSX, PDF. **Scopes**: whole attendance (all of a
  teacher's sections), a single section, a single student.
- **Structure**: register grid for section/whole exports — students as
  rows, dates as columns, each cell P/A/L/E — familiar to school staff,
  scans like a paper register. A single-student export is naturally a
  chronological list instead (one row per day) since there's only one
  student.
- **Summary column**: attendance % per student included in
  section/whole exports, not just raw daily marks. Single-student
  export gets header-level stats (overall %, streak, per-status
  counts) instead.
- **Whole-attendance XLSX** uses one workbook, one sheet per section
  (XLSX supports this natively — much better than 4 separate CSVs).
- **PDF is a branded, formatted document** (NoorAI mark, palette,
  clean layout) rather than a plain data table — since this can end up
  as something handed to a parent or filed with admin, it should look
  like an official record, not a debug dump.
- **Date range**: presets (This month / This term / Custom range) on
  the export action itself, so "whole attendance" has a time boundary.
- **Filenames** are descriptive (e.g.
  `AI-Engineering_Morning-Boys_2026-09.csv`), not a generic `export.*`.

## Phase 8.1 — Attendance marking screen (2026-09-11)

Built the first real piece of the Phase 8 spec above — the teacher's
daily marking flow. History/analytics and export come next.

- `src/lib/mock/attendance.ts` — 71 named students across the 4
  sections (matching `classes` in teacher-dashboard.ts), and a
  deterministic (not `Math.random`) seeded history for today + the
  past `BACKFILL_DAYS` (7) days, so the screen opens with realistic
  data instead of empty. Deterministic seeding matters here
  specifically because this page is a client component — `Math.random`
  would produce different values on server-render vs. client-hydration
  and throw a hydration-mismatch error.
- `src/app/teacher/attendance/page.tsx` — section tabs (segmented
  control, one of the teacher's 4 sections), a date input whose
  `min`/`max` enforce the 7-day backfill window directly (no separate
  validation needed), a "No class today" toggle that swaps the roster
  for a banner and excludes that day from the summary, live summary
  chips (count per status), bulk "mark all present/absent," and a
  per-student 4-button status toggle (Present/Absent/Late/Excused,
  color-coded). New `src/styles/attendance.css`, split out rather than
  further growing `shell.css`.
- **Real responsive bug found and fixed**: the roster row only wrapped
  below a hardcoded 640px breakpoint, but the actual pinch point is
  higher — the sidebar is still its full 232px until that same
  breakpoint, so names were getting squeezed to a few pixels wide
  (wrapping mid-word) anywhere from ~640–900px, a range untested by
  the same headless-Chrome floor issue noted in Phase 7. Root-fixed by
  making `.roster-row` (and, proactively, the dashboard's `.todo-row`/
  `.schedule-row`, which share the identical structural risk) wrap
  unconditionally via `flex-wrap: wrap` with a sane `flex-basis`,
  instead of gating wrap behind a guessed pixel breakpoint — the
  browser now wraps exactly when content actually doesn't fit, at any
  width, which is more robust than any specific breakpoint number.
- Verified in both light and dark mode, and at multiple widths
  (700/1400) via headless-Chrome screenshots.

## Phase 8.2 — Multi-subject support + compact register table (2026-09-11)

Feedback on Phase 8.1: the roster felt too long, and the data model
wrongly assumed one subject per teacher.

- **Logic fix — multiple subjects per teacher**: `classes` in
  `teacher-dashboard.ts` gained a `subject` field (previously the
  single hardcoded `teacherSubject` constant stood in for this). The
  mock teacher now teaches two subjects — AI Engineering (4 sections)
  and AI Powered Graphic Designing (2 sections, not gender-split) — to
  actually prove sections don't have to come in fours, and subjects
  don't have to be symmetric. The Attendance page gained a subject-tab
  row *above* the section tabs, but it only renders when a teacher
  actually has more than one subject — the common one-subject case
  stays exactly as simple as it was in Phase 8.1. Rippled into the
  dashboard: header subtitle now says "N subjects" when there's more
  than one, "Today's schedule" rows show subject + section, and
  "Your sections" already worked unchanged since each card labels its
  own subject.
- **UI fix — roster felt too long**: replaced the stacked flex-row
  roster with a real `<table>` — genuinely tabular data (roll, name,
  status), so a table is also the semantically correct choice, not
  just a style pick. Sticky `<thead>` (stays visible while scrolling),
  wrapped in a capped-height (`480px`), scrollable container — same
  bounded-scroll pattern as the dashboard's To-do/Reminders panels
  (Phase 7.3), applied here because it's the same underlying problem:
  a list whose length depends on real-world data (a 20-student section)
  shouldn't dictate the page's height.
  - Narrow screens: the table scrolls horizontally instead of
    wrapping. Deliberate choice, not a fallback — a dense data table
    scrolling sideways on mobile is the standard pattern (Sheets, admin
    panels, banking apps), whereas wrapping the row (Phase 8.1's
    approach) is right for free-form content, not tabular data.
- Renamed `.section-tab(s)` → `.pill-tabs`/`.pill-tab` in
  `attendance.css` since the same segmented-pill control is now reused
  for both subject and section selection — avoided keeping two
  near-identical class sets.

## Phase 8.3 — Section consistency + attendance export (2026-09-11)

Two gaps flagged after trying Phase 8.2: "AI Powered Graphic Designing"
only had 2 loose sections (Morning/Evening, no gender split) while "AI
Engineering" had 4 (Morning/Evening × Boys/Girls) — every subject a
teacher covers now follows the same 4-section structure, so switching
subjects doesn't change what shape of data you're looking at. Split the
existing 26 Graphic Designing students by gender into
`c5`–`c8` (Morning Boys/Girls, Evening Boys/Girls); total student count
(97) was unchanged since it's the same students, just grouped
correctly.

Also built the CSV/XLSX/PDF export agreed on earlier in Phase 8 —
`src/lib/attendance-export.ts`, wired into a new "Export attendance"
panel on the marking screen:

- **Scope**: this section, all sections a teacher covers, or a single
  student — matches the three cases discussed.
- **Range**: the same `today − BACKFILL_DAYS … today` window the
  marking screen can edit (8 days) — there's no data outside that
  window yet, so the export can't promise a longer range than the
  product actually stores.
- **Register-grid** structure for section/whole exports (one row per
  student, one column per date, `%` summary column) — CSV, and XLSX
  via SheetJS (`xlsx` — installed from SheetJS's own CDN tarball,
  `https://cdn.sheetjs.com/xlsx-0.20.3/...`, not the `npm` registry
  build, which is stuck on a version flagged for prototype-pollution/
  ReDoS advisories with no fix; the CDN build has both patched).
  "All sections" XLSX gets one sheet per section plus a Summary sheet,
  since a flat table mixing every subject/section together would be
  harder to file than separate register sheets.
- **List** structure (date → status) for a single student — a grid
  with one data row doesn't help anyone.
- **PDF** via `jspdf` + `jspdf-autotable`: a branded letterhead
  (NoorAI wordmark, register title, date range) above a formatted
  table; "all sections" gets one page per section instead of cramming
  every student onto one.
- Attendance % excludes "No class" and Excused days from the
  denominator entirely (neither counts for nor against a student);
  Present and Late both count as attended.
- Filenames are descriptive:
  `NoorAI_Attendance_<subject>_<section>_<start>_to_<end>.<ext>`.

Not yet built: the student month-heatmap view and the teacher's
per-section trend/analytics — export only covers the raw register for
now.

## Phase 8.4 — Group dashboard sections by subject (2026-09-11)

Flagged right after 8.3 shipped: with 8 section cards now instead of 6,
the flat `.class-grid` (flex-wrap, 220px basis) sometimes broke rows
across subject boundaries — a row could end up with 4 AI Engineering
cards plus 1 Graphic Designing card, then a ragged trailing row of 3,
which read as disarranged since two unrelated subjects visually
bled into the same line.

Fixed by grouping cards under a per-subject heading — each subject
gets its own label (`AI ENGINEERING`, `AI POWERED GRAPHIC DESIGNING`)
and its own independent `.class-grid`, so a row can never mix subjects
and a subject's own 4 cards wrap as a clean 4/row or 2x2, never a 3+1
orphan. Card titles now show just the section (`Morning (Boys)`)
instead of repeating the subject name on every card — the subject
heading already says it once, and the long "AI Powered Graphic
Designing" title had been making some cards visually heavier than
others. Removed the now-unused `<p>` element in `.class-card` (section
name moved into the `<h4>` title).

## Phase 8.5 — History & analytics view, export panel redesign (2026-09-11)

Two asks: the export panel from Phase 8.3 "didn't look good," and
teachers need to *view* attendance over a week/month for a whole
section or one student, with visual analytics — not just mark today
and export a file.

**Export panel** — rebuilt as a proper card: a panel-title with a
download icon, the date range moved to its own header line, "Scope"
and "Student" as labeled fields instead of unlabeled controls stacked
together, and the three format buttons rebuilt as larger cards (icon +
name + one-line hint: "Plain spreadsheet" / "Formatted workbook" /
"Printable register") instead of three flat ghost buttons that gave no
indication of what each format actually produces.

**History & analytics** — a new mode alongside marking, toggled via a
segmented control at the top of the page (`Mark attendance` /
`History & analytics`) rather than a separate nav item, since it's the
same subject/section context, just a different view of it. Reuses the
existing subject/section tabs; adds a Week/Month range toggle and a
student-focus dropdown (whole section vs. one student).

- Extended the mock store: `seedAttendanceStore` now seeds
  `ANALYTICS_DAYS` (30) by default instead of just `BACKFILL_DAYS` (7),
  so the same store backs both the marking screen (still only
  *editable* within the 7-day backfill window — that rule is
  unchanged) and a 30-day read-only history. Viewing old data isn't
  the same commitment as letting someone edit it, so the two windows
  are allowed to differ.
- **Calendar heatmap** (`src/lib/attendance-analytics.ts` +
  `.heatmap-grid` in `attendance.css`): a 7-column CSS grid of day
  cells. Whole-section view colors each day by that day's average
  attendance % (5-step scale, teal → gold → red); single-student view
  colors each day by their actual status. A tooltip on each cell gives
  the exact date and value.
- **Per-student ranked bar list**: sorted lowest-attendance-first so
  at-risk students surface immediately — the same "flag low
  attendance" idea the dashboard Reminders panel already gestures at,
  now with real visual backing. Clicking a row switches the whole view
  to that student's focused heatmap.
- Stat tiles (reusing the dashboard's `.stat-row`/`.stat-tile`
  pattern): section-wide attendance %, present/absent counts, and
  late/excused, or — when focused on one student — their %, current
  streak, and present/absent counts.
- Found and fixed a real color bug while building this: the heatmap's
  "Excused" swatch used `color-mix(..., var(--indigo-night), var(--bg))`,
  but `--indigo-night` *is* `--bg` in dark mode (see `tokens.css`), so
  the mix was a no-op and the cell silently matched the background at
  any percentage. Switched to a dedicated violet (`#7c6fa8`, one more
  hand-picked non-brand hex, same precedent as the `#c65c3b` already
  used for Absent) so all five states — Present/Late/Absent/Excused/No
  class — are distinguishable at a glance in both themes.
- Centralized date helpers (`parseDateKey`, `formatDateShort`,
  `formatDateLong`, `rangeDates`) into `mock/attendance.ts` so the
  export and analytics modules share one implementation instead of two
  copies drifting apart.

## Phase 8.6 — Analytics polish: period navigation, sizing (2026-09-11)

Three fixes requested right after trying Phase 8.5:

1. **Pill-tab text felt cramped against its border** — `.pill-tab`
   padding was `8px 14px` with a 4px container inset; bumped to
   `10px 18px` with a 5px inset across every pill-tab in the app
   (subject tabs, mode tabs, section tabs, export scope, analytics
   range) since they all share the one class.
2. **Heatmap cells were oversized** — `.heatmap-cell` used
   `aspect-ratio: 1` with columns stretching to the full panel width,
   so on a wide screen each day cell rendered as a huge square. Fixed
   height (`grid-auto-rows: 52px`, `38px` under 480px) plus a
   `max-width: 620px` cap on the grid reads as a compact calendar
   strip instead of oversized tiles.
3. **"This week"/"This month" only ever showed the current rolling
   window** — no way to check attendance from 5 weeks ago or a few
   months back. Added period navigation: ‹/› buttons step back/forward
   one full period at a time, a label shows the exact date range (e.g.
   "Aug 1, 2026 – Aug 7, 2026"), and a "Jump to current" link appears
   once you've stepped away from today. Backed by extending the seeded
   mock history from 30 days to a full year (`ANALYTICS_DAYS = 365`,
   decoupled from the week/month period length so bumping one doesn't
   silently change the other) — navigation is clamped to that window
   via `maxPeriodOffset = Math.floor(ANALYTICS_DAYS / periodStepDays)`
   (~52 weeks or ~11 months of headroom). Selecting a different
   section, subject, or range resets back to the current period so you
   don't land on a stale range for different data.

## Phase 8.7 — Real calendar grid, export tied to analytics (2026-09-11)

Three more fixes right after trying 8.6:

1. **Tab spacing still felt tight** — went further than the 8.6 pass:
   `.pill-tab` padding `10px 18px` → `11px 20px`, and — the part 8.6
   missed — the *gap between adjacent pills* was only 4px
   (`var(--space-1)`), which read as tabs running into each other.
   Bumped to `var(--space-2)` (8px) with a larger 6px container inset.
2. **Export was disconnected from what you were looking at** — you'd
   click a format and it exported a fixed 8-day window with no way to
   say "for this week" or "for this month," and the scope/range
   controls lived in a completely separate panel under the Mark tab.
   Moved Export into the History & Analytics view entirely: it now
   shares the exact same section, week/month + period-nav date range,
   and student focus already on screen — the panel literally shows
   "Exporting: Ahmed Khan — Morning (Boys)" or a This-section/
   All-my-sections pill choice, and the date range line always matches
   the heatmap above it. `exportAttendance()` in
   `attendance-export.ts` now takes an explicit `dates: string[]`
   argument instead of deriving a fixed range from `today` internally,
   so it's driven by whatever period the caller is viewing.
3. **Heatmap had no weekday structure** — it was 7 cells per row in
   date order, but nothing tied a column to an actual weekday, so nothing
   about it read as a calendar. Added a Sun–Sat header row above the
   grid and leading blank cells (`parseDateKey(dates[0]).getDay()` of
   them) before the first real date, so every date now lines up under
   its correct weekday column — Aug 12, 2026 (a Wednesday) sits under
   "WED," etc.

## Phase 8.8 — "Month" means an actual calendar month (2026-09-11)

Follow-up to 8.7's calendar grid: "Month" was still a rolling 31-day
lookback (e.g. "Aug 12 – Sep 11"), so the grid straddled two different
months and never ran cleanly from day 1 to day 28/30/31 like a real
calendar page. Reworked the month branch of the analytics date
computation to anchor on an actual `(year, month)` pair — `periodOffset`
now steps back one *calendar month* at a time (not 31 days), and the
date list is generated as `day 1 → the actual last day of that month`
via `new Date(year, month + 1, 0).getDate()`, so February gets 28/29
days, not a padded or truncated 31.

- The period label switches to "September 2026" style (`Intl.DateTimeFormat`
  with `month: "long", year: "numeric"`) for Month, while Week keeps
  the existing "Sep 5, 2026 – Sep 11, 2026" range format — a single
  month name reads better than a same-month date range would.
- The current (partial) month correctly shows real data through today
  and "No data" for the remaining, not-yet-happened days — verified
  September 2026 (today = the 11th) renders days 1–11 with real colors
  and 12–30 as the neutral "no data" swatch, exactly like a calendar
  app showing a month in progress.
- A fully-elapsed past month (August 2026) renders every day 1–31 with
  real seeded data, confirming the `ANALYTICS_DAYS = 365` lookback
  still comfortably covers whole-month navigation.
- Week mode's rolling-window behavior is unchanged — only Month
  switched to real calendar semantics, since "5 weeks before" was
  always meant as a rolling count, not calendar week numbers.

## Phase 8.9 — Make single-student export discoverable (2026-09-11)

Single-student export already worked (Phase 8.7 tied Export to
whatever the analytics student-focus dropdown is set to), but nothing
made that connection obvious — you'd pick a student, then have to
scroll down on your own to notice the Export panel had switched to
them. Fixed the discoverability gap, not the underlying capability:

- Picking a student (via the dropdown or by clicking their row in the
  "Attendance by student" ranked list) now smooth-scrolls the Export
  panel into view automatically (`scrollIntoView` in a
  `requestAnimationFrame` after the state update), so the two are
  visibly connected instead of requiring a manual scroll-and-discover.
- Added an inline hint on the ranked list's title — "Attendance by
  student — click a name to export just their record" — so the
  capability is stated up front instead of left implicit.

## Phase 8.10 — Export UI removed, pending redesign (2026-09-11)

Explicit instruction: remove the "Export this view" section entirely —
the export UI is getting redesigned from scratch rather than iterated
on further. Removed from `teacher/attendance/page.tsx`: the export
panel JSX, `exportAllSections` state, the `doExport` handler, the
`focusStudent` auto-scroll wrapper (Phase 8.9) and its `exportPanelRef`
(reverted the ranked-list row click and student dropdown back to a
plain `setFocusStudentId` call, since there's no export panel to
scroll to anymore), and the ranked list's "click a name to export"
hint. Deleted the now-unused `.export-*` CSS block from
`attendance.css`.

Kept on purpose, not deleted: `src/lib/attendance-export.ts` (the
CSV/XLSX/PDF generation logic — `attendance-analytics.ts` still
imports `attendancePercent`/`STATUS_SHORT` from it, and the export
logic itself wasn't the complaint, just its UI) and the `xlsx`/`jspdf`/
`jspdf-autotable` dependencies, so the redesign has a working engine to
build a new UI on top of rather than starting from zero. Nothing in
the app currently calls `exportAttendance()` — that's expected until
the new UI lands.

## Phase 8.11 — Drop Week, analytics is month-to-month only (2026-09-11)

The Week toggle's rolling 7-day window could still straddle two named
months (e.g. "Aug 29, 2026 – Sep 4, 2026"), which read as inconsistent
right next to Month's real-calendar-month fix from Phase 8.8. Asked
whether Week should become calendar-aligned (clipped at month edges)
or be dropped in favor of month-only navigation — chose to drop it:
simplest, and every period shown is now unambiguously a real calendar
month.

- Removed the `analyticsRange`/`selectAnalyticsRange` state and the
  Week/Month pill-tabs entirely — History & analytics always shows a
  full calendar month now.
- `periodOffset` always means "months back"; `maxPeriodOffset` is a
  single `Math.floor(ANALYTICS_DAYS / 30)` instead of branching on
  range. `analyticsDates` and `periodRangeLabel` lost their week
  branches — always the 1st through the real last day of
  `monthAnchor`'s month, labeled "September 2026" style.
- Nav button `aria-label`s simplified to "Previous month"/"Next month"
  now that there's only one period type to navigate.

## Where things stand

| Area | Status |
|---|---|
| Branding / design tokens | Done |
| Login UI | Done (mock credentials — no auth backend) |
| Favicon | Done |
| Light/dark theme | Done (manual toggle + system default) |
| Teacher dashboard | Done (mock data) |
| Attendance — marking screen | Done (mock data) |
| Attendance — export (CSV/XLSX/PDF) | UI removed, pending redesign (engine still in `attendance-export.ts`) |
| Attendance — history/analytics (heatmap, per-student ranking) | Done (section-level; no cross-section rollup yet) |
| Results (quiz marks) UI | Stub only |
| Classes UI | Stub only |
| Student dashboard | Stub only |
| Authentication (NextAuth + `User` model) | Not started |
| Database (PostgreSQL + Prisma schema) | Not started |
| Deployment | Not started |

## Up next (planned, not yet done)

8. **Attendance — cross-section rollup** — Phase 8.5's history/
   analytics view covers one section (or one student) at a time; a
   "some of my students are struggling across all sections" rollup
   view is still open, along with the student's own read-only view of
   their own attendance (once student auth exists).
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
