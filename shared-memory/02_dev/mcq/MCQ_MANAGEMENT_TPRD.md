# MCQ Management — Technical PRD (QuizMaker)

## Overview

This document specifies **how** MCQ management is implemented: D1 schema aligned with `migrations/`, API contracts, UI routes, search behavior, tests, and deployment notes. Product intent is in `shared-memory/01_product/mcq/MCQ_MANAGEMENT_FEATURE_PRD.md`. Authentication is **out of scope** here except where MCQ APIs require a session (`user_id`).

---

## Business requirements (summary)

- Teachers manage a **personal library** of MCQs (ownership on `mcqs.created_by_user_id`).
- Each MCQ has title, optional description (**searchable**), one prompt, 2–4 choices, exactly one correct.
- **Search** narrows the visible list by matching text against **description** (client-side).
- Preview records **attempts** with server-derived correctness.

---

## Technical requirements

### Database (D1 / SQLite)

Actual schema is defined in repository migrations (e.g. `migrations/0001_initial.sql`). Conceptual model:

- `mcqs(id, title, description, created_by_user_id, created_at, updated_at)`
- `questions(id, mcq_id FK CASCADE, prompt, sort_order)`
- `choices(id, question_id FK CASCADE, label, sort_order, is_correct)`
- `attempts(id, user_id, mcq_id, question_id, selected_choice_id, is_correct, attempted_at)`

Access only via `lib/d1-client.ts` helpers (parameter binding, `?` → `?1`, `?2`, …).

### API endpoints

| Method | Path | Purpose |
|--------|------|---------|
| GET | `/api/mcqs` | List all MCQs (auth required) |
| POST | `/api/mcqs` | Create (body: `mcqWriteSchema`) |
| GET | `/api/mcqs/[id]` | Preview payload or edit payload (`?for=edit` owner-only) |
| PATCH | `/api/mcqs/[id]` | Update (owner) |
| DELETE | `/api/mcqs/[id]` | Delete (owner, cascades) |
| POST | `/api/mcqs/[id]/attempts` | Record attempt (`selectedChoiceId` only in body) |

### Search

- **Not** a separate API: full list from `GET /api/mcqs`; browser filters with `filterMcqsByDescription()` in `src/lib/mcq/filter-by-description.ts`.
- Future: server query + pagination if datasets grow.

### UI routes

| Route | Notes |
|-------|--------|
| `/mcqs` | List, search, empty state, cards |
| `/mcqs/create` | Create form |
| `/mcqs/[id]/edit` | Server-load owner data; edit form |
| `/mcqs/[id]/preview` | Attempt flow |

Styling: `docs/UI.md` (monochrome).

---

## Implementation phases (engineering)

### Phase 1 — Schema — COMPLETED

Migrations applied locally/remote per `package.json` scripts.

### Phase 2 — Services & routes — COMPLETED

`mcq-service.ts`, route handlers, Zod `mcqWriteSchema`.

### Phase 3 — Client UI — COMPLETED

Components under `src/components/mcq/`, shell under `src/components/layout/`.

### Phase 4 — Description search — COMPLETED

Filter helper + list UI + unit tests.

### Phase 5 — Vitest — COMPLETED

`vitest.config.ts`, tests colocated with modules.

### Phase 6 — Cloudflare deploy — OPERATIONAL

`npm run deploy`; secrets; **remote** migrations when releasing (team process).

---

## Security & trade-offs

- **Trade-off**: Client-side search keeps API simple and avoids extra queries; acceptable for small libraries.
- **Security**: `user_id` for attempts never from client JSON; edit/delete enforced by creator id; session from HTTP-only cookie.
- **Rate limiting**: Not implemented in app code; recommended at edge (Cloudflare) for auth routes (see `docs/BASIC_AUTHENTICATION.md`).

---

## Testing

- Run `npm run test` (Vitest).
- No production D1 in unit tests; mock DB when extending service tests per `.cursor/rules/vitest-testing.mdc`.

---

**Last updated**: April 2026
