# Plan 05 — Results & Analytics Dashboard

## Goal
Let questionnaire owners view aggregated response data as charts and export results as a PDF.

---

## Scope

| File | Action |
|------|--------|
| `Frontend/src/routes/questionnaires/$id.results.tsx` | New — results route |
| `Frontend/src/components/survey/SurveyDashboard.tsx` | New — wraps `survey-analytics` VisualizationPanel |
| `Frontend/src/api/responses.ts` | Already exists — `getResponses(id)` |
| `Frontend/src/hooks/useResponses.ts` | Already exists — add `useResponses` query if not present |

---

## Steps

### 1. Install analytics & PDF packages (if not already installed)
```bash
cd Frontend/
pnpm add survey-analytics survey-pdf survey-core
```

### 2. Build `SurveyDashboard` (`Frontend/src/components/survey/SurveyDashboard.tsx`)
```tsx
import 'survey-analytics/survey.analytics.min.css'
import { VisualizationPanel } from 'survey-analytics'
```
- Props: `surveyJson: object`, `responses: object[]`.
- Mount the `VisualizationPanel` into a `<div ref>` using `useEffect`:
  ```ts
  const panel = new VisualizationPanel(surveyJson.pages[0].elements, responses)
  panel.render(containerRef.current)
  return () => panel.destroy?.()
  ```
- Re-render when `responses` length changes.

### 3. Results route (`Frontend/src/routes/questionnaires/$id.results.tsx`)
- Fetch questionnaire → `useQuestionnaire(id)`.
- Fetch responses → `useResponses(id)` (calls `GET /questionnaires/:id/responses`).
- Layout:
  - **Header**: questionnaire title, response count badge, "Back to list" link.
  - **Stats bar**: total responses, completion rate (if available), date of last response.
  - **Charts section**: `<SurveyDashboard surveyJson={...} responses={responses} />`.
  - **PDF export button**: see step 4.
- Empty state: "No responses yet" with the shareable link as a CTA.

### 4. PDF Export button
```tsx
import { SurveyPDF } from 'survey-pdf'
```
- On click, instantiate `SurveyPDF` with `surveyJson` and the first response (or a blank model for the structure).
- Call `surveyPdf.save('questionnaire-results.pdf')`.
- Wrap in a try/catch; show an error toast on failure.
- Button label: "Export PDF", variant `outline`.

### 5. Ensure `useResponses` hook exists
In `Frontend/src/hooks/useResponses.ts`:
```ts
export const responseKeys = {
  all: (qId: string) => ['responses', qId] as const,
}

export function useResponses(questionnaireId: string) {
  return useQuery({
    queryKey: responseKeys.all(questionnaireId),
    queryFn: () => getResponses(questionnaireId),
    enabled: !!questionnaireId,
  })
}
```

---

## Acceptance Criteria
- [ ] `/questionnaires/:id/results` is accessible to the questionnaire owner.
- [ ] Charts render for each question type (choice, rating, text).
- [ ] Response count and last-response date are shown.
- [ ] "Export PDF" downloads a file named after the questionnaire.
- [ ] Empty state is shown when no responses exist.
- [ ] `pnpm build` passes.

---

## Dependencies
- `survey-analytics`, `survey-pdf` packages.
- `getResponses` in `src/api/responses.ts` — already exists.
- Commercial license key may be required to suppress watermarks — set in component or `main.tsx`.
- See `Docs/SurveyJS/survey-analytics.md` and `Docs/SurveyJS/survey-pdf.md` for detailed API docs.
