# Basic Authentication

This document describes the first-version authentication model for QuizMaker: user accounts, sign-up and login, how sessions tie to API routes, and how everything persists in **Cloudflare D1**. It is written so you can rebuild the same behavior on a new device together with **`MCQ_CRUD.md`** and **`UI.md`**. **Do not** paste Cloudflare API tokens, account IDs, or production secrets into these docs—use placeholders and your own dashboard or Wrangler setup.

## Goals

- Users can **sign up** and **log in** with credentials stored in **D1** (Wrangler binding name is configurable; the app expects one D1 binding for the QuizMaker schema).
- **Attempts** on MCQs are always associated with an authenticated **user ID** (see `MCQ_CRUD.md`).
- Passwords are **never stored in plain text**; only a strong one-way hash is persisted.
- Session handling is explicit enough to swap for JWT/OAuth/cookies managed by a dedicated library without rewriting the whole domain model.

## User Model

| Field | Notes |
|--------|--------|
| **User ID** | Stable primary key (recommended: UUID/text id, or integer with `AUTOINCREMENT` in D1). Exposed in app code as `userId`. |
| **First name** | Required for display and future profile features. |
| **Last name** | Required for display and future profile features. |
| **Username** | Unique, human-readable identifier. |
| **Email** | Unique; may match username for users who prefer email-as-login. Validation: basic email format server-side. |
| **Password** | Stored only as a **password hash** (see below). |

### Uniqueness and login identifier

- Enforce **unique** constraints on `username` and `email` in the database.
- **Login** may accept **email or username** in a single field (recommended UX), resolved server-side to one user row.

## Password Storage

- On sign-up (and password change, when added later): hash with a modern, slow-by-design algorithm (**Argon2id** preferred if available in the Workers runtime; otherwise **bcrypt** with a sensible cost factor).
- Store only: `password_hash`, optional `password_hash_algorithm` / version column if you want safe future algorithm rotation.
- Never log passwords or hashes in application logs.

## Session Model (v1)

A minimal, swappable approach:

- After successful login, issue a **signed session token** (e.g. JWT or opaque id) stored in an **HTTP-only, Secure, SameSite=Lax** cookie.
- Session payload should include at least `userId` and an expiry; refresh or sliding expiry can be added later.
- **Sign-up** should log the user in the same way (same cookie shape) to reduce duplicate code paths.

### Migration path to a framework

- Keep **user table and password hashing** in dedicated modules (`lib/auth/password.ts`, `lib/auth/session.ts` or similar).
- Replace cookie issuance/verification with NextAuth/Clerk/etc. by implementing the same small interface the app uses: `getCurrentUser()` / `requireUser()` for Server Components and Server Actions.
- Avoid scattering `userId` discovery logic across the codebase—centralize it so the backing implementation can change in one place.

## Routes and Flows (conceptual)

| Flow | Behavior |
|------|----------|
| **Sign-up** | Validate input → check username/email uniqueness → hash password → insert user → create session → redirect to MCQ list (or home). |
| **Login** | Resolve user by email/username → verify hash → create session → redirect. |
| **Logout** | Clear session cookie; optionally revoke server-side session record if you add a sessions table later. |
| **Protected routes** | MCQ list, create/edit, preview/attempt, and any API that records attempts should **require** an authenticated user. Public marketing pages may stay unauthenticated if desired. |

## Relationship to MCQs and Attempts

- Every **attempt** row references `user_id` (see `MCQ_CRUD.md`).
- Anonymous attempts are **out of scope** for v1; unauthenticated users should be redirected to login (or sign-up) before viewing protected MCQ flows.

## Security Notes (v1)

- Use HTTPS in production (Cloudflare Workers default).
- Rate-limit login and sign-up endpoints (Cloudflare rate limiting or app-level counters) to reduce brute-force risk.
- CSRF: for cookie-based sessions, prefer SameSite cookies and consistent origin checks; if you add cross-site APIs, revisit CSRF tokens.
- Document environment secrets (e.g. session signing key) in `.dev.vars` / Wrangler secrets, never in source control.

## Cloudflare D1 and local development

- **Single database**: Create one D1 database in the Cloudflare dashboard (or via Wrangler). Point `wrangler` config at it with a **`database_id`** you obtain from your own account.
- **Binding**: Expose it to the Worker/Next adapter as one binding (e.g. `quizmaker_app_database`) used by all auth and MCQ code.
- **Migrations**: Keep SQL files in a `migrations/` folder and apply them with Wrangler:
  - **Local** (recommended for `next dev`): apply migrations to the **local** D1 copy so API routes respond immediately. Example npm script name: `db:migrate:local` → `wrangler d1 migrations apply <YOUR_DATABASE_NAME> --local`.
  - **Remote** (deployed environment): apply the same migrations to the **remote** D1 instance before or after deploy, e.g. `wrangler d1 migrations apply <YOUR_DATABASE_NAME> --remote`.
- **Avoid hanging requests in dev**: Do **not** set D1 to **remote-only** mode in Wrangler while running the Next.js dev server unless you have fully configured remote access (otherwise the Wrangler platform proxy can block or hang, and the browser will sit on “Signing in…” forever). Prefer **local** D1 for day-to-day development.

## Server runtime (OpenNext on Cloudflare)

- API routes and server code obtain the D1 binding via the OpenNext Cloudflare helper using **async** mode, e.g. `getCloudflareContext({ async: true })`, then read your D1 binding from `env`. A small wrapper (e.g. `getQuizmakerD1()`) keeps routes consistent.
- **Next.js config** should call `initOpenNextCloudflareForDev()` from `@opennextjs/cloudflare` so `next dev` can inject bindings (see OpenNext Cloudflare “bindings” documentation).

## Session signing

- Use a **strong random** `SESSION_SECRET` in production (Wrangler secret or environment). A placeholder dev default may exist only for convenience—**rotate** for any shared or production deployment.

## Future Extensions (not required for v1)

- Email verification, password reset, OAuth providers.
- Dedicated `sessions` table for revocation and multi-device management.
- Role-based access (e.g. teacher vs student) on top of the same `users` table.
