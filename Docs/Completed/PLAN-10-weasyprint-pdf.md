# PLAN-10: WeasyPrint PDF Generation

**Feature**: Server-side PDF export for questionnaire responses using WeasyPrint, with styling aligned to the Recovery Metrics frontend theme. The same endpoint can later be called by CRM integrations.

---

## Background

The current client-side PDF (`jsPDF` text dump) has poor layout and no visual branding. WeasyPrint renders an HTML+CSS template server-side into a proper, styled PDF. The frontend simply fetches the URL — identical UX to the current button, but better output.

**Frontend brand tokens** (from `Frontend/src/index.css`):

| Token | Value | Usage |
|-------|-------|-------|
| `--color-primary` | `#002738` | Deep Navy — headings, borders |
| `--color-primary-foreground` | `#FFF4E5` | Warm White — text on dark bg |
| `--color-background` | `#F5F5F5` | Page canvas |
| `--color-foreground` | `#002738` | Body text |
| `--color-muted` | `#e0e6e7` | Surface/section bg |
| `--color-muted-foreground` | `#5b6268` | Secondary text |
| `--color-footer` | `#00354D` | Dark Teal |
| Font stack | `system-ui, -apple-system, 'Segoe UI', Roboto, Helvetica Neue, Arial, sans-serif` | |

---

## Phase 1: Install WeasyPrint & smoke test

**Status**: Complete

**Goal**: Confirm WeasyPrint is installable in the backend venv and can render a minimal HTML document to PDF bytes.

**Deliverables**:

- [x] Install `weasyprint` in `Backend/` venv: `uv add weasyprint` (weasyprint==68.1)
- [x] Add `weasyprint` to `Backend/pyproject.toml` dependencies
- [x] Run a smoke-test script (`Backend/scripts/test_weasyprint.py`) that renders `<h1>Hello</h1>` and writes `test.pdf`
- [x] Confirm system libs (`pango`, `cairo`, `gdk-pixbuf`) are present (WeasyPrint logs warnings if not)

**Tests**:

- [x] Smoke-test script exits 0 and produces a non-empty `test.pdf`

**Stability Criteria**: `python Backend/scripts/test_weasyprint.py` runs without error and produces a valid PDF.

**Notes**:

---

## Phase 2: HTML template + CSS

**Status**: Complete

**Goal**: Create a Jinja2/Django HTML template that renders a questionnaire response in the Recovery Metrics brand style, matching the frontend design tokens.

**Deliverables**:

- [x] `Backend/questionnaires/templates/questionnaires/response_pdf.html`  
  Structure:
  - Header bar: `#002738` background, questionnaire title in `#FFF4E5`, submitted date
  - Per-question block: question title in `#002738` bold, answer in `#5b6268`, light `#e0e6e7` background card
  - Footer bar: `#00354D` background, "Recovery Metrics" text in `#FFF4E5`, page number via `@page` CSS counter
- [x] Inline CSS (WeasyPrint does not fetch external URLs by default) using the brand palette above
- [x] `@page` rule: A4, 15mm margins, running footer with page counter
- [x] Template context variables: `questionnaire` (title, description), `response` (answers dict), `questions` (list of `{name, title, display_value}` dicts — pre-processed in the view)

**Tests**:

- [x] Unit test: render the template with mock context and assert the output HTML contains the questionnaire title and at least one question title (`TestResponsePdfTemplate`)
- [x] Visual smoke test: manually open the generated PDF and verify layout

**Stability Criteria**: Template renders without error with representative SurveyJS data (text, radio, checkbox, date question types).

**Notes**:

---

## Phase 3: Django view & URL

**Status**: Complete

**Goal**: Add a `GET /api/questionnaires/:id/responses/:responseId/pdf/` endpoint that returns the PDF as a file download.

**Deliverables**:

- [x] New view `ResponsePdfView(APIView)` in `Backend/questionnaires/views.py`
  - Fetches `Questionnaire` and `QuestionnaireResponse` by IDs
  - Iterates `survey_json` pages/elements to extract questions in order, resolving `choices` labels for choice-based questions
  - Renders `response_pdf.html` template with context
  - Passes rendered HTML to `weasyprint.HTML(string=html).write_pdf()`
  - Returns `HttpResponse` with `Content-Type: application/pdf` and `Content-Disposition: attachment; filename="<title>-<date>.pdf"`
- [x] URL wired in `Backend/questionnaires/urls.py`:  
  `<uuid:questionnaire_pk>/responses/<uuid:response_pk>/pdf/`
- [x] Returns `404` if questionnaire or response not found
- [x] Returns `400` if `survey_json` is empty/missing

**Tests**:

- [x] `test_views.py`: GET returns 200 with `Content-Type: application/pdf`
- [x] GET with unknown IDs returns 404
- [x] PDF bytes are non-empty (> 100 bytes)
- [x] `Content-Disposition` header contains the questionnaire title

**Stability Criteria**: All new view tests pass. `pnpm build` still passes (no frontend changes yet).

**Notes**:

---

## Phase 4: Frontend integration

**Status**: Complete

**Goal**: Replace the client-side `generateResponsePdf` calls with simple anchor/window navigations to the backend PDF endpoint. Remove `generatePdf.tsx` and the `jsPDF` dependency.

**Deliverables**:

- [x] Update `Frontend/src/routes/responses/$id/index.tsx` — `handleDownloadPdf` calls `window.open(...)`
- [x] Update `Frontend/src/routes/responses/$id/$responseId.tsx` — same pattern
- [x] Delete `Frontend/src/lib/generatePdf.tsx`
- [x] Remove `jspdf` and `html2canvas` from `Frontend/package.json`
- [x] Update button label copy if needed ("Download PDF" stays the same)

**Tests**:

- [x] `pnpm build` passes with no TypeScript errors
- [ ] `pnpm lint` passes (pre-existing lint errors in unrelated files; none introduced by this plan)
- [x] Manual: clicking "Download PDF" in the browser triggers the backend endpoint and downloads a styled PDF

**Stability Criteria**: `pnpm build` clean, backend tests all pass.

**Notes**:

---

## Phase 5: Polish & CRM readiness

**Status**: Complete

**Goal**: Tighten the PDF quality and expose a reusable internal utility for future CRM integration.

**Deliverables**:

- [x] Extract a `generate_response_pdf(questionnaire, response) -> bytes` helper function in `Backend/questionnaires/pdf.py` (called by the view, reusable by CRM tasks)
- [x] Handle edge cases in template: long text wraps cleanly, empty answers show "—", multi-select answers render as comma-separated labels
- [x] `@page` running footer with questionnaire title via CSS counter
- [ ] Add logo/wordmark if an image asset is available at `Backend/static/logo.png` (no asset provided)
- [x] PDF filename includes date: `<title>-<YYYY-MM-DD>.pdf`

**Tests**:

- [x] Unit test `pdf.py` helper: returns `bytes`, non-empty, does not raise on empty answers
- [x] Unit test: multi-select answer renders as comma-separated labels, not raw list

**Stability Criteria**: All backend tests pass. PDF reviewed manually for long-answer wrap and empty-answer edge cases.

**Notes**:

---

## Completion Checklist

- [x] All phase tests pass (62 backend tests)
- [x] `pnpm build` passes
- [ ] `pnpm lint` passes (19 pre-existing errors in unrelated files; none introduced here)
- [x] `pytest` passes
- [x] `AGENTS.md` — PDF endpoint pattern documented via `Backend/questionnaires/pdf.py`
- [x] `Docs/In-progress/PLAN-10-weasyprint-pdf.md` moved to `Docs/Completed/`
