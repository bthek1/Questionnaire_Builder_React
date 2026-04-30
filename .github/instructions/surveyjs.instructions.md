---
applyTo: "Frontend/src/components/survey/**,Frontend/src/routes/take/**,Frontend/src/routes/questionnaires/**"
description: "Use when creating or modifying SurveyJS components (Survey Renderer) or any route that builds or takes a questionnaire."
---

# SurveyJS Integration Patterns

See [Docs/SurveyJS/README.md](../../Docs/SurveyJS/README.md) for an overview of the packages in use.

---

## Package Responsibilities

| What you need | Package | Import path |
|---------------|---------|-------------|
| Render a survey to a respondent | `survey-react-ui` | `survey-react-ui` |
| Data model / headless logic | `survey-core` | `survey-core` |

> **Note:** `survey-creator-react`, `survey-creator-core`, `survey-analytics`, and `survey-pdf` have been removed (commercial EULA). Use the JSON editor route (`/questionnaires/:id/json`) for building surveys. Response data is displayed in a plain table.

Install:
```bash
pnpm add survey-react-ui
```

---

## Required CSS Imports

Always import CSS in the component file, not globally in `index.css`:

```ts
// Survey Renderer
import 'survey-core/survey-core.css';
```

---

## Form Builder (JSON Editor)

**Route:** `src/routes/questionnaires/$id/json.tsx`

Survey Creator has been removed. Use the JSON editor route instead.
The `/questionnaires/:id/edit` route redirects to `/questionnaires/:id/json`.

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

## Responses / Results

Response data is fetched via `useResponses(id)` and displayed in a plain HTML table (`RawResponsesTable`). There is no analytics dashboard — `survey-analytics` has been removed.

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
