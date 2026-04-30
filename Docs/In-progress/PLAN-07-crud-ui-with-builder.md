# Plan 07 — Update UI: Full CRUD with Questionnaire Builder

## Goal

Integrate the questionnaire metadata (title + description) CRUD workflow directly into the builder flow, so owners can create, read, update, and delete questionnaire details without leaving the survey-creator context.  
Specifically: add an inline metadata editor to the edit page, surface edit/delete actions consistently, and ensure the "New Questionnaire" flow feeds cleanly into the builder.

---

## Background & Current State

| What exists | Gap |
|-------------|-----|
| List page (`/questionnaires`) with Edit / Share / Results / Delete actions | Delete is list-only; there is no delete action inside the builder |
| `new.tsx` — creates questionnaire then redirects to `/questionnaires/:id/edit` | Metadata (title/description) cannot be changed after creation without leaving the editor |
| `$id/edit.tsx` — shows questionnaire title in the header bar, renders `SurveyCreatorWidget` | No way to rename or add a description from within the editor page |
| `SurveyCreatorWidget` — auto-saves `surveyJson` via `creator.saveSurveyFunc` | Metadata changes need a separate PATCH call |

---

## Scope

| File | Action |
|------|--------|
| `Frontend/src/routes/questionnaires/$id/edit.tsx` | Add inline metadata editor (title + description) + delete action in the header bar |
| `Frontend/src/components/questionnaire/QuestionnaireMetaEditor.tsx` | New — small inline form for renaming/describing a questionnaire; emits `onSave` |
| `Frontend/src/routes/questionnaires/new.tsx` | Verify flow is still correct; add inline error display if creation fails |
| `Frontend/src/routes/questionnaires/index.tsx` | No changes required (CRUD is already present) |
| `Frontend/src/hooks/useQuestionnaires.ts` | Confirm `useUpdateQuestionnaire` and `useDeleteQuestionnaire` are exported and typed correctly |

---

## Phases

---

## Phase 1: Inline Metadata Editor Component

**Status**: Not started

**Goal**: Create a reusable `QuestionnaireMetaEditor` component that shows the current title and description, lets the user edit them in place, and calls a provided `onSave` callback.

**Deliverables**:

- [ ] `Frontend/src/components/questionnaire/QuestionnaireMetaEditor.tsx`
  - Props: `title: string`, `description?: string`, `onSave: (data: { title: string; description?: string }) => Promise<void>`, `isSaving?: boolean`
  - Collapsed state: renders title as a `<h1>` with a small pencil-icon "Edit" button beside it
  - Expanded state: renders `Input` (title) + `Textarea` (description) + Save / Cancel buttons
  - Validates that title is non-empty; shows inline error
  - Disables Save button while `isSaving` is true; shows a spinner label "Saving…"
  - Calls `onSave` on submit, then collapses back to display state on success
  - Keyboard accessible: `Escape` cancels edit, `Enter` in title field submits

**Tests**:

- [ ] `Frontend/src/test/QuestionnaireMetaEditor.test.tsx`
  - Renders title in display mode by default
  - Clicking Edit button switches to edit mode
  - Submitting empty title shows validation error and does not call `onSave`
  - Submitting valid title calls `onSave` with correct payload
  - `Escape` key cancels and returns to display mode

**Stability Criteria**: `pnpm test -- --testPathPattern=QuestionnaireMetaEditor` passes; no TypeScript errors.

**Notes**: —

---

## Phase 2: Wire Meta Editor into the Edit Page

**Status**: Not started

**Goal**: Replace the static title display in `$id/edit.tsx` header with the `QuestionnaireMetaEditor`, wired to `useUpdateQuestionnaire`.

**Deliverables**:

- [ ] `Frontend/src/routes/questionnaires/$id/edit.tsx` updated:
  - Import and render `<QuestionnaireMetaEditor>` in the header bar area
  - `onSave` handler calls `useUpdateQuestionnaire(id).mutateAsync({ title, description })`
  - Pass `isSaving={updateMutation.isPending}` to the editor
  - Show a transient success toast/banner "Saved" on metadata save (reuse existing pattern or use a simple state-based banner)
  - Show an error banner if the mutation fails

**Tests**:

- [ ] `Frontend/src/test/EditQuestionnairePage.test.tsx`
  - Renders `QuestionnaireMetaEditor` with the questionnaire's title and description
  - Editing and saving calls `updateQuestionnaire` API with new metadata
  - API error shows error message

**Stability Criteria**: `pnpm test -- --testPathPattern=EditQuestionnairePage` passes; `pnpm build` passes.

**Notes**: —

---

## Phase 3: Delete Action in the Builder Header

**Status**: Not started

**Goal**: Add a Delete button to the edit page header so owners can remove a questionnaire without navigating back to the list.

**Deliverables**:

- [ ] Delete button (destructive variant) in the edit page header bar
- [ ] Inline confirmation modal (reuse the same pattern from the list page): "Delete questionnaire? This action cannot be undone." with Confirm / Cancel buttons
- [ ] On confirm: calls `useDeleteQuestionnaire().mutateAsync(id)`, then navigates to `/questionnaires`
- [ ] On error: shows an inline error message

**Tests**:

- [ ] `Frontend/src/test/EditQuestionnairePage.test.tsx` (extend existing test file):
  - Delete button is present
  - Clicking Delete opens confirmation modal
  - Confirming calls `deleteQuestionnaire` mutation and navigates to `/questionnaires`
  - Cancelling closes the modal without calling the mutation

**Stability Criteria**: `pnpm test -- --testPathPattern=EditQuestionnairePage` passes; no regressions in `QuestionnairesPage` tests.

**Notes**: —

---

## Phase 4: Final Build & Smoke Tests

**Status**: Not started

**Goal**: Ensure the full CRUD flow works end-to-end: create → edit metadata → design survey → delete.

**Deliverables**:

- [ ] `pnpm build` passes with zero TypeScript errors
- [ ] `pnpm lint` passes with zero warnings
- [ ] `pnpm test` — all existing tests still pass
- [ ] Manual smoke test checklist:
  - [ ] Create new questionnaire from `/questionnaires/new` → lands on editor
  - [ ] Edit title/description inline in the editor header → saved badge appears
  - [ ] Design survey questions in SurveyJS Creator → auto-save triggers
  - [ ] Navigate back to list — title/description reflect updated values
  - [ ] Delete from editor → confirmation → redirect to list → item gone
  - [ ] Delete from list → confirmation → item gone
- [ ] Update `AGENTS.md` — add `QuestionnaireMetaEditor` to component table

**Stability Criteria**: All of the above pass.

**Notes**: —

---

## Acceptance Criteria (all phases)

- [ ] Owner can rename and re-describe a questionnaire without leaving the editor page.
- [ ] Owner can delete a questionnaire from the editor page with a confirmation step.
- [ ] All CRUD actions are reachable from both the list page and the editor page.
- [ ] No TypeScript errors, no ESLint warnings.
- [ ] All existing unit tests continue to pass.

---

## Dependencies

- `useUpdateQuestionnaire`, `useDeleteQuestionnaire` — already exist in `Frontend/src/hooks/useQuestionnaires.ts`.
- UI primitives `Button`, `Input`, `Label`, `Textarea` — already exist in `Frontend/src/components/ui/`.
- No new packages required.
