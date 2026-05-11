# PLAN-23: Recipient JSON — Respondent Information Collection

## Overview

Some questionnaires need to capture **who is completing the form** before the main survey begins (e.g., "I am the mother completing this for my child"). This is modelled as an optional `recipient_json` field on `QuestionnaireType` that holds a standard SurveyJS page/element descriptor. When present, it is prepended as the **first page** of the survey rendered to respondents on the `/take/:shareToken` route.

The recipient answers are stored alongside the main survey answers (inside `answers_json`) — no separate model field is needed. The `recipient_json` field is `null` by default so questionnaires that do not require it are unaffected.

---

## Data shape

`recipient_json` is a nullable JSON field that holds a **single SurveyJS page descriptor** — the same structure as one entry in `surveyJson.pages[]`.

### Naming convention

To prevent collisions with main survey question names (now and as the feature expands), all questions inside `recipient_json` **must** follow this naming rule:

- **Page name**: always `"recipient_page"`
- **Element names**: always prefixed with `"recipient__"` (double underscore), e.g. `"recipient__respondent_type"`, `"recipient__dob"`, `"recipient__clinic_id"`

This prefix guarantees that recipient answers in `answers_json` are visually and programmatically distinct from survey answers, makes it safe to add more recipient questions over time without name clashes, and enables results pages / analytics to filter or group recipient data separately if needed.

Example value stored in `QuestionnaireType.recipient_json`:

```json
{
  "name": "recipient_page",
  "elements": [
    {
      "type": "radiogroup",
      "name": "recipient__respondent_type",
      "title": "Who is completing this questionnaire?",
      "isRequired": true,
      "choices": [
        { "value": "myself",       "text": "I am completing this questionnaire for myself" },
        { "value": "mother",       "text": "I am the mother completing this questionnaire for my child" },
        { "value": "father",       "text": "I am the father completing this questionnaire for my child" },
        { "value": "guardian",     "text": "I am the guardian completing this questionnaire for my child" },
        { "value": "practitioner", "text": "I am a practitioner completing this questionnaire on behalf of a client/patient" },
        { "value": "other",        "text": "Other" }
      ]
    }
  ]
}
```

When `recipient_json` is non-null, the `/take/` route merges it as the first page of `surveyJson` before passing to `SurveyRenderer`. The respondent's answers to those fields (keyed `recipient__*`) are submitted as part of `answers_json` as normal.

> **Future expansion**: additional recipient questions (e.g. date of birth, clinic ID) are added as more elements inside the same `recipient_json` page, each with the `recipient__` prefix. No model or API changes are required.

---

## Phase 1: Backend — Model & Migration

**Status**: Not started

**Goal**: Add `recipient_json` (nullable JSONField) to `QuestionnaireType` and expose it through the serializer and API.

**Deliverables**:

- [ ] `Backend/questionnaires/models.py` — add field to `QuestionnaireType`:
  ```python
  recipient_json = models.JSONField(default=None, null=True, blank=True)
  ```
- [ ] Create migration `0015_questionnairetype_recipient_json.py` using `migrations.AddField`.
- [ ] `Backend/questionnaires/serializers.py` — add `recipientJson` field to `QuestionnaireTypeSerializer`:
  ```python
  recipientJson = serializers.JSONField(source="recipient_json", required=False, allow_null=True)
  ```
  Add `"recipientJson"` to `fields` list.
- [ ] Run `python manage.py migrate` to verify migration applies cleanly.

**Tests**:

- [ ] `Backend/questionnaires/tests/test_models.py` — add `TestQuestionnaireTypeRecipientJson` class:
  - `test_recipient_json_defaults_to_none` — newly created type has `recipient_json is None`
  - `test_recipient_json_stores_and_retrieves_dict` — round-trip a page descriptor dict using the `recipient__` prefix convention
- [ ] `Backend/questionnaires/tests/test_views.py` — add to `TestQuestionnaireTypeViewSet`:
  - `test_create_with_recipient_json` — POST with `recipientJson` stores the value; GET returns it
  - `test_patch_recipient_json` — PATCH updates the field
  - `test_recipient_json_null_by_default` — GET on a newly created type returns `"recipientJson": null`

**Stability Criteria**: `python manage.py check` passes; migration applies cleanly; all new backend tests pass alongside the existing 112.

**Notes**:

---

## Phase 2: Frontend Types & API

**Status**: Not started

**Goal**: Add `recipientJson` to the `QuestionnaireType` TypeScript interface and ensure the API layer passes it through.

**Deliverables**:

- [ ] `Frontend/src/types/index.ts` — add optional field to `QuestionnaireType`:
  ```ts
  recipientJson?: Record<string, unknown> | null
  ```
- [ ] `Frontend/src/api/questionnaireTypes.ts` — no code change required (the Axios response is typed via the interface; the field is included automatically). Verify that `updateQuestionnaireType` payload type (`Partial<Omit<QuestionnaireType, 'id' | ...>>`) already allows `recipientJson`. If the Omit pattern excludes it, add it explicitly.

**Tests**:

- [ ] `Frontend/src/test/api.questionnaireTypes.test.ts` (or equivalent) — add a test asserting that a mocked GET response with `recipientJson` is passed through to the caller typed correctly. If no existing test file covers the types API, skip and cover in Phase 3.

**Stability Criteria**: `pnpm build` passes with no TypeScript errors.

**Notes**:

---

## Phase 3: Frontend — Take Page Merges Recipient Page

**Status**: Not started

**Goal**: When a `QuestionnaireType` has a non-null `recipientJson`, the `/take/:shareToken` route prepends it as the first page of the survey before passing to `SurveyRenderer`.

**Deliverables**:

- [ ] `Frontend/src/routes/take/$id.tsx` — before constructing `surveyJson` passed to `SurveyRenderer`, merge `recipientJson`:
  ```ts
  const recipientPage = instance.questionnaireType?.recipientJson
  const mergedSurveyJson = recipientPage
    ? {
        ...surveyJson,
        pages: [recipientPage, ...(surveyJson.pages ?? [])],
      }
    : surveyJson
  ```
  Pass `mergedSurveyJson` to `<SurveyRenderer surveyJson={mergedSurveyJson} ...>`.

- [ ] The merge must be a pure in-memory operation — `surveyJson` stored on the type is **not** modified. `recipient_json` remains a separate field.

**Tests**:

- [ ] `Frontend/src/test/TakePage.test.tsx` — add cases:
  - `renders recipient page first when recipientJson is set` — mock `useQuestionnaireByToken` to return a type with `recipientJson` set; assert the merged JSON passed to `SurveyRenderer` includes the recipient page as `pages[0]`.
  - `no recipient page when recipientJson is null` — mock with `recipientJson: null`; assert `SurveyRenderer` receives the original `surveyJson` unchanged.

**Stability Criteria**: All existing TakePage tests still pass; new tests pass; `pnpm build` clean.

**Notes**:

---

## Phase 4: Frontend — JSON Editor Exposes recipientJson

**Status**: Not started

**Goal**: Allow questionnaire builders to set/clear `recipient_json` via the JSON editor split-view page (`/questionnaire-types/:id/json`). No separate UI control is needed — the existing Raw JSON mode already lets authors edit `surveyJson`; a parallel text area for `recipientJson` is sufficient.

**Deliverables**:

- [ ] `Frontend/src/routes/questionnaire-types/$id/json.tsx` — add a collapsible "Recipient JSON" section below the existing JSON editor panel:
  - Shows a Monaco / textarea editor pre-filled with the current `recipientJson` (pretty-printed JSON, or a starter template with `name: "recipient_page"` and one element using the `recipient__` prefix if null).
  - A "Save recipient" button PATCHes `{ recipientJson: <parsed JSON> }` to the type via `useUpdateQuestionnaireType` (or the existing save pipeline).
  - A "Clear recipient" button PATCHes `{ recipientJson: null }`.
  - Validation: show an inline error if the JSON is syntactically invalid (do not save).
  - Display a hint reminding authors to prefix all element names with `recipient__` to avoid collision with main survey question names.

- [ ] The live preview panel on the right side of the split-view should also reflect `recipientJson` — prepend the recipient page to the preview `SurveyRenderer` in the same way as the take route (Phase 3).

**Tests**:

- [ ] `Frontend/src/test/JsonEditorPage.test.tsx` — add cases:
  - `shows recipient json editor section` — mock type with `recipientJson` set; assert the section is visible and pre-populated.
  - `save recipient json calls patch with recipientJson` — simulate editing and clicking Save; assert the mutation was called with `{ recipientJson: <value> }`.
  - `clear recipient json patches null` — simulate clicking Clear; assert mutation called with `{ recipientJson: null }`.

**Stability Criteria**: All JsonEditorPage tests pass; `pnpm build` and `pnpm lint` clean.

**Notes**:

---

## Phase 5: Verify & Cleanup

**Status**: Not started

**Goal**: Full stack clean — build, lint, all tests pass.

**Deliverables**:

- [ ] `pnpm build` — no TypeScript or Vite errors
- [ ] `pnpm lint` — no ESLint errors
- [ ] `pnpm test` — all frontend tests pass (≥ 320 + new tests)
- [ ] `pytest Backend/` — all backend tests pass (≥ 112 + new tests)
- [ ] Update `AGENTS.md` — document `recipientJson` on `QuestionnaireType`
- [ ] Update `Docs/SurveyJS/survey_forms_json.md` if recipient page shape is worth documenting

**Stability Criteria**: Zero errors. `AGENTS.md` reflects the new field.

**Notes**:
