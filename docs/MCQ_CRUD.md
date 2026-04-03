# Multiple Choice Questions (MCQ) — Features, Data Model, and Phases

This document covers **only** the MCQ domain: listing (including **search by description**), CRUD, preview/attempts, validation, and D1 tables. **Authentication** (users, sessions, passwords) is in **`BASIC_AUTHENTICATION.md`**. **UI** conventions (monochrome layout) are in **`UI.md`**. Do not embed API tokens or Cloudflare credentials in documentation.

---

## Implementation snapshot (current codebase)

The app uses a **normalized** schema: `mcqs` → `questions` → `choices`, plus `attempts`. Migrations live in `migrations/` (e.g. `0001_initial.sql`). Access goes through `lib/d1-client.ts` with parameterized queries.

| Rule | Detail |
|------|--------|
| Choices per MCQ | **2–4** choices; exactly **one** marked correct (`is_correct`). |
| Search | Client-side filter on **`mcqs.description`** (substring, case-insensitive). See `lib/mcq/filter-by-description.ts`. |
| Listing | All MCQs listed for authenticated users; edit/delete restricted to creator. |
| Persistence | **D1** only. |

---

## Document trio

| File | Focus |
|------|--------|
| `BASIC_AUTHENTICATION.md` | Sign-up, login, session cookie, `users` table |
| `MCQ_CRUD.md` (this file) | MCQ CRUD, preview, attempts, search, validation, D1 tables |
| `UI.md` | Monochrome UI, routes, copy strings |

---

## Feature summary

- **List**: “My MCQs” with count, **search** (description), cards with title, description snippet, created date, actions (view / edit / delete).
- **Create / edit**: Title, description (optional, used for search), question prompt, 2–4 choices, **radio** to mark the single correct answer.
- **Preview / attempt**: Select one choice, submit; server records attempt and returns correctness.
- **Attempts**: Multiple attempts per user per MCQ allowed; each row stores user, MCQ, question, selected choice, correctness, timestamp.

---

## Implementation phases

### Phase 1: Database schema — COMPLETED

**Objective**: Tables for MCQs, questions, choices, attempts with FKs and cascades.

**Tasks**:
1. `users` (from auth migration), `mcqs`, `questions`, `choices`, `attempts`.
2. `ON DELETE CASCADE` from MCQ → questions → choices; attempts cascade when MCQ deleted.

**Deliverables**: `migrations/0001_initial.sql` (or successor migrations).

---

### Phase 2: MCQ API and services — COMPLETED

**Objective**: CRUD + attempts with server-side validation and authorization.

**Tasks**:
1. `GET/POST /api/mcqs`, `GET/PATCH/DELETE /api/mcqs/[id]`, `POST /api/mcqs/[id]/attempts`.
2. `lib/services/mcq-service.ts` — list, get (preview vs edit), create, update, delete, record attempt.
3. Correctness for attempts computed **server-side** from stored choice flags; **never** trust client for `user_id`.

**Deliverables**: Route handlers under `src/app/api/mcqs/`.

---

### Phase 3: MCQ UI (list, create, edit, delete, preview) — COMPLETED

**Objective**: Full flows with monochrome UI (see `UI.md`).

**Tasks**:
1. List page with empty state, **search by description**, card layout, actions.
2. Create/edit forms with “Back to MCQs”, placeholders, correct-answer radio per choice.
3. Preview page with submit and feedback.
4. Delete confirmation dialog.

**Deliverables**: `src/app/mcqs/*`, `src/components/mcq/*`.

---

### Phase 4: Search by description — COMPLETED

**Objective**: Users can narrow the MCQ list by text matching the **description** field.

**Tasks**:
1. Pure filter helper `filterMcqsByDescription` for testability.
2. Search input on list page; “no matches” state when query is non-empty and no rows match.

**Deliverables**: `src/lib/mcq/filter-by-description.ts`, list UI wiring, unit tests.

---

### Phase 5: Automated tests (Vitest) — COMPLETED

**Objective**: Regression tests for validation, session token round-trip, password verify, and description filter.

**Tasks**:
1. `npm run test` (Vitest) with `src/**/*.test.ts`.
2. Mocked session secret for token tests; no real D1 in unit tests.

**Deliverables**: `vitest.config.ts`, tests colocated with modules per `.cursor/rules` vitest guidance.

---

## User flows (concise)

### Create MCQ

1. Open **Create MCQ** → fill title, optional description (searchable), question, 2–4 choices, mark **one** correct.
2. Server validates with Zod (`mcqWriteSchema`) and persists in batch.

### Edit MCQ

1. Owner opens **Edit** → same form, `GET ?for=edit` returns data only for creator.

### Delete MCQ

1. Confirm dialog → `DELETE` cascades related rows per schema.

### Preview and attempt

1. Open preview → select choice → **Submit answer** → attempt row inserted; UI shows correct/incorrect.

---

## Validation rules

- One **prompt** per MCQ (v1); `questions.sort_order` reserved for future multi-question.
- **2–4** choices; **exactly one** `is_correct`.
- Reasonable max lengths enforced in Zod + `TEXT` in DB.

---

## Database design (D1)

### Entity relationships

```text
users 1 ── * mcqs (created_by_user_id)
mcqs 1 ── * questions
questions 1 ── * choices
users * ── * attempts
mcqs * ── * attempts
```

### Tables (conceptual)

#### `mcqs`

| Column | Type | Notes |
|--------|------|--------|
| `id` | TEXT PK | UUID |
| `created_by_user_id` | TEXT FK → users | Owner |
| `title` | TEXT | |
| `description` | TEXT | **Search field** for list filter |
| `created_at`, `updated_at` | TEXT | ISO timestamps |

#### `questions`

| Column | Type | Notes |
|--------|------|--------|
| `id` | TEXT PK | |
| `mcq_id` | TEXT FK → mcqs CASCADE | |
| `prompt` | TEXT | Question text |
| `sort_order` | INTEGER | Future multi-question |

#### `choices`

| Column | Type | Notes |
|--------|------|--------|
| `id` | TEXT PK | |
| `question_id` | TEXT FK → questions CASCADE | |
| `label` | TEXT | |
| `sort_order` | INTEGER | |
| `is_correct` | INTEGER | 0 or 1; exactly one per question |

#### `attempts`

| Column | Type | Notes |
|--------|------|--------|
| `id` | TEXT PK | |
| `user_id` | TEXT FK → users | From session only |
| `mcq_id` | TEXT FK → mcqs | |
| `question_id` | TEXT FK → questions | |
| `selected_choice_id` | TEXT FK → choices | |
| `is_correct` | INTEGER | Snapshot at submit |
| `attempted_at` | TEXT | Server time |

---

## Server-side responsibilities

- **Authorization**: Edit/delete only if `created_by_user_id === session userId`; preview/attempt for any authenticated user (v1).
- **Attempts**: `user_id` from session only; `is_correct` from DB choice row.

---

## Extension points

- Multiple questions per MCQ (`questions` + `sort_order`).
- Server-side search / pagination if libraries grow large.
- Analytics on `attempts`.
