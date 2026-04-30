# PLAN-11: Questionnaire Types & Instances

## Overview

Introduce a two-level hierarchy:

| Concept | Model | Role |
|---------|-------|------|
| **QuestionnaireType** | `QuestionnaireType` | Reusable template — stores the SurveyJS JSON schema, title, description, and owner. Edited by the creator in the JSON split-view. |
| **Questionnaire** | `Questionnaire` (repurposed) | A single deployment sent to one person — has a `share_token` link, and stores that person's answers directly (no separate response model). |

### What changes

- `QuestionnaireType` is a **new model** that takes over `title`, `description`, `survey_json`, and `owner` from the current `Questionnaire`.
- `Questionnaire` becomes a combined **instance + response record**: FK → `QuestionnaireType`, optional `name`, `share_token` (UUID public link), `answers` (JSONField, empty until submitted), `submitted_at` (null until submitted).
- `QuestionnaireResponse` is **removed** — its data (`answers`, `submitted_at`) merges into `Questionnaire`.
- Each `Questionnaire` row represents exactly one send-link → one respondent → one set of answers (1-to-1 by design).
- The results/analytics page aggregates `answers` across all `Questionnaire` instances of a given type.
- The public take URL becomes `/take/<share_token>`.
- The JSON editor route targets `QuestionnaireType`, not `Questionnaire`.

---

## Phase 1: Backend — New Models & Migration

**Status**: Not started

**Goal**: Add `QuestionnaireType` model, merge `QuestionnaireResponse` into `Questionnaire`, and migrate existing data.

**Deliverables**:

- [ ] New `QuestionnaireType` model in `Backend/questionnaires/models.py`:
  - `id` — UUIDField, PK
  - `owner` — FK → User (nullable)
  - `title` — CharField(255)
  - `description` — TextField(blank, null)
  - `survey_json` — JSONField(default=dict)
  - `created_at`, `updated_at` — auto timestamps
  - `__str__` returns `title`
  - `Meta.ordering = ["-created_at"]`
- [ ] Rewrite `Questionnaire` model (instance + response combined):
  - Remove `title`, `description`, `survey_json`, `owner` fields
  - Add `questionnaire_type` — ForeignKey(QuestionnaireType, on_delete=CASCADE, related_name="instances")
  - Add `name` — CharField(max_length=255, blank=True) — optional human label for this send
  - Add `share_token` — UUIDField(default=uuid.uuid4, unique=True, db_index=True)
  - Add `answers` — JSONField(default=dict, blank=True) — empty until the respondent submits
  - Add `submitted_at` — DateTimeField(null=True, blank=True) — set on submission
  - Keep `created_at` (auto_now_add), `updated_at` (auto_now)
  - `__str__` returns `f"{self.questionnaire_type.title} – {self.name or self.share_token}"`
- [ ] Delete `QuestionnaireResponse` model
- [ ] Write migration `0005_questionnaire_type.py`:
  - Create `QuestionnaireType` table
  - Add `questionnaire_type` FK, `share_token`, `name`, `answers`, `submitted_at` to `Questionnaire`
  - Data migration:
    1. For each existing `Questionnaire` row: create a `QuestionnaireType` with `title`, `description`, `survey_json`, `owner`; set `questionnaire.questionnaire_type` FK
    2. For each existing `QuestionnaireResponse` row: copy `answers` and `submitted_at` onto the parent `Questionnaire` row (if multiple responses existed, keep the most recent)
  - Drop `QuestionnaireResponse` table
  - Drop old fields (`title`, `description`, `survey_json`, `owner`) from `Questionnaire`
- [ ] Register `QuestionnaireType` in `Backend/questionnaires/admin.py`; remove `QuestionnaireResponse` admin registration

**Tests**:

- [ ] `test_models.py`: QuestionnaireType CRUD, Questionnaire creation, `share_token` uniqueness, cascade delete, `answers`/`submitted_at` default to empty/null

**Stability Criteria**: `python manage.py migrate` completes without errors; no data loss on existing answers.

**Notes**:

---

## Phase 2: Backend — Serializers, Views, URLs

**Status**: Not started

**Goal**: Expose full CRUD for `QuestionnaireType` and `Questionnaire` instances via the REST API.

**Deliverables**:

- [ ] `QuestionnaireTypeSerializer` in `serializers.py`:
  - Fields: `id`, `title`, `description`, `surveyJson` (→ `survey_json`), `createdAt`, `updatedAt`
  - `read_only_fields`: `id`, `createdAt`, `updatedAt`
- [ ] `QuestionnaireSerializer` (replaces old + response serializer):
  - Fields: `id`, `questionnaireTypeId` (→ `questionnaire_type_id`), `name`, `shareToken` (→ `share_token`, read-only), `answers`, `submittedAt` (→ `submitted_at`, read-only), `createdAt`, `updatedAt`
  - Nested read-only field `questionnaireType` (nested `QuestionnaireTypeSerializer`) for detail/take views
  - `read_only_fields`: `id`, `shareToken`, `submittedAt`, `createdAt`, `updatedAt`
- [ ] Remove `QuestionnaireResponseSerializer`
- [ ] `QuestionnaireTypeViewSet` (ModelViewSet, `AllowAny`):
  - Standard CRUD at `/api/questionnaire-types/`
- [ ] `QuestionnaireViewSet` (updated, ModelViewSet, `AllowAny`):
  - Standard CRUD on instances
  - Custom action `GET /api/questionnaires/by-token/<share_token>/` — public lookup for the take page
  - Custom action `PATCH /api/questionnaires/by-token/<share_token>/submit/` — respondent submits answers (sets `answers` + `submitted_at`)
- [ ] Remove `ResponseListCreateView` and `ResponsePdfView` (or repurpose PDF to export a single `Questionnaire`'s answers)
- [ ] `urls.py` updated:
  - Register `QuestionnaireTypeViewSet` at `questionnaire-types/`
  - Register `QuestionnaireViewSet` at `questionnaires/`
  - Remove old nested response endpoints
  - New paths: `questionnaires/by-token/<uuid:share_token>/` and `questionnaires/by-token/<uuid:share_token>/submit/`
- [ ] PDF export: `GET /api/questionnaires/<id>/pdf/` — export a single instance's answers as PDF

**Tests**:

- [ ] `test_serializers.py`: QuestionnaireType + updated Questionnaire serializer, nested read, answers write
- [ ] `test_views.py`: CRUD for both ViewSets, by-token lookup (valid + 404), submit action sets `answers` + `submitted_at`, re-submission rejected if already submitted

**Stability Criteria**: All existing passing backend tests still pass; new tests green.

**Notes**:

---

## Phase 3: Frontend — Type Definitions & API Layer

**Status**: Not started

**Goal**: Update TypeScript types and API functions to match the new two-model shape (no separate response type).

**Deliverables**:

- [ ] `Frontend/src/types/index.ts` — replace all types with:
  ```ts
  export interface QuestionnaireType {
    id: string;
    title: string;
    description?: string;
    surveyJson?: object;
    createdAt: string;
    updatedAt: string;
  }

  export interface Questionnaire {
    id: string;
    questionnaireTypeId: string;
    questionnaireType?: QuestionnaireType;  // nested on detail/take
    name: string;
    shareToken: string;
    answers: Record<string, unknown>;       // empty until submitted
    submittedAt: string | null;
    createdAt: string;
    updatedAt: string;
  }
  ```
  Remove `QuestionnaireResponse` and `Answer` types.
- [ ] `Frontend/src/api/questionnaireTypes.ts` — new file:
  - `getQuestionnaireTypes()`, `getQuestionnaireType(id)`, `createQuestionnaireType(data)`, `updateQuestionnaireType(id, data)`, `deleteQuestionnaireType(id)`
- [ ] `Frontend/src/api/questionnaires.ts` — rewrite:
  - `getQuestionnaires()`, `getQuestionnaire(id)`, `getQuestionnaireByToken(shareToken)`
  - `createQuestionnaire(data: { questionnaireTypeId, name? })`
  - `updateQuestionnaire(id, data)`
  - `deleteQuestionnaire(id)`
  - `submitAnswers(shareToken, answers)` — PATCH to `/by-token/<shareToken>/submit/`
- [ ] Remove `Frontend/src/api/responses.ts`
- [ ] `Frontend/src/hooks/useQuestionnaireTypes.ts` — new file, query-key factory pattern
- [ ] `Frontend/src/hooks/useQuestionnaires.ts` — update to new shape; replace response hooks with `useSubmitAnswers`
- [ ] Remove `Frontend/src/hooks/useResponses.ts`

**Tests**:

- [ ] `api.questionnaireTypes.test.ts` — new
- [ ] Update `api.questionnaires.test.ts` — new shape + `submitAnswers`
- [ ] `useQuestionnaireTypes.test.ts` — new
- [ ] Update `useQuestionnaires.test.ts`
- [ ] Delete `api.responses.test.ts` and `useResponses.test.ts`

**Stability Criteria**: `pnpm test` all green.

**Notes**:

---

## Phase 4: Frontend — QuestionnaireType Routes (Builder)

**Status**: Not started

**Goal**: Give the owner a UI to manage `QuestionnaireType` records (the survey templates).

**Deliverables**:

- [ ] `Frontend/src/routes/questionnaire-types/index.tsx` — list all types; each row has:
  - Title + description
  - **Edit JSON** button → `/questionnaire-types/:id/json`
  - **New Instance** button → `/questionnaires/new?typeId=<id>`
  - **Delete** button
- [ ] `Frontend/src/routes/questionnaire-types/new.tsx` — create form (title, description) → redirect to `/questionnaire-types/:id/json`
- [ ] `Frontend/src/routes/questionnaire-types/$id/json.tsx` — split-view Monaco JSON editor + live SurveyRenderer preview (same pattern as current `questionnaires/$id/json.tsx` but targeting `QuestionnaireType`)
- [ ] Nav bar updated to add "Types" link → `/questionnaire-types`

**Tests**:

- [ ] `QuestionnaireTypesPage.test.tsx` — list renders, delete calls hook
- [ ] `NewQuestionnaireTypePage.test.tsx` — form submit calls create mutation, redirects
- [ ] `JsonEditorTypePage.test.tsx` — editor loads type surveyJson, save patches type

**Stability Criteria**: `pnpm build` clean; routes accessible and functional.

**Notes**:

---

## Phase 5: Frontend — Questionnaire Instance Routes (Deploy & Take)

**Status**: Not started

**Goal**: Give the owner a UI to manage `Questionnaire` instances (deployments) and update the take/results routes.

**Deliverables**:

- [ ] `Frontend/src/routes/questionnaires/index.tsx` — updated list:
  - Columns: Type title, Instance name, Status (submitted / pending), Share link (copy button), Results link, Delete
  - **+ New Deployment** button → `/questionnaires/new`
- [ ] `Frontend/src/routes/questionnaires/new.tsx` — create instance form:
  - Dropdown to pick `QuestionnaireType`
  - Optional name field
  - On submit → `createQuestionnaire` → redirect to instance list
  - If `?typeId=<id>` query param pre-selects the type
- [ ] `Frontend/src/routes/take/$id.tsx` — `$id` is `shareToken`:
  - Fetch via `getQuestionnaireByToken(shareToken)`
  - If `submittedAt` is already set → show "already submitted" message (no re-submission)
  - Renders `surveyJson` from nested `questionnaireType`
  - `onComplete` → `submitAnswers(shareToken, answers)`; on success show thank-you message
- [ ] `Frontend/src/routes/questionnaires/$id/results.tsx` — updated:
  - Fetch all `Questionnaire` instances of the same type (`getQuestionnaires()` filtered by `questionnaireTypeId`)
  - Collect `answers` from all submitted instances → feed into SurveyDashboard (VisualizationPanel)
  - Survey schema from `questionnaireType.surveyJson`
  - PDF export: download single instance PDF via `/api/questionnaires/<id>/pdf/`
- [ ] Remove `Frontend/src/routes/questionnaires/share.tsx` or update to iterate over instances
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

**Status**: Not started

**Goal**: Ensure the repo is fully consistent, documented, and all checks pass.

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

The migration `0005` must handle existing data:

1. For each existing `Questionnaire` row: create a `QuestionnaireType` with the same `title`, `description`, `survey_json`, `owner`; point `questionnaire.questionnaire_type` at it.
2. For each existing `QuestionnaireResponse` row: copy `answers` and `submitted_at` onto the parent `Questionnaire` row. If a questionnaire had multiple responses (old 1-to-many), copy the most recent one.
3. `share_token` is auto-generated by `uuid.uuid4` default — no explicit data migration step needed.
4. Drop the `QuestionnaireResponse` table.
5. Drop old columns (`title`, `description`, `survey_json`, `owner`) from `Questionnaire`.

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
