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

## Where things stand

| Area | Status |
|---|---|
| Branding / design tokens | Done |
| Login UI | Done (mock — no auth backend) |
| Favicon | Done |
| Light/dark theme | Done (manual toggle + system default) |
| Attendance UI | Not started |
| Results (quiz marks) UI | Not started |
| Authentication (NextAuth + `User` model) | Not started |
| Database (PostgreSQL + Prisma schema) | Not started |
| Deployment | Not started |

## Up next (planned, not yet done)

7. **Attendance UI** — mock data, teacher (marking grid) and student
   (own record) views.
8. **Results UI** — mock data, per-student/per-week marks.
9. **Authentication** — NextAuth + Prisma `User` model (id, name,
   email, hashed password, role, lab, language, created date), wired
   into the login screen built in Phase 4. Admin-created accounts only,
   no self-registration (per `README.md`).
10. **Database** — PostgreSQL + Prisma schema/migrations backing the
    User model and, incrementally, Attendance/Quiz.
11. **Wire UI to real data** — replace the Phase 7/8 mock data with
    live queries once auth + DB are in place.
12. **Deployment** — target per `README.md` is self-hosted on the
    existing Dell R730 (Docker), LAN-only for the pilot's 8 labs; no
    internet exposure needed until onboarding schools outside that
    network. Exact deploy steps to be logged here once reached.

This file gets a new entry per phase as work continues — check back
here for the current state instead of re-deriving it from chat history.
