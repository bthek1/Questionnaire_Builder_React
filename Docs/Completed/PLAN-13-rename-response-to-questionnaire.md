# PLAN-13: Rename `QuestionnaireResponse` → `Questionnaire`

## Overview

Completes the naming step from PLAN-11's two-level hierarchy vision. After PLAN-12
renamed the template model to `QuestionnaireType`, this plan renames the response
model from `QuestionnaireResponse` to `Questionnaire` — making it the
*instance + response* record described in PLAN-11.

**This plan does not restructure fields or remove/add columns.** It is a pure rename
of the class, DB table, serializer, admin, and TypeScript interface. Field-level
restructuring (adding `share_token`, `name`, merging `submitted_at`) belongs to
PLAN-11 Phase 1.

### Scope

| What changes | How |
|---|---|
| DB table `questionnaires_questionnaireresponse` | Renamed via `RenameModel` — zero data loss |
| Python model class `QuestionnaireResponse` | Renamed to `Questionnaire` |
| `QuestionnaireResponseSerializer` | Renamed to `QuestionnaireSerializer` |
| `QuestionnaireResponseAdmin` | Renamed to `QuestionnaireAdmin` |
| All views, pdf.py references | Updated to import/use `Questionnaire` |
| Backend tests | All `QuestionnaireResponse` references updated |
| `Frontend/src/types/index.ts` | `QuestionnaireResponse` interface → `Questionnaire` |
| `Frontend/src/api/responses.ts` | Type annotation updated |
| `Frontend/src/hooks/useResponses.ts` | Type import updated |
| Route and component files | `QuestionnaireResponse` → `Questionnaire` |
| Frontend tests | All `QuestionnaireResponse` references updated |

### What does NOT change

- No column values are altered.
- No rows are deleted or created.
- Field names (`questionnaire_type_id`, `answers`, `submitted_at`) are unchanged.
- The public API URL paths are unchanged (`/api/questionnaires/:id/responses/`).
- `QuestionnaireType` is untouched.

---

## Phase 1: Django Model & Migration

**Status**: ✅ Completed 2026-04-30

**Goal**: Rename the `QuestionnaireResponse` Django model to `Questionnaire` using a
`RenameModel` migration so the DB table is renamed atomically with no data loss.

**Deliverables**:

- [ ] `Backend/questionnaires/models.py`:
  - Rename class `QuestionnaireResponse` → `Questionnaire`
  - Keep all fields identical: `id`, `questionnaire_type` (FK), `answers`, `submitted_at`
  - Update `__str__` to reference `self.questionnaire_type` (already correct — no change needed)
  - Keep `related_name="responses"` on the FK (callers use `questionnaire_type.responses`)

- [ ] `Backend/questionnaires/migrations/0006_rename_response_to_questionnaire.py`
  (hand-written or reviewed after `makemigrations`):

  ```python
  from django.db import migrations

  class Migration(migrations.Migration):

      dependencies = [
          ("questionnaires", "0005_rename_questionnaire_to_type"),
      ]

      operations = [
          migrations.RenameModel(
              old_name="QuestionnaireResponse",
              new_name="Questionnaire",
          ),
      ]
  ```

  `RenameModel` renames the underlying DB table atomically — no data copy required.

**Tests**:

- [ ] `test_models.py`: update all `QuestionnaireResponse` imports and references to
  `Questionnaire`; confirm FK `questionnaire_type` still works and `related_name`
  `"responses"` resolves correctly

**Stability Criteria**: `python manage.py migrate` completes without errors; running
`python manage.py shell -c "from questionnaires.models import Questionnaire; print(Questionnaire.objects.count())"` returns the same row count as before.

---

## Phase 2: Backend Serializers, Views, Admin & PDF

**Status**: ✅ Completed 2026-04-30

**Goal**: Update all backend Python code that references `QuestionnaireResponse` to
use `Questionnaire`.

**Deliverables**:

- [ ] `Backend/questionnaires/serializers.py`:
  - Import `Questionnaire` instead of `QuestionnaireResponse`
  - Rename `QuestionnaireResponseSerializer` → `QuestionnaireSerializer`
  - Update `Meta.model = Questionnaire`

- [ ] `Backend/questionnaires/views.py`:
  - Import `Questionnaire` (was `QuestionnaireResponse`)
  - Import `QuestionnaireSerializer` (was `QuestionnaireResponseSerializer`)
  - Rename `ResponseListCreateView.serializer_class` → `QuestionnaireSerializer`
  - Update `get_queryset` and `perform_create` to reference `Questionnaire` model
  - Update `ResponsePdfView`: replace `QuestionnaireResponse` → `Questionnaire` in
    `get_object_or_404` call

- [ ] `Backend/questionnaires/admin.py`:
  - Import `Questionnaire` instead of `QuestionnaireResponse`
  - Rename `QuestionnaireResponseAdmin` → `QuestionnaireAdmin`
  - Update `@admin.register(Questionnaire)` decorator

- [ ] `Backend/questionnaires/pdf.py`:
  - Update any type hints or imports that reference `QuestionnaireResponse`

**Tests**:

- [ ] `test_serializers.py`: update `QuestionnaireResponseSerializer` →
  `QuestionnaireSerializer`; update model import
- [ ] `test_views.py`: update all `QuestionnaireResponse` model imports and factory
  calls to `Questionnaire`
- [ ] `test_pdf.py`: update model import if referenced

**Stability Criteria**: `pytest Backend/questionnaires/tests/ -q` all green with no
remaining references to `QuestionnaireResponse`.

---

## Phase 3: Frontend — TypeScript Types & API/Hooks

**Status**: ✅ Completed 2026-04-30

**Goal**: Rename the `QuestionnaireResponse` TypeScript interface to `Questionnaire`
across types, API layer, and hooks.

**Deliverables**:

- [ ] `Frontend/src/types/index.ts`:
  - Rename `export interface QuestionnaireResponse` → `export interface Questionnaire`
  - Keep all fields identical: `id`, `questionnaireTypeId`, `answers`, `submittedAt`

- [ ] `Frontend/src/api/responses.ts`:
  - Update `import type { QuestionnaireResponse }` → `import type { Questionnaire }`
  - Update all `Promise<QuestionnaireResponse>` and `Promise<QuestionnaireResponse[]>`
    return types to use `Questionnaire`

- [ ] `Frontend/src/hooks/useResponses.ts`:
  - Update `import type { QuestionnaireResponse }` → `import type { Questionnaire }`
  - Update any inline type annotations

**Stability Criteria**: `pnpm build` compiles without TypeScript errors.

---

## Phase 4: Frontend — Routes, Components & Tests

**Status**: ✅ Completed 2026-04-30

**Goal**: Update every route file, component, and test that imports or references the
`QuestionnaireResponse` type.

**Files to update**:

- [ ] `Frontend/src/components/questionnaire/RawResponsesTable.tsx`
  - `import type { QuestionnaireResponse }` → `import type { Questionnaire }`
  - Prop type: `responses: QuestionnaireResponse[]` → `responses: Questionnaire[]`

- [ ] `Frontend/src/routes/responses/$id/index.tsx`
  - `import type { QuestionnaireResponse }` → `import type { Questionnaire }`
  - Inline `response: QuestionnaireResponse` annotation → `response: Questionnaire`

**Test files to update**:

- [ ] `Frontend/src/test/api.responses.test.ts`
  - `import type { QuestionnaireResponse }` → `import type { Questionnaire }`
  - `const mockResponse: QuestionnaireResponse` → `const mockResponse: Questionnaire`

- [ ] `Frontend/src/test/useResponses.test.tsx`
  - `import type { QuestionnaireResponse }` → `import type { Questionnaire }`
  - `const sampleResponse: QuestionnaireResponse` → `const sampleResponse: Questionnaire`

- [ ] `Frontend/src/test/RawResponsesTable.test.tsx`
  - `import type { QuestionnaireResponse }` → `import type { Questionnaire }`
  - All `QuestionnaireResponse` type annotations → `Questionnaire`

**Stability Criteria**: `pnpm test` all green; `pnpm build` produces no errors.

---

## Completion Checklist

- [x] Phase 1 complete — migration runs cleanly, backend tests green
- [x] Phase 2 complete — no `QuestionnaireResponse` remains in Python source
- [x] Phase 3 complete — TypeScript compiles, API/hook types updated
- [x] Phase 4 complete — all frontend tests pass, build succeeds
- [x] `grep -r "QuestionnaireResponse" Backend/ Frontend/src/` returns no results
