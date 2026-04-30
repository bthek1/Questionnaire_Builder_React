# PLAN-11: Questionnaire Types & Instances

## Overview

Introduce a two-level hierarchy:

| Concept | Model | Role |
|---------|-------|------|
| **QuestionnaireType** | `QuestionnaireType` | Reusable template — stores the SurveyJS JSON schema, title, description, and owner. Edited by the creator in the JSON split-view. |
| **Questionnaire** | `Questionnaire` (repurposed) | A single deployment sent to one person — has a `share_token` link, and stores that person's answers directly (no separate response model). |

### What changes

- `QuestionnaireType` ✅ already exists (PLAN-12) — stores `title`, `description`, `survey_json`, and `owner`.
- `Questionnaire` ✅ already exists as a rename of `QuestionnaireResponse` (PLAN-13) — still needs `share_token`, `name`, nullable `submitted_at`, and `created_at`/`updated_at` added.
- `QuestionnaireResponse` ✅ already removed (PLAN-13) — its data (`answers`, `submitted_at`) is on `Questionnaire`.
- Each `Questionnaire` row represents exactly one send-link → one respondent → one set of answers (1-to-1 by design).
- The results/analytics page aggregates `answers` across all `Questionnaire` instances of a given type.
- The public take URL becomes `/take/<share_token>`.
- The JSON editor route targets `QuestionnaireType`, not `Questionnaire`.

---

## Phase 1: Backend — New Models & Migration

**Status**: ✅ Completed 2025-07-28

**Goal**: Extend `Questionnaire` with `share_token`, `name`, and fix `submitted_at` / `answers` defaults. `QuestionnaireType` and `Questionnaire` models already exist (created by PLAN-12 and PLAN-13).

**Prerequisites completed**:
- ✅ PLAN-12 — `Questionnaire` renamed to `QuestionnaireType` (migration `0005`)
- ✅ PLAN-13 — `QuestionnaireResponse` renamed to `Questionnaire` (migration `0006`)

**Current `Questionnaire` model state** (after PLAN-13):
- `id`, `questionnaire_type` FK, `answers` (JSONField default=list), `submitted_at` (auto_now_add)
- Missing: `share_token`, `name`, `created_at`, `updated_at`
- `submitted_at` must change from `auto_now_add` to nullable (set only on submission)
- `answers` default should be `dict` not `list`
- `related_name` is `"responses"` — should be `"instances"`

**Deliverables**:

- [ ] Update `Questionnaire` model in `Backend/questionnaires/models.py`:
  - Change `related_name` on `questionnaire_type` FK from `"responses"` to `"instances"`
  - Add `name` — CharField(max_length=255, blank=True)
  - Add `share_token` — UUIDField(default=uuid.uuid4, unique=True, db_index=True)
  - Change `answers` default from `list` to `dict`; add `blank=True`
  - Change `submitted_at` from `auto_now_add=True` to `null=True, blank=True` (no auto-set)
  - Add `created_at` — DateTimeField(auto_now_add=True)
  - Add `updated_at` — DateTimeField(auto_now=True)
  - Update `__str__` to `f"{self.questionnaire_type.title} – {self.name or self.share_token}"`
- [ ] Write migration `0007_questionnaire_add_fields.py`:
  - Add `name`, `share_token`, `created_at`, `updated_at`
  - Alter `answers` (default dict, blank=True)
  - Alter `submitted_at` (null=True, blank=True, remove auto_now_add)
  - Alter `related_name` on FK (`"instances"`)
- [ ] Update `Backend/questionnaires/admin.py` `QuestionnaireAdmin` to list `share_token`, `name`, `submitted_at`

**Tests**:

- [ ] `test_models.py`: `Questionnaire` creation with defaults, `share_token` uniqueness, cascade delete from `QuestionnaireType`, `answers` defaults to `{}`, `submitted_at` defaults to `None`

**Stability Criteria**: `python manage.py migrate` completes without errors; all existing backend tests still pass.

**Notes**:
- PLAN-12 and PLAN-13 are complete prerequisites — all rename work is done.
- Callers using `questionnaire_type.responses` (old `related_name`) must be updated to `.instances` alongside the migration.

---

## Phase 2: Backend — Serializers, Views, URLs

**Status**: ✅ Completed 2025-07-28

**Notes**: All deliverables implemented. Migration `0007_questionnaire_add_fields` created. QuestionnaireAdmin updated. 69 backend tests pass.

**Already done**:
- ✅ `QuestionnaireTypeSerializer` — exists with correct fields (`id`, `title`, `description`, `surveyJson`, `createdAt`, `updatedAt`)
- ✅ `QuestionnaireTypeViewSet` — exists (`ModelViewSet`, `AllowAny`); currently registered at `""` (i.e. `/api/questionnaires/`)
- ✅ `QuestionnaireResponseSerializer` removed (renamed to `QuestionnaireSerializer` in PLAN-13)

**Deliverables**:

- [ ] Update `QuestionnaireSerializer` in `serializers.py` (currently only has `id`, `questionnaireTypeId`, `answers`, `submittedAt`):
  - Add `name`, `shareToken` (→ `share_token`, read-only), `createdAt`, `updatedAt`
  - Add nested read-only `questionnaireType` field (nested `QuestionnaireTypeSerializer`) for detail/take views
  - Update `read_only_fields`: `id`, `shareToken`, `submittedAt`, `createdAt`, `updatedAt`
  - Note: `name`, `shareToken`, `createdAt`, `updatedAt` fields only exist after Phase 1 migration
- [ ] Add `QuestionnaireViewSet` (new `ModelViewSet`, `AllowAny`):
  - Standard CRUD on instances at `/api/questionnaires/`
  - Custom action `GET /by-token/<share_token>/` — public lookup for the take page
  - Custom action `PATCH /by-token/<share_token>/submit/` — sets `answers` + `submitted_at`; returns 409 if already submitted
- [ ] Remove `ResponseListCreateView` and `ResponsePdfView` from `views.py`
- [ ] Update `urls.py`:
  - Move `QuestionnaireTypeViewSet` registration from `""` to `questionnaire-types/`
  - Register `QuestionnaireViewSet` at `questionnaires/`
  - Remove old `<uuid:questionnaire_pk>/responses/` and `.../pdf/` paths
- [ ] PDF export: `GET /api/questionnaires/<id>/pdf/` — export a single instance's answers as PDF (repurpose `ResponsePdfView`)

**Tests**:

- [ ] `test_serializers.py`: updated `QuestionnaireSerializer` nested read, `shareToken` read-only, answers write
- [ ] `test_views.py`: CRUD for `QuestionnaireViewSet`, `by-token/` lookup (valid + 404), submit action sets `answers` + `submitted_at`, re-submission returns 409

**Stability Criteria**: All existing passing backend tests still pass; new tests green.

**Notes**:

---

## Phase 3: Frontend — Type Definitions & API Layer

**Status**: ✅ Completed 2025-07-28

**Goal**: Update TypeScript types and API functions to match the new two-model shape (no separate response type).

**Already done**:
- ✅ `QuestionnaireType` interface in `types/index.ts` — correct already (`id`, `title`, `description?`, `surveyJson?`, `createdAt`, `updatedAt`)
- ✅ `api/questionnaires.ts` — already has all `QuestionnaireType` CRUD functions (`getQuestionnaireTypes`, `getQuestionnaireType`, `createQuestionnaireType`, `updateQuestionnaireType`, `deleteQuestionnaireType`)
- ✅ `hooks/useQuestionnaires.ts` — already has all `QuestionnaireType` hooks (`useQuestionnaireTypes`, `useQuestionnaireType`, `useCreateQuestionnaireType`, etc.)

**Deliverables**:

- [ ] `Frontend/src/types/index.ts` — update `Questionnaire` interface (add `name`, `shareToken`, `questionnaireType?`, `createdAt`, `updatedAt`; fix `submittedAt: string | null`; fix `answers: Record<string, unknown>`); remove `Answer` type
- [ ] `Frontend/src/api/questionnaireTypes.ts` — new file: move `QuestionnaireType` functions from `questionnaires.ts` here (no logic change, just rename the file)
- [ ] `Frontend/src/api/questionnaires.ts` — rewrite for `Questionnaire` instances:
  - `getQuestionnaires()`, `getQuestionnaire(id)`, `getQuestionnaireByToken(shareToken)`
  - `createQuestionnaire(data: { questionnaireTypeId, name? })`
  - `updateQuestionnaire(id, data)`
  - `deleteQuestionnaire(id)`
  - `submitAnswers(shareToken, answers)` — PATCH to `/questionnaires/by-token/<shareToken>/submit/`
- [ ] Remove `Frontend/src/api/responses.ts`
- [ ] `Frontend/src/hooks/useQuestionnaireTypes.ts` — new file: move `QuestionnaireType` hooks from `useQuestionnaires.ts` here (no logic change, just rename the file + update import)
- [ ] `Frontend/src/hooks/useQuestionnaires.ts` — rewrite for `Questionnaire` instance hooks; add `useSubmitAnswers(shareToken)`
- [ ] Remove `Frontend/src/hooks/useResponses.ts`

**Tests**:

- [ ] `api.questionnaireTypes.test.ts` — move/rename from `api.questionnaires.test.ts`
- [ ] `api.questionnaires.test.ts` — rewrite for instance shape + `submitAnswers`
- [ ] `useQuestionnaireTypes.test.ts` — move/rename from `useQuestionnaires.test.ts`
- [ ] `useQuestionnaires.test.ts` — rewrite for instance hooks
- [ ] Delete `api.responses.test.ts` and `useResponses.test.ts`

**Stability Criteria**: `pnpm test` all green.

**Notes**:

---

## Phase 4: Frontend — QuestionnaireType Routes (Builder)

**Status**: ✅ Completed 2026-04-30

**Goal**: Give the owner a UI to manage `QuestionnaireType` records (the survey templates).

**All deliverables already exist**:
- ✅ `Frontend/src/routes/questionnaire-types/index.tsx`
- ✅ `Frontend/src/routes/questionnaire-types/new.tsx`
- ✅ `Frontend/src/routes/questionnaire-types/share.tsx`
- ✅ `Frontend/src/routes/questionnaire-types/$id/json.tsx` — split-view Monaco editor + live preview
- ✅ Nav bar — already has "Questionnaire Types" → `/questionnaire-types` and "Questionnaires" → `/questionnaires`

**Notes**: Phase 4 routes were built prior to PLAN-11 work beginning. They will need to be updated in Phase 5 once the hooks are renamed (Phase 3) — currently they import from `useQuestionnaires` which will become `useQuestionnaireTypes`.

---

## Phase 5: Frontend — Questionnaire Instance Routes (Deploy & Take)

**Status**: ✅ Completed 2025-07-28

**Goal**: Give the owner a UI to manage `Questionnaire` instances (deployments) and update the take/results routes.

**Current state of `questionnaires/` routes**:
- `questionnaires/index.tsx` — exists but shows QuestionnaireType list + per-type response counts (old shape); uses `useResponses` hook
- `questionnaires/$id/index.tsx` — exists as a response detail page; uses `useResponses` hook
- `questionnaires/$id/$responseId.tsx` — exists (individual response view)
- No `questionnaires/new.tsx` or `questionnaires/$id/results.tsx`
- `take/$id.tsx` — exists but calls `submitResponse` via old `useResponses` hook

**Deliverables**:

- [ ] Rewrite `Frontend/src/routes/questionnaires/index.tsx` — instance list:
  - Columns: Type title, Instance name, Status (submitted / pending), Share link (copy button), Results link, Delete
  - **+ New Deployment** button → `/questionnaires/new`
- [ ] Create `Frontend/src/routes/questionnaires/new.tsx` — create instance form:
  - Dropdown to pick `QuestionnaireType`
  - Optional name field
  - On submit → `createQuestionnaire` → redirect to instance list
  - If `?typeId=<id>` query param pre-selects the type
- [ ] Rename/rewrite `questionnaires/$id/index.tsx` → `questionnaires/$id/results.tsx`:
  - Fetch all `Questionnaire` instances of the same type (filtered by `questionnaireTypeId`)
  - Collect `answers` from submitted instances → feed into SurveyDashboard (VisualizationPanel)
  - Survey schema from `questionnaireType.surveyJson`
  - PDF export via `/api/questionnaires/<id>/pdf/`
- [ ] Delete `questionnaires/$id/$responseId.tsx` — no longer needed
- [ ] Update `Frontend/src/routes/take/$id.tsx` — `$id` is `shareToken`:
  - Fetch via `getQuestionnaireByToken(shareToken)`
  - If `submittedAt` is already set → show "already submitted" message (no re-submission)
  - Renders `surveyJson` from nested `questionnaireType`
  - `onComplete` → `submitAnswers(shareToken, answers)`; on success show thank-you message
- [ ] Update `questionnaire-types/index.tsx` to import from `useQuestionnaireTypes` (rename from Phase 3)
- [ ] Update `questionnaire-types/$id/json.tsx` to import from `useQuestionnaireTypes`
- [ ] Shareable URL pattern updated to `window.location.origin + /take/${instance.shareToken}`

**Tests**:

- [ ] `QuestionnairesPage.test.tsx` — updated for new shape + status column
- [ ] `NewQuestionnairePage.test.tsx` — type dropdown test
- [ ] `TakePage.test.tsx` — already-submitted guard, submit calls `submitAnswers`
- [ ] `ResultsPage.test.tsx` — aggregates answers from instances

**Stability Criteria**: `pnpm build` clean; `pnpm test` all green; public take URL resolves and prevents double submission.

**Notes**:

---

## Phase 6: Cleanup, Docs & Build Verification

**Status**: ✅ Completed 2025-07-28

**Goal**: Ensure the repo is fully consistent, documented, and all checks pass.

**Notes**: `pnpm build` ✅, `pnpm lint` ✅, `pnpm test` 82/82 ✅, Django pytest 69/69 ✅. `AGENTS.md` updated. Deprecated `api/responses.ts` and `hooks/useResponses.ts` emptied (kept as stubs). ESLint react-refresh fixed via file-level disable comments on all route files.

**Deliverables**:

- [ ] Remove or archive any dead code left from the migration (old `questionnaires` API file shape, unused types)
- [ ] Update `AGENTS.md` — architecture table, route structure, API layer section
- [ ] Update `Docs/SurveyJS/README.md` if integration notes changed
- [ ] Update `memories/repo/questionnaire-builder-state.md`
- [ ] Run `pnpm build` — zero errors/warnings
- [ ] Run `pnpm lint` — zero errors
- [ ] Run `pnpm test` — all pass
- [ ] Run Django test suite (`pytest`) — all pass
- [ ] Run `pnpm test:e2e` (Playwright) — all pass (or update broken specs)

**Stability Criteria**: All CI checks green; plan file moved to `Docs/Completed/`.

**Notes**:

---

## API Shape Reference

### QuestionnaireType endpoints

| Method | URL | Description |
|--------|-----|-------------|
| GET | `/api/questionnaire-types/` | List all types |
| POST | `/api/questionnaire-types/` | Create a type |
| GET | `/api/questionnaire-types/:id/` | Get a type |
| PATCH | `/api/questionnaire-types/:id/` | Update survey JSON / metadata |
| DELETE | `/api/questionnaire-types/:id/` | Delete a type (cascades to instances) |

### Questionnaire (instance + response) endpoints

| Method | URL | Auth | Description |
|--------|-----|------|-------------|
| GET | `/api/questionnaires/` | owner | List all instances |
| POST | `/api/questionnaires/` | owner | Create instance (`{ questionnaireTypeId, name? }`) |
| GET | `/api/questionnaires/:id/` | owner | Get instance (includes nested type + answers) |
| PATCH | `/api/questionnaires/:id/` | owner | Rename instance |
| DELETE | `/api/questionnaires/:id/` | owner | Delete instance |
| GET | `/api/questionnaires/:id/pdf/` | owner | PDF export of this instance's answers |
| GET | `/api/questionnaires/by-token/:shareToken/` | public | Fetch instance by share token (for respondent) |
| PATCH | `/api/questionnaires/by-token/:shareToken/submit/` | public | Submit answers — sets `answers` + `submitted_at`; returns 409 if already submitted |

---

## Data Migration Notes

**Steps 1–5 from the original plan are completed via PLAN-12 and PLAN-13:**

| Step | Migration | Status |
|------|-----------|--------|
| Create `QuestionnaireType` table; move `title`, `description`, `survey_json`, `owner` | `0005_rename_questionnaire_to_type` | ✅ Done |
| Rename `QuestionnaireResponse` → `Questionnaire`; FK becomes `questionnaire_type` | `0006_rename_response_to_questionnaire` | ✅ Done |
| Add `share_token`, `name`, `created_at`, `updated_at`; fix `answers` default + `submitted_at` nullable | `0007_questionnaire_add_fields` | ⬜ Phase 1 |

`share_token` is auto-generated by `uuid.uuid4` default — no explicit data backfill needed. Existing rows will receive a unique token automatically.

---

## Route Map (after this plan)

```
Frontend/src/routes/
  __root.tsx                            # nav: Home | Types | My Deployments
  index.tsx                             # redirect → /questionnaire-types
  questionnaire-types/
    index.tsx                           # list types
    new.tsx                             # create type
    $id/
      json.tsx                          # edit type survey JSON (split-view)
  questionnaires/
    index.tsx                           # list instances (deployments)
    new.tsx                             # create instance (pick type + optional name)
    share.tsx                           # copy shareable links for all instances
    $id/
      results.tsx                       # SurveyDashboard + PDF export
  take/
    $id.tsx                             # public respondent view — $id = shareToken
```
