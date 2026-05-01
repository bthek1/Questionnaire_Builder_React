# PLAN-15: Stored Metrics Field on Questionnaire

**Feature summary**: Add a `metrics` JSONField to `Questionnaire` that caches the evaluated `calculatedValues` (name → value) at submit time. The results page will read this pre-computed cache instead of re-instantiating a `survey-core` `Model` on every render.

---

## Background

Currently `results.tsx` reconstructs a SurveyJS `Model`, injects the stored answers, and reads `model.calculatedValues` on every render. This means:

- The `survey-core` bundle is imported into the results route purely for metric evaluation.
- Any expression whose result is **not** stored via `includeIntoResult: true` depends on SurveyJS expression parsing working correctly inside Vitest/jsdom.
- There is no server-side record of what the respondent "saw" as their score at submit time.

Storing the metrics at submit time (mirroring what was done for `survey_json_snapshot` in PLAN-14) removes the runtime dependency and creates a stable, auditable record.

---

## Data Shape

```jsonc
// Questionnaire.metrics (JSONField, default = {})
{
  "total_score": 42,
  "risk_level": "medium",
  "bmi": 24.5
}
```

Keys are the `name` values from `surveyJson.calculatedValues`. Values are whatever SurveyJS evaluated.  
If no `calculatedValues` are defined the field is `{}`.

The `metrics` field is **read-only** after submission. It is populated via two paths:

1. **New submissions**: frontend computes metrics (already done in `evaluateMetrics()`) and includes them in the PATCH `/questionnaires/by-token/:token/submit/` payload.
2. **Backfill**: a data migration derives metrics from the values already embedded in `answers` (those stored by `includeIntoResult: true`) cross-referenced against the `calculatedValues` definitions in `survey_json_snapshot`.

---

## Phases

---

## Phase 1: Backend — Model, Migration, Serializer

**Status**: ✅ Completed 2026-05-01

**Goal**: Add the `metrics` JSONField to `Questionnaire`, expose it in the serializer, and accept it in the submit action.

**Deliverables**:

- [ ] `Backend/questionnaires/models.py` — add `metrics = models.JSONField(default=dict, blank=True)` to `Questionnaire`.
- [ ] Migration `0011_questionnaire_metrics` — `AddField` for `metrics`.
- [ ] Migration `0012_backfill_metrics` — data migration: for each submitted `Questionnaire`, derive metrics from `answers` filtered by names listed in `survey_json_snapshot.calculatedValues`. Any name that has `includeIntoResult: true` (or whose value is already present in `answers`) is captured; others are skipped.
- [ ] `Backend/questionnaires/serializers.py` — add `metrics = serializers.JSONField(read_only=False, required=False, default=dict)` to `QuestionnaireSerializer`; add `"metrics"` to `fields`; mark it **writable** (not in `read_only_fields`) so the submit action can accept it.
- [ ] `Backend/questionnaires/views.py` submit action — read `metrics` from `request.data` (default `{}`), save alongside `answers` and `survey_json_snapshot`. Add `"metrics"` to `update_fields`.

**Tests**:

- [ ] `Backend/questionnaires/tests/test_models.py` — field exists with `default={}`, saving a non-empty dict round-trips correctly.
- [ ] `Backend/questionnaires/tests/test_serializers.py` — serializer output includes `metrics`; writable on input.
- [ ] `Backend/questionnaires/tests/test_views.py` — submit PATCH with `metrics` payload → response contains correct `metrics`; submit without `metrics` → `metrics` defaults to `{}`.

**Stability Criteria**: `just test-backend` passes (all 79 + new tests green). Migration applies cleanly on a fresh `just migrate`.

**Notes**: *(fill in on completion)*

---

## Phase 2: Frontend — Types, API, Hook

**Status**: ✅ Completed 2026-05-01

**Goal**: Thread `metrics` through the TypeScript layer (types → API → hook) and update the submit flow to send computed metrics in the PATCH payload.

**Deliverables**:

- [ ] `Frontend/src/types/index.ts` — add `metrics?: Record<string, unknown>` to the `Questionnaire` interface.
- [ ] `Frontend/src/api/questionnaires.ts` — update `submitAnswers(token, answers)` signature to `submitAnswers(token, answers, metrics)` (metrics defaults to `{}`); include `metrics` in the PATCH body.
- [ ] `Frontend/src/hooks/useQuestionnaires.ts` — update `useSubmitAnswers` mutation to accept and forward `metrics`.
- [ ] `Frontend/src/routes/take/$id.tsx` — when `survey.onComplete` fires, compute metrics using the existing `evaluateMetrics` helper (extracted to a shared utility — see Phase 3), then pass them to `useSubmitAnswers`.

**Tests**:

- [ ] `Frontend/src/test/api.questionnaires.test.ts` — `submitAnswers` called with third `metrics` argument; PATCH body includes `{ answers, metrics }`.
- [ ] `Frontend/src/test/useQuestionnairesHooks.test.tsx` — `useSubmitAnswers` mutation forwards `metrics` to the API function.
- [ ] `Frontend/src/test/TakePage.test.tsx` — `onComplete` calls `submitAnswers` with non-empty `metrics` when `calculatedValues` are present; `{}` when absent.

**Stability Criteria**: `pnpm build` clean; all 107 + new frontend tests green.

**Notes**: *(fill in on completion)*

---

## Phase 3: Frontend — Results Page Refactor

**Status**: ✅ Completed 2026-05-01

**Goal**: Move `evaluateMetrics` to a shared utility, then update the results page to read `instance.metrics` directly instead of re-instantiating a `Model`.

**Deliverables**:

- [ ] Extract `evaluateMetrics` and `formatLabel` from `results.tsx` into `Frontend/src/lib/metrics.ts` (pure functions, no React or SurveyJS import at module level — import `Model` lazily inside the function if backfill evaluation is ever needed, but prefer the stored path).
- [ ] `Frontend/src/routes/questionnaires/$id/results.tsx` — replace the `useMemo` metrics derivation:
  - If `instance.metrics` is non-empty → map it directly to `MetricResult[]` using label definitions from `surveyJsonSnapshot.calculatedValues` (same label logic, no `Model` instantiation).
  - If `instance.metrics` is `{}` or undefined (un-submitted or pre-PLAN-15 backfill gap) → fall back to the existing `evaluateMetrics(surveyJson, answers)` path so old data still renders.
- [ ] Remove the direct `Model` import from `results.tsx` (it moves into `metrics.ts` where it is only imported when the fallback path is invoked).

**Tests**:

- [ ] `Frontend/src/test/utils.test.ts` (or a new `metrics.test.ts`) — unit tests for `evaluateMetrics` and `formatLabel`.
- [ ] `Frontend/src/test/ResultsPage.test.tsx` — (a) when `instance.metrics` is populated, metrics cards render without constructing a `Model`; (b) when `metrics` is `{}`, cards render via the fallback path.

**Stability Criteria**: `pnpm build` + `pnpm lint` clean; all tests green; results page renders correct metric values for both code paths in the test suite.

**Notes**: *(fill in on completion)*

---

## Phase 4: Cleanup & Docs

**Status**: ✅ Completed 2026-05-01

**Goal**: Validate end-to-end, remove any dead code, and keep all project docs in sync.

**Deliverables**:

- [ ] Run `pnpm build` and `pnpm lint` — fix any warnings or errors.
- [ ] Run full test suite (`pnpm test --run` + `just test-backend`) — all green.
- [ ] Update `AGENTS.md` — add `metrics` field to the `Questionnaire` description; update test counts; note the `metrics.ts` utility.
- [ ] Update `/memories/repo/questionnaire-builder-state.md` — add PLAN-15 to completed list; update `Questionnaire` field list.
- [ ] Move this file from `Docs/In-progress/` to `Docs/Completed/`.

**Stability Criteria**: Zero lint errors, zero type errors, all tests green, docs match implementation.

**Notes**: *(fill in on completion)*

---

## Key Decisions

| Decision | Rationale |
|---|---|
| Metrics computed on **frontend** at submit time, not backend | Backend has no JS runtime; re-implementing SurveyJS expression evaluation in Python is fragile. The frontend already has the evaluated values from `model.calculatedValues` at `onComplete`. |
| Backfill uses **answers** as source of truth | For `includeIntoResult: true` fields, the evaluated value is already embedded in `answers`. For others, we cannot retroactively evaluate — they are omitted from the backfill. |
| `metrics` is **writable** in the serializer (on submit only) | Allows the frontend to send the pre-computed values; the submit view simply stores whatever arrives. No server-side re-evaluation needed. |
| Results page keeps a **fallback** to the `Model` path | Guarantees backward compatibility for questionnaires submitted before PLAN-15 where `metrics` is `{}`. |
