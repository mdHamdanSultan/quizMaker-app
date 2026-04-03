# MCQ Management — Product Spec (QuizMaker)

## Overview

This document defines **product** requirements for MCQ management in QuizMaker: create/edit/delete quizzes, **search by description**, preview with attempts, and a **monochrome** UI. Companion technical detail lives in `shared-memory/02_dev/mcq/MCQ_MANAGEMENT_TPRD.md`. Authentication is specified in `shared-memory/01_product/authentication/` and `docs/BASIC_AUTHENTICATION.md`.

Structured feature flags remain in `mcq_management_features.yaml` (sync when scope changes).

---

## In scope

- CRUD for MCQs with title, **description** (used for search), one question prompt, **2–4** choices, **exactly one** correct answer (radio).
- List view with **description search** (client-side filter), library count, card layout, view / edit / delete.
- Preview mode: select answer, submit, immediate correct/incorrect feedback; attempts stored in D1.
- Owner-only edit/delete; any authenticated user may preview/attempt (v1).

## Out of scope

- Sharing MCQs between users, categories/tags, bulk import/export, analytics dashboards, student-only delivery mode.

---

## Implementation phases (product)

### Phase 1 — Schema & migrations — COMPLETED

Normalized tables: `mcqs`, `questions`, `choices`, `attempts`; FKs and cascades per `docs/MCQ_CRUD.md`.

### Phase 2 — API & services — COMPLETED

REST handlers under `src/app/api/mcqs/`; business logic in `lib/services/mcq-service.ts`; validation via Zod.

### Phase 3 — UI (list, forms, preview) — COMPLETED

Monochrome UI per `docs/UI.md`; no animated marketing background.

### Phase 4 — Search by description — COMPLETED

Search input filters the list by substring match on `mcqs.description` (see `lib/mcq/filter-by-description.ts`).

### Phase 5 — Automated tests — COMPLETED

Vitest tests for MCQ schema, filter helper, session token round-trip, password verify (`npm run test`).

### Phase 6 — Deploy (Cloudflare)

Build with OpenNext; apply **remote** D1 migrations; set `SESSION_SECRET`; `npm run deploy` (see project README / Wrangler docs).

---

## Success criteria

- [x] Users can create MCQs with 2–4 choices and one marked correct.
- [x] Users can search MCQs by description text.
- [x] Users can edit/delete own MCQs; preview and submit attempts.
- [x] Attempts persist with server-side correctness.
- [x] UI is black/white/grey only (sprint scope).

-----

**Last updated**: April 2026
