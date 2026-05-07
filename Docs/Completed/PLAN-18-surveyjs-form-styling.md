# PLAN-18: SurveyJS Form Styling

**Goal**: Apply a consistent, branded visual theme to SurveyJS forms rendered in the respondent view (`/take/:shareToken`) and the live preview in the JSON editor, using SurveyJS's built-in theming API and optional CSS overrides aligned with the project's Tailwind v4 design tokens.

---

## Background

Currently `SurveyRenderer` imports only `survey-core/survey-core.min.css`, which renders the raw unstyled default skin. SurveyJS ships a proper `defaultV2` theme (flat, modern look) and exposes a full [Theme Editor JSON](https://surveyjs.io/form-library/documentation/manage-default-themes-and-styles) format that can be applied programmatically. The goal is to:

1. Enable the `defaultV2` built-in theme.
2. Override CSS custom properties to match the app's Tailwind v4 colour palette (CSS variables from `index.css`).
3. Optionally allow per-`QuestionnaireType` theme overrides stored in `surveyJson`.

---

## Phase 1: Apply `defaultV2` Built-in Theme

**Status**: ✅ Completed 2026-05-07 with the `defaultV2` theme so forms have a clean, accessible appearance out of the box.

**Deliverables**:

- [ ] In `SurveyRenderer.tsx`, import `survey-core/defaultV2.min.css` instead of `survey-core/survey-core.min.css`.
- [ ] Apply the theme via the `SurveyJS.StylesManager` API (or the newer v2 `themeJson` approach) inside `SurveyRenderer` so the theme is applied globally once on mount.
- [ ] Verify the live preview panel in `questionnaire-types/$id/json.tsx` also picks up the theme (it reuses `SurveyRenderer`).
- [ ] Update `Frontend/src/components/survey/SurveyRenderer.tsx` — no new files needed.

**Implementation notes**:

```tsx
// Option A – CSS import only (simplest, v1 approach)
import 'survey-core/defaultV2.min.css'

// Option B – programmatic (v2 recommended, surveyjs ≥ 1.9)
import { StylesManager } from 'survey-core'
StylesManager.applyTheme('defaultV2')
```

Call `StylesManager.applyTheme` once at module load time (outside the component) so it is not re-applied on every render.

**Tests**:

- [ ] Update `SurveyRenderer` tests (`TakePage.test.tsx`, `JsonEditorPage.test.tsx`) to expect the new CSS import rather than the old one. Because SurveyJS CSS is mocked in Vitest (`vi.mock` or `moduleNameMapper`), only assert that the component renders without crashing — no visual diff needed.
- [ ] Run `pnpm test` — all 213 tests must stay green.

**Stability Criteria**: `pnpm build` and `pnpm lint` pass; no console errors about missing CSS in the browser.

**Notes**: Themes are named exports from `survey-core/themes` (the `./themes/*` subpath is not exported under ESM conditions — individual file imports like `survey-core/themes/default-light` cause Vite errors). CSS base kept as `survey-core/survey-core.min.css`; `defaultV2` theme is applied via `model.applyTheme(DefaultLight)` instead of a CSS import.

---

## Phase 2: Brand-Aligned CSS Variable Overrides

**Status**: ✅ Completed 2026-05-07

**Goal**: Override SurveyJS's `defaultV2` CSS custom properties to match the app's Tailwind v4 colour palette so the survey form visually fits the rest of the UI.

**Deliverables**:

- [ ] Create `Frontend/src/components/survey/survey-theme.css` with CSS custom property overrides scoped to `.sd-root-modern` (the root class `defaultV2` adds to survey forms).
- [ ] Import `survey-theme.css` in `SurveyRenderer.tsx` after the SurveyJS theme CSS.
- [ ] Map the following Tailwind v4 CSS variables (defined in `index.css`) to their SurveyJS equivalents:

| Tailwind var | SurveyJS var | Purpose |
|---|---|---|
| `var(--color-primary)` | `--sjs-primary-backcolor` | Button / active element background |
| `var(--color-primary)` | `--sjs-primary-forecolor` | Button text |
| `var(--color-background)` | `--sjs-general-backcolor` | Form background |
| `var(--color-foreground)` | `--sjs-general-forecolor` | Question text colour |
| `var(--radius)` | `--sjs-corner-radius` | Input / button border radius |
| `var(--color-border)` | `--sjs-border-default` | Input borders |

- [ ] Confirm overrides look correct in the browser on `/take/:shareToken` and the editor preview.

**Tests**:

- [ ] Confirm `SurveyRenderer` snapshot (if any) is updated.
- [ ] Run `pnpm test` — all tests stay green (CSS overrides are import-only, no logic change).

**Stability Criteria**: `pnpm build` passes; no TypeScript or lint errors; visual parity with the rest of the UI colour palette.

**Notes**: Created `Frontend/src/components/survey/survey-theme.css` scoped to `.sd-root-modern`. All Tailwind v4 CSS vars map correctly.

---

## Phase 3: Theme Toggle in the JSON Editor Preview

**Status**: ✅ Completed 2026-05-07

**Goal**: Add a lightweight theme selector in the split-view JSON editor (`questionnaire-types/$id/json.tsx`) so builders can preview their form in different SurveyJS themes before publishing.

**Deliverables**:

- [ ] Add a `<Select>` component above the live preview panel with options: `defaultV2` (default), `modern`, `plain` (no theme).
- [ ] Pass the selected theme name as a prop to `SurveyRenderer` (`theme?: string`).
- [ ] Inside `SurveyRenderer`, call `StylesManager.applyTheme(theme ?? 'defaultV2')` when the prop changes (use `useEffect` with `theme` in the dependency array).
- [ ] Persist the selected theme in `localStorage` under the key `surveyPreviewTheme` so it survives page refreshes.
- [ ] The `theme` prop is optional — `SurveyRenderer` used on `/take/:shareToken` keeps using `defaultV2` (the default) and is unaffected.

**Tests**:

- [ ] Add a test to `JsonEditorPage.test.tsx` that asserts the theme `<Select>` is visible and that changing it re-renders the preview.
- [ ] Run `pnpm test` — all tests green.

**Stability Criteria**: `pnpm build` passes; no new TypeScript errors; `SurveyRenderer` contract is backward-compatible (prop is optional).

**Notes**: `localStorage.getItem` wrapped in try/catch — jsdom test environment doesn't have a URL set so localStorage throws; the guard keeps all 14 existing JsonEditorPage tests green.

---

## Phase 4: Per-Survey Theme via `surveyJson`

**Status**: ✅ Completed 2026-05-07

**Goal**: Allow a builder to embed a `themeJson` block in the survey definition so that when the survey is taken, the custom theme is applied automatically. This unlocks per-form branding without any UI changes to the respondent view.

**Deliverables**:

- [ ] Extend `SurveyRenderer` to detect a top-level `themeJson` key in `surveyJson` and apply it via `survey.applyTheme(themeJson)` (SurveyJS v2 API).
- [ ] Document the `themeJson` shape in `.github/instructions/survey-json.instructions.md`.
- [ ] Add a note to the JSON editor help text: "Add a `themeJson` object to customise the form's visual theme."
- [ ] Add a link to the [SurveyJS Theme Editor](https://surveyjs.io/create-free-survey) so builders can generate a `themeJson` externally.

**Tests**:

- [ ] Add a test in `TakePage.test.tsx` that passes a `surveyJson` with a `themeJson` block and asserts `survey.applyTheme` is called.
- [ ] Run `pnpm test` — all tests green.

**Stability Criteria**: `pnpm build` passes; existing forms without `themeJson` are unaffected.

**Notes**: `surveyJson.themeJson` detected in the `useMemo` block; cast to `SurveyTheme` for `model.applyTheme()`. Tested in `SurveyRenderer.test.tsx`.

---

## Completion Criteria

- All four phases completed with green tests.
- `pnpm build` and `pnpm lint` pass with zero errors.
- `AGENTS.md` updated: `SurveyRenderer` entry updated to mention theme prop and `themeJson` support.
- `.github/instructions/surveyjs.instructions.md` updated with the CSS import convention and theme application pattern.
- This file moved to `Docs/Completed/PLAN-18-surveyjs-form-styling.md`.
