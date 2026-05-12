# PLAN-24: Rename `survey_json` → `questionnaire_json` and Remove `description` from `QuestionnaireType`

**Status**: ✅ Completed 2026-05-11

## Overview

Two related cleanups to `QuestionnaireType`:

1. **Rename** the `survey_json` model field to `questionnaire_json`. The serializer currently exposes this as `surveyJson` to the frontend; the new camelCase key will be `questionnaireJson`. The existing `Questionnaire.questionnaire_json_snapshot` field and `surveyJsonSnapshot` serializer alias are **not** changed (they belong to the instance, not the type).

2. **Remove** the `description` field from `QuestionnaireType`. Description is redundant because SurveyJS JSON already has a top-level `description` property inside `questionnaire_json`. The `BatteryType.description` field is **not** changed.

---

## Affected Surface

| Layer | Items |
|-------|-------|
| Django model | `QuestionnaireType.survey_json` → `questionnaire_json`; remove `description` |
| Django migration | New migration `0016_questionnairetype_rename_survey_json_remove_description.py` |
| Django serializer | `QuestionnaireTypeSerializer`: rename `surveyJson` field alias → `questionnaireJson`; remove `"description"` from `fields` |
| Django tests | `conftest.py`, `test_views.py`, `test_serializers.py` — update `survey_json=` kwargs and field name assertions |
| Frontend types | `QuestionnaireType` interface: `surveyJson?` → `questionnaireJson?`; remove `description?` |
| Frontend API | `api/questionnaireTypes.ts` — no code changes needed (generic `Partial<QuestionnaireType>` payload) |
| Frontend routes | `questionnaire-types/$id/json.tsx` — rename `surveyJson` references to `questionnaireJson`; remove description field usage if any |
| Frontend routes | `questionnaire-types/new.tsx` — remove `description` state/field; stop sending `description` in create payload; update template preset objects |
| Frontend routes | `take/$id.tsx`, `take-battery/$shareToken.tsx` — rename `surveyJson` access on `QuestionnaireType` |
| Frontend components | `SurveyRenderer` props: `surveyJson` prop name is internal and does **not** change (it's a component prop, not an API field) |
| Frontend tests | All test files that reference `surveyJson` on `QuestionnaireType` or `description` on `QuestionnaireType` |
| `AGENTS.md` | Update field name table and type descriptions |

---

## Phase 1: Backend — migration, model, serializer, tests

**Status**: ✅ Completed 2026-05-11

**Goal**: Rename `survey_json` → `questionnaire_json` and drop `description` in the Django model, serializer, and tests.

**Deliverables**:

- [x] `QuestionnaireType` model: rename `survey_json = models.JSONField(...)` → `questionnaire_json = models.JSONField(...)`
- [x] `QuestionnaireType` model: delete `description = models.TextField(blank=True, null=True)` line
- [x] Migration `0016_questionnairetype_rename_survey_json_remove_description.py` using `RenameField` + `RemoveField`
- [x] `QuestionnaireTypeSerializer`: rename alias `surveyJson` → `questionnaireJson` (update `source="questionnaire_json"`); remove `"description"` from `fields` list
- [x] `QuestionnaireSerializer`: the nested `questionnaireType` embed uses `QuestionnaireTypeSerializer` — no separate change needed
- [x] `conftest.py`: replace `survey_json=` → `questionnaire_json=`, remove `description=` kwargs
- [x] `test_views.py`: replace all `survey_json` model attribute accesses and `"surveyJson"` response data keys → `questionnaire_json` / `"questionnaireJson"`; remove description assertions
- [x] `test_serializers.py`: same rename; remove `"description"` from expected fields list

**Tests**:

- [x] `pytest Backend/questionnaires/tests/` — all 112 backend tests pass

**Stability Criteria**: All existing backend tests pass with zero failures after the rename.

**Notes**: Migration uses `RenameField` + `RemoveField` operations. `BatteryType.description` was left unchanged as specified.

---

## Phase 2: Frontend — types, routes, tests

**Status**: ✅ Completed 2026-05-11

**Goal**: Update all TypeScript types, route files, and tests to use `questionnaireJson` instead of `surveyJson` on `QuestionnaireType`, and remove `description`.

**Deliverables**:

- [x] `Frontend/src/types/index.ts`: `QuestionnaireType.surveyJson?` → `questionnaireJson?`; remove `description?` field
- [x] `Frontend/src/routes/questionnaire-types/$id/json.tsx`: renamed all `questionnaire?.surveyJson` → `questionnaire?.questionnaireJson`; updated mutation to `mutate({ questionnaireJson: ... })`
- [x] `Frontend/src/routes/questionnaire-types/new.tsx`: `description` is UI-only (template labels); no `description` sent to API; payload uses `questionnaireJson:`
- [x] `Frontend/src/routes/take/$id.tsx`: accesses `instance?.questionnaireType?.questionnaireJson`
- [x] `Frontend/src/routes/take-battery/$shareToken.tsx`: accesses `instance.questionnaireType?.questionnaireJson`
- [x] `Frontend/src/routes/questionnaire-types/index.tsx`: no description display
- [x] Verified `SurveyRenderer` and `VisualEditor` component props unaffected (internal `surveyJson` prop unchanged)
- [x] `Frontend/src/test/JsonEditorPage.test.tsx`: all mocks use `questionnaireJson`
- [x] `Frontend/src/test/TakePage.test.tsx`: mocks use `questionnaireJson`
- [x] `Frontend/src/test/TakeBatteryPage.test.tsx`: mocks use `questionnaireJson`
- [x] Other test files with `QuestionnaireType` mocks updated

**Tests**:

- [x] `pnpm test` — all 320 frontend tests pass

**Stability Criteria**: `pnpm build` and `pnpm test` both pass with zero errors.

**Notes**: `SurveyRenderer` still accepts `surveyJson` as a component prop — this is intentional and unrelated to the API field rename.

---

## Phase 3: Docs & AGENTS.md

**Status**: ✅ Completed 2026-05-11

**Goal**: Keep documentation in sync with the renamed field.

**Deliverables**:

- [x] Update `AGENTS.md` — `QuestionnaireType.surveyJson` references → `questionnaireJson`; remove `description` from type description
- [x] `Frontend/src/routeTree.gen.ts` is auto-generated — no manual edit needed
- [x] Run `pnpm build && pnpm lint` and fix any remaining errors

**Tests**:

- [x] `pnpm build` — zero TypeScript errors
- [x] `pnpm lint` — zero lint warnings/errors

**Stability Criteria**: Clean build and lint.

**Notes**: Build and lint confirmed passing (exit code 0).
