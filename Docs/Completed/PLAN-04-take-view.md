# Plan 04 — Respondent "Take" View (Submit a Questionnaire)

**Status**: ✅ Completed 2026-04-30

## Goal
Render a public, unauthenticated page at `/take/:id` where respondents answer the questionnaire and submit their responses.

---

## Scope

| File | Action | Status |
|------|--------|--------|
| `Frontend/src/routes/take/$id.tsx` | New — public respondent route | ✅ Done |
| `Frontend/src/components/survey/SurveyRenderer.tsx` | New — wraps `survey-react-ui` | ✅ Done |
| `Frontend/src/api/responses.ts` | Already exists — `submitResponse(id, data)` | ✅ Done |
| `Frontend/src/hooks/useResponses.ts` | Add `useSubmitResponse` | ✅ Done |
| `Frontend/src/types/index.ts` | Add `surveyJson?: object` to `Questionnaire` | ✅ Done |

---

## Steps

### 1. Install `survey-react-ui` (if not already installed)
```bash
cd Frontend/
pnpm add survey-react-ui survey-core
```
✅ Installed.

### 2. Build `SurveyRenderer` (`Frontend/src/components/survey/SurveyRenderer.tsx`)
```tsx
import 'survey-core/survey.min.css'
import { Model } from 'survey-core'
import { Survey } from 'survey-react-ui'
```
- Props: `surveyJson: object`, `onComplete: (data: object) => void`.
- Create `const model = useMemo(() => new Model(surveyJson), [surveyJson])`.
- Wire `model.onComplete.add((sender) => onComplete(sender.data))`.
- Render `<Survey model={model} />`.

✅ Implemented. CSS import uses `survey-core/survey-core.min.css`.

### 3. Respondent route (`Frontend/src/routes/take/$id.tsx`)
- Load questionnaire via `useQuestionnaire(id)` — **no auth header needed** (public GET).
- Pass `questionnaire.surveyJson` to `<SurveyRenderer>`.
- `onComplete` calls `useSubmitResponse`:
  - `POST /questionnaires/:id/responses` with `{ answers: data }`.
- **Success state**: replace the survey with a thank-you card.
- **Error state**: show an error banner with a retry option.
- **Loading state**: spinner centered on screen.
- **Empty surveyJson state**: informational message.

✅ Implemented with all states.

### 4. Ensure `useSubmitResponse` hook exists
In `Frontend/src/hooks/useResponses.ts`:
```ts
export function useSubmitResponse(questionnaireId: string) {
  return useMutation({
    mutationFn: (data: object) => submitResponse(questionnaireId, data),
  })
}
```
✅ Implemented. Also added `useGetResponses` and `responseKeys` factory.

---

## Acceptance Criteria
- [x] `/take/:id` is accessible without authentication.
- [x] The SurveyJS form renders correctly from `surveyJson`.
- [x] On submit, a `POST /questionnaires/:id/responses` request is made.
- [x] A thank-you message replaces the form after successful submission.
- [x] Navigating to a non-existent ID shows a 404-style error message.
- [x] `pnpm build` passes.

---

## Notes
- `surveyJson?: object` added to `Questionnaire` type in `Frontend/src/types/index.ts`.
- CSS import is `survey-core/survey-core.min.css` (not `survey.min.css` as originally specified).
- `useGetResponses` was also added to `useResponses.ts` to prepare for PLAN-05.
- Build passes with no TypeScript errors (only chunk-size warning from SurveyJS bundles — acceptable).

---

## Dependencies
- `survey-react-ui` package.
- `submitResponse` in `Frontend/src/api/responses.ts` — already exists.
- The `/take/:id` route must be excluded from any auth guard applied in `Frontend/src/routes/__root.tsx`.
