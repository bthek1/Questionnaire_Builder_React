# PLAN-14: Snapshot surveyJson on Questionnaire submission

## Problem

`Questionnaire` instances store answers but not the survey definition used at the time of completion. If the parent `QuestionnaireType.survey_json` is later edited, the historical answers become uninterpretable — the field names and question text no longer match.

## Solution

Add a `survey_json_snapshot` field to the `Questionnaire` model that is **written once** when the respondent submits. From that point on, all analytics and PDF export use the snapshot instead of the live `QuestionnaireType.survey_json`.

---

## Phase 1: Backend — model field + migration

**Status**: ✅ Completed 2026-05-01

**Goal**: Add `survey_json_snapshot` (JSONField, default empty dict, blank=True, null=False) to the `Questionnaire` model and create the corresponding migration.

**Deliverables**:

- [x] Add `survey_json_snapshot = models.JSONField(default=dict, blank=True)` to `Questionnaire` in `Backend/questionnaires/models.py`
- [x] Generate migration `0009_questionnaire_survey_json_snapshot.py` via `python manage.py makemigrations`
- [x] Write a follow-up **data migration** `0010_backfill_survey_json_snapshot.py` that iterates over all `Questionnaire` rows where `submitted_at` is not null and sets `survey_json_snapshot` from `questionnaire_type.survey_json` using a `RunPython` operation. Rows where `submitted_at` is null (not yet submitted) are left as `{}` — they will be populated at submit time by Phase 2.

**Tests**:  

- [x] `test_models.py` — verify new field defaults to `{}` on a fresh `Questionnaire` instance
- [x] `test_models.py` — verify snapshot not set when unsubmitted

**Stability Criteria**: `python manage.py migrate` runs cleanly; submitted rows have their snapshot populated; unsubmitted rows remain `{}`.

**Notes**: Migration ran cleanly. 79 backend tests pass.

**Notes**:

---

## Phase 2: Backend — populate snapshot on submit

**Status**: ✅ Completed 2026-05-01

**Goal**: When the `submit` action is called, copy `questionnaire_type.survey_json` into `survey_json_snapshot` before saving.

**Deliverables**:

- [x] Update `QuestionnaireViewSet.submit` in `views.py` to set `instance.survey_json_snapshot = instance.questionnaire_type.survey_json` alongside the existing `answers` and `submitted_at` assignments
- [x] Add `survey_json_snapshot` to the `update_fields` list in `instance.save(...)`

**Tests**:

- [x] `test_views.py` — submit action: assert that `survey_json_snapshot` on the returned instance matches the type's `survey_json`
- [x] `test_views.py` — verify a second submit still returns 409 (already submitted guard unchanged)

**Stability Criteria**: All existing backend tests still pass; new snapshot test passes.

**Notes**: 79 backend tests pass.

---

## Phase 3: Backend — expose snapshot in serializer

**Status**: ✅ Completed 2026-05-01

**Goal**: Include `surveyJsonSnapshot` in the `QuestionnaireSerializer` so the frontend can read it.

**Deliverables**:

- [x] Add `surveyJsonSnapshot = serializers.JSONField(source="survey_json_snapshot", read_only=True)` to `QuestionnaireSerializer`
- [x] Add `"surveyJsonSnapshot"` to `Meta.fields` and `Meta.read_only_fields`

**Tests**:

- [x] `test_serializers.py` — verify `surveyJsonSnapshot` appears in serialized output
- [x] `test_serializers.py` — verify field is read-only (excluded from writable fields)

**Stability Criteria**: All 73 backend tests pass.

**Notes**: 79 backend tests pass (6 new tests added).

---

## Phase 4: Frontend — TypeScript type update

**Status**: ✅ Completed 2026-05-01

**Goal**: Reflect the new backend field in the frontend type system.

**Deliverables**:

- [x] Add `surveyJsonSnapshot?: object` to the `Questionnaire` interface in `Frontend/src/types/index.ts`

**Tests**:

- [x] `pnpm build` passes with no TypeScript errors

**Stability Criteria**: `pnpm build` and `pnpm lint` pass with zero errors.

**Notes**: Build and lint pass cleanly.

---

## Phase 5: Frontend — use snapshot in results and take pages

**Status**: ✅ Completed 2026-05-01

**Goal**: Where a submitted `Questionnaire` is displayed (results dashboard, PDF export, raw responses table, take-page replay), prefer `surveyJsonSnapshot` over `questionnaireType.surveyJson`.

**Deliverables**:

- [x] `Frontend/src/routes/questionnaires/$id/results.tsx` — pass `surveyJsonSnapshot ?? questionnaireType?.surveyJson` as the survey model to `evaluateMetrics`
- [x] `Frontend/src/routes/take/$id.tsx` — added comment explaining the take page intentionally uses live `surveyJson` (not snapshot) since it's rendering for submission

**Tests**:

- [x] `ResultsPage.test.tsx` — added `surveyJsonSnapshot` to `submittedInstance` fixture; added tests that verify snapshot is preferred over live type, and that live type is used as fallback when snapshot is absent
- [x] `pnpm test --run` — all 107 tests pass

**Stability Criteria**: `pnpm build`, `pnpm lint`, and `pnpm test --run` all pass.

**Notes**: 107 frontend tests pass.

---

## Phase 6: Docs + cleanup

**Status**: ✅ Completed 2026-05-01

**Goal**: Keep project documentation in sync with the implementation.

**Deliverables**:

- [x] Update `AGENTS.md` — `Questionnaire` type description to include `surveyJsonSnapshot`
- [x] Update `/memories/repo/questionnaire-builder-state.md` — add `surveyJsonSnapshot` to the model and type descriptions
- [x] Run `pnpm build` and `pnpm lint` one final time and fix any remaining issues
- [x] Move this plan file from `Docs/In-progress/` to `Docs/Completed/`

**Stability Criteria**: `pnpm build`, `pnpm lint`, `pnpm test --run`, and `pytest` all pass.

**Notes**: All checks green. 107 frontend tests, 79 backend tests.

---

## Out of scope

- Backfilling rows where `submitted_at IS NULL` — those have no answers yet and will be snapshotted at submit time
- Exposing a UI to show when the snapshot differs from the current type definition
