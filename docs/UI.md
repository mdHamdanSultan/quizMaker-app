# QuizMaker — UI (Monochrome)

This document describes the **visual and UX** conventions for QuizMaker Phase 1: **white background**, **black/grey** only (no brand colors, no animated backgrounds). It complements **`BASIC_AUTHENTICATION.md`** and **`MCQ_CRUD.md`**.

---

## Principles

- **Background**: Page background `#FFFFFF` (`bg-white`).
- **Text**: Primary `text-black`, secondary `text-neutral-600` / `text-neutral-500`.
- **Borders**: Thin `border-neutral-300` or `border-black` for emphasis (cards, inputs, header separator).
- **Typography**: **Serif** (`DM Serif Display` via `--font-brand-serif`) for brand wordmark, main headings, and primary actions where specified; **sans** (Geist) for body, labels, and helper text.
- **No** full-screen animations, gradients, or water-droplet effects in scope.

---

## Layout

### Marketing (`/`)

- Top bar: book icon + **QuizMaker** (serif), **Log in** (ghost), **Sign up** (black fill).
- Divider: `border-b border-neutral-200`.
- Hero: centered serif title, neutral body copy, primary CTA black buttons.

### Auth (`/login`, `/signup`)

- Thin top bar optional: “← QuizMaker” link.
- Centered **card** with `border-neutral-300`, generous padding.
- Login: “Welcome back”, subtitle, fields, black **Log in** button (serif label), footer link to sign up.

### App shell (`/mcqs/**`)

- Header: book icon + **QuizMaker** (serif), optional **user display name** (first + last or username), **Log out** (outline black).
- Divider under header.
- Content `max-w-6xl` centered.

---

## Components

- **Buttons**: Primary = black fill + white text; secondary = white + black border (`variant="outline"`).
- **Inputs / textareas**: White fill, `border-neutral-300`, `rounded-md`.
- **MCQ cards**: `border-black` or strong border for list items; action icons as ghost buttons (black stroke).
- **Preview**: “Preview” pill badge (neutral border); selected option `bg-neutral-100`; submit uses **grey** fill (`neutral-500`/`600`) with white text per product mock.

---

## Page map

| Path | Role |
|------|------|
| `/` | Marketing |
| `/login` | Login |
| `/signup` | Sign up |
| `/mcqs` | List + search + create entry |
| `/mcqs/create` | Create MCQ |
| `/mcqs/[id]/edit` | Edit (owner) |
| `/mcqs/[id]/preview` | Preview / attempt |

---

## Copy (reference)

| Location | Text |
|----------|------|
| Login title | Welcome back |
| Login subtitle | Enter your credentials to access your account |
| Login submit | Log in / Signing in... |
| List title | My MCQs |
| Search | Search MCQs... (filters by **description**) |
| Create MCQ | Create New MCQ / + Create MCQ |

---

## Rebuild checklist

1. Apply D1 migrations (local for dev).
2. Set `SESSION_SECRET` (see `BASIC_AUTHENTICATION.md`).
3. Implement API + services (`MCQ_CRUD.md`).
4. Apply this document for pages and tokens (`globals.css`, `font-brand-serif` on `body` from `layout.tsx`).
