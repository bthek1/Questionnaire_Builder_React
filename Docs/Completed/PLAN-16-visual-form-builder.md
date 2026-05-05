# PLAN-16: Visual Form Builder (React UI Toggle)

**Feature summary**: Replace the raw JSON textarea in the questionnaire type editor with a friendly React UI form builder. A toggle bar lets the author switch between "Visual" mode (React-driven question editor) and "JSON" mode (existing textarea). Both modes read and write the same `surveyJson` object — the toggle is purely a view switch with no data loss.

---

## Background

The current editor (`/questionnaire-types/:id/json`) has:

- **Left pane** — plain `<Textarea>` for raw JSON editing
- **Right pane** — live `<SurveyRenderer>` preview

Raw JSON is powerful but hostile to non-technical authors. Adding a Visual mode lets anyone build a questionnaire without touching JSON, while keeping JSON mode available for power users who need calculated values, conditional logic, or custom properties.

`survey-creator-react` was deliberately removed in PLAN-08 (commercial EULA). This plan builds a **bespoke React UI** on top of `survey-core` primitives — no new commercial packages.

---

## Design Decisions

| Decision | Rationale |
|----------|-----------|
| Toggle, not separate route | No URL change; both modes share the same save / rename toolbar |
| React state owns the `surveyJson` object | Toggle only switches the rendering view; JSON ↔ object round-trips happen on tab switch |
| Visual mode writes a **subset** of SurveyJS JSON | Support: `text`, `rating`, `radiogroup`, `checkbox`, `dropdown`, `comment`, `boolean`. Power features (matrices, panels, calculated values, conditionals) remain JSON-only |
| No drag-and-drop in Phase 1 | Keeps scope small; reorder via up/down buttons instead |
| Preview pane unchanged | `SurveyRenderer` already works; no changes needed |

---

## Data Contract

Both modes operate on the same in-memory `surveyJson: object`. The Visual editor reads/writes a typed intermediate representation:

```ts
// lib/formBuilder.ts
export type FieldType =
  | 'text' | 'rating' | 'radiogroup' | 'checkbox'
  | 'dropdown' | 'comment' | 'boolean'

export interface BuilderQuestion {
  name: string        // unique key → surveyJson question name
  title: string       // display label
  type: FieldType
  required: boolean
  choices?: string[]  // for radiogroup / checkbox / dropdown
  rateMin?: number    // for rating
  rateMax?: number    // for rating
}

export interface BuilderSurvey {
  title: string
  questions: BuilderQuestion[]
}

// surveyJson → BuilderSurvey (best-effort; drops unsupported props)
export function parseSurveyJson(json: object): BuilderSurvey

// BuilderSurvey → surveyJson (minimal valid SurveyJS JSON)
export function buildSurveyJson(survey: BuilderSurvey): object
```

Unsupported question types (e.g. `matrix`, `paneldynamic`) are preserved as-is in the `surveyJson` and shown as read-only "Advanced question" placeholders in Visual mode so they are not accidentally discarded.

---

## Phases

---

## Phase 1: Data layer — `lib/formBuilder.ts` + unit tests

**Status**: ✅ Completed 2026-05-05

**Goal**: Pure conversion utilities between SurveyJS JSON and `BuilderSurvey`. No UI yet.

**Deliverables**:

- [x] `Frontend/src/lib/formBuilder.ts` — `parseSurveyJson`, `buildSurveyJson`, types
- [x] `Frontend/src/test/formBuilder.test.ts` — unit tests covering:
  - Round-trip: `buildSurveyJson(parseSurveyJson(json))` equals original for supported types
  - Unsupported types (e.g. `matrix`) are preserved under a `_advanced` bucket
  - Empty survey produces valid minimal JSON `{ "pages": [{ "name": "page1", "elements": [] }] }`
  - Choices parsing: bare strings and `{ value, text }` objects both handled

**Tests**:

- [ ] All cases above in `formBuilder.test.ts`

**Stability Criteria**: `pnpm test` green with formBuilder tests passing.

**Notes**: —

---

## Phase 2: Visual question editor components

**Status**: ✅ Completed 2026-05-05

**Goal**: Build the question-list UI and per-question editor panel. No toggle integration yet — render standalone for easy development.

**Deliverables**:

- [x] `Frontend/src/components/formBuilder/QuestionList.tsx` — ordered list of questions with Add / Delete / Move-up / Move-down actions
- [x] `Frontend/src/components/formBuilder/QuestionEditor.tsx` — inline editor for a single `BuilderQuestion`:
  - Fields: `title`, `type` (Select), `required` (checkbox), `choices` (textarea, newline-separated, shown only when type ∈ {radiogroup, checkbox, dropdown}), `rateMin` / `rateMax` (shown only for `rating`)
- [x] `Frontend/src/components/formBuilder/SurveyTitleEditor.tsx` — editable survey title (top of visual pane)
- [x] `Frontend/src/components/formBuilder/AdvancedQuestionPlaceholder.tsx` — read-only card shown for unsupported question types; displays the question's `name` and `type`; warns "Edit in JSON mode"
- [x] `Frontend/src/components/formBuilder/index.ts` — barrel export

**Tests**:

- [x] `Frontend/src/test/QuestionList.test.tsx` — renders questions; add / delete / reorder callbacks fire
- [x] `Frontend/src/test/QuestionEditor.test.tsx` — type change shows/hides choices & rate fields; onChange fires with updated question

**Stability Criteria**: `pnpm test` green.

**Notes**: —

---

## Phase 3: Toggle integration into the editor page

**Status**: ✅ Completed 2026-05-05

**Goal**: Wire the Visual components into `json.tsx` behind a "Visual / JSON" toggle. Both modes share the same `surveyJson` state; switching tabs converts between JSON string and `BuilderSurvey` in memory.

**Deliverables**:

- [x] Toggle bar in `json.tsx` — pill tabs: `Visual` | `JSON`. Sits above the left pane only; preview pane is unaffected.
- [x] State machine:
  - Active mode stored in `useState<'visual' | 'json'>('visual')`
  - Switching **JSON → Visual**: parse `text` (if valid) → `parseSurveyJson` → populate visual state. If JSON is currently invalid, show a warning toast and keep JSON mode.
  - Switching **Visual → JSON**: `buildSurveyJson(builderSurvey)` → `JSON.stringify(..., null, 2)` → update `text` and `previewJson`
- [x] Visual pane renders `SurveyTitleEditor` + `QuestionList` + `QuestionEditor` for the selected question
- [x] Save button works identically in both modes (serialises whatever is current)
- [x] `data-testid="editor-mode-toggle"` on the toggle container for testability

**Tests**:

- [ ] `Frontend/src/test/JsonEditorPage.test.tsx` — extend existing tests:
  - Toggle renders with "Visual" and "JSON" labels
  - Default mode is Visual
  - Switching to JSON shows textarea; switching back to Visual hides it
  - Invalid JSON while in JSON mode: switching to Visual shows an error, does not crash

**Stability Criteria**: `pnpm test` green; `pnpm build` passes; `pnpm lint` clean.

**Notes**: —

---

## Phase 4: Polish & edge cases

**Status**: ✅ Completed 2026-05-05

**Goal**: Usability improvements and guard rails.

**Deliverables**:

- [ ] Auto-generate unique `name` for new questions (`q1`, `q2`, … checking for collisions)
- [ ] Warn when two questions share the same `name` (inline validation in `QuestionEditor`)
- [ ] "Advanced question" placeholder shows a "Delete" button (removes it from the JSON entirely)
- [ ] Keyboard shortcut `Ctrl+S` / `Cmd+S` saves in both modes
- [ ] Empty-state illustration when no questions exist yet ("Add your first question")
- [ ] `pnpm build` + `pnpm lint` clean

**Tests**:

- [ ] Unique name generation unit test in `formBuilder.test.ts`
- [ ] Duplicate name validation renders error in `QuestionEditor.test.tsx`

**Stability Criteria**: `pnpm build` clean, `pnpm lint` clean, `pnpm test` green.

**Notes**: —

---

## Out of scope (future plans)

- Drag-and-drop reordering
- Multi-page surveys in Visual mode
- Conditional logic (`visibleIf`, `enableIf`) in Visual mode
- `calculatedValues` editor in Visual mode
- Theme / branding editor
- `survey-creator-react` (commercial, removed in PLAN-08)

---

## File Inventory (new files introduced by this plan)

| File | Purpose |
|------|---------|
| `Frontend/src/lib/formBuilder.ts` | Pure JSON ↔ BuilderSurvey conversion |
| `Frontend/src/test/formBuilder.test.ts` | Unit tests for conversion utilities |
| `Frontend/src/components/formBuilder/QuestionList.tsx` | Ordered question list |
| `Frontend/src/components/formBuilder/QuestionEditor.tsx` | Per-question inline editor |
| `Frontend/src/components/formBuilder/SurveyTitleEditor.tsx` | Survey title field |
| `Frontend/src/components/formBuilder/AdvancedQuestionPlaceholder.tsx` | Read-only card for unsupported types |
| `Frontend/src/components/formBuilder/index.ts` | Barrel export |

**Modified files**:

- `Frontend/src/routes/questionnaire-types/$id/json.tsx` — toggle + Visual pane wired in (Phase 3)
- `Frontend/src/test/JsonEditorPage.test.tsx` — extended with toggle tests (Phase 3)
