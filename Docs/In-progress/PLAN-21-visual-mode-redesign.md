# PLAN-21 — Visual Mode Redesign: JSON as Single Source of Truth

## Context & Problem

The current visual builder (`PLAN-16`) works by **parsing** the raw `surveyJson` into an
intermediate `BuilderSurvey` tree, letting the user edit it via form controls, then **rebuilding**
the JSON from that tree on save or mode switch.

This round-trip architecture has a fundamental flaw: the builder only knows about the properties
it explicitly handles. Any SurveyJS property that is not mapped in `formBuilder.ts`
(conditional logic expressions, calculated values, triggers, custom validators, page-level
settings, theme JSON, etc.) must be stored in escape hatches (`_rawExtra`, `_rawMeta`) and
rebuilt. This is fragile — any gap in the mapping silently mutates the JSON the user wrote.

**Goal of this plan**: make visual mode a **transparent read layer** over the JSON.

---

## Core Design Principles

| Principle | Meaning |
|-----------|---------|
| **JSON is the single source of truth** | The raw `surveyJson` object is never modified by anything other than an explicit user action |
| **Visual mode is a view, not a transform** | The visual editor reads from the JSON directly; it never has its own parallel state that can diverge |
| **Edits are surgical patches** | Every visual UI action produces a minimal targeted patch to the JSON (e.g. `set pages[0].elements[1].title = "..."`) — not a full rebuild |
| **Unknown properties are invisible, never dropped** | Properties the visual layer does not know about are simply not shown, but are preserved exactly because they come from and go back to the same JSON object |
| **No lossy round-trips** | Switching between Visual ↔ JSON modes does not change the JSON in any way |

---

## Architecture Change

### Current (PLAN-16)

```
surveyJson (object)
    │  parseSurveyJson()
    ▼
BuilderSurvey (intermediate state)   ◄──  user edits via React components
    │  buildSurveyJson()
    ▼
surveyJson (rebuilt — may differ from original)
```

### New (PLAN-21)

```
surveyJson (object) ◄──────────────────────────────────────────┐
    │                                                            │
    │  read-only traversal (no copy, no transform)              │ targeted patch
    ▼                                                            │
Visual layer (React components derive display-only values)   user edits one field at a time
    │
    │  reads, never owns
    ▼
Live preview (SurveyRenderer) — same surveyJson, no rebuild needed
```

Key implications:

- `parseSurveyJson` / `buildSurveyJson` / `BuilderSurvey` types are **no longer part of the
  save pipeline** — they may be kept as utilities for reading display values but must never
  be used to produce the saved JSON.
- The JSON `text` state (currently used only in JSON mode) becomes the **single shared state**
  for both modes.
- Visual mode components receive a parsed `object` (the live JSON) and a setter that applies a
  patch; they never hold their own copy.

---

## Phase 1 — Shared JSON State & Read-Only Visual Scaffold

**Status**: Not started

**Goal**: Establish a single `surveyJson` state used by both modes; visual mode renders a
read-only structural outline of the survey (title, pages, question names/types) without any
editing capability yet.

**Deliverables**:

- [ ] Replace the dual `text` + `builderSurvey` states in `json.tsx` with a single
      `surveyJsonText: string` state (the canonical source). Both modes read from the same
      parsed value.
- [ ] Add a pure helper `patchSurveyJson(json, path, value)` in `lib/surveyPatch.ts` that
      returns a new JSON object with one field updated at the given dot-notation or index path,
      leaving all other fields untouched.
- [ ] Visual mode renders a structural outline: survey title (read-only label), list of pages,
      list of element names and types per page. No editing controls yet.
- [ ] Switching Visual ↔ JSON no longer calls `parseSurveyJson` / `buildSurveyJson`. The
      text in the JSON editor and the object driving the visual view are always the same.
- [ ] Add unit tests for `patchSurveyJson` covering: nested objects, array indices,
      preserving sibling keys, no-op when value is unchanged.

**Tests**:

- [ ] `surveyPatch.test.ts` — at least 10 cases covering all patch scenarios
- [ ] Update `JsonEditorPage.test.tsx` — mode-switch must not change the JSON string

**Stability Criteria**: `pnpm test` passes; switching modes leaves JSON identical.

**Notes**:

---

## Phase 2 — Surgical Edit Actions for Common Properties

**Status**: Not started

**Goal**: Re-implement the most commonly edited properties as surgical patch actions so the
visual layer can actually edit them without rebuilding the whole JSON.

**Deliverables**:

- [ ] Survey-level patches: `title`, `description`, `locale`, `showProgressBar`,
      `showQuestionNumbers`, `completedHtml` (each field gets a dedicated input that calls
      `patchSurveyJson`).
- [ ] Page-level patches: page `title`, add page (appends a new `{ name, elements: [] }` object
      to the `pages` array), delete page (splices the array), reorder pages (swap).
- [ ] Element-level patches for `BuilderQuestion`-mapped types: `title`, `isRequired`,
      `description`, `visibleIf` for any element type; type-specific common properties (choices
      list, rateMin/rateMax, inputType, etc.) via the existing `QuestionEditor` inputs — but
      each input now writes directly to the JSON via `patchSurveyJson` instead of updating
      `BuilderSurvey`.
- [ ] Add element, delete element, reorder elements — array splice helpers in `surveyPatch.ts`.
- [ ] Advanced / unknown element types show a read-only badge with their `type` and `name`;
      all their properties are shown as a collapsible raw-property list (key → value, read-only).
      No editing offered; no data dropped.
- [ ] Unknown properties on known elements (anything not in the visual controls) are shown in a
      collapsed "Other properties" section (key → value, read-only). Editing them is done via
      the JSON editor.

**Tests**:

- [ ] Extend `surveyPatch.test.ts` — array splice cases (add/delete/reorder elements and pages)
- [ ] Update `JsonEditorPage.test.tsx` — editing title, required toggle, choices update the
      JSON text without altering unrelated properties

**Stability Criteria**: `pnpm test` passes; editing a question title does not change any
other field in the JSON output.

**Notes**:

---

## Phase 3 — Mode Switch Integrity & UX Polish

**Status**: Not started

**Goal**: Guarantee that switching modes never mutates the JSON, and polish the visual
mode UI to clearly communicate what it can and cannot edit.

**Deliverables**:

- [ ] Add a `jsonBeforeSwitch` snapshot comparison in tests: `JSON.stringify` before and after
      switching Visual → JSON → Visual must be identical (modulo re-serialisation whitespace).
- [ ] Visual mode header: add a small info badge "Unknown properties are preserved but not
      shown here. Use JSON mode to edit them." (only shown when the survey contains properties
      outside the known set).
- [ ] Remove `_rawExtra` and `_rawMeta` escape-hatch fields from `BuilderSurvey` and
      `BuilderQuestion` — they are no longer needed because the visual layer no longer rebuilds
      the JSON.
- [ ] Keep `parseSurveyJson` / `buildSurveyJson` / `BuilderSurvey` in `formBuilder.ts` for
      backwards-compatibility with existing tests, but mark them `@deprecated` with a JSDoc
      comment explaining they are no longer part of the save pipeline.
- [ ] `pnpm lint` passes with no new warnings.

**Tests**:

- [ ] Round-trip test: a survey JSON containing SurveyJS properties not mapped by the builder
      (e.g. `triggers`, `calculatedValues`, `logo`, nested `defaultValueExpression` inside
      panels) emerges identical after: load → switch to visual → switch to JSON.
- [ ] Visual mode "Other properties" section is present when unknown props exist.

**Stability Criteria**: `pnpm build && pnpm test && pnpm lint` all pass.

**Notes**:

---

## Phase 4 — Cleanup & Documentation

**Status**: Not started

**Goal**: Remove dead code, update docs, and ensure all tests are green.

**Deliverables**:

- [ ] Remove the `AdvancedQuestion` / `_advanced` branching code from `json.tsx` visual render
      path — replaced by the read-only badge from Phase 2.
- [ ] Update `AGENTS.md` — replace the description of the current visual builder architecture
      with the new patch-based model.
- [ ] Update `.github/instructions/surveyjs.instructions.md` if it references the old
      parse/build pipeline.
- [ ] `pnpm coverage` — ensure no coverage regression vs. current baseline (279 tests).

**Tests**:

- [ ] All 279+ existing tests pass.
- [ ] No new `@ts-ignore` or `eslint-disable` lines added.

**Stability Criteria**: `pnpm build && pnpm test && pnpm lint` all pass; coverage ≥ baseline.

**Notes**:

---

## Files Affected

| File | Change |
|------|--------|
| `Frontend/src/routes/questionnaire-types/$id/json.tsx` | Replace dual state with single JSON state; wire visual controls to patch helper |
| `Frontend/src/lib/surveyPatch.ts` | **New** — `patchSurveyJson`, array splice helpers |
| `Frontend/src/lib/formBuilder.ts` | Mark `parseSurveyJson`, `buildSurveyJson`, `BuilderSurvey` as `@deprecated`; remove `_rawExtra`/`_rawMeta` from types |
| `Frontend/src/components/formBuilder/QuestionEditor.tsx` | Receive `(json, path, onChange)` instead of `(question, onChange)` |
| `Frontend/src/components/formBuilder/QuestionList.tsx` | Receive page element array from JSON; patch on reorder/add/delete |
| `Frontend/src/components/formBuilder/SurveyTitleEditor.tsx` | Patch survey-level fields directly |
| `Frontend/src/test/surveyPatch.test.ts` | **New** |
| `Frontend/src/test/JsonEditorPage.test.tsx` | Add round-trip & no-mutation assertions |

---

## What Is NOT Changing

- The JSON editor (Monaco) in JSON mode — unchanged.
- The live `SurveyRenderer` preview — unchanged.
- The save path (`PATCH /questionnaire-types/:id`) — unchanged.
- The `QuestionnaireType.surveyJson` field type (`object`) — unchanged.
- Backend, migrations, serializers — untouched.
