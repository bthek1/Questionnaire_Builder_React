---
description: "Scaffold all route files, SurveyJS components, hooks, and type updates needed for the full questionnaire build→share→respond→results workflow"
agent: "agent"
---

Implement the full questionnaire workflow for this project using SurveyJS.

Refer to [AGENTS.md](../../AGENTS.md) for architecture conventions and [.github/instructions/surveyjs.instructions.md](../instructions/surveyjs.instructions.md) for SurveyJS patterns.

---

## 0. Install SurveyJS packages

```bash
pnpm add survey-react-ui survey-creator-react survey-analytics survey-pdf
```

---

## 1. Update Types — `src/types/index.ts`

Replace the existing `Questionnaire`, `QuestionnaireResponse`, and `Answer` interfaces. Keep any other types unchanged.

```ts
export interface Questionnaire {
  id: string
  title: string
  description?: string
  surveyJson: object          // raw SurveyJS JSON schema
  createdAt: string
  updatedAt: string
}

export interface QuestionnaireResponse {
  id: string
  questionnaireId: string
  data: Record<string, unknown>  // raw sender.data from survey.onComplete
  submittedAt: string
}
```

Remove `Question`, `QuestionOption`, and `Answer` — they are replaced by the SurveyJS JSON schema.

---

## 2. Update API — `src/api/responses.ts`

Change `submitResponse` to accept `Record<string, unknown>` instead of `Answer[]`:

```ts
export async function submitResponse(
  questionnaireId: string,
  data: Record<string, unknown>,
): Promise<QuestionnaireResponse> {
  const { data: res } = await apiClient.post<QuestionnaireResponse>(
    `/questionnaires/${questionnaireId}/responses`,
    { data },
  )
  return res
}
```

---

## 3. Add Response Hook — `src/hooks/useResponses.ts`

Follow the query-key factory pattern from [`src/hooks/useQuestionnaires.ts`](../../src/hooks/useQuestionnaires.ts):

```ts
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { getResponses, submitResponse } from '@/api/responses'

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

export function useSubmitResponse(questionnaireId: string) {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: (data: Record<string, unknown>) =>
      submitResponse(questionnaireId, data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: responseKeys.all(questionnaireId) })
    },
  })
}
```

---

## 4. Create SurveyJS Components

### 4a. Survey Creator — `src/components/survey/SurveyCreatorWidget.tsx`

See the full pattern in [surveyjs.instructions.md](../instructions/surveyjs.instructions.md#survey-creator-widget).

- Accept `questionnaireId: string` and `initialJson?: object` as props.
- Instantiate `SurveyCreator` inside `useState` initialiser (never in render body).
- `saveSurveyFunc` → `updateQuestionnaire(questionnaireId, { surveyJson: creator.JSON })`.
- Import `survey-core/survey-core.css` and `survey-creator-core/survey-creator-core.css`.

### 4b. Survey Renderer — `src/components/survey/SurveyRenderer.tsx`

- Accept `questionnaireId: string`, `surveyJson: object`, and `onComplete?: () => void`.
- Create `Model` inside `useMemo`.
- `model.onComplete.add(sender => submitResponse(questionnaireId, sender.data))`.
- Import `survey-core/survey-core.css`.

### 4c. Survey Dashboard — `src/components/survey/SurveyDashboard.tsx`

- Accept `surveyJson: object` and `responses: object[]`.
- Create `VisualizationPanel` in `useEffect`; call `panel.clear()` in cleanup.
- Render into a `div` via `useRef`.
- Import `survey-analytics/survey.analytics.css`.

---

## 5. Update Root Layout — `src/routes/__root.tsx`

Add a navigation bar with links to `/questionnaires` and `/questionnaires/new`:

```tsx
import { createRootRoute, Link, Outlet } from '@tanstack/react-router'
import { TanStackRouterDevtools } from '@tanstack/react-router-devtools'

export const Route = createRootRoute({
  component: () => (
    <>
      <header className="border-b px-6 py-3 flex items-center gap-6">
        <Link to="/questionnaires" className="font-semibold text-lg">
          Questionnaire Builder
        </Link>
        <nav className="flex gap-4 text-sm">
          <Link to="/questionnaires" activeProps={{ className: 'font-medium' }}>
            My Questionnaires
          </Link>
          <Link to="/questionnaires/new" activeProps={{ className: 'font-medium' }}>
            New
          </Link>
        </nav>
      </header>
      <Outlet />
      <TanStackRouterDevtools />
    </>
  ),
})
```

---

## 6. Redirect Index — `src/routes/index.tsx`

```tsx
import { createFileRoute, redirect } from '@tanstack/react-router'

export const Route = createFileRoute('/')({
  beforeLoad: () => { throw redirect({ to: '/questionnaires' }) },
})
```

---

## 7. Create Route Files

Create each file below. Follow the `createFileRoute` pattern from [`src/routes/index.tsx`](../../src/routes/index.tsx). Use `Route.useParams()` for dynamic segments.

### 7a. `src/routes/questionnaires/index.tsx` — Questionnaire List

- Call `useQuestionnaires()`.
- For each questionnaire render:
  - Title
  - A **Copy link** button: `navigator.clipboard.writeText(window.location.origin + '/take/' + q.id)`
  - A **Results** link: `<Link to="/questionnaires/$id/results" params={{ id: q.id }}>`
  - An **Edit** link: `<Link to="/questionnaires/$id/edit" params={{ id: q.id }}>`
  - A **Delete** button using `useDeleteQuestionnaire()`.
- A **New questionnaire** button linking to `/questionnaires/new`.
- Show loading and error states.

### 7b. `src/routes/questionnaires/new.tsx` — Create New Questionnaire

1. Render a small form (title + optional description) using `@tanstack/react-form`.
2. On submit, call `useCreateQuestionnaire()`, then navigate to `/questionnaires/$id/edit` with the new id.
3. Do **not** embed Survey Creator here — the creator lives in the edit route.

```tsx
import { createFileRoute, useNavigate } from '@tanstack/react-router'
import { useCreateQuestionnaire } from '@/hooks/useQuestionnaires'
// ... form setup
```

### 7c. `src/routes/questionnaires/$id.edit.tsx` — Edit Questionnaire

```tsx
import { createFileRoute } from '@tanstack/react-router'
import { useQuestionnaire } from '@/hooks/useQuestionnaires'
import SurveyCreatorWidget from '@/components/survey/SurveyCreatorWidget'

export const Route = createFileRoute('/questionnaires/$id/edit')({
  component: EditQuestionnaire,
})

function EditQuestionnaire() {
  const { id } = Route.useParams()
  const { data, isLoading } = useQuestionnaire(id)

  if (isLoading) return <p>Loading…</p>
  if (!data) return <p>Not found</p>

  return (
    <SurveyCreatorWidget
      questionnaireId={id}
      initialJson={data.surveyJson}
    />
  )
}
```

### 7d. `src/routes/questionnaires/$id.results.tsx` — Results Dashboard

```tsx
import { createFileRoute } from '@tanstack/react-router'
import { useQuestionnaire } from '@/hooks/useQuestionnaires'
import { useResponses } from '@/hooks/useResponses'
import SurveyDashboard from '@/components/survey/SurveyDashboard'

export const Route = createFileRoute('/questionnaires/$id/results')({
  component: Results,
})

function Results() {
  const { id } = Route.useParams()
  const { data: q } = useQuestionnaire(id)
  const { data: responses = [] } = useResponses(id)

  if (!q) return <p>Loading…</p>

  return (
    <main className="p-6">
      <h1 className="text-2xl font-semibold mb-4">{q.title} — Results</h1>
      <SurveyDashboard surveyJson={q.surveyJson} responses={responses} />
    </main>
  )
}
```

### 7e. `src/routes/take/$id.tsx` — Public Respondent View (no auth)

```tsx
import { createFileRoute } from '@tanstack/react-router'
import { useQuestionnaire } from '@/hooks/useQuestionnaires'
import SurveyRenderer from '@/components/survey/SurveyRenderer'

export const Route = createFileRoute('/take/$id')({
  component: TakeSurvey,
})

function TakeSurvey() {
  const { id } = Route.useParams()
  const { data: q, isLoading } = useQuestionnaire(id)

  if (isLoading) return <p>Loading questionnaire…</p>
  if (!q) return <p>Questionnaire not found.</p>

  return (
    <main className="mx-auto max-w-3xl p-8">
      <SurveyRenderer
        questionnaireId={id}
        surveyJson={q.surveyJson}
      />
    </main>
  )
}
```

---

## 8. After creating all files

1. Run `pnpm dev` — the Vite plugin regenerates `src/routeTree.gen.ts` automatically.
2. Run `pnpm build` and fix any TypeScript errors (unused imports, missing types).
3. Run `pnpm lint:fix`.
4. Confirm these URLs work in the browser:
   - `http://localhost:5173/questionnaires`
   - `http://localhost:5173/questionnaires/new`
   - `http://localhost:5173/questionnaires/<id>/edit`
   - `http://localhost:5173/questionnaires/<id>/results`
   - `http://localhost:5173/take/<id>`

**Never edit `src/routeTree.gen.ts` directly.**
