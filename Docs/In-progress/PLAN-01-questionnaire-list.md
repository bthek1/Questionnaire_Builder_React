# Plan 01 — Questionnaire List Page & Navigation Shell

## Goal
Provide a home base for the app: a nav bar, a `/questionnaires` list page showing all questionnaires the user owns, and entry-points into the other flows.

---

## Scope

| File | Action |
|------|--------|
| `src/routes/__root.tsx` | Add persistent top nav bar with app title and `/questionnaires` link |
| `src/routes/index.tsx` | Redirect `→ /questionnaires` |
| `src/routes/questionnaires/index.tsx` | New — list page |

---

## Steps

### 1. Update Root Layout (`__root.tsx`)
- Add a `<nav>` bar with the app name ("Questionnaire Builder") and a link to `/questionnaires`.
- Use Tailwind for styling; keep the layout minimal (sticky top bar + `<Outlet />`).

### 2. Questionnaire List Route (`questionnaires/index.tsx`)
- Call `useQuestionnaires()` hook.
- Render a table / card list with columns:
  - Title
  - Created date (formatted)
  - **"Edit"** → `/questionnaires/:id/edit`
  - **"Share link"** → copy-to-clipboard button (covered in Plan 03)
  - **"Results"** → `/questionnaires/:id/results`
  - **"Delete"** → calls `useDeleteQuestionnaire`, shows a confirmation dialog
- Loading state: skeleton cards.
- Empty state: "No questionnaires yet — create one" with a button to `/questionnaires/new`.
- **"+ New Questionnaire"** button in the page header → `/questionnaires/new`.

### 3. New Questionnaire Route stub (`questionnaires/new.tsx`)
- Renders `<QuestionnaireForm />` (already exists).
- On successful creation, redirect to `/questionnaires/:id/edit` so the user lands in the builder.

---

## Acceptance Criteria
- [ ] Nav bar appears on every page.
- [ ] `/questionnaires` lists all questionnaires from the API.
- [ ] Delete prompts for confirmation before calling the API.
- [ ] "New Questionnaire" navigates to the form.
- [ ] `pnpm build` passes with no TypeScript errors.

---

## Dependencies
- `useQuestionnaires`, `useDeleteQuestionnaire` hooks — already exist.
- TanStack Router `Link` and `useNavigate`.
- No new packages required.
