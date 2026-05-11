# PLAN-22: Rename Questionnaire JSON Model Fields

## Overview

Rename three `JSONField` columns on the `Questionnaire` Django model for clarity:

| Old name | New name |
|---|---|
| `answers` | `answers_json` |
| `survey_json_snapshot` | `questionnaire_json_snapshot` |
| `metrics` | `metrics_json` |

The REST API JSON keys exposed to the frontend (`answers`, `surveyJsonSnapshot`, `metrics`) are **unchanged** — the serializer bridges the gap via `source=` attributes. This means no frontend code changes are required.

---

## Phase 1: Django Migration

**Status**: ✅ Completed 2026-05-11

**Goal**: Add a single database migration that renames all three columns atomically using `RenameField`.

**Deliverables**:

- [ ] Create `Backend/questionnaires/migrations/0014_rename_questionnaire_json_fields.py`
      using three `migrations.RenameField` operations in one migration:
      - `Questionnaire`: `answers` → `answers_json`
      - `Questionnaire`: `survey_json_snapshot` → `questionnaire_json_snapshot`
      - `Questionnaire`: `metrics` → `metrics_json`

**Tests**:

- [ ] Run `python manage.py migrate --run-syncdb` (or equivalent) to verify the migration applies cleanly.

**Stability Criteria**: Migration applies without errors on a fresh `migrate` run.

**Notes**:

---

## Phase 2: Backend Model & Python Code

**Status**: ✅ Completed 2026-05-11

**Goal**: Update all Python code that references the old field names so the codebase works with the renamed columns.

**Deliverables**:

- [ ] `Backend/questionnaires/models.py` — rename the three field definitions:
  - `answers` → `answers_json`
  - `survey_json_snapshot` → `questionnaire_json_snapshot`
  - `metrics` → `metrics_json`

- [ ] `Backend/questionnaires/serializers.py` — add explicit `source=` on `answers` and `metrics`; update `source=` on `surveyJsonSnapshot`:
  - `answers = serializers.JSONField(source="answers_json", ...)` (keeps API key `answers`)
  - `surveyJsonSnapshot = serializers.JSONField(source="questionnaire_json_snapshot", ...)` (API key unchanged)
  - `metrics = serializers.JSONField(source="metrics_json", ...)` (API key unchanged)
  - Update `"answers"` and `"metrics"` in `fields` list to remain as-is (they are the serializer-level names)
  - Remove `"answers"` and `"metrics"` from `read_only_fields` if they are listed there; they now have explicit declarations

- [ ] `Backend/questionnaires/views.py` — update the `submit` action and `prior_answers` action:
  - `instance.answers` → `instance.answers_json`
  - `instance.survey_json_snapshot` → `instance.questionnaire_json_snapshot`
  - `instance.metrics` → `instance.metrics_json`
  - `update_fields` list: `"answers"` → `"answers_json"`, `"survey_json_snapshot"` → `"questionnaire_json_snapshot"`, `"metrics"` → `"metrics_json"`
  - `prior_answers` action: `prior.answers` → `prior.answers_json` (the response dict key stays `"answers"` since the frontend reads `data.answers`)

- [ ] `Backend/questionnaires/pdf.py` — update model attribute access:
  - `response.answers` → `response.answers_json` (line ~107)

**Tests**:

- [ ] Run `pnpm test` (backend via pytest) to confirm no backend test regressions before updating the test files.

**Stability Criteria**: All non-test backend files compile without errors; `python manage.py check` passes.

**Notes**:

---

## Phase 3: Backend Test Updates

**Status**: ✅ Completed 2026-05-11

**Goal**: Update backend test files to use the new field names.

**Deliverables**:

- [ ] `Backend/questionnaires/tests/conftest.py`:
  - `answers={"q1": "Answer text"}` → `answers_json={"q1": "Answer text"}`

- [ ] `Backend/questionnaires/tests/test_models.py`:
  - All `answers=…` kwargs in `Questionnaire.objects.create(...)` → `answers_json=…`
  - All `r.answers` attribute reads → `r.answers_json`
  - All `r.survey_json_snapshot` → `r.questionnaire_json_snapshot`
  - All `r.metrics` → `r.metrics_json`
  - Test method names referencing old field names can be renamed for clarity, e.g.
    `test_answers_default_is_dict` → `test_answers_json_default_is_dict`

- [ ] `Backend/questionnaires/tests/test_views.py`:
  - All `response_for.answers` reads → `response_for.answers_json`
  - `response_for.survey_json_snapshot` → `response_for.questionnaire_json_snapshot`
  - `response_for.metrics` → `response_for.metrics_json`
  - HTTP payload keys `"answers"` and `"metrics"` stay the same (they are API keys, not model fields)
  - `response.data["metrics"]` stays the same (serializer-level key, not model field)

- [ ] `Backend/questionnaires/tests/test_pdf.py`:
  - `Questionnaire.objects.create(questionnaire_type=q, answers={})` → `answers_json={}`
  - `response_for.answers` → `response_for.answers_json`

**Tests**:

- [ ] `pytest Backend/questionnaires/tests/` — all 112 backend tests pass.

**Stability Criteria**: Full backend test suite green.

**Notes**:

---

## Phase 4: Verify & Cleanup

**Status**: ✅ Completed 2026-05-11

**Goal**: Confirm the full stack (frontend build, lint, backend tests) is clean.

**Deliverables**:

- [ ] `pnpm build` — no TypeScript or Vite errors (frontend unchanged, should be clean)
- [ ] `pnpm lint` — no ESLint errors
- [ ] `pnpm test` — all 320 frontend tests pass
- [ ] `pytest Backend/` — all backend tests pass
- [ ] Update `AGENTS.md` — change the `Questionnaire` type description to reflect the new field names (`answers_json`, `questionnaire_json_snapshot`, `metrics_json`)

**Stability Criteria**: Zero errors in build, lint, and test suites. `AGENTS.md` reflects new field names.

**Notes**:
