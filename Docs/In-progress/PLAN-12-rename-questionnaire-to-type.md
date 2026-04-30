# PLAN-12: Rename `Questionnaire` → `QuestionnaireType` Without Data Loss

## Overview

The current `Questionnaire` model stores the survey *template* (title, description,
`survey_json`, owner). PLAN-11 introduces a two-level hierarchy where this role is
played by `QuestionnaireType`. This plan covers **only the rename step**: safely
migrating the existing `Questionnaire` model and all dependent code to the new name
`QuestionnaireType`, without touching the planned `Questionnaire`-as-instance shape
from PLAN-11 (that restructure happens after this plan completes).

### Scope

| What changes | How |
|---|---|
| DB table `questionnaires_questionnaire` | Renamed in-place via `RenameModel` — zero data loss |
| FK `questionnaires_questionnaireresponse.questionnaire_id` | Renamed via `RenameField` — constraint updated, rows untouched |
| Python model class `Questionnaire` | Renamed to `QuestionnaireType` |
| Python model class `QuestionnaireResponse` | FK field renamed `questionnaire_type` |
| Serializer, views, admin, URLs | Updated to use new class/field names |
| Frontend types, API, hooks, routes | Updated to use `QuestionnaireType` naming |

### What does NOT change

- No column values are altered.
- No rows are deleted or created.
- The `QuestionnaireResponse` model is **kept** (removal is part of PLAN-11 Phase 1).
- The two-level hierarchy (QuestionnaireType + Questionnaire instance) is **not**
  introduced here — that is PLAN-11.

---

## Phase 1: Django Model & Migration

**Status**: Not started

**Goal**: Rename the Django model from `Questionnaire` to `QuestionnaireType` and
update the FK on `QuestionnaireResponse`, preserving all existing rows.

**Deliverables**:

- [ ] `Backend/questionnaires/models.py`:
  - Rename class `Questionnaire` → `QuestionnaireType`
  - Keep all fields identical (`id`, `owner`, `title`, `description`, `survey_json`,
    `created_at`, `updated_at`)
  - Update `__str__` and `Meta` (no table name override needed — Django derives it)
  - On `QuestionnaireResponse`: rename FK field `questionnaire` → `questionnaire_type`
    and update `related_name` to `"responses"` (unchanged), `on_delete=CASCADE`
  - Update `__str__` on `QuestionnaireResponse` to reference `self.questionnaire_type`

- [ ] `Backend/questionnaires/migrations/0005_rename_questionnaire_to_type.py`
  (hand-written or `makemigrations`-generated, then reviewed):

  ```python
  operations = [
      # 1. Rename the model — also renames the DB table in a single ALTER TABLE
      migrations.RenameModel(
          old_name="Questionnaire",
          new_name="QuestionnaireType",
      ),
      # 2. Rename the FK field on QuestionnaireResponse
      migrations.RenameField(
          model_name="questionnaireresponse",
          old_name="questionnaire",
          new_name="questionnaire_type",
      ),
  ]
  ```

  `RenameModel` in Django renames the underlying table atomically; no data copy is
  needed. `RenameField` renames the column and updates the FK constraint name.

- [ ] `Backend/questionnaires/admin.py`:
  - Import `QuestionnaireType` instead of `Questionnaire`
  - Rename `QuestionnaireAdmin` → `QuestionnaireTypeAdmin`
  - Update `list_filter` and `search_fields` to reference new FK name

**Tests**:

- [ ] `test_models.py`: existing Questionnaire tests updated to reference
  `QuestionnaireType`; confirm `QuestionnaireResponse.questionnaire_type` FK works

**Stability Criteria**: `python manage.py migrate` completes cleanly; running
`python manage.py shell -c "from questionnaires.models import QuestionnaireType; print(QuestionnaireType.objects.count())"` returns the same row count as before.

**Notes**:

---

## Phase 2: Backend Serializers, Views & URLs

**Status**: Not started

**Goal**: Update all backend Python code that references `Questionnaire` (the old
model name) to use `QuestionnaireType`.

**Deliverables**:

- [ ] `Backend/questionnaires/serializers.py`:
  - Rename `QuestionnaireSerializer` → `QuestionnaireTypeSerializer`
  - Change `model = QuestionnaireType`
  - `QuestionnaireResponseSerializer`: update `source` for the FK field:
    `questionnaireTypeId = serializers.UUIDField(source="questionnaire_type_id", read_only=True)`

- [ ] `Backend/questionnaires/views.py`:
  - Import `QuestionnaireType` (was `Questionnaire`)
  - Import `QuestionnaireTypeSerializer` (was `QuestionnaireSerializer`)
  - Rename `QuestionnaireViewSet` → `QuestionnaireTypeViewSet`
  - Update `get_queryset` to use `QuestionnaireType.objects.all()`
  - `ResponseListCreateView`: update `questionnaire_id` lookup key →
    `questionnaire_type_id` (to match the renamed FK column)
  - `ResponsePdfView`: update `get_object_or_404` to use `QuestionnaireType`; update
    FK filter: `questionnaire_type=questionnaire_type_obj`

- [ ] `Backend/questionnaires/urls.py`:
  - Register `QuestionnaireTypeViewSet` at the same prefix (`questionnaires/`)
  - No URL path changes — external API surface stays identical for now

- [ ] `Backend/questionnaires/pdf.py`:
  - Update function signature/type hints if they reference `Questionnaire`

**Tests**:

- [ ] `test_serializers.py`: update all `Questionnaire` references to
  `QuestionnaireType`; `questionnaireId` → `questionnaireTypeId` in response tests
- [ ] `test_views.py`: update model imports and factory calls

**Stability Criteria**: `pytest Backend/` all green with no references to the old
`Questionnaire` model name.

**Notes**:

---

## Phase 3: Frontend — TypeScript Types & API Layer

**Status**: Not started

**Goal**: Update the TypeScript types and API client to reflect the renamed model
while keeping the public API URL paths unchanged (they still hit `/api/questionnaires/`
until PLAN-11 changes the URL layout).

**Deliverables**:

- [ ] `Frontend/src/types/index.ts`:
  - Rename interface `Questionnaire` → `QuestionnaireType`
  - Keep all fields the same (`id`, `title`, `description?`, `surveyJson?`,
    `createdAt`, `updatedAt`)
  - `QuestionnaireResponse`: rename field `questionnaireId` → `questionnaireTypeId`
  - Keep `Answer` type as-is

- [ ] `Frontend/src/api/questionnaires.ts`:
  - Update return type annotations from `Questionnaire` to `QuestionnaireType`
  - Rename exported functions to signal the type:
    - `getQuestionnaires` → `getQuestionnaireTypes`
    - `getQuestionnaire` → `getQuestionnaireType`
    - `createQuestionnaire` → `createQuestionnaireType`
    - `updateQuestionnaire` → `updateQuestionnaireType`
    - `deleteQuestionnaire` → `deleteQuestionnaireType`
  - URL path strings remain `/questionnaires/` (no backend URL change yet)

- [ ] `Frontend/src/api/responses.ts`:
  - No functional change; update type import (`QuestionnaireResponse.questionnaireTypeId`)

- [ ] `Frontend/src/hooks/useQuestionnaires.ts`:
  - Rename exported hooks to `useQuestionnaireTypes`, `useQuestionnaireType`,
    `useCreateQuestionnaireType`, `useUpdateQuestionnaireType`,
    `useDeleteQuestionnaireType`
  - Update query-key factory name: `questionnaireTypeKeys`
  - Update API function calls to the renamed functions above

**Tests**:

- [ ] `api.questionnaires.test.ts` — update all references
- [ ] `useQuestionnaires.test.ts` — update hook names

**Stability Criteria**: `pnpm test` all green.

**Notes**:

---

## Phase 4: Frontend — Routes & Components

**Status**: Not started

**Goal**: Update every route file and component that imports `Questionnaire` type or
`useQuestionnaires` hook to use the renamed equivalents.

**Deliverables**:

- [ ] `Frontend/src/routes/questionnaires/index.tsx` — update type imports and hook calls
- [ ] `Frontend/src/routes/questionnaires/new.tsx` — update `createQuestionnaireType` call
- [ ] `Frontend/src/routes/questionnaires/share.tsx` — update type + hook imports
- [ ] `Frontend/src/routes/questionnaires/$id/json.tsx` — update type + hook imports
- [ ] `Frontend/src/routes/questionnaires/$id/results.tsx` — update type + hook imports
- [ ] `Frontend/src/routes/take/$id.tsx` — update type imports (survey schema still comes
  from `surveyJson` field, no change needed)
- [ ] `Frontend/src/components/questionnaire/QuestionnaireForm.tsx` — update type import
- [ ] Any other component under `Frontend/src/components/` referencing `Questionnaire`

**Tests**:

- [ ] All existing component tests — update imports, mock types, and hook names

**Stability Criteria**: `pnpm build` clean (strict mode will catch any missed rename);
`pnpm test` all green; dev server loads `/questionnaires` without console errors.

**Notes**:

---

## Phase 5: Final Verification & Docs

**Status**: Not started

**Goal**: Confirm zero data loss and no broken references across the full stack.

**Deliverables**:

- [ ] Run `python manage.py migrate` on a copy of production DB and confirm row counts
  match before/after
- [ ] Run full backend test suite: `pytest Backend/`
- [ ] Run full frontend test suite: `pnpm test`
- [ ] Run `pnpm build` (TypeScript strict mode enforces completeness)
- [ ] Run `pnpm lint` and fix any warnings
- [ ] Update `AGENTS.md` — replace `Questionnaire` with `QuestionnaireType` in type table
- [ ] Update `memories/repo/questionnaire-builder-state.md` — update type names
- [ ] Move this file to `Docs/Completed/`

**Stability Criteria**: Zero test failures; `pnpm build` exits 0; `pnpm lint` exits 0.

**Notes**:

---

## Data Safety Checklist

Before running the migration in any environment:

- [ ] Take a DB backup (or snapshot) first
- [ ] Verify `python manage.py showmigrations questionnaires` shows 0004 applied
- [ ] Run `python manage.py migrate --plan` and confirm only `0005` is pending
- [ ] After migrate: `SELECT COUNT(*) FROM questionnaires_questionnairetype;` equals
  the pre-migration `questionnaires_questionnaire` count
- [ ] After migrate: `SELECT COUNT(*) FROM questionnaires_questionnaireresponse;`
  unchanged

## Relationship to PLAN-11

This plan is a **prerequisite refactor** for PLAN-11. Completing it means:
- All code now uses `QuestionnaireType` for the survey template concept.
- PLAN-11 Phase 1 can introduce the new `Questionnaire` instance model cleanly,
  without a name collision.
- The DB migration chain remains linear and reviewable.
