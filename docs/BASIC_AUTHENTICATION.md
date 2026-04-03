# Basic Authentication

This document describes the **authentication-only** model for QuizMaker: user accounts, sign-up and login, sessions, and how user data persists in **Cloudflare D1**. MCQ features are documented separately in **`MCQ_CRUD.md`**. **Do not** paste Cloudflare API tokens, account IDs, or production secrets into these docs—use placeholders and your own dashboard or Wrangler setup.

## Document map

| File | Focus |
|------|--------|
| `BASIC_AUTHENTICATION.md` (this file) | Users table, passwords, sessions, auth API routes, D1 local vs remote |
| `MCQ_CRUD.md` | MCQs, questions, choices, attempts (application data) |
| `UI.md` | Visual system (monochrome UI), routes, copy strings |

---

## Goals

- Users can **sign up** and **log in** with credentials stored in **D1** (one D1 binding for the QuizMaker schema).
- Passwords are **never stored in plain text**; only a strong one-way hash is persisted.
- Session handling is explicit enough to swap for JWT/OAuth/cookies managed by a dedicated library without rewriting the whole domain model.

---

## User Model

| Field | Notes |
|--------|--------|
| **User ID** | Stable primary key (UUID/text id). Exposed in app code as `userId`. |
| **First name** | Required for display. |
| **Last name** | Required for display. |
| **Username** | Unique, human-readable identifier. |
| **Email** | Unique; validation: basic email format server-side. |
| **Password** | Stored only as a **password hash** (see below). |

### Uniqueness and login identifier

- Enforce **unique** constraints on `username` and `email` in the database.
- **Login** may accept **email or username** in a single field, resolved server-side to one user row.

---

## Password Storage

- On sign-up: hash with **bcrypt** (or Argon2id when available) with a sensible cost factor.
- Store: `password_hash`, optional `password_hash_algorithm` for future rotation.
- Never log passwords or hashes in application logs.

---

## Session Model (v1)

- After successful login (or sign-up), issue a **signed session token** stored in an **HTTP-only, Secure, SameSite=Lax** cookie.
- Session payload includes at least `userId` and an expiry.

### Migration path to a framework

- Keep **user table and password hashing** in dedicated modules (`lib/auth/password.ts`, `lib/auth/session-token.ts`, `lib/auth/session-cookie.ts`).
- Replace cookie issuance/verification with NextAuth/Clerk/etc. by implementing the same interface: session read on the server for API routes and Server Components.

---

## Routes and Flows (authentication)

| Flow | Behavior |
|------|----------|
| **Sign-up** | Validate input → check username/email uniqueness → hash password → insert user → create session → redirect to app (e.g. `/mcqs`). |
| **Login** | Resolve user by email/username → verify hash → create session → redirect. |
| **Logout** | Clear session cookie. |
| **Protected routes** | Any route that requires identity uses middleware + session verification; unauthenticated users are redirected to `/login`. |

---

## Security Notes (v1)

- Use HTTPS in production (Cloudflare Workers default).
- **Rate limiting** (recommended): add Cloudflare rate limiting or app-level limits on login/sign-up to reduce brute-force risk.
- **CSRF**: SameSite cookies and same-origin APIs; revisit if you add cross-site clients.
- **Secrets**: `SESSION_SECRET` in `.dev.vars` / Wrangler secrets—never in source control.

---

## Cloudflare D1 and local development

- **Single database**: One D1 database; `wrangler` config includes `database_id` from your account.
- **Binding**: e.g. `quizmaker_app_database` for all app data (users + MCQs share one DB; schema is split by table).
- **Migrations**: SQL under `migrations/`; apply with Wrangler:
  - **Local** (recommended for `next dev`): `npm run db:migrate:local`
  - **Remote** (deployed): `npm run db:migrate:remote` (run when you deploy; do not apply remote from untrusted environments without review).
- **Avoid hanging requests in dev**: Prefer **local** D1 for day-to-day development (see `MCQ_CRUD.md` for the same note in full context).

---

## Server runtime (OpenNext on Cloudflare)

- API routes use `getCloudflareContext({ async: true })` and a small wrapper `getQuizmakerD1()` for the D1 binding.
- `next.config.ts` calls `initOpenNextCloudflareForDev()` so `next dev` can inject bindings.

---

## Session signing

- Use a **strong random** `SESSION_SECRET` in production (Wrangler secret). A dev-only fallback may exist locally—**rotate** for shared or production deployments.

---

## Future Extensions (authentication only)

- Email verification, password reset, OAuth providers.
- Dedicated `sessions` table for revocation and multi-device management.
- Role-based access on top of the same `users` table.
