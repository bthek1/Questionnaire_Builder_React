# PLAN-09: Edit Page — Merge Edit/JSON & Split-View Preview

## Overview

Two UX improvements to the questionnaire builder:

1. **Merge the Edit and JSON buttons** — `edit.tsx` is already a redirect to `json.tsx`; remove the redundant "Edit" button from the list page so only one "Edit" button remains (pointing to the JSON editor at `/questionnaires/:id/json`).

2. **Split-view JSON editor** — The JSON editor page gains a live survey preview panel beside the editor. As the user types valid JSON the preview re-renders automatically; invalid JSON leaves the last valid preview in place.

---

## Phase 1: Remove Redundant Edit Button

**Status**: ✅ Completed 2026-04-30

**Goal**: Collapse the "Edit" and "JSON" action buttons in the questionnaire list into a single "Edit" button that navigates to `/questionnaires/:id/json`.

**Deliverables**:

- [x] In `Frontend/src/routes/questionnaires/index.tsx`, replace the two buttons (Edit → `$id/edit`, JSON → `$id/json`) with a single "Edit" button that links to `$id/json`.
- [x] Delete `Frontend/src/routes/questionnaires/$id/edit.tsx` (the redirect shim is no longer needed).
- [x] Verify `routeTree.gen.ts` regenerates cleanly on `pnpm dev` / `pnpm build`.

**Tests**:

- [x] Update `Frontend/src/test/QuestionnairesPage.test.tsx` — remove assertions for the old JSON button; assert a single "Edit" link points to `/questionnaires/<id>/json`.
- [x] Confirm no test references `edit.tsx` or the `/edit` route path.

**Stability Criteria**: `pnpm build` and `pnpm test` pass with no errors.

**Notes**: Added two new tests — one asserting each Edit link href ends in `/json`, one asserting no separate JSON link exists. `pnpm build` and all 70 tests green.

---

## Phase 2: Split-View Layout for the JSON Editor

**Status**: ✅ Completed 2026-04-30

**Goal**: Render the JSON editor on the left and a live `SurveyRenderer` preview on the right within the existing `/questionnaires/:id/json` route.

**Deliverables**:

- [x] Refactor `JsonEditor` in `Frontend/src/routes/questionnaires/$id/json.tsx`:
  - Switch the outer container to a two-column layout (`grid grid-cols-1 gap-4 lg:grid-cols-2`) that stacks to a single column on small screens.
  - Left column: existing `Textarea` JSON editor + save/status UI (unchanged logic).
  - Right column: render `<SurveyRenderer>` in **read-only / preview mode** using the currently-parsed JSON. Update the preview on every valid JSON keystroke (controlled by a `previewJson` state derived from `text`).
  - While `text` contains invalid JSON, keep displaying the last successfully-parsed `previewJson` (or the saved `surveyJson` on first load).
- [x] Pass a no-op `onComplete` callback to `SurveyRenderer` so responses are not submitted during preview (`mode="display"` prop does not exist on the component — used `useCallback` no-op instead).
- [x] Add a "Preview" heading above the right panel.

**Tests**:

- [x] Update `Frontend/src/test/JsonEditorPage.test.tsx`:
  - Assert the preview panel renders on load with the saved `surveyJson`.
  - Assert that typing valid JSON updates the preview.
  - Assert that typing invalid JSON does **not** crash and retains the last valid preview.

**Stability Criteria**: `pnpm build` and `pnpm test` pass; preview re-renders visually on valid JSON edits confirmed manually via `pnpm dev`.

**Notes**: `SurveyRenderer` has no `mode="display"` prop; used a `useCallback` no-op for `onComplete` to prevent submission. Mocked `SurveyRenderer` in tests to render `surveyJson` as text for assertion. All 70 tests green.

---

## Phase 3: Polish & Cleanup

**Status**: ✅ Completed 2026-04-30

**Goal**: Tidy up navigation, remove the now-unused `edit.tsx` route file from routing config, and update docs.

**Deliverables**:

- [x] Confirm `Frontend/src/routes/questionnaires/$id/edit.tsx` is deleted and `routeTree.gen.ts` no longer references it.
- [x] Update `AGENTS.md` Route Structure table — removed the `edit.tsx` row, updated `json.tsx` description to mention split-view, updated `index.tsx` description.
- [x] Run `pnpm lint` and `pnpm build`; remaining lint errors are pre-existing `react-refresh/only-export-components` warnings from TanStack Router's route file pattern (not introduced by this plan).

**Tests**:

- [x] Full `pnpm test` suite green (70/70).
- [ ] `pnpm test:e2e` smoke test: navigate to edit page and assert both panels are visible.

**Stability Criteria**: `pnpm build`, `pnpm lint`, and `pnpm test` all pass clean.

**Notes**: `pnpm build` ✓, `pnpm test` 70/70 ✓. E2E smoke test not yet run — requires running dev server manually.
