# Multiple Choice Questions (MCQ) — Features and Data Model

This document describes the first version of the MCQ feature set: listing and CRUD UI, preview/attempt flow, validation rules, and how data is stored in **Cloudflare D1**. It complements **`BASIC_AUTHENTICATION.md`** (sessions and users) and **`UI.md`** (pages, theme, and navigation). Together, those three documents are sufficient to recreate the app elsewhere—**without** embedding API tokens or Cloudflare credentials in documentation.

## Document trio

| File | Focus |
|------|--------|
| `BASIC_AUTHENTICATION.md` | Sign-up, login, session cookie, D1 `users` table, local vs deployed D1 |
| `MCQ_CRUD.md` (this file) | MCQ CRUD, preview, attempts, validation, D1 tables for quizzes |
| `UI.md` | Dark theme, animated background, auth shell, routes, copy strings |

## Implementation snapshot (Phase 1 code)

The running app uses a **flattened** MCQ row: `question_text` lives on `mcqs` (no separate `questions` table yet). Choices are in `mcq_choices`. Attempts are in `mcq_attempts`. This matches the SQL migrations under `quizmaker-app/migrations/`.

- **Choices per question**: enforce **2–6** choices in API validation; exactly **one** marked correct.
- **Listing**: all MCQs in one table (v1 does not filter by owner in the schema; API still requires authentication).
- **Persistence**: 100% **D1**—no external database service.

The **normalized** sections below (separate `questions` table, etc.) remain a **design target** if you split question text out of `mcqs` later; new implementations may follow either the migrations in the repo or the normalized model.

## Feature Summary

- **Landing experience**: Authenticated users see a page titled **“Multiple Choice Questions”** with a **Create MCQ** button aligned to the **top right**.
- **Listing**: All MCQs shown in a **table**; initially empty with empty-state copy if desired.
- **Row actions**: Each row has an **actions** control (far right) opening a **dropdown** with **Edit** and **Delete**.
- **Create / edit**: Users can create **unlimited** MCQs. Each MCQ has a **unique ID**, **title**, **description**, **one main question**, and **up to four** answer choices (plain text). Exactly **one** choice is marked correct per question.
- **Preview / attempt**: Clicking an MCQ opens **preview mode** where the user selects an answer and **submits**. Each submit is one **attempt**.
- **Attempts**: Users may attempt the same MCQ **multiple times**. Every attempt stores **user ID**, **MCQ ID**, **selected answer** (choice), **correct/incorrect**, and **timestamp**.

## UI Layout (List Page)

| Area | Content |
|------|---------|
| Header row | Page title **“Multiple Choice Questions”** (left); **Create MCQ** button (right). |
| Body | Table: columns at minimum **Title** (and/or description snippet), **Updated** optional; final column **Actions** with dropdown (**Edit**, **Delete**). |
| Empty state | Clear message that there are no MCQs yet; primary action to create one. |

Use **shadcn/ui** primitives (`Button`, `Table`, `DropdownMenu`, etc.) per project rules.

## User Flows

### Create MCQ

1. User clicks **Create MCQ**.
2. Form captures: title, description, question text, up to four choices, and which choice is correct (radio or single-select).
3. Server validates: all required fields, **exactly one** `is_correct`, max four choices, non-empty choice text.
4. Persist MCQ → question → choices in one logical operation (transaction if supported by your D1 access layer).

### Edit MCQ

1. User opens row **Actions → Edit**.
2. Same form as create, pre-filled.
3. Update replaces question/choices as needed while preserving MCQ `id` and stable choice `id`s where possible (simpler v1: replace choices with new rows and new ids, or use deterministic updates—document the chosen strategy in code).

### Delete MCQ

1. User opens **Actions → Delete**.
2. Confirm dialog (recommended).
3. Delete in order respecting foreign keys: attempts referencing this MCQ’s question/choices, then choices, question, MCQ—or use `ON DELETE CASCADE` in schema.

### Preview and attempt

1. User clicks a row (or a **Preview** affordance) to open preview for that MCQ.
2. Show question and choices (radio list).
3. **Submit** creates an **attempt** row: selected choice, derive `is_correct` from the choice’s `is_correct` flag, set `attempted_at` to server time (UTC recommended).
4. Show immediate feedback (correct/incorrect) optional for v1; data model must still store the attempt regardless.

## Validation Rules

- **One main question** per MCQ in v1 (schema still has a `questions` table for scalability).
- **Up to four** choices per question; minimum **two** recommended for a meaningful MCQ (enforce in app or DB check).
- **Exactly one** choice with `is_correct = 1` per question (enforce in app + optional DB trigger or check constraint).
- Titles and question text should have reasonable max lengths (enforced in Zod + DB `TEXT` or `VARCHAR`).

## Database Design (D1)

Principles: **separate** entities—`users` (see auth doc), `mcqs`, `questions`, `choices`, `attempts`—with clear foreign keys. Use prepared statements via `lib/d1-client.ts` and migrations via Wrangler.

### Entity relationships

```text
users 1 ── * mcqs (created_by)
mcqs 1 ── * questions
questions 1 ── * choices
users * ── * attempts (via attempts.user_id)
mcqs * ── * attempts (via attempts.mcq_id; see below)
questions * ── * attempts (optional refinement)
choices * ── * attempts (selected_choice)
```

### Tables (conceptual)

#### `users`

Defined in `BASIC_AUTHENTICATION.md` (id, names, username, email, password_hash, timestamps).

#### `mcqs`

| Column | Type | Notes |
|--------|------|--------|
| `id` | TEXT (UUID) PRIMARY KEY | Unique MCQ id. |
| `created_by_user_id` | TEXT NOT NULL FK → users.id | Owner/creator. |
| `title` | TEXT NOT NULL | |
| `description` | TEXT NOT NULL | Allow empty string if product allows. |
| `created_at` | TEXT (ISO-8601) or INTEGER (unix) | |
| `updated_at` | Same | |

Indexes: `created_by_user_id`.

#### `questions`

One row per question; v1 uses **one question per MCQ**.

| Column | Type | Notes |
|--------|------|--------|
| `id` | TEXT (UUID) PRIMARY KEY | |
| `mcq_id` | TEXT NOT NULL FK → mcqs.id ON DELETE CASCADE | |
| `prompt` | TEXT NOT NULL | Main question text. |
| `sort_order` | INTEGER DEFAULT 0 | For future multi-question quizzes. |

Unique: `(mcq_id)` if strictly one question per MCQ in v1, or allow multiple with `sort_order`.

#### `choices`

| Column | Type | Notes |
|--------|------|--------|
| `id` | TEXT (UUID) PRIMARY KEY | Unique choice id (stable for attempt references). |
| `question_id` | TEXT NOT NULL FK → questions.id ON DELETE CASCADE | |
| `label` | TEXT NOT NULL | Plain text answer body. |
| `sort_order` | INTEGER NOT NULL | 0–3 for up to four options. |
| `is_correct` | INTEGER NOT NULL | 0 or 1; **exactly one** per `question_id`. |

Indexes: `question_id`.

#### `attempts`

| Column | Type | Notes |
|--------|------|--------|
| `id` | TEXT (UUID) PRIMARY KEY | |
| `user_id` | TEXT NOT NULL FK → users.id | Who attempted. |
| `mcq_id` | TEXT NOT NULL FK → mcqs.id | Satisfies “MCQ id” on every attempt. |
| `question_id` | TEXT NOT NULL FK → questions.id | Normalized link to the question (same MCQ). |
| `selected_choice_id` | TEXT NOT NULL FK → choices.id | Selected answer. |
| `is_correct` | INTEGER NOT NULL | 0 or 1 (denormalized snapshot at submit time). |
| `attempted_at` | TEXT (ISO-8601) or INTEGER | Server-generated timestamp. |

Indexes: `user_id`, `mcq_id`, `question_id`, `attempted_at` (for reporting).

**Why both `mcq_id` and `question_id`?** The product asks for MCQ id on attempts; including `question_id` keeps the model correct when MCQs later contain multiple questions, and simplifies joins from choice → question.

### Referential integrity

- Prefer `ON DELETE CASCADE` from `mcqs` → `questions` → `choices`.
- For `attempts`, use **RESTRICT** or avoid deleting MCQs that have attempts unless product explicitly allows purge (teacher-only hard delete with confirmation).

## Server-Side Responsibilities

- **Authorization**: Only the creator (or future roles) may edit/delete an MCQ; all users might be allowed to preview/attempt depending on product rules—**v1** can restrict edit/delete to `created_by_user_id === currentUser.id`.
- **Attempt recording**: Always set `user_id` from the session, never from the client body.
- **Correctness**: Compute `is_correct` server-side by loading the selected choice and reading `is_correct` (do not trust client).

## Extension Points

- Multiple questions per MCQ: already supported by `questions` + `sort_order`.
- Rich text / images on choices: add columns or asset references later.
- Analytics: aggregate on `attempts` by `mcq_id`, `user_id`, and date ranges.
