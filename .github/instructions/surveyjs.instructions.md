---
applyTo: "Frontend/src/components/survey/**,Frontend/src/routes/take/**,Frontend/src/routes/questionnaires/**"
description: "Use when creating or modifying SurveyJS components (Survey Creator, Survey Renderer, Dashboard, PDF export) or any route that builds, takes, or analyses a questionnaire."
---

# SurveyJS Integration Patterns

See [Docs/SurveyJS/README.md](../../Docs/SurveyJS/README.md) for an overview of all four packages.

---

## Package Responsibilities

| What you need | Package | Import path |
|---------------|---------|-------------|
| Render a survey to a respondent | `survey-react-ui` | `survey-react-ui` |
| Data model / headless logic | `survey-core` | `survey-core` |
| Drag-and-drop builder for authors | `survey-creator-react` | `survey-creator-react` |
| Builder options / types | `survey-creator-core` | `survey-creator-core` |
| Response analytics charts | `survey-analytics` | `survey-analytics` |
| Export survey/results to PDF | `survey-pdf` | `survey-pdf` |

Install order (SurveyJS resolves peers automatically):
```bash
pnpm add survey-react-ui survey-creator-react survey-analytics survey-pdf
```

---

## Required CSS Imports

Always import CSS in the component file, not globally in `index.css`:

```ts
// Survey Renderer
import 'survey-core/survey-core.css';

// Survey Creator
import 'survey-core/survey-core.css';
import 'survey-creator-core/survey-creator-core.css';

// Dashboard
import 'survey-analytics/survey.analytics.css';
```

---

## Survey Creator Widget

**File:** `src/components/survey/SurveyCreatorWidget.tsx`  
**Route:** `src/routes/questionnaires/$id.edit.tsx`

```tsx
import { useState } from 'react';
import { ICreatorOptions, SurveyCreator } from 'survey-creator-core';
import { SurveyCreatorComponent } from 'survey-creator-react';
import { updateQuestionnaire } from '@/api/questionnaires';
import 'survey-core/survey-core.css';
import 'survey-creator-core/survey-creator-core.css';

const DEFAULT_OPTIONS: ICreatorOptions = {
  autoSaveEnabled: true,
  showLogicTab: true,
  showThemeTab: true,
  haveCommercialLicense: true, // suppress alert banner when license is set
};

interface Props {
  questionnaireId: string;
  initialJson?: object;
}

export default function SurveyCreatorWidget({ questionnaireId, initialJson }: Props) {
  const [creator] = useState(() => {
    const c = new SurveyCreator(DEFAULT_OPTIONS);

    if (initialJson) {
      c.JSON = initialJson;
    }

    c.saveSurveyFunc = (saveNo, callback) => {
      updateQuestionnaire(questionnaireId, { surveyJson: c.JSON })
        .then(() => callback(saveNo, true))
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

Key rules:
- `useState` initialiser (not `useEffect`) — avoids re-creating the creator on every render.
- `saveSurveyFunc` calls `PATCH /questionnaires/:id` with `{ surveyJson: creator.JSON }`.
- Pass `haveCommercialLicense: true` once you have a license key.

---

## Survey Renderer (Respondent View)

**File:** `src/components/survey/SurveyRenderer.tsx`  
**Route:** `src/routes/take/$id.tsx`  
**This route is public — no auth required.**

```tsx
import { useMemo } from 'react';
import { Model } from 'survey-core';
import { Survey } from 'survey-react-ui';
import { submitResponse } from '@/api/responses';
import 'survey-core/survey-core.css';

interface Props {
  questionnaireId: string;
  surveyJson: object;
  onComplete?: () => void;
}

export default function SurveyRenderer({ questionnaireId, surveyJson, onComplete }: Props) {
  const survey = useMemo(() => {
    const model = new Model(surveyJson);

    model.onComplete.add((sender) => {
      submitResponse(questionnaireId, sender.data)
        .then(() => onComplete?.())
        .catch(console.error);
    });

    return model;
  }, [questionnaireId, surveyJson, onComplete]);

  return <Survey model={survey} />;
}
```

Key rules:
- Create `Model` inside `useMemo` — never inside the render body (that would recreate it every render).
- `sender.data` is the raw key→value response object; pass it directly to `submitResponse`.
- The `/take/:id` route calls `getQuestionnaire(id)` **without** auth headers — the Axios interceptor only adds the token when it exists in `localStorage`, so no changes needed.

---

## Shareable URL

```ts
const shareUrl = `${window.location.origin}/take/${id}`;
navigator.clipboard.writeText(shareUrl);
```

Expose this as a copy button on the questionnaire list page (`/questionnaires`).

---

## Analytics Dashboard

**File:** `src/components/survey/SurveyDashboard.tsx`  
**Route:** `src/routes/questionnaires/$id.results.tsx`

```tsx
import { useEffect, useRef } from 'react';
import { Model } from 'survey-core';
import { VisualizationPanel } from 'survey-analytics';
import 'survey-analytics/survey.analytics.css';

interface Props {
  surveyJson: object;
  responses: object[];
}

export default function SurveyDashboard({ surveyJson, responses }: Props) {
  const containerRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!containerRef.current || responses.length === 0) return;

    const survey = new Model(surveyJson);
    const panel = new VisualizationPanel(
      survey.getAllQuestions(),
      responses,
      { allowHideQuestions: false },
    );

    panel.render(containerRef.current);
    return () => { panel.clear(); };
  }, [surveyJson, responses]);

  return <div ref={containerRef} />;
}
```

Feed `responses` from `useResponses(id)` hook — see `src/hooks/useResponses.ts`.

---

## PDF Export

```ts
import { SurveyPDF } from 'survey-pdf';

function exportToPdf(surveyJson: object, responses?: object) {
  const pdf = new SurveyPDF(surveyJson, {
    fontSize: 14,
    margins: { left: 10, right: 10, top: 10, bot: 10 },
    haveCommercialLicense: true,
  });

  if (responses) {
    pdf.data = responses;
  }

  pdf.save('questionnaire-results.pdf');
}
```

Place the export button in `$id.results.tsx` alongside the dashboard.

---

## Data Model

`Questionnaire.surveyJson` (type `object`) stores the raw SurveyJS JSON schema.  
The legacy `questions: Question[]` array is **not** used for SurveyJS forms.

```ts
// src/types/index.ts — add this field
export interface Questionnaire {
  id: string;
  title: string;
  description?: string;
  surveyJson: object;        // ← SurveyJS schema
  createdAt: string;
  updatedAt: string;
}
```

`QuestionnaireResponse.answers` should store the raw SurveyJS data object, not a typed `Answer[]` array:

```ts
export interface QuestionnaireResponse {
  id: string;
  questionnaireId: string;
  data: Record<string, unknown>; // ← raw sender.data from onComplete
  submittedAt: string;
}
```

---

## Response Hooks

Follow the same query-key factory pattern as `useQuestionnaires.ts`:

```ts
// src/hooks/useResponses.ts
export const responseKeys = {
  all: (qId: string) => ['responses', qId] as const,
};

export function useResponses(questionnaireId: string) {
  return useQuery({
    queryKey: responseKeys.all(questionnaireId),
    queryFn: () => getResponses(questionnaireId),
    enabled: !!questionnaireId,
  });
}

export function useSubmitResponse(questionnaireId: string) {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (data: Record<string, unknown>) =>
      submitResponse(questionnaireId, data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: responseKeys.all(questionnaireId) });
    },
  });
}
```

---

## Common Pitfalls

| Pitfall | Fix |
|---------|-----|
| `SurveyCreator` re-created on every render | Use `useState(() => new SurveyCreator(...))` |
| Survey model re-created on every render | Use `useMemo(() => new Model(...), [...])` |
| CSS not loading | Import CSS in the component file, not just `index.css` |
| `VisualizationPanel` leaking DOM nodes | Always call `panel.clear()` in the `useEffect` cleanup |
| Alert banner appearing | Set `haveCommercialLicense: true` in options once licensed |
| SSR hydration errors | N/A for this Vite SPA, but never use `survey-react-ui` in a server component |
