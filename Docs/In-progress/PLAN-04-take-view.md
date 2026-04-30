# Plan 04 — Respondent "Take" View (Submit a Questionnaire)

## Goal
Render a public, unauthenticated page at `/take/:id` where respondents answer the questionnaire and submit their responses.

---

## Scope

| File | Action |
|------|--------|
| `src/routes/take/$id.tsx` | New — public respondent route |
| `src/components/survey/SurveyRenderer.tsx` | New — wraps `survey-react-ui` |
| `src/api/responses.ts` | Already exists — `submitResponse(id, data)` |
| `src/hooks/useResponses.ts` | Already exists — add `useSubmitResponse` if not present |

---

## Steps

### 1. Install `survey-react-ui` (if not already installed)
```bash
pnpm add survey-react-ui survey-core
```

### 2. Build `SurveyRenderer` (`src/components/survey/SurveyRenderer.tsx`)
```tsx
import 'survey-core/survey.min.css'
import { Model } from 'survey-core'
import { Survey } from 'survey-react-ui'
```
- Props: `surveyJson: object`, `onComplete: (data: object) => void`.
- Create `const model = useMemo(() => new Model(surveyJson), [surveyJson])`.
- Wire `model.onComplete.add((sender) => onComplete(sender.data))`.
- Render `<Survey model={model} />`.

### 3. Respondent route (`src/routes/take/$id.tsx`)
- Load questionnaire via `useQuestionnaire(id)` — **no auth header needed** (public GET).
- Pass `questionnaire.surveyJson` to `<SurveyRenderer>`.
- `onComplete` calls `useSubmitResponse`:
  - `POST /questionnaires/:id/responses` with `{ answers: data }`.
- **Success state**: replace the survey with a thank-you card:
  - "Thank you for completing the questionnaire!"
  - Optional: show the questionnaire title.
- **Error state**: show an error banner with a retry option.
- **Loading state**: spinner centered on screen.
- No nav bar auth links — page should be clean and public-facing.

### 4. Ensure `useSubmitResponse` hook exists
In `src/hooks/useResponses.ts`:
```ts
export function useSubmitResponse(questionnaireId: string) {
  return useMutation({
    mutationFn: (data: object) => submitResponse(questionnaireId, data),
  })
}
```

---

## Acceptance Criteria
- [ ] `/take/:id` is accessible without authentication.
- [ ] The SurveyJS form renders correctly from `surveyJson`.
- [ ] On submit, a `POST /questionnaires/:id/responses` request is made.
- [ ] A thank-you message replaces the form after successful submission.
- [ ] Navigating to a non-existent ID shows a 404-style error message.
- [ ] `pnpm build` passes.

---

## Dependencies
- `survey-react-ui` package.
- `submitResponse` in `src/api/responses.ts` — already exists.
- The `/take/:id` route must be excluded from any auth guard applied in `__root.tsx`.
