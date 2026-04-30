# SurveyJS JSON Format Reference

## Overview: JSON Types in SurveyJS

There are two primary JSON structures and several auxiliary ones:

| Type | Purpose | Authored by |
|---|---|---|
| **Survey Definition** | Describes form structure, questions, logic, appearance | Developer / form builder |
| **Response Data** | Captures respondent answers | Respondent (at runtime) |
| **Theme JSON** | Visual styling / CSS variables | Developer / Theme Editor |
| **Translations JSON** | i18n strings per locale | Developer |
| **State JSON** | Partial completion snapshot for resume | Runtime (persisted by you) |

---

## 1. Survey Definition JSON (the "form")

### Top-level structure

```json
{
  "$schema": "../../node_modules/survey-core/surveyjs_definition.json",
  "title": "My Survey",
  "locale": "en",
  "showProgressBar": "top",
  "showQuestionNumbers": "on",
  "questionsOnPageMode": "standard",
  "checkErrorsMode": "onNextPage",
  "clearInvisibleValues": "onHidden",
  "calculatedValues": [],
  "variables": [],
  "pages": [],
  "completedHtml": "<p>Thank you!</p>",
  "completedHtmlOnCondition": []
}
```

> The `$schema` property can reference either the local npm package path or the CDN at `https://unpkg.com/survey-core/surveyjs_definition.json`, enabling IntelliSense and validation in VS Code. The schema can also be used to **validate definitions server-side** before storing them in Postgres.

### Pages and elements

```json
{
  "pages": [
    {
      "name": "page1",
      "title": "Section Title",
      "visibleIf": "{consent} = true",
      "elements": []
    }
  ]
}
```

- If a survey has only **one page**, you can skip `pages` and specify `elements` at the top level.
- All elements have unique `name` values used to identify them in code and in response data.

---

## 2. Question Types

### Common properties (all types)

| Property | Purpose |
|---|---|
| `type` | Question type (`text`, `rating`, `radiogroup`, etc.) |
| `name` | Unique key — used in expressions and response data |
| `title` | Displayed label |
| `description` | Helper text |
| `isRequired` | Boolean |
| `requiredIf` | Expression-based required |
| `visibleIf` | Expression-based visibility |
| `enableIf` | Expression-based enabled state |
| `defaultValue` | Pre-filled value |
| `valueName` | Override the key used in response data |
| `titleLocation` | `"top"`, `"left"`, `"hidden"` |

> **`valueName`** is particularly useful in clinical contexts — it decouples the display label from the DB key, keeping your Django model fields stable even if question wording changes.

### Type reference

```json
{ "type": "text",          "name": "q1", "inputType": "number" }
{ "type": "rating",        "name": "q2", "rateMin": 0, "rateMax": 10 }
{ "type": "radiogroup",    "name": "q3", "choices": ["Yes", "No", { "value": 1, "text": "Option A" }] }
{ "type": "checkbox",      "name": "q4", "choices": [] }
{ "type": "dropdown",      "name": "q5", "choices": [] }
{ "type": "comment",       "name": "q6", "rows": 4 }
{ "type": "boolean",       "name": "q7" }
{ "type": "matrix",        "name": "q8", "rows": [], "columns": [] }
{ "type": "matrixdropdown","name": "q9", "rows": [], "columns": [] }
{ "type": "matrixdynamic", "name": "q10", "columns": [] }
{ "type": "multipletext",  "name": "q11", "items": [{ "name": "first" }, { "name": "last" }] }
{ "type": "panel",         "name": "p1", "elements": [] }
{ "type": "paneldynamic",  "name": "p2", "templateElements": [] }
{ "type": "html",          "html": "<p>Instructions</p>" }
{ "type": "image",         "imageLink": "https://..." }
{ "type": "expression",    "name": "score", "expression": "{q1} + {q2}" }
```

---

## 3. Calculated Values

Registered at the top level under `calculatedValues`. Each expression is re-evaluated whenever any referenced value changes. Use `includeIntoResult: true` to merge the value into `survey.data`.

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

The `expression` question type is the **visible counterpart** — a read-only field that displays a calculated result inline to the respondent:

```json
{
  "type": "expression",
  "name": "displayScore",
  "title": "Your total score",
  "expression": "{q1} + {q2} + {q3}",
  "displayStyle": "decimal"
}
```

`setValueExpression` and `setValueIf` can also be used on regular questions to auto-populate a field's value based on an expression.

---

## 4. Expression Syntax

Reference question values using curly braces: `{question-name}`.

Supports:
- **Arithmetic**: `+`, `-`, `*`, `/`
- **Comparison**: `=`, `!=`, `>`, `<`, `>=`, `<=` *(case-sensitive)*
- **Logical**: `and`, `or`, `not`

### Built-in functions

| Function | Purpose |
|---|---|
| `iif(cond, a, b)` | Ternary |
| `sum({q1}, {q2})` | Sum of args |
| `sumInArray({matrix}, 'col')` | Sum a matrix column |
| `avgInArray(...)` | Average |
| `countInArray(...)` | Count non-empty |
| `minInArray(...)` | Min |
| `maxInArray(...)` | Max |
| `age({dob})` | Age from date |
| `currentDate()` | Today's date |
| `min(...)`, `max(...)` | Scalar min/max |

### Custom functions

```js
Survey.FunctionFactory.Instance.register("myFn", (params) => {
  return params[0] * 2;
});
```

Then use `myFn({q1})` in any expression field.

---

## 5. Conditional Logic

Assign Boolean expressions to `visibleIf`, `enableIf`, and `requiredIf` on questions, panels, and pages. Expressions are re-evaluated any time a referenced value changes.

```json
{
  "visibleIf":  "{phq9_score} >= 10",
  "enableIf":   "{consent} = 'yes'",
  "requiredIf": "{mode} = 'clinical'"
}
```

---

## 6. Response Data JSON (the "results")

`survey.onComplete` gives you `sender.data` — a **flat object** keyed by question `name` (or `valueName`). Calculated values with `includeIntoResult: true` are merged into the same object.

```json
{
  "q1": 7,
  "q2": "sometimes",
  "matrix1": { "row1": "col2", "row2": "col1" },
  "totalScore": 21,
  "severity": "high"
}
```

### Response shapes by question type

| Type | Response shape |
|---|---|
| `text`, `rating`, `radiogroup`, `dropdown`, `boolean` | scalar value |
| `checkbox` | `["option1", "option2"]` |
| `matrix` | `{ "row1": "colValue", "row2": "colValue" }` |
| `matrixdynamic` | `[{ "col1": "val", "col2": "val" }, ...]` |
| `paneldynamic` | `[{ "nested_q": "val" }, ...]` |
| `multipletext` | `{ "first": "val", "last": "val" }` |
| `file` | `[{ "name": "...", "content": "base64..." }]` |

---

## 7. Branching / Conditional Completion HTML

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

## 8. Auxiliary JSON Structures

### Theme JSON

Exported from the Theme Editor; controls visual styling.

```json
{
  "themeName": "default",
  "colorPalette": "light",
  "cssVariables": {
    "--sjs-primary-backcolor": "#19b394"
  }
}
```

### Translations JSON

Per-locale string overrides.

```json
{
  "en": { "pagePrevText": "Back" },
  "fr": { "pagePrevText": "Précédent" }
}
```

### State JSON (resume partial completion)

Not a formal SurveyJS format — you persist and restore it yourself by combining `survey.data` and `survey.currentPageNo`:

```js
// Save
const state = { data: survey.data, currentPageNo: survey.currentPageNo };

// Restore
survey.data = state.data;
survey.currentPageNo = state.currentPageNo;
```

---

## 9. Recovery Metrics — Relevant Primitives

For PREM/PROM questionnaires, the most useful features are:

| Feature | Use case |
|---|---|
| `calculatedValues` + `includeIntoResult: true` | Subscale scores (PHQ-9 total, GAD-7 severity band) merged into response data |
| `expression` question type | Show scores inline to the respondent during completion |
| `visibleIf` | Skip logic — show follow-up questions only if score exceeds a threshold |
| `valueName` | Decouple display wording from DB field key — stable Django model fields across question rewording |
| `$schema` validation | Validate questionnaire definitions server-side before storing in Postgres |
| `completedHtmlOnCondition` | Show clinician-referral prompts based on severity score |

### Django model mapping

| SurveyJS artifact | Django model |
|---|---|
| Definition JSON | `QuestionnaireTemplate.definition` (JSONField) |
| Response JSON (`sender.data`) | `QuestionnaireResponse.data` (JSONField) |
| State JSON | `QuestionnaireResponse.partial_state` (JSONField, nullable) |