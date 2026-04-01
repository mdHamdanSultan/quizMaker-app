# QuizMaker — UI / Experience PRD (Phase 1)

This document, together with **`BASIC_AUTHENTICATION.md`** and **`MCQ_CRUD.md`**, is enough to rebuild the same product on a new machine: same flows, same look and feel, and the same data living in **Cloudflare D1** (no third-party API keys are required for core behavior). It intentionally avoids embedding secrets, tokens, or account-specific Cloudflare identifiers.

---

## 1. Purpose

- **Public marketing** at `/` invites users to sign up or log in.
- **Login** (`/login`) and **Sign up** (`/signup`) share one visual system: dark blue/black theme, animated background, glass-style forms.
- After **successful authentication**, the user lands on **`/mcqs`**, the main workspace to **list, create, edit, delete, preview, and attempt** multiple-choice quizzes. All persisted data uses **D1** (see the other two PRDs).

---

## 2. Stack (rebuild checklist)

| Layer | Choice |
|--------|--------|
| Framework | Next.js (App Router), React |
| Styling | Tailwind CSS |
| Cloud | Cloudflare Workers via **OpenNext Cloudflare** adapter |
| Database | **Cloudflare D1** (SQLite), bound in Wrangler as a single D1 database |
| Auth UI | Client forms posting JSON to same-origin API routes |
| Session | HTTP-only cookie with signed payload (details in `BASIC_AUTHENTICATION.md`) |

Do **not** commit session secrets or Cloudflare API tokens; configure them only in local env / Wrangler secrets / dashboard as described in `BASIC_AUTHENTICATION.md`.

---

## 3. Visual language

### 3.1 Palette

- **Background base**: near-black navy (`#020617` and similar slate-950 tones).
- **Accents**: deep blue gradients (e.g. blue-700 → blue-900) for primary buttons.
- **Surfaces**: semi-transparent dark panels (`bg-slate-900/50` class of equivalent), subtle borders (`border-slate-600/40`), light ring (`ring-white/5`).
- **Text**: primary `slate-50` / `slate-100`, secondary `slate-400`, errors `red-400`.

### 3.2 Typography and density

- Page titles: large, semibold (`text-2xl font-semibold`).
- Labels: small (`text-sm`) muted.
- Inputs: comfortable padding (`px-3 py-2.5`), rounded corners (`rounded-xl`).
- Primary actions: full-width buttons on auth forms with gradient and hover brightening.

### 3.3 Motion (background)

- Full-viewport **canvas** behind content (`pointer-events-none`, fixed, `z-0`).
- **Particles** (“droplets”): soft blue radial gradients; each particle **breathes** (radius oscillates with a sine of time + per-particle phase).
- Particles **drift** slowly with velocity; when they leave the viewport they **wrap** so motion is continuous.
- A **static** dark gradient sits under particles (linear + optional radial glows in deep blue) so the page never looks flat gray.

---

## 4. Layout components (conceptual)

### 4.1 `AuthLandingShell`

- Wrapper for `/`, `/login`, `/signup`, and **all `/mcqs/**` routes** (via `QuizAppShell`: same droplet background plus an app header with **QuizMaker**, **My MCQs**, and **Log out**).
- Structure: outer `relative min-h-screen overflow-hidden` with base background color; **animated background** as first child; **content** in `relative z-10`.
- Ensures login, signup, and landing share identical atmosphere.

### 4.2 Floating droplet background

- Client-only canvas animation (no SSR canvas paint).
- Resize on `window.resize`; use `devicePixelRatio` capped (e.g. 2) for sharpness.
- Non-interactive (`pointer-events-none`).

### 4.3 Auth forms (login / signup)

- **Card**: centered, `max-w-md`, glass panel (blur + border + shadow).
- **Login fields**: single “Username or Email”, password; submit shows **“Signing in…”** while the request is in flight.
- **Signup fields**: first name, last name, username, email, password; submit shows **“Creating account…”** while in flight.
- **Cross-links**: “Create one” → `/signup`, “Login” → `/login` (use client navigation, e.g. framework `Link`).
- On **success** (HTTP 2xx): navigate client-side to **`/mcqs`**.
- On **failure**: show inline error from JSON `error` field or a generic message; re-enable the button.
- Optional: request **timeout** (e.g. 60s) and a clear message if the server never responds (often indicates DB not migrated locally).

---

## 5. Page map and UX

| Path | Role |
|------|------|
| `/` | Marketing: hero, feature bullets, CTAs to `/signup` and `/login`. |
| `/login` | Login form; if already authenticated, redirect to `/mcqs`. |
| `/signup` | Registration form; if already authenticated, redirect to `/mcqs`. |
| `/mcqs` | MCQ list + create entry (protected). |
| `/mcqs/create` | Create MCQ (protected). |
| `/mcqs/[id]/edit` | Edit MCQ (protected). |
| `/mcqs/[id]/preview` | Preview / take quiz (protected). |

**Auth header (login/signup only, optional):** thin top bar with back link text “← QuizMaker” to `/`.

---

## 6. End-to-end user stories

1. **New user**: Land on `/` → Sign up → account created and session established → **`/mcqs`** → Create MCQ → save → see it in the list.
2. **Returning user**: `/login` → **`/mcqs`** → edit or preview as needed.
3. **Attempt**: From preview, select an answer → submit → server records attempt in D1 (`mcq_attempts`) and returns correctness (see `MCQ_CRUD.md`).

---

## 7. Copy strings (auth)

| Location | Text |
|----------|------|
| Login title | `Login` |
| Login primary | `Sign in` / loading `Signing in...` |
| Login link | `No account?` + `Create one` |
| Signup title | `Sign Up` |
| Signup primary | `Create account` / loading `Creating account...` |
| Signup link | `Already have an account?` + `Login` |
| Generic client error | `Unexpected error. Please try again.` |
| Timeout hint | Short note pointing to applying D1 migrations locally (see `BASIC_AUTHENTICATION.md`). |

---

## 8. Relationship to data and auth

- UI does **not** send user id in MCQ bodies; the server reads the session and uses D1.
- **All** quiz content and attempts are stored in **D1**; there is no separate BaaS for Phase 1.

---

## 9. Rebuilding from zero (order of operations)

1. Create Cloudflare account and D1 database (name is arbitrary; bind it in Wrangler).
2. Add SQL migrations (users, mcqs, choices, attempts) per `MCQ_CRUD.md` / repo `migrations/`.
3. Apply migrations **locally** for `next dev` (see `BASIC_AUTHENTICATION.md`).
4. Implement session + password hashing per `BASIC_AUTHENTICATION.md`.
5. Implement API routes and MCQ services per `MCQ_CRUD.md`.
6. Apply this document for **pages**, **shell**, **canvas**, and **form** styling and behavior.

Together, these three documents describe the full Phase 1 QuizMaker application.
