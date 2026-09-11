# NoorAI

**Status:** Planning phase, first implementation slice underway (login → attendance → results, backend first).
This document is a living plan — update it as decisions change.

## 1. Vision

NoorAI is a rebuild of STLab (the AI Engineering Lab platform originally built for Muslim Hands Educational Complex, Wazirabad) into a full AI-lab and learning management platform designed to be run by *other* schools and colleges in their own labs — not just one internal tool.

- **Pilot:** our own 8 computer labs, all on the same site/campus, served by the existing Dell R730 server over LAN — same network model STLab v1 already proved out.
- **Long-term goal:** Pakistan has roughly 30 million children out of school. NoorAI exists in service of the right to education for everyone — approached gradually, starting local (our own labs), then expanding to other schools once the pilot is solid.
- **Philosophy carried over from Special Technician's teaching approach:** "command AI, don't depend on it." Wherever AI features touch the platform, a human stays in the loop and reviews/approves — this is structural, not just a curriculum rule (see Delegation Review under AI Layer, below).

## 2. Branding & Identity

- **Name:** NoorAI ("Noor" = light). Replaces the old Ananas/Pineapple Gold identity, which was built for one lab, not a multi-school product.
  - Known naming collisions to be aware of (not disqualifying, but worth knowing): Nooreed (MENA social enterprise), Noor System (Saudi Arabia's Ministry of Education platform), Noor Educational Platform (Oman's Ministry of Education platform), several unrelated NoorAI-named AI companies. Not a trademark clearance — just what a plain search surfaces.
- **Color palette** (5 colors):
  | Name | Hex | Role |
  |---|---|---|
  | Indigo night | `#1B2340` | Primary dark tone / dark-mode surface |
  | Dawn gold | `#D9A441` | Signature accent — logo, primary actions |
  | First light | `#F2C572` | Secondary accent / dark-mode secondary text |
  | Parchment | `#F5F1E8` | Light-mode surface |
  | Deep teal | `#2F6357` | Supporting color (nod to Ananas' Crown Green heritage), light-mode secondary text, large fills |
- **Logo mark:** a radiating "dawn-burst" — 8 evenly-spaced rays plus a center dot, defined once and scaled (not redrawn) for consistency across sizes. Solid gold (`#D9A441`) only. Full mark used throughout; the simplified 4-ray favicon variant explored and **not** adopted — sticking with one mark.
- **Wordmark:** "Noor" in Deep teal (First light in dark mode) + "AI" in Dawn gold.
- **Typography:** Literata (headlines/wordmark — chosen over Fraunces for better on-screen readability) + Public Sans (UI/body text). JetBrains Mono retained from the Ananas system for code/data labels.
- **Themes:** both light and dark supported as standard, not optional.
- **Logo files** (same mark geometry and hex values as above, for consistency — do not redraw by hand elsewhere):
  - `noorai-mark.svg` — icon only, transparent background, for anywhere just the mark is needed
  - `noorai-logo-light.svg` — full lockup for light surfaces ("Noor" in Deep teal)
  - `noorai-logo-dark.svg` — full lockup for dark surfaces ("Noor" in First light)
  - Note: the wordmark text references the Literata font by name but isn't outlined to paths — whoever uses these files needs Literata available, or the text should be converted to paths before use somewhere that can't load it.
- **Per-school branding customization:** not yet decided (logo-only vs. logo + accent color vs. full re-theme) — revisit once real schools are onboarding.

## 3. Feature List

### Multi-tenant foundation (deferred — see Architecture)
- Organization (school), role hierarchy extension (Super Admin / School Admin), school onboarding, cross-school analytics

### Core CRUD
- Students, **Teachers** (priority — see Current Status), Classes, enrollment

### Attendance
- Manual check-in (online-capable, no lab PC required) — building first
- Auto-from-heartbeat (re-added once lab PCs/agent are wired in)

### Quiz (marks only)
- Simple per-student, per-week score. The original trigger for this whole plan. Not the full exam engine.

### Curriculum & homework
- Modules, exercises, submissions, progress tracking

### E-library
- Existing session decks/notebooks/handouts as seed content, tagged to curriculum modules, versioned per school later

### Full exam engine
- Question bank, timer, lockdown-ready, crash-resume, sealed official record (carried over from STLab v1's exam spec)

### Communication
- Messages (teacher broadcasts), Doubts (student Q&A)

### Engagement
- Journal entries, badges, stars, wellbeing check-ins

### AI layer
- Socratic tutor (RAG on curriculum materials, answers with guiding questions rather than direct answers)
- Doubt-answering assistant (RAG-drafted first-pass answers, teacher-reviewed)
- Exam question-bank generator (drafts questions for teacher review)
- Weekly at-risk student briefing (reads attendance/progress/journal/wellbeing data)
- **Delegation Review logging** — wraps all of the above: every AI-assisted answer/grade/draft gets logged and requires human confirmation before it counts, structurally enforcing the "command AI, don't depend on it" philosophy

### Lab hardware (LAN-specific — deliberately last)
- PC registration, heartbeat sessions, activity tracking, screen-view/recording, the Python agent — the one layer genuinely tied to physical lab presence; everything above it works online/anywhere from day one

## 4. Architecture

- **Stack:** same as STLab v1 — Next.js + Prisma + PostgreSQL + NextAuth. Chosen for portability: same codebase runs self-hosted now and can move to a cloud host later without a rebuild.
- **Pilot hosting:** self-hosted on the existing Dell R730, LAN-only, serving all 8 labs (same site/campus, confirmed) — same network model as STLab v1, just scaled from 1 lab to 8. No internet exposure needed yet; "online, access from everywhere" becomes a requirement only once onboarding schools outside our own network.
- **Multi-tenant Organization layer:** explicitly **skipped for the pilot**, to be added later. Decision made knowingly — retrofitting is a real migration cost, but acceptable since it's our own data for now, not multiple schools' data already mixed.
- **AI/RAG layer:** planned as its own internal service the core app calls, not woven into Next.js routes directly — lets AI features be toggled off per school later and keeps model/retrieval choices swappable.

## 5. Build Order

Dependency-driven phase order, agreed before implementation started:

1. **Foundation — Users & Auth** (in progress — see Current Status)
2. Core CRUD — Students & Classes
3. Attendance (manual/online first, auto-heartbeat later)
4. Quiz (marks only)
5. Curriculum & Homework
6. Full Exam engine
7. Communication (Messages, Doubts)
8. Engagement (Journal, Badges, Stars, Wellbeing)
9. Lab hardware (PC registration, heartbeat, activity tracking, screen-view/recording, agent)

AI layer features are woven into the phases above where they plug into an existing model, rather than being one standalone phase.

## 6. Current Status & Next Steps

Backend/database/API first, UI after. Building in this order within Phase 1:

1. **Login (Users & Auth)** — current focus. Prioritizing **Teacher and Student** roles first, since they're who the system is actually used by day to day; Admin comes after.
   - Draft `User` shape: id, name, email (unique), hashed password, role (`STUDENT` / `TEACHER` / `ADMIN`), lab assignment, language preference (en/ur), created date.
   - No self-registration — accounts created by an admin, matching how STLab v1 worked.
   - No Organization field (per Architecture decision above).
2. **Attendance** — next.
3. **Results (quiz marks)** — next.

Nothing beyond this backend slice is being built yet — UI, the rest of the feature list, and the multi-tenant layer all wait until this foundation is solid.
