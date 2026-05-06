# PLAN-17: Full SurveyJS Question Type Support in Visual Builder

**Status**: ✅ Completed 2025-07-05

## Goal

Expand the visual form builder to natively edit every major SurveyJS question type — moving questions out of "Advanced (edit in JSON)" and into first-class visual editors. Multi-page support and survey-level settings (description, progress bar, etc.) are also included.

---

## Background

The current `SUPPORTED_TYPES` in `formBuilder.ts` covers 7 types:

| Type | Visual editor |
|------|--------------|
| `text` | ✅ |
| `comment` | ✅ |
| `radiogroup` | ✅ choices (plain strings only) |
| `checkbox` | ✅ choices (plain strings only) |
| `dropdown` | ✅ choices (plain strings only) |
| `rating` | ✅ min/max only |
| `boolean` | ✅ (no label config) |

Everything else (html, image, expression, matrix, panel, file, signaturepad, tagbox, imagepicker, multipletext, nouislider, paneldynamic, matrixdropdown, matrixdynamic, …) falls through to `AdvancedQuestion` and gets an inline JSON textarea.

Limitations also affecting supported types:
- `radiogroup`/`checkbox`/`dropdown` choices: only plain string labels, no `{ value, text }` pairs, no `showOtherItem`, no `showNoneItem`
- `text`: no `inputType`, `placeholder`, `min`/`max`, `validators`
- `rating`: no `rateStep`, `rateType` (stars/smileys), `minRateDescription`/`maxRateDescription`
- `boolean`: no `labelTrue`/`labelFalse`
- No `description`, `placeholder`, `visibleIf`, `requiredIf`, `enableIf` on any type
- No survey-level settings editor (description, locale, showProgressBar, completedHtml, etc.)
- No multi-page support

---

## Phases

---

### Phase 1: Rich choices editor (value/text pairs + Other/None toggles)

**Status**: ✅ Completed 2025-07-05

**Goal**: Upgrade the choices editor for `radiogroup`, `checkbox`, `dropdown` to support `{ value, text }` pairs and the `showOtherItem`/`showNoneItem` toggles.

**Deliverables**:

- [ ] `BuilderQuestion.choices` type changes from `string[]` to `Array<string | { value: string; text: string }>`
- [ ] `ChoicesEditor` component: two-column table (Value | Label) with add/remove rows; "Use plain strings" toggle switches to simple mode
- [ ] `showOtherItem: boolean` field on `BuilderQuestion` → checkbox in editor
- [ ] `showNoneItem: boolean` field on `BuilderQuestion` (checkbox/radiogroup only)
- [ ] `normaliseChoice` in `parseSurveyJson` preserves `{ value, text }` objects
- [ ] `buildSurveyJson` outputs `{ value, text }` when non-plain, plain string when equal

**Tests**:

- [ ] `parseSurveyJson` round-trips `{ value, text }` choices
- [ ] `buildSurveyJson` outputs plain strings when value === text
- [ ] `ChoicesEditor` renders existing choices, allows edit/add/remove

**Stability Criteria**: All existing 22 `formBuilder.test.ts` tests still pass; new choice tests added.

**Notes**:

---

### Phase 2: Rich `text` question editor

**Status**: ✅ Completed 2025-07-05

**Goal**: Expose the `inputType`, `placeholder`, `min`/`max`/`step`, and `validators` fields for `text` questions.

**Deliverables**:

- [ ] `BuilderQuestion` gains: `inputType?`, `placeholder?`, `min?`, `max?`, `step?`, `validators?: Array<{ type: string }>`
- [ ] `QuestionEditor` shows `inputType` select (text, number, email, date, datetime-local, time, tel, url, password, range, color) when type is `text`
- [ ] `placeholder` text input (shown for text/comment/dropdown)
- [ ] `min`/`max`/`step` number inputs (shown when `inputType` is number/range/date)
- [ ] `validators` checkbox list: email, required (extensible)
- [ ] `parseSurveyJson` maps these fields; `buildSurveyJson` emits them

**Tests**:

- [ ] Round-trip: `inputType: "email"` survives parse → build
- [ ] `QuestionEditor` shows/hides inputType fields correctly

**Stability Criteria**: All tests pass; visual builder can reproduce the `text_email` example from the showcase.

**Notes**:

---

### Phase 3: `boolean` labels + `comment` options + `rating` full config

**Status**: ✅ Completed 2025-07-05

**Goal**: Complete the editors for the three types that already have partial support.

**Deliverables**:

- [ ] `boolean`: add `labelTrue?`/`labelFalse?` text inputs to editor
- [ ] `comment`: add `rows?` (number input), `placeholder?`
- [ ] `rating`: add `rateStep?`, `rateType?` select (numbers/stars/smileys), `minRateDescription?`/`maxRateDescription?`
- [ ] `parseSurveyJson` + `buildSurveyJson` updated for all new fields

**Tests**:

- [ ] Round-trip for each new field
- [ ] `QuestionEditor` renders correct controls per type

**Stability Criteria**: All tests pass.

**Notes**:

---

### Phase 4: New simple types — `tagbox`, `imagepicker`, `multipletext`

**Status**: ✅ Completed 2025-07-05

**Goal**: Promote three currently-Advanced types to first-class visual editors.

**Deliverables**:

- [ ] `tagbox` added to `SUPPORTED_TYPES`; editor reuses `ChoicesEditor` + `showOtherItem`
- [ ] `imagepicker` added; editor: choices table with extra `imageLink` column; `multiSelect` toggle; `imageWidth`/`imageHeight` inputs
- [ ] `multipletext` added; editor: list of sub-items (name, title, isRequired); add/remove rows
- [ ] `parseSurveyJson` + `buildSurveyJson` for all three
- [ ] `TYPE_LABELS` updated

**Tests**:

- [ ] Round-trip for `tagbox`, `imagepicker`, `multipletext`
- [ ] `QuestionEditor` renders correct sub-fields per type

**Stability Criteria**: All tests pass; Showcase JSON loads all three as visual (not Advanced).

**Notes**:

---

### Phase 5: `html` and `expression` display types

**Status**: ✅ Completed 2025-07-05

**Goal**: Promote `html` and `expression` to first-class types with simple editors.

**Deliverables**:

- [ ] `html` added to `SUPPORTED_TYPES`; editor: textarea for `html` content (rendered preview below); no title/required fields
- [ ] `expression` added; editor: `expression` string input, `displayStyle` select, `suffix`/`prefix` inputs; title field kept
- [ ] `parseSurveyJson` + `buildSurveyJson` for both
- [ ] `QuestionList` shows `[HTML]` / `[Expr]` type badge in row label

**Tests**:

- [ ] Round-trip for `html` and `expression`

**Stability Criteria**: All tests pass; Showcase HTML and expression elements load visually.

**Notes**:

---

### Phase 6: Conditional logic fields (`visibleIf`, `requiredIf`, `enableIf`)

**Status**: ✅ Completed 2025-07-05

**Goal**: Add a simple expression editor for conditional logic on every question.

**Deliverables**:

- [ ] `BuilderQuestion` gains `visibleIf?`, `requiredIf?`, `enableIf?` (all `string | undefined`)
- [ ] `QuestionEditor` gains a collapsible "Conditional logic" section with three text inputs and a link to SurveyJS expression docs
- [ ] `parseSurveyJson` + `buildSurveyJson` emit these fields when non-empty
- [ ] No validation of expression syntax (free text)

**Tests**:

- [ ] Round-trip for `visibleIf`/`requiredIf`/`enableIf`
- [ ] Conditional fields are omitted from output when empty

**Stability Criteria**: All tests pass; Showcase conditional questions load with their expressions intact.

**Notes**:

---

### Phase 7: Matrix types (`matrix`, `matrixdropdown`, `matrixdynamic`)

**Status**: ✅ Completed 2025-07-05

**Goal**: Promote the three matrix types to visual editors.

**Deliverables**:

- [ ] `matrix`: editor with rows list (value/text), columns list (value/text)
- [ ] `matrixdropdown`: rows list + columns list with per-column `cellType` select and `choices` (for dropdown columns)
- [ ] `matrixdynamic`: columns list with `cellType` + `rowCount`/`addRowText`/`removeRowText`
- [ ] Shared `MatrixRowsEditor` and `MatrixColumnsEditor` sub-components
- [ ] `parseSurveyJson` + `buildSurveyJson` for all three

**Tests**:

- [ ] Round-trip for `matrix`, `matrixdropdown`, `matrixdynamic`

**Stability Criteria**: All tests pass; Showcase matrix page loads without any Advanced placeholders.

**Notes**:

---

### Phase 8: Panel types (`panel`, `paneldynamic`)

**Status**: ✅ Completed 2025-07-05

**Goal**: Support static and dynamic panels in the visual builder.

**Deliverables**:

- [ ] `panel`: rendered as a collapsible group in `QuestionList`; nested elements use the same `QuestionList` recursively; `title`/`description`/`state` fields in editor
- [ ] `paneldynamic`: flat editor showing `templateElements` as a nested question list; `panelCount`/`minPanelCount`/`maxPanelCount`, `panelAddText`/`panelRemoveText`, `templateTitle` fields
- [ ] `parseSurveyJson` recursively parses nested elements
- [ ] `buildSurveyJson` re-nests correctly

**Tests**:

- [ ] Round-trip for `panel` with nested questions
- [ ] Round-trip for `paneldynamic`

**Stability Criteria**: All tests pass.

**Notes**: This is the most complex phase — nested question lists. Consider a dedicated `PanelEditor` component.

---

### Phase 9: Multi-page support

**Status**: ✅ Completed 2025-07-05

**Goal**: Represent multiple pages in the visual builder instead of flattening to `page1`.

**Deliverables**:

- [ ] `BuilderSurvey.questions` replaced by `BuilderSurvey.pages: BuilderPage[]` where `BuilderPage = { name: string; title?: string; questions: AnyQuestion[] }`
- [ ] `QuestionList` gains a page grouping UI: page headers with rename/add/delete page actions; questions within each page are draggable/reorderable
- [ ] `parseSurveyJson` maps each `pages[]` entry to a `BuilderPage`; flat `elements` format creates a single unnamed page
- [ ] `buildSurveyJson` outputs one page per `BuilderPage`
- [ ] All existing question-level actions (add, move, delete, duplicate) work within and across pages
- [ ] `_rawMeta` page-level fields (page title, `visibleIf`, etc.) preserved

**Tests**:

- [ ] Round-trip: Showcase (10 pages) → parse → build preserves page structure
- [ ] Adding a question to page 2 places it in `pages[1].elements` in output

**Stability Criteria**: All tests pass; switching to JSON mode on Showcase shows the original 10-page structure.

**Notes**: This phase requires refactoring `BuilderSurvey` — all earlier phases must be merged first.

---

### Phase 10: Survey-level settings editor

**Status**: ✅ Completed 2025-07-05

**Goal**: Provide a UI panel to edit common top-level survey settings without touching JSON.

**Deliverables**:

- [ ] `BuilderSurvey` gains `settings?: BuilderSurveySettings` with fields: `description`, `locale`, `showProgressBar` (off/top/bottom/both), `showQuestionNumbers` (on/off/onPage), `checkErrorsMode`, `completedHtml`
- [ ] Collapsible "Survey settings" panel above the question list in the visual editor
- [ ] `parseSurveyJson` reads these fields from `json`; `buildSurveyJson` emits them (they are removed from `_rawMeta` to avoid duplication)
- [ ] `completedHtml` textarea with basic HTML editing

**Tests**:

- [ ] Round-trip: Showcase `showProgressBar: "top"` preserved through parse → build
- [ ] Settings panel renders with correct defaults when fields absent

**Stability Criteria**: All tests pass; Showcase no longer loses `description`/`showProgressBar` etc. when saved from visual mode.

**Notes**: `_rawMeta` already preserves these fields — this phase moves them into managed state so they're editable.

---

## Completion Criteria

- [ ] `pnpm build` clean
- [ ] `pnpm lint` clean
- [ ] All tests pass
- [ ] Showcase JSON (`question-types-showcase.survey.json`) loads in visual builder with zero Advanced placeholders (except `file`, `signaturepad`, `nouislider`, `image` — low-priority types deferred post-plan)
- [ ] CORE-10 JSON round-trips without data loss
- [ ] `AGENTS.md` updated with new supported types and component list
