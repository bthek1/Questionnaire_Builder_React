# Plan 02 — Questionnaire Builder (Survey Creator UI)

## Goal
Let owners design questionnaires using the SurveyJS drag-and-drop creator, and persist the JSON schema to the backend via `PATCH /questionnaires/:id`.

---

## Scope

| File | Action |
|------|--------|
| `src/components/survey/SurveyCreatorWidget.tsx` | New — wraps `survey-creator-react` |
| `src/routes/questionnaires/new.tsx` | Create questionnaire then open builder |
| `src/routes/questionnaires/$id.edit.tsx` | New — builder route for existing questionnaire |
| `src/api/questionnaires.ts` | Add `surveyJson` to the `updateQuestionnaire` payload type |
| `src/types/index.ts` | Add `surveyJson: object` field to `Questionnaire` |

---

## Steps

### 1. Extend the `Questionnaire` type
Add `surveyJson: object` to the `Questionnaire` interface in `src/types/index.ts`.
The old `questions: Question[]` array is superseded but can remain for backward compatibility.

### 2. Install SurveyJS Creator packages (if not already installed)
```bash
pnpm add survey-creator-react survey-creator-core survey-core
```

### 3. Build `SurveyCreatorWidget`
```tsx
// src/components/survey/SurveyCreatorWidget.tsx
import 'survey-creator-core/survey-creator-core.min.css'
import 'survey-core/survey.min.css'
import { SurveyCreatorComponent, SurveyCreator } from 'survey-creator-react'
```
- Accept props: `initialJson?: object`, `onSave: (json: object) => void`.
- Instantiate `SurveyCreator` once (via `useRef` or `useMemo`).
- Set `creator.JSON = initialJson` when `initialJson` changes.
- Wire `creator.saveSurveyFunc = (saveNo, callback) => { onSave(creator.JSON); callback(saveNo, true) }`.
- Render `<SurveyCreatorComponent creator={creator} />`.
- Set `haveCommercialLicense: true` option to suppress the banner (or configure the license key).

### 4. New Questionnaire flow (`questionnaires/new.tsx`)
- Render `<QuestionnaireForm />` (title + description).
- On submit → `useCreateQuestionnaire()` → redirect to `/questionnaires/:newId/edit`.

### 5. Edit Builder Route (`questionnaires/$id.edit.tsx`)
- Load questionnaire via `useQuestionnaire(id)`.
- Pass `questionnaire.surveyJson` as `initialJson` to `<SurveyCreatorWidget>`.
- `onSave` calls `useUpdateQuestionnaire(id)` with `{ surveyJson }`.
- Show a toast/banner "Saved" on success, "Error saving" on failure.
- "Back to list" link in the header.

---

## Acceptance Criteria
- [ ] Navigating to `/questionnaires/:id/edit` renders the SurveyJS creator.
- [ ] Clicking the creator's save button persists the JSON to the backend.
- [ ] Reloading the edit page restores the previous design.
- [ ] No TypeScript errors (`pnpm build`).

---

## Dependencies
- `survey-creator-react`, `survey-creator-core`, `survey-core` packages.
- `useQuestionnaire`, `useUpdateQuestionnaire` hooks — already exist.
- See `.github/instructions/surveyjs.instructions.md` for CSS import order and creator patterns.
