# PLAN-07 — Frontend UX Refresh: JSON Editor, Share Links, Responses Viewer

## Goal

Deliver three focused frontend improvements:

1. **JSON Editor page** — view, edit, create, and delete the raw `surveyJson` for any questionnaire.
2. **Share Links page** — generate and copy shareable respondent URLs for every questionnaire.
3. **Responses Viewer page** — list all raw response records submitted for a questionnaire.

All pages connect to the backend at **`http://192.168.2.28:8000`** via the `VITE_API_BASE_URL` env var.

---

## Prerequisites / Current State

| Item | Status |
|------|--------|
| TanStack Router file-based routes in `Frontend/src/routes/` | ✅ in place |
| `apiClient` (Axios) reads `VITE_API_BASE_URL` from env | ✅ in place |
| `useQuestionnaires`, `useDeleteQuestionnaire`, `useCreateQuestionnaire`, `useUpdateQuestionnaire` hooks | ✅ in place |
| `useResponses` hook (`getResponses`) | ✅ in place |
| `GET /questionnaires/`, `POST`, `PATCH :id/`, `DELETE :id/` API functions | ✅ in place |
| `GET /questionnaires/:id/responses/` API function | ✅ in place |
| Backend running at `http://192.168.2.28:8000` | assumed running |

---

## Phase 1: Point frontend at the real backend

**Status**: ✅ Completed 2026-04-30

**Goal**: Change `VITE_API_BASE_URL` so every API call hits `http://192.168.2.28:8000/api`.

**Deliverables**:

- [ ] Create (or update) `Frontend/.env` to set:
  ```
  VITE_API_BASE_URL=http://192.168.2.28:8000/api
  ```
- [ ] Confirm the Axios `baseURL` already reads `import.meta.env.VITE_API_BASE_URL ?? '/api'` (no code change needed if it does).
- [ ] Confirm CORS is enabled on the Django backend for `http://localhost:5173` (document; fix backend if not).

**Tests**:

- [ ] Manually verify `pnpm dev` → questionnaires list loads data from `192.168.2.28:8000`.

**Stability Criteria**: Dev server starts; no CORS errors in browser console; questionnaire list renders real data.

**Notes**:

---

## Phase 2: JSON Editor Page (`/questionnaires/:id/json`)

**Status**: ✅ Completed 2026-04-30

**Goal**: A dedicated route that displays the raw `surveyJson` for a questionnaire in a `<textarea>`, lets the user edit it as plain JSON, and saves it via `PATCH /questionnaires/:id/`.

### Route

```
Frontend/src/routes/questionnaires/$id/json.tsx
```

### UI layout

```
┌─────────────────────────────────────────────────┐
│ ← Back to list          [title]          [Save] │
├─────────────────────────────────────────────────┤
│  <textarea rows=30>                             │
│    { "pages": [ … ] }                           │
│  </textarea>                                    │
│                                                 │
│  [Parse error banner if JSON is invalid]        │
└─────────────────────────────────────────────────┘
```

**Deliverables**:

- [ ] New route file `Frontend/src/routes/questionnaires/$id/json.tsx` exporting `Route` via `createFileRoute('/questionnaires/$id/json')`.
- [ ] Uses `useQuestionnaire(id)` to load current `surveyJson`.
- [ ] Textarea initialised with `JSON.stringify(surveyJson, null, 2)`.
- [ ] Inline JSON validation: if the textarea content is not parseable, show an error and disable Save.
- [ ] On Save: calls `useUpdateQuestionnaire` mutation with `{ surveyJson: parsed }`, shows success feedback.
- [ ] "Back" link to `/questionnaires`.
- [ ] Add an "Edit JSON" button/link on the questionnaires list page (`/questionnaires/index.tsx`) pointing to this route.
- [ ] Create button on this page: if navigated to `/questionnaires/new-json`, renders an empty editor that calls `useCreateQuestionnaire` on save, then redirects to the new id's edit-json page. _(Optional — create questionnaires already possible via `/questionnaires/new`; skip if not needed.)_

**Tests**:

- [ ] `Frontend/src/test/JsonEditorPage.test.tsx`:
  - Renders textarea pre-filled with existing `surveyJson`.
  - Save button disabled when JSON is invalid.
  - Calls `updateQuestionnaire` with parsed JSON on valid save.

**Stability Criteria**: `pnpm build` passes; new route renders; save round-trip works against the real backend.

**Notes**:

---

## Phase 3: Share Links Page (`/questionnaires/share`)

**Status**: ✅ Completed 2026-04-30

**Goal**: A dedicated page listing all questionnaires with their shareable respondent URL and a one-click copy button.

### Route

```
Frontend/src/routes/questionnaires/share.tsx
```

### UI layout

```
┌──────────────────────────────────────────────────────────┐
│  Share Questionnaire Links                               │
├──────────────────────────────────────────────────────────┤
│  Title                │  Respondent URL           │  Copy│
│  ─────────────────────│───────────────────────────│──────│
│  My Survey            │  http://…/take/abc123     │  [📋]│
│  Exit Poll            │  http://…/take/def456     │  [📋]│
└──────────────────────────────────────────────────────────┘
```

**Deliverables**:

- [ ] New route `Frontend/src/routes/questionnaires/share.tsx` exporting `Route` via `createFileRoute('/questionnaires/share')`.
- [ ] Uses `useQuestionnaires()` to list all questionnaires.
- [ ] For each questionnaire computes `shareUrl = window.location.origin + '/take/' + q.id`.
- [ ] Displays the URL in a read-only `<input>` (or truncated `<span>`).
- [ ] Uses existing `<CopyButton>` primitive (or inline `navigator.clipboard.writeText`) to copy the full URL.
- [ ] "Back to list" link.
- [ ] Add a "Share Links" nav entry or button in the root layout / questionnaires list page.

**Tests**:

- [ ] `Frontend/src/test/ShareLinksPage.test.tsx`:
  - Renders a row per questionnaire.
  - Copy button triggers `navigator.clipboard.writeText` with the correct URL.

**Stability Criteria**: `pnpm build` passes; page renders correct URLs; copy works in the browser.

**Notes**:

---

## Phase 4: Responses Viewer Page (enhance `/questionnaires/:id/results`)

**Status**: ✅ Completed 2026-04-30

**Goal**: Display a plain table of every raw response record for a questionnaire so the owner can review individual submissions without needing the SurveyJS analytics panel.

### Changes

Augment the existing `Frontend/src/routes/questionnaires/$id/results.tsx` with a collapsible "Raw Responses" section **below** the existing `SurveyDashboard`.  
Alternatively, add a new sub-tab — keep both options open during implementation.

### UI layout (raw responses table)

```
┌──────────────────────────────────────────────────────┐
│  Raw Responses (N)              [▼ Expand / Collapse]│
├──────────────────────────────────────────────────────┤
│  #  │  Submitted At        │  Answers (JSON preview) │
│  1  │  2026-04-30 14:22    │  { "q1": "Yes", … }    │
│  2  │  2026-04-29 09:01    │  { "q1": "No",  … }    │
└──────────────────────────────────────────────────────┘
```

**Deliverables**:

- [ ] Collapsible `<RawResponsesTable>` component in `Frontend/src/components/questionnaire/RawResponsesTable.tsx`.
  - Props: `responses: QuestionnaireResponse[]`.
  - Each row: response number, `submittedAt` formatted as local date+time, `answers` stringified and truncated to 120 chars with a "View full" expand toggle.
- [ ] Import and render `<RawResponsesTable>` in `results.tsx` below the dashboard.
- [ ] Uses `useResponses(id)` (already in place).

**Tests**:

- [ ] `Frontend/src/test/RawResponsesTable.test.tsx`:
  - Renders correct row count.
  - Answers column truncates long JSON strings.
  - "View full" toggle shows complete JSON.

**Stability Criteria**: `pnpm build` passes; responses table renders real data from `192.168.2.28:8000`.

**Notes**:

---

## Phase 5: Final verification

**Status**: ✅ Completed 2026-04-30

**Goal**: End-to-end smoke test and build clean-up.

**Deliverables**:

- [ ] `pnpm build` exits 0 with no TypeScript errors.
- [ ] `pnpm lint` exits 0 with no ESLint warnings.
- [ ] `pnpm test` passes all unit tests.
- [ ] Manual browser check: JSON editor → save → reload shows updated JSON.
- [ ] Manual browser check: Share Links page → copy → paste URL in new tab → survey renders.
- [ ] Manual browser check: Results page → Raw Responses table shows submitted data.
- [ ] Update `AGENTS.md` route table to include `/questionnaires/share` and `/questionnaires/$id/json`.

**Stability Criteria**: All three checks above pass against `http://192.168.2.28:8000`.

**Notes**:
