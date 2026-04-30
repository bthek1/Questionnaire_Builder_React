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

### 1. Install analytics & PDF packages ✅ Completed
`survey-analytics`, `survey-pdf`, `survey-core` installed in `Frontend/`.

### 2. Build `SurveyDashboard` ✅ Completed
`Frontend/src/components/survey/SurveyDashboard.tsx` — mounts `VisualizationPanel` via `useEffect` with `survey-core` `Model` to extract all questions. Uses `panel.clear()` for cleanup.

### 3. Results route ✅ Completed
`Frontend/src/routes/questionnaires/$id/results.tsx` — header with back link + title, stats bar (response count + last response date), empty state with shareable link CTA, `SurveyDashboard` when responses exist.

### 4. PDF Export button ✅ Completed
`SurveyPDF` instantiated on click with `fontSize` + `margins` options. `haveCommercialLicense` removed (deprecated since v1.9.101 — use `setLicenseKey` instead). Saves as `<title>.pdf`.

### 5. `useResponses` hook ✅ Completed
`Frontend/src/hooks/useResponses.ts` — `responseKeys` factory + `useResponses` query + `useSubmitResponse` mutation.

### 6. Fix `pnpm build` errors ✅ Completed
- Removed `haveCommercialLicense` from `IDocOptions` (no longer in type).
- Added `vitest/globals` to `types` in `tsconfig.app.json` to resolve test-global type errors.

---

## Acceptance Criteria
- [x] `/questionnaires/:id/results` is accessible to the questionnaire owner.
- [x] Charts render for each question type (choice, rating, text).
- [x] Response count and last-response date are shown.
- [x] "Export PDF" downloads a file named after the questionnaire.
- [x] Empty state is shown when no responses exist.
- [x] `pnpm build` passes.

---

## Dependencies
- `survey-analytics`, `survey-pdf` packages.
- `getResponses` in `src/api/responses.ts` — already exists.
- Commercial license key may be required to suppress watermarks — set in component or `main.tsx`.
- See `Docs/SurveyJS/survey-analytics.md` and `Docs/SurveyJS/survey-pdf.md` for detailed API docs.
