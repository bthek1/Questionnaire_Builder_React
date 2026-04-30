# Survey Creator (`survey-creator`)

**Packages:** `survey-creator-core` + `survey-creator-react`  
**License:** Commercial (free for non-commercial / online trial at https://surveyjs.io/create-survey)  
**GitHub:** https://github.com/surveyjs/survey-creator  
**Docs:** https://surveyjs.io/survey-creator/documentation/overview

---

## What It Does

Survey Creator is a **visual drag-and-drop form builder** that lets developers (or end-users) design surveys without writing JSON by hand. It produces a survey JSON schema that can be stored and later rendered by the [SurveyJS Form Library](./survey-library.md).

Think of it as the "admin panel" or "designer" layer — you ship Survey Creator to content authors, they build forms, your app stores the resulting JSON and renders it to end-users via the Form Library.

---

## How It Works

```
Author opens Survey Creator UI
        │
        ▼
Drags questions from Toolbox → Design Surface
Sets properties in the Property Grid (right panel)
Previews the live form in the Preview tab
        │
        ▼
creator.JSON  ──►  Saved to your database (POST /api/surveys)
        │
        ▼
SurveyJS Form Library reads JSON → renders survey to respondents
```

---

## UI Panels

| Panel | Description |
|-------|-------------|
| **Toolbox** | Palette of available question types; can be customised to show only the types your app needs |
| **Design Surface** | Canvas where questions are arranged; supports multi-page layouts |
| **Property Grid** | Context-sensitive settings for the selected element (title, choices, validation, logic, etc.) |
| **Logic Editor** | Visual builder for conditional rules (`visibleIf`, `enableIf`, skip logic) |
| **Theme Editor** | CSS-based editor to customise colors, fonts, and spacing without writing CSS |
| **JSON Editor tab** | Raw JSON view / edit; optionally powered by the Ace code editor |
| **Preview tab** | Renders the form as an end-user would see it |
| **Translation tab** | Manage survey text in multiple languages |

---

## React Integration

### Installation

```bash
pnpm add survey-creator-react
# survey-creator-core is installed automatically as a peer dependency
```

### Basic Component

```tsx
// components/SurveyCreatorWidget.tsx
'use client' // required for Next.js
import { useState } from 'react';
import { ICreatorOptions, SurveyCreator } from 'survey-creator-core';
import { SurveyCreatorComponent } from 'survey-creator-react';
import 'survey-core/survey-core.css';
import 'survey-creator-core/survey-creator-core.css';

const creatorOptions: ICreatorOptions = {
  autoSaveEnabled: true,   // save JSON on every change
  collapseOnDrag: true,    // collapse pages when dragging
  showLogicTab: true,      // show conditional logic editor
  showThemeTab: true,      // show CSS theme editor
};

export default function SurveyCreatorWidget() {
  const [creator] = useState(() => {
    const c = new SurveyCreator(creatorOptions);

    // Load existing schema from your backend or localStorage
    c.text = localStorage.getItem('survey-json') ?? JSON.stringify({ pages: [{ name: 'page1', elements: [] }] });

    // Save callback: called on every change when autoSaveEnabled = true
    c.saveSurveyFunc = (saveNo, callback) => {
      fetch('/api/surveys', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: c.text,
      })
        .then((res) => callback(saveNo, res.ok))
        .catch(() => callback(saveNo, false));
    };

    return c;
  });

  return (
    <div style={{ height: '100vh', width: '100%' }}>
      <SurveyCreatorComponent creator={creator} />
    </div>
  );
}
```

### Reading the Produced JSON

```ts
// Get as a plain object
const schema: object = creator.JSON;

// Get as a JSON string
const schemaText: string = creator.text;
```

### Image Upload

When authors add images (logos, backgrounds, Image Picker options), the default behaviour embeds them as Base64. To store them on your server instead:

```ts
creator.onUploadFile.add((_, options) => {
  const formData = new FormData();
  options.files.forEach((file: File) => formData.append(file.name, file));

  fetch('/api/uploads', { method: 'POST', body: formData })
    .then((res) => res.json())
    .then((result) => options.callback('success', result.url))
    .catch(() => options.callback('error'));
});
```

---

## Key Configuration Options (`ICreatorOptions`)

| Option | Type | Default | Description |
|--------|------|---------|-------------|
| `autoSaveEnabled` | `boolean` | `false` | Trigger `saveSurveyFunc` on every change |
| `collapseOnDrag` | `boolean` | `false` | Collapse pages when dragging elements |
| `showLogicTab` | `boolean` | `false` | Show the Logic tab |
| `showThemeTab` | `boolean` | `false` | Show the Theme Editor tab |
| `showTranslationTab` | `boolean` | `false` | Show the Translation tab |
| `isAutoSave` | `boolean` | `false` | Alias for `autoSaveEnabled` |
| `readOnly` | `boolean` | `false` | Open the creator in read-only / preview mode |
| `haveCommercialLicense` | `boolean` | `false` | Suppress the license alert banner |

---

## Toolbox Customisation

Restrict available question types for your use case:

```ts
creator.toolbox.allowExpandMultipleCategories = true;

// Remove question types you don't need
creator.toolbox.removeItem('signaturepad');
creator.toolbox.removeItem('imagepicker');

// Add a custom question type
creator.toolbox.addItem({
  name: 'nps-question',
  title: 'NPS Score',
  json: { type: 'rating', rateMin: 0, rateMax: 10 },
});
```

---

## Licensing

Survey Creator requires a **commercial license** for use in commercial applications. You can use the hosted online version at https://surveyjs.io/create-survey for free to produce JSON schemas and render them with the Form Library (which is MIT).

---

## Further Reading

- [Property Grid customisation](https://surveyjs.io/survey-creator/documentation/property-grid)
- [Toolbox customisation](https://surveyjs.io/survey-creator/documentation/toolbox)
- [Themes & styles](https://surveyjs.io/survey-creator/documentation/survey-creator-interface-themes)
- [Localisation](https://surveyjs.io/survey-creator/documentation/localization)
- [Backend integration](https://surveyjs.io/documentation/backend-integration)
- [Migration from v1 to v2](https://surveyjs.io/survey-creator/documentation/migrate-from-v1-to-v2)
