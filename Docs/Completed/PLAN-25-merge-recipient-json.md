# PLAN-25: Merge recipient_json into questionnaire_json

## Overview

**Status**: ✅ Completed 2026-05-13

**Goal**: Remove the separate `recipient_json` field from `QuestionnaireType`. The recipient page will live as the first page of `questionnaire_json` (identified by `name: "recipient_page"`), simplifying the data model, API surface, and frontend logic.

### Current state

`QuestionnaireType` has two JSON fields:

| Field | Purpose |
|---|---|
| `questionnaire_json` | SurveyJS survey definition — pages, elements, logic |
| `recipient_json` | Optional SurveyJS page descriptor prepended as page 0 on the take route |

The frontend json.tsx editor maintains both fields separately and merges them on-the-fly for the live preview. The `/take/:shareToken` route contains explicit merge logic to prepend the recipient page before passing the JSON to `SurveyRenderer`.

### Target state

- `recipient_json` field is dropped from the model, serializer, API, and frontend types.
- The recipient page is stored directly as the first entry in `questionnaire_json.pages` (when present), identified by `name: "recipient_page"`.
- The take route passes `questionnaireJson` to `SurveyRenderer` directly — no merge logic needed.
- The json.tsx editor no longer has a separate "Recipient JSON" collapsible section; the recipient page is managed as part of the main JSON.
- `questionnaire_json_snapshot` already captures the full `questionnaire_json`; no change needed for results/PDF.

---

## Phase 1: Data migration + schema migration

**Status**: ✅ Completed 2026-05-13

**Goal**: Migrate existing data and drop the `recipient_json` database column.

**Deliverables**:

- [ ] Migration `0017_merge_recipient_json_into_questionnaire_json.py` — data migration:
  - For each `QuestionnaireType` where `recipient_json IS NOT NULL`:
    - Normalise `recipient_json` to a page descriptor: if it lacks an `elements` key, wrap it as `{ "name": "recipient_page", "elements": [recipient_json] }`.
    - If `questionnaire_json` has a `pages` list: prepend the recipient page to `pages`.
    - If `questionnaire_json` has a flat `elements` list: convert to `{ "pages": [recipient_page, { "name": "page1", "elements": <elements> }] }`.
    - If `questionnaire_json` is empty `{}`: set `questionnaire_json = { "pages": [recipient_page] }`.
    - Save the updated `questionnaire_json`.
- [ ] Migration `0018_drop_recipient_json.py` — schema migration: `RemoveField` for `recipient_json`.

**Tests**:

- [ ] Unit test the migration helper logic (data transformation) in isolation.
- [ ] Confirm `recipient_json` column no longer exists after running migrations.

**Stability Criteria**: `python manage.py migrate` runs cleanly; all existing backend tests pass.

**Notes**:

---

## Phase 2: Backend — serializer, views, PDF

**Status**: ✅ Completed 2026-05-13

**Goal**: Remove all backend references to `recipient_json`.

**Deliverables**:

- [ ] `serializers.py`: Remove `recipientJson` field from `QuestionnaireTypeSerializer`. Remove it from `fields` list.
- [ ] `views.py` — `submit` action: No change needed. The snapshot (`questionnaire_json_snapshot`) already captures `questionnaire_type.questionnaire_json`, which now includes the recipient page.
- [ ] `pdf.py`: Verify the PDF generator reads only `questionnaire_json`. No logic changes expected; confirm it works with the merged structure.
- [ ] `models.py`: Remove `recipient_json = models.JSONField(...)` field definition. (The column removal is handled by phase 1 migrations.)

**Tests**:

- [ ] `test_models.py`: Remove / update `TestQuestionnaireTypeRecipientJson` class.
- [ ] `test_views.py`: Remove / update recipient_json view tests. Add test that a type with an embedded `recipient_page` in `questionnaire_json` is serialised correctly.

**Stability Criteria**: All backend tests pass (`pytest Backend/`).

**Notes**:

---

## Phase 3: Frontend — types, API, editor, take route

**Status**: ✅ Completed 2026-05-13

**Goal**: Remove all frontend references to `recipientJson`. Simplify the json.tsx editor and take route.

**Deliverables**:

- [ ] `Frontend/src/types/index.ts`: Remove `recipientJson` from `QuestionnaireType` interface.
- [ ] `Frontend/src/api/questionnaireTypes.ts`: Remove `recipientJson` from any update payload types.
- [ ] `Frontend/src/hooks/useQuestionnaireTypes.ts`: Remove `recipientJson` from mutation input types (if present).
- [ ] `Frontend/src/routes/questionnaire-types/$id/json.tsx`:
  - Remove `recipientJsonText`, `recipientParseError`, `recipientSaved`, `lastValidRecipientJson`, `recipientOpen`, `RECIPIENT_STARTER` state and constants.
  - Remove the `previewSurveyJson` memo that merged the two JSONs; replace with `lastValidJson` directly.
  - Remove `handleRecipientJsonChange`, `handleSaveRecipient`, `handleClearRecipient` functions.
  - Remove the "Recipient JSON" collapsible UI section from the JSX.
  - The `SurveyRenderer` preview now receives `lastValidJson` (which may already contain a `recipient_page` page).
- [ ] `Frontend/src/routes/take/$id.tsx`:
  - Remove `recipientRaw`, `recipientPage`, `mergedSurveyJson` variables and the entire merge block.
  - Pass `questionnaireJson` directly to `SurveyRenderer`.
- [ ] `Frontend/src/routes/take-battery/$shareToken.tsx`: Check for any recipient merge logic and remove it.

**Tests**:

- [ ] `JsonEditorPage.test.tsx`: Remove tests for recipient JSON section. Update snapshot/render tests.
- [ ] `TakePage.test.tsx`: Remove tests that exercise recipient JSON prepend logic.
- [ ] Run `pnpm test` — all 320 tests must pass.

**Stability Criteria**: `pnpm build` and `pnpm lint` pass with zero errors.

**Notes**:

---

## Phase 4: Documentation

**Status**: ✅ Completed 2026-05-13

**Goal**: Keep docs in sync with the simplified model.

**Deliverables**:

- [ ] Update `AGENTS.md`: Remove references to `recipient_json` / `recipientJson`. Update `QuestionnaireType` description.
- [ ] Update `.github/instructions/survey-json.instructions.md`: Remove the `recipientJson` row from the field table.
- [ ] Move this plan to `Docs/Completed/`.

**Stability Criteria**: `pnpm build && pnpm lint` green; `pytest Backend/` green.

**Notes**:

---

## Migration reference

### 0017 — data migration logic (pseudocode)

```python
def migrate_recipient_json(apps, schema_editor):
    QuestionnaireType = apps.get_model("questionnaires", "QuestionnaireType")
    for qt in QuestionnaireType.objects.exclude(recipient_json=None):
        rj = qt.recipient_json
        # Normalise to page descriptor
        if not isinstance(rj, dict) or "elements" not in rj:
            rj = {"name": "recipient_page", "elements": [rj]}
        qj = qt.questionnaire_json or {}
        if "pages" in qj and isinstance(qj["pages"], list):
            qj = {**qj, "pages": [rj, *qj["pages"]]}
        elif "elements" in qj and isinstance(qj["elements"], list):
            qj = {"pages": [rj, {"name": "page1", "elements": qj["elements"]}]}
        else:
            qj = {**qj, "pages": [rj]}
        qt.questionnaire_json = qj
        qt.save(update_fields=["questionnaire_json"])
```

### 0018 — drop column

```python
operations = [
    migrations.RemoveField(
        model_name="questionnairetype",
        name="recipient_json",
    ),
]
```
