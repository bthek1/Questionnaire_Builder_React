# Plan 01 — Questionnaire List Page & Navigation Shell

## Goal
Provide a home base for the app: a nav bar, a `/questionnaires` list page showing all questionnaires the user owns, and entry-points into the other flows.

---

## Scope

| File | Action |
|------|--------|
| `Frontend/src/routes/__root.tsx` | Add persistent top nav bar with app title and `/questionnaires` link |
| `Frontend/src/routes/index.tsx` | Redirect `→ /questionnaires` |
| `Frontend/src/routes/questionnaires/index.tsx` | New — list page |

---

## Steps

### 1. Update Root Layout (`Frontend/src/routes/__root.tsx`) ✅
- Sticky `<header>` with app title link and "My Questionnaires" nav link.
- Layout: `<main className="mx-auto max-w-5xl px-4 py-8">` wrapping `<Outlet />`.

### 2. Questionnaire List Route (`Frontend/src/routes/questionnaires/index.tsx`) ✅
- `useQuestionnaires()` + `useDeleteQuestionnaire()` hooks wired up.
- Table with Title, Created date, and Actions (Edit, Copy Link, Results, Delete).
- Skeleton loading state (3 animated placeholder rows).
- Empty state with dashed border and "Create one" button.
- Confirmation dialog (`pendingDelete` state) before calling delete mutation.
- **"+ New Questionnaire"** button in page header.

### 3. New Questionnaire Route stub (`Frontend/src/routes/questionnaires/new.tsx`) ✅
- Renders `<QuestionnaireForm />`.
- `handleSuccess(id)` redirects to `/questionnaires/:id/edit` via `useNavigate`.

---

## Acceptance Criteria
- [x] Nav bar appears on every page.
- [x] `/questionnaires` lists all questionnaires from the API.
- [x] Delete prompts for confirmation before calling the API.
- [x] "New Questionnaire" navigates to the form.
- [x] `pnpm build` passes with no TypeScript errors.

---

## Dependencies
- `useQuestionnaires`, `useDeleteQuestionnaire` hooks — already exist.
- TanStack Router `Link` and `useNavigate`.
- No new packages required.
