# PLAN-24: Rename `survey_json` → `questionnaire_json` and Remove `description` from `QuestionnaireType`

**Status**: Not started

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

**Status**: Not started

**Goal**: Rename `survey_json` → `questionnaire_json` and drop `description` in the Django model, serializer, and tests.

**Deliverables**:

- [ ] `QuestionnaireType` model: rename `survey_json = models.JSONField(...)` → `questionnaire_json = models.JSONField(...)`
- [ ] `QuestionnaireType` model: delete `description = models.TextField(blank=True, null=True)` line
- [ ] Migration `0016_questionnairetype_rename_survey_json_remove_description.py` using `RenameField` + `RemoveField`
- [ ] `QuestionnaireTypeSerializer`: rename alias `surveyJson` → `questionnaireJson` (update `source="questionnaire_json"`); remove `"description"` from `fields` list
- [ ] `QuestionnaireSerializer`: the nested `questionnaireType` embed uses `QuestionnaireTypeSerializer` — no separate change needed
- [ ] `conftest.py`: replace `survey_json=` → `questionnaire_json=`, remove `description=` kwargs
- [ ] `test_views.py`: replace all `survey_json` model attribute accesses and `"surveyJson"` response data keys → `questionnaire_json` / `"questionnaireJson"`; remove description assertions
- [ ] `test_serializers.py`: same rename; remove `"description"` from expected fields list

**Tests**:

- [ ] `pytest Backend/questionnaires/tests/` — all 112 backend tests pass

**Stability Criteria**: All existing backend tests pass with zero failures after the rename.

**Notes**:

---

## Phase 2: Frontend — types, routes, tests

**Status**: Not started

**Goal**: Update all TypeScript types, route files, and tests to use `questionnaireJson` instead of `surveyJson` on `QuestionnaireType`, and remove `description`.

**Deliverables**:

- [ ] `Frontend/src/types/index.ts`: `QuestionnaireType.surveyJson?` → `questionnaireJson?`; remove `description?` field
- [ ] `Frontend/src/routes/questionnaire-types/$id/json.tsx`: rename all `questionnaire?.surveyJson` → `questionnaire?.questionnaireJson`; rename state variables / local consts (`surveyJsonText`, `initialJson` etc.) as needed; update the `mutate({ surveyJson: ... })` call to `mutate({ questionnaireJson: ... })`
- [ ] `Frontend/src/routes/questionnaire-types/new.tsx`: remove `description` state, label, and input; stop including `description` in create payload; remove `description:` keys from preset template objects (the ones that are user-visible descriptions of the preset, e.g. `'Start from scratch'` — these can be inlined or dropped); rename `surveyJson:` → `questionnaireJson:` in preset objects and create payload
- [ ] `Frontend/src/routes/take/$id.tsx`: rename `questionnaireType?.surveyJson` → `questionnaireType?.questionnaireJson`
- [ ] `Frontend/src/routes/take-battery/$shareToken.tsx`: rename `instance?.questionnaireType?.surveyJson` references → `questionnaireJson`
- [ ] `Frontend/src/routes/questionnaire-types/index.tsx`: remove any `description` display if present
- [ ] Verify `SurveyRenderer` and `VisualEditor` component props are unaffected (they receive `surveyJson` as a **component prop**, not from the API type — no change needed)
- [ ] `Frontend/src/test/JsonEditorPage.test.tsx`: rename mock data `surveyJson` → `questionnaireJson` on `QuestionnaireType` objects; update assertions referencing `surveyJson`; remove `description` from mock data
- [ ] `Frontend/src/test/TakePage.test.tsx`: same rename in mocks
- [ ] `Frontend/src/test/TakeBatteryPage.test.tsx`: same rename in mocks
- [ ] `Frontend/src/test/useQuestionnaires.test.tsx` / `useQuestionnairesHooks.test.tsx`: update any `QuestionnaireType` mocks
- [ ] Any other test file containing `surveyJson` on a `QuestionnaireType` mock object

**Tests**:

- [ ] `pnpm test` — all 320 frontend tests pass

**Stability Criteria**: `pnpm build` and `pnpm test` both pass with zero errors.

**Notes**:

---

## Phase 3: Docs & AGENTS.md

**Status**: Not started

**Goal**: Keep documentation in sync with the renamed field.

**Deliverables**:

- [ ] Update `AGENTS.md` — `QuestionnaireType.surveyJson` references → `questionnaireJson`; remove `description` from type description
- [ ] Update `Frontend/src/routeTree.gen.ts` is auto-generated — no manual edit needed
- [ ] Run `pnpm build && pnpm lint` and fix any remaining errors

**Tests**:

- [ ] `pnpm build` — zero TypeScript errors
- [ ] `pnpm lint` — zero lint warnings/errors

**Stability Criteria**: Clean build and lint.

**Notes**:
