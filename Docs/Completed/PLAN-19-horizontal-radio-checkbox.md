# PLAN-19: Horizontal Radio / Checkbox Options

**Goal**: Make `radiogroup` and `checkbox` question options render in a compact horizontal row by default, rather than stacking vertically, to reduce the form's vertical footprint.

---

## Background

SurveyJS renders `radiogroup` and `checkbox` items as a vertical list by default (one item per row). There are two native mechanisms to control this:

1. **JSON `colCount` property** — set `"colCount": -1` on a question to force a single row, or `"colCount": 2` / `3` for N-column grids. This is per-question and stored in `surveyJson`.
2. **CSS class `sd-selectbase--row`** — SurveyJS adds this class to the `<fieldset>` when `colCount === -1`, enabling `display: flex; flex-wrap: wrap`. Custom CSS can reinforce or override the gap/alignment.

The cleanest user-facing approach is:
- **Builder default**: pre-set `colCount: -1` for new `radiogroup` and `checkbox` questions so the visual builder outputs horizontal options by default.
- **CSS polish**: add a targeted rule in `survey-theme.css` to control gap and alignment when `sd-selectbase--row` is active.
- **QuestionEditor control**: expose a `colCount` field in the visual builder's `QuestionEditor` for `radiogroup` and `checkbox` types so builders can override the default.

---

## Phase 1: CSS — Polish Horizontal Row Layout

**Status**: ✅ Completed 2026-05-07

**Goal**: Add CSS to `survey-theme.css` so that when SurveyJS renders options in row mode (`sd-selectbase--row`), they look tight and well-aligned.

**Deliverables**:

- [x] In `Frontend/src/components/survey/survey-theme.css`, add rules targeting `.sd-selectbase--row` to set a consistent gap between items and prevent awkward wrapping on small viewports.

- [x] Verify visually in the browser on `/take/:shareToken` and the editor preview with a `radiogroup` or `checkbox` question that has `"colCount": -1`.

**Tests**:

- [x] No logic change — CSS-only. `pnpm build` passes.

**Stability Criteria**: `pnpm build` passes; no TypeScript or lint errors.

**Notes**: Added `.sd-selectbase--row` rules to `survey-theme.css`.

---

## Phase 2: Builder Default — `colCount: -1` for New Radio/Checkbox Questions

**Status**: ✅ Completed 2026-05-07

**Goal**: When a builder adds a new `radiogroup` or `checkbox` question in the visual editor, default `colCount` to `-1` so options render horizontally without any manual JSON editing.

**Deliverables**:

- [x] Added `colCount?: number` to `BuilderQuestion` in `formBuilder.ts`.
- [x] `parseRawElements` reads `colCount` for choice types; `buildElements` emits it when present.
- [x] `handleTypeChange` in `QuestionEditor.tsx` sets `colCount: -1` when switching to `radiogroup`/`checkbox`.

**Files to change**:

| File | Change |
|---|---|
| `Frontend/src/lib/formBuilder.ts` | Emit `colCount: -1` by default for `radiogroup` / `checkbox` types |

**Tests**:

- [x] Added parse/build/round-trip `colCount` cases to `formBuilder.test.ts`; all 234 tests green.

**Stability Criteria**: `pnpm build` passes; existing tests unaffected.

**Notes**: Default `colCount: -1` is set in `handleTypeChange`; no change needed in json.tsx (new questions start as `text` type).

---

## Phase 3: QuestionEditor — `colCount` Field in Visual Builder

**Status**: ✅ Completed 2026-05-07

**Goal**: Expose a `colCount` selector in `QuestionEditor` for `radiogroup` and `checkbox` types so builders can switch between Horizontal (row), 2-column, 3-column, or Default (vertical) layouts without touching JSON.

**Deliverables**:

- [x] In `Frontend/src/components/formBuilder/QuestionEditor.tsx`, added a `<Select>` for `colCount` that appears only when `question.type === 'radiogroup' || question.type === 'checkbox'`.
- [ ] Options:

| Label | `colCount` value |
|---|---|
| Horizontal (row) | `0` (SurveyJS applies `sd-selectbase--row` flex layout) |
| 2 columns | `2` |
| 3 columns | `3` |
| Vertical (default) | `1` (one per row) |

- [x] `colCount?: number` added to `BuilderQuestion`.
- [x] `buildSurveyJson` writes `colCount` when present; `parseSurveyJson` reads it back.

**Files to change**:

| File | Change |
|---|---|
| `Frontend/src/lib/formBuilder.ts` | Add `colCount?: number` to `BuilderQuestion`; read/write in `parseSurveyJson`/`buildSurveyJson` |
| `Frontend/src/components/formBuilder/QuestionEditor.tsx` | Add `colCount` `<select>` for `radiogroup` / `checkbox` |

**Tests**:

- [x] `formBuilder.test.ts`: parse/build/round-trip cases added.
- [x] `QuestionEditor.test.tsx`: `col-count-select` visible for radiogroup/checkbox, hidden for text/dropdown.
- [x] 234 tests pass.

**Stability Criteria**: `pnpm build` and `pnpm lint` pass; `SurveyRenderer` and the take page are unaffected.

**Notes**: `data-testid="col-count-select"` on the `<SelectTrigger>`; default value falls back to `-1` when `colCount` is undefined.

---

## Completion Criteria

- All three phases completed with green tests.
- `pnpm build` and `pnpm lint` pass with zero errors.
- `AGENTS.md` updated if `BuilderQuestion` type is extended.
- This file moved to `Docs/Completed/PLAN-19-horizontal-radio-checkbox.md`.
