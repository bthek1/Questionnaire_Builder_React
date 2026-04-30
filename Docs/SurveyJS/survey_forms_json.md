Here's a comprehensive reference for the SurveyJS JSON format:

---

## SurveyJS JSON Format Reference

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
  "calculatedValues": [...],
  "variables": [...],
  "pages": [...],
  "completedHtml": "<p>Thank you!</p>",
  "completedHtmlOnCondition": [...]
}
```

The `$schema` property can reference either the local npm package path (`node_modules/survey-core/surveyjs_definition.json`) or the CDN at `https://unpkg.com/survey-core/surveyjs_definition.json`, enabling IntelliSense and validation in VS Code.

---

### Pages and elements

If a survey has only one page, you can skip the `pages` array and specify `elements` at the top level. Otherwise, `pages` is an array of page objects, each with its own `elements` array. All survey elements have unique `name` values used to identify them in code.

```json
{
  "pages": [
    {
      "name": "page1",
      "title": "Section Title",
      "visibleIf": "{consent} = true",
      "elements": [...]
    }
  ]
}
```

---

### Question types

Every element shares common properties:

| Property | Purpose |
|---|---|
| `type` | Question type (`text`, `rating`, `radiogroup`, `checkbox`, `matrix`, `expression`, etc.) |
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

Key question types:

```json
{ "type": "text", "name": "q1", "inputType": "number" }
{ "type": "rating", "name": "q2", "rateMin": 0, "rateMax": 10 }
{ "type": "radiogroup", "name": "q3", "choices": ["Yes", "No", { "value": 1, "text": "Option A" }] }
{ "type": "checkbox", "name": "q4", "choices": [...] }
{ "type": "dropdown", "name": "q5", "choices": [...] }
{ "type": "comment", "name": "q6", "rows": 4 }
{ "type": "boolean", "name": "q7" }
{ "type": "matrix", "name": "q8", "rows": [...], "columns": [...] }
{ "type": "matrixdropdown", "name": "q9", "rows": [...], "columns": [...] }
{ "type": "matrixdynamic", "name": "q10", "columns": [...] }
{ "type": "multipletext", "name": "q11", "items": [{ "name": "first" }, { "name": "last" }] }
{ "type": "panel", "name": "p1", "elements": [...] }
{ "type": "paneldynamic", "name": "p2", "templateElements": [...] }
{ "type": "html", "html": "<p>Instructions</p>" }
{ "type": "image", "imageLink": "https://..." }
{ "type": "expression", "name": "score", "expression": "{q1} + {q2}" }
```

---

### Calculated values

Calculated values let you register an expression under a name. The expression is recalculated each time any referenced value changes. Define them in a top-level `calculatedValues` array. Each object has `name`, `expression`, and optionally `includeIntoResult`.

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

`expression` questions are the visible counterpart — read-only fields that display a calculated result inline:

```json
{
  "type": "expression",
  "name": "displayScore",
  "title": "Your total score",
  "expression": "{q1} + {q2} + {q3}",
  "displayStyle": "decimal"
}
```

`setValueExpression` and `setValueIf` can also be used on regular questions to auto-populate a field's value based on an expression — re-evaluated whenever any referenced question changes.

---

### Expression syntax

Reference question values using curly braces: `{question-name}`. Expressions support arithmetic (`+`, `-`, `*`, `/`), comparison (`=`, `!=`, `>`, `<`, `>=`, `<=`), and logical (`and`, `or`, `not`) operators. Comparison operations are case-sensitive.

Built-in functions:

| Function | Purpose |
|---|---|
| `iif(cond, a, b)` | Ternary |
| `sum({q1}, {q2})` | Sum of args |
| `sumInArray({matrix}, 'col')` | Sum matrix column |
| `avgInArray(...)` | Average |
| `countInArray(...)` | Count non-empty |
| `minInArray(...)` | Min |
| `maxInArray(...)` | Max |
| `age({dob})` | Age from date |
| `currentDate()` | Today's date |
| `min(...)`, `max(...)` | Scalar min/max |

You can also register custom functions in JS:

```js
Survey.FunctionFactory.Instance.register("myFn", (params) => {
  return params[0] * 2;
});
```

Then use `myFn({q1})` in any expression.

---

### Conditional logic

Assign Boolean expressions to `visibleIf`, `enableIf`, and `requiredIf` on questions, panels, and pages. The survey re-evaluates these expressions any time a referenced value changes.

```json
{
  "visibleIf": "{phq9_score} >= 10",
  "enableIf": "{consent} = 'yes'",
  "requiredIf": "{mode} = 'clinical'"
}
```

---

### Response data format

`survey.onComplete` gives you `sender.data` — a flat object keyed by question `name` (or `valueName`):

```json
{
  "q1": 7,
  "q2": "sometimes",
  "matrix1": { "row1": "col2", "row2": "col1" },
  "totalScore": 21,
  "severity": "high"
}
```

Calculated values with `includeIntoResult: true` are merged into this same object.

---

### Completions / branching

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

### Relevance for Recovery Metrics

For PREM/PROM questionnaires, the most useful primitives are:

- `calculatedValues` with `includeIntoResult: true` for subscale scores (e.g. PHQ-9 total, GAD-7 severity band)
- `expression` question type to show scores inline to the respondent
- `visibleIf` for skip logic (e.g. only show follow-up if score exceeds threshold)
- `valueName` to decouple the display label from the DB key — keeps your Django model fields stable even if question wording changes
- The formal JSON schema at `surveyjs_definition.json` can be used to validate questionnaire definitions server-side before storing them in Postgres