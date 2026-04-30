---
description: 'Use when authoring, validating, editing, or processing SurveyJS JSON — survey definition schemas, response data shapes, calculated values, conditional logic, and Django model mapping. Applies to the JSON editor route and any backend code that reads or stores survey JSON.'
applyTo: 'Frontend/src/routes/questionnaires/**,Backend/questionnaires/**'
---

# SurveyJS JSON Authoring & Processing

Full reference: [Docs/SurveyJS/survey_forms_json.md](../../Docs/SurveyJS/survey_forms_json.md)

---

## Two Distinct JSON Objects

| Object                                                   | Where it lives               | Django field |
| -------------------------------------------------------- | ---------------------------- | ------------ |
| **Survey Definition** — form structure, questions, logic | `Questionnaire.surveyJson`   | `JSONField`  |
| **Response Data** — respondent answers (`sender.data`)   | `QuestionnaireResponse.data` | `JSONField`  |

Never mix them. The definition is written once by the owner; response data is written once per respondent submission.

---

## Minimal Valid Survey Definition

```json
{
  "title": "My Survey",
  "pages": [
    {
      "name": "page1",
      "elements": [
        { "type": "text", "name": "q1", "title": "What is your name?", "isRequired": true }
      ]
    }
  ]
}
```

- Every `element` must have a unique `name`. This name becomes the key in response data.
- Single-page surveys may use top-level `elements` instead of `pages`.
- Add `"$schema": "https://unpkg.com/survey-core/surveyjs_definition.json"` for VS Code IntelliSense and server-side validation.

---

## Common Question Types

```jsonc
// Short text / number / email / date
{ "type": "text", "name": "q", "inputType": "number" }

// 0–10 scale
{ "type": "rating", "name": "q", "rateMin": 0, "rateMax": 10 }

// Single choice
{ "type": "radiogroup", "name": "q", "choices": ["Yes", "No", { "value": 1, "text": "Option A" }] }

// Multi-select
{ "type": "checkbox", "name": "q", "choices": ["A", "B", "C"] }

// Long text
{ "type": "comment", "name": "q", "rows": 4 }

// Yes/No toggle
{ "type": "boolean", "name": "q" }

// Grid: one answer per row
{ "type": "matrix", "name": "q", "rows": ["row1"], "columns": ["col1"] }

// Static HTML (no answer)
{ "type": "html", "html": "<p>Instructions here.</p>" }

// Read-only calculated display
{ "type": "expression", "name": "score", "expression": "{q1} + {q2}", "displayStyle": "decimal" }
```

---

## Response Data Shape

`survey.onComplete` → `sender.data` is a **flat object** keyed by question `name`:

```json
{
  "q1": "Alice",
  "q2": 7,
  "checkbox1": ["A", "C"],
  "matrix1": { "row1": "col2" },
  "totalScore": 21
}
```

Response shapes by type:

| Type                                                  | Shape                               |
| ----------------------------------------------------- | ----------------------------------- |
| `text`, `rating`, `boolean`, `radiogroup`, `dropdown` | scalar                              |
| `checkbox`                                            | `["opt1", "opt2"]`                  |
| `matrix`                                              | `{ "row": "colValue" }`             |
| `matrixdynamic`                                       | `[{ "col1": "val" }, ...]`          |
| `paneldynamic`                                        | `[{ "nested_q": "val" }, ...]`      |
| `multipletext`                                        | `{ "first": "val", "last": "val" }` |

---

## Calculated Values (Scores)

Defined at the top level. Re-evaluated on every value change. Use `includeIntoResult: true` to merge into `sender.data`.

```json
{
  "calculatedValues": [
    {
      "name": "totalScore",
      "expression": "{q1} + {q2} + {q3}",
      "includeIntoResult": true
    },
    {
      "name": "severity",
      "expression": "iif({totalScore} >= 20, 'high', iif({totalScore} >= 10, 'moderate', 'low'))",
      "includeIntoResult": true
    }
  ]
}
```

Built-in expression functions: `iif`, `sum`, `sumInArray`, `avgInArray`, `countInArray`, `age`, `currentDate`, `min`, `max`.

---

## Conditional Logic

Apply Boolean expressions to `visibleIf`, `enableIf`, `requiredIf` on any question, panel, or page:

```json
{ "visibleIf":  "{severity} = 'high'" }
{ "enableIf":   "{consent} = 'yes'" }
{ "requiredIf": "{mode} = 'clinical'" }
```

Expression operators: `=`, `!=`, `>`, `<`, `>=`, `<=`, `and`, `or`, `not`. Reference values with `{question-name}`.

---

## `valueName` — Stable DB Keys

Use `valueName` to decouple the display question `name` from the key stored in response data. This keeps Django model fields stable if question wording changes.

```json
{
  "type": "rating",
  "name": "phq9_q1_display",
  "valueName": "phq9_q1",
  "title": "Little interest or pleasure in doing things?"
}
```

Response data will use `"phq9_q1"` regardless of how `name` changes.

---

## Completion HTML by Condition

Show conditional messages at survey completion:

```json
{
  "completedHtmlOnCondition": [
    {
      "expression": "{severity} = 'high'",
      "html": "<p>Please contact your clinician immediately.</p>"
    }
  ]
}
```

---

## Frontend — Passing JSON to the Model

Always pass the raw `surveyJson` object directly to `new Model(surveyJson)`. Do not stringify or parse it — it arrives from the API as a plain `object`.

```ts
const survey = useMemo(() => new Model(surveyJson), [surveyJson])
```

---

## Backend — Storing and Validating

- Store definitions as `JSONField` on the `Questionnaire` model — no schema migration needed when question structure changes.
- Store responses as `JSONField` on `QuestionnaireResponse`.
- Optionally validate incoming definitions against the `$schema` using `jsonschema` before saving.

```python
# questionnaires/serializers.py — example validation hook
import jsonschema, requests

SURVEY_SCHEMA = None  # load lazily or cache at startup

def validate_survey_json(value: dict) -> None:
    # lightweight check: must be a dict with either 'pages' or 'elements'
    if not isinstance(value, dict):
        raise serializers.ValidationError("surveyJson must be an object.")
    if "pages" not in value and "elements" not in value:
        raise serializers.ValidationError("surveyJson must contain 'pages' or 'elements'.")
```

---

## Checklist — JSON Editor Route

When saving from the JSON editor (`/questionnaires/:id/json`):

1. Parse the editor string with `JSON.parse` — catch `SyntaxError` and show an inline error.
2. `PATCH /questionnaires/:id` with `{ surveyJson: parsed }`.
3. Invalidate `['questionnaires', id]` query on success.
4. The live preview (`SurveyRenderer`) receives the updated `surveyJson` prop and re-creates the `Model` via `useMemo`.
