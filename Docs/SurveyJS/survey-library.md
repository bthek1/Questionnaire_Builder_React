# SurveyJS Form Library (`survey-library`)

**Package:** `survey-core` + framework renderer (e.g. `survey-react-ui`)  
**License:** MIT (free for commercial use)  
**GitHub:** https://github.com/surveyjs/survey-library  
**Docs:** https://surveyjs.io/form-library/documentation/overview

---

## What It Does

SurveyJS Form Library is the core rendering engine of the SurveyJS ecosystem. It takes a **survey JSON schema** and renders it as a fully interactive, accessible web form. All other SurveyJS products depend on it.

Key capabilities:
- Renders dynamic, multi-page forms from a declarative JSON definition.
- Collects user responses and provides a structured data object.
- Supports conditional logic (show/hide questions based on answers).
- Handles validation, scoring, text piping, and carry-forward responses.
- Can be used standalone (no Survey Creator required — JSON can be hand-authored or fetched from a database).

---

## Architecture

The library is split into two layers:

| Layer | Package | Purpose |
|-------|---------|---------|
| Core (framework-agnostic) | `survey-core` | Data model, JSON parsing, logic engine |
| Renderer | `survey-react-ui`, `survey-angular-ui`, `survey-vue3-ui`, or vanilla JS | Converts the model to DOM elements |

This split means you can run the core on the server (e.g. Node.js) for validation without a DOM.

---

## Survey JSON Schema

Everything is driven by a plain JSON object. Example:

```json
{
  "title": "Customer Feedback",
  "pages": [
    {
      "name": "page1",
      "elements": [
        {
          "type": "rating",
          "name": "satisfaction",
          "title": "How satisfied are you?",
          "rateMin": 1,
          "rateMax": 5
        },
        {
          "type": "comment",
          "name": "comments",
          "title": "Any additional comments?",
          "visibleIf": "{satisfaction} < 4"
        }
      ]
    }
  ]
}
```

The schema is backend-agnostic — store it in any database (SQL, MongoDB, flat file, etc.).

---

## Supported Question Types (20+)

| Category | Types |
|----------|-------|
| Text input | `text`, `comment`, `multipletext` |
| Choice | `radiogroup`, `checkbox`, `dropdown`, `tagbox` |
| Scale / Rating | `rating`, `nps` |
| Matrix | `matrix`, `matrixdropdown`, `matrixdynamic` |
| Media | `file`, `signaturepad`, `imagepicker` |
| Visual / Layout | `image`, `html`, `expression` |
| Containers | `panel`, `paneldynamic` |
| Specialist | `boolean`, `ranking` |

---

## React Integration

### Installation

```bash
pnpm add survey-core survey-react-ui
```

### Basic Usage

```tsx
import { Model } from 'survey-core';
import { Survey } from 'survey-react-ui';
import 'survey-core/survey-core.css';

const surveyJson = { /* JSON schema */ };

export default function SurveyPage() {
  const survey = new Model(surveyJson);

  survey.onComplete.add((sender) => {
    console.log('Results:', sender.data);
    // POST sender.data to your backend
  });

  return <Survey model={survey} />;
}
```

> **Note:** SurveyJS components do **not** support SSR. In Next.js add `'use client'` or use `dynamic(..., { ssr: false })`.

### Theming

Import one of the built-in themes or use the Theme Editor in Survey Creator to generate a custom theme:

```ts
import { StylesManager } from 'survey-core';
// Built-in themes: 'defaultV2', 'modern', 'bootstrap', 'bootstrapmaterial'
StylesManager.applyTheme('defaultV2');
```

---

## Key Features

### Conditional Logic

Use the `visibleIf`, `enableIf`, and `requiredIf` properties with SurveyJS expression syntax:

```json
{
  "type": "text",
  "name": "companyName",
  "visibleIf": "{employmentStatus} = 'employed'"
}
```

### Validation

Built-in validators plus custom async validators:

```ts
survey.onValidateQuestion.add((_, options) => {
  if (options.name === 'email' && !options.value.includes('@')) {
    options.error = 'Please enter a valid email.';
  }
});
```

### Collecting Results

```ts
survey.onComplete.add((sender) => {
  fetch('/api/responses', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(sender.data),
  });
});
```

### Partial Saves / Auto-Save

```ts
survey.onValueChanged.add((sender) => {
  localStorage.setItem('survey-partial', JSON.stringify(sender.data));
});
// Restore on load:
survey.data = JSON.parse(localStorage.getItem('survey-partial') || '{}');
```

---

## Licensing

MIT — free for all use cases including commercial production. No watermarks, no submission limits, no backend lock-in.

---

## Further Reading

- [All question types](https://surveyjs.io/form-library/documentation/question-types)
- [Data validation](https://surveyjs.io/form-library/documentation/data-validation)
- [Conditional logic](https://surveyjs.io/form-library/documentation/conditional-logic)
- [Themes & styles](https://surveyjs.io/form-library/documentation/manage-default-themes-and-styles)
- [Localisation (25+ languages)](https://surveyjs.io/form-library/documentation/survey-localization)
- [Backend integration guide](https://surveyjs.io/documentation/backend-integration)
