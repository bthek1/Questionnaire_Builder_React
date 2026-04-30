# PLAN-08 — Remove survey-creator, Replace with JSON Editor

## Goal

Remove the commercially-licensed `survey-creator-react` and `survey-creator-core` packages
from the project and replace the drag-and-drop builder UI with the plain JSON editor
already built in PLAN-07 (`/questionnaires/:id/json`).

---

## Background

`survey-creator-react` and `survey-creator-core` require a paid SurveyJS licence and must
not ship in an open-source distribution.  The raw-JSON editor introduced in PLAN-07
(`SurveyCreatorWidget` → `/questionnaires/:id/json`) provides a functionally adequate
replacement.

### Affected files

| File | What changes |
|------|-------------|
| `Frontend/package.json` | Remove `survey-creator-react`, `survey-creator-core` deps |
| `Frontend/src/components/survey/SurveyCreatorWidget.tsx` | Delete — replaced by existing `JsonEditorPage` |
| `Frontend/src/routes/questionnaires/$id/edit.tsx` | Replace contents: redirect to `/questionnaires/$id/json` |
| `Frontend/src/routes/questionnaires/new.tsx` | Change post-create redirect from `/edit` → `/json` |
| `Frontend/src/test/NewQuestionnairePage.test.tsx` | Remove `SurveyCreatorWidget` mock; fix assertion |
| `Frontend/src/test/QuestionnairesPage.test.tsx` | Remove `SurveyCreatorWidget` mock |
| `Frontend/src/test/TakePage.test.tsx` | Remove `SurveyCreatorWidget` mock |
| `Frontend/src/test/JsonEditorPage.test.tsx` | Remove `SurveyCreatorWidget` mock |
| `Frontend/src/test/ShareLinksPage.test.tsx` | Remove `SurveyCreatorWidget` mock |
| `AGENTS.md` | Update architecture table, package table, feature overview |
| `.github/instructions/surveyjs.instructions.md` | Remove creator-specific patterns |
| `.github/prompts/implement-questionnaire-routes.prompt.md` | Remove creator install / CSS steps |

---

## Phase 1: Uninstall the commercial packages

**Status**: Not started

**Goal**: Remove `survey-creator-react` and `survey-creator-core` from `package.json` and the lockfile.

**Deliverables**:

- [ ] Run `pnpm remove survey-creator-react survey-creator-core` from `Frontend/`.
- [ ] Confirm neither package appears in `Frontend/package.json` dependencies.
- [ ] Confirm `pnpm-lock.yaml` no longer references them.

**Tests**: N/A — build will fail until Phase 2 removes the imports.

**Stability Criteria**: Both packages absent from `package.json`.

**Notes**:

---

## Phase 2: Delete `SurveyCreatorWidget` and update the edit route

**Status**: Not started

**Goal**: Remove every import of the deleted packages and make `/questionnaires/:id/edit`
redirect to the JSON editor so existing links don't break.

**Deliverables**:

- [ ] Delete `Frontend/src/components/survey/SurveyCreatorWidget.tsx`.
- [ ] Replace `Frontend/src/routes/questionnaires/$id/edit.tsx` with a component that
  performs an immediate client-side redirect to `/questionnaires/$id/json` using
  TanStack Router's `<Navigate>` (or `useNavigate` in an effect-free way via a loader/beforeLoad).
  The route file must still export `Route` via `createFileRoute('/questionnaires/$id/edit')`.
- [ ] Change the post-create navigation in `Frontend/src/routes/questionnaires/new.tsx`
  from `to: '/questionnaires/$id/edit'` → `to: '/questionnaires/$id/json'`.
- [ ] Remove the `survey-core/survey-core.css` import from `SurveyCreatorWidget` — confirm
  `survey-core` CSS is still imported somewhere it is needed (e.g. `SurveyRenderer.tsx`).

**Tests**:

- [ ] `Frontend/src/test/NewQuestionnairePage.test.tsx`: update post-create assertion to
  expect navigation to `/questionnaires/$id/json`, not `/edit`.
- [ ] `pnpm build` exits 0 — no dangling imports.

**Stability Criteria**: `pnpm build` passes; navigating to `/questionnaires/$id/edit` redirects
to the JSON editor; creating a new questionnaire lands on the JSON editor.

**Notes**:

---

## Phase 3: Clean up test mocks

**Status**: Not started

**Goal**: Remove the `vi.mock('@/components/survey/SurveyCreatorWidget', ...)` stub from
every test file that no longer needs it (the component no longer exists).

**Deliverables**:

- [ ] Remove `vi.mock('@/components/survey/SurveyCreatorWidget', …)` block from:
  - `QuestionnairesPage.test.tsx`
  - `TakePage.test.tsx`
  - `JsonEditorPage.test.tsx`
  - `ShareLinksPage.test.tsx`
  - `NewQuestionnairePage.test.tsx`
- [ ] Confirm no other test file references `SurveyCreatorWidget`.

**Tests**:

- [ ] `pnpm test --run` — all existing tests pass.

**Stability Criteria**: `pnpm test --run` exits 0 with no failures.

**Notes**:

---

## Phase 4: Update documentation and instructions

**Status**: Not started

**Goal**: Remove all references to `survey-creator` from living docs so future agents don't
attempt to use the removed packages.

**Deliverables**:

- [ ] `AGENTS.md`:
  - Remove `survey-creator-react` / `survey-creator-core` rows from the Package Roles table.
  - Update the Architecture table: replace `survey-creator-react` row with
    `JSON editor` → `Frontend/src/routes/questionnaires/$id/json.tsx`.
  - Update the Feature Overview: Builder flow now navigates to `/questionnaires/:id/json`.
- [ ] `.github/instructions/surveyjs.instructions.md`:
  - Remove the Survey Creator section (import pattern, CSS, `SurveyCreator` instantiation).
  - Add a note: "Survey Creator has been removed; use the JSON editor route instead."
- [ ] `.github/prompts/implement-questionnaire-routes.prompt.md`:
  - Remove `survey-creator-react` from the `pnpm add` line.
  - Remove the CSS import step for `survey-creator-core/survey-creator-core.css`.
  - Update the builder step to point to the JSON editor route.

**Tests**: N/A — documentation only.

**Stability Criteria**: No file in the repo imports or references `survey-creator` after this phase.

**Notes**:

---

## Phase 5: Final verification

**Status**: Not started

**Goal**: Confirm the codebase is clean, all checks pass, and the app is functional.

**Deliverables**:

- [ ] `pnpm build` exits 0 with no TypeScript errors.
- [ ] `pnpm lint` exits 0 with no ESLint warnings (only pre-existing `react-refresh` route
  errors are acceptable — document if present).
- [ ] `pnpm test --run` — all tests pass.
- [ ] Manual smoke test:
  - Create a new questionnaire → lands on JSON editor.
  - Navigate to `/questionnaires/:id/edit` → redirects to `/questionnaires/:id/json`.
  - Render a questionnaire via `/take/:id` → survey renders correctly.
  - Results page → SurveyDashboard and Raw Responses table still work.
- [ ] Run `grep -r "survey-creator" Frontend/src` → zero results.
- [ ] Move this plan file from `Docs/In-progress/` to `Docs/Completed/`.

**Stability Criteria**: All five bullet points above pass.

**Notes**:
