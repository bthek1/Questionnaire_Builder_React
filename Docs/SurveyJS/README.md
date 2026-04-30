# SurveyJS — Overview

SurveyJS is a suite of open-source and commercial JavaScript components that lets you build surveys, quizzes, polls, and web forms; store them as JSON; render them in any framework; and visualise or export results.

---

## Component Map

| Package | npm | Role | License |
|---------|-----|------|---------|
| **survey-library** | `survey-core` + `survey-react-ui` | Render forms from JSON | **MIT (free)** |
| **survey-creator** | `survey-creator-core` + `survey-creator-react` | Visual drag-and-drop form builder | Commercial |
| **survey-analytics** | `survey-analytics` | Result dashboards & charts | Commercial |
| **survey-pdf** | `survey-pdf` | Export surveys to PDF | Commercial |

> The Form Library (survey-library) is the **foundation**. The three paid products are built on top of it and require it as a peer dependency.

---

## How They Fit Together

```
┌──────────────────────────────────────────────────┐
│                  Your Application                │
├───────────────┬──────────────┬───────────────────┤
│ survey-creator│survey-analytics│   survey-pdf    │
│  (build forms)│ (visualise)   │  (export PDF)    │
├───────────────┴──────────────┴───────────────────┤
│              survey-library (survey-core)         │
│         Renders JSON → interactive forms          │
└──────────────────────────────────────────────────┘
```

---

## Detailed Docs

- [survey-library.md](./survey-library.md) — Form Library (rendering engine)
- [survey-creator.md](./survey-creator.md) — Visual form builder
- [survey-analytics.md](./survey-analytics.md) — Dashboard & result visualisation
- [survey-pdf.md](./survey-pdf.md) — PDF export

---

## Official Links

| Resource | URL |
|----------|-----|
| Documentation home | https://surveyjs.io/documentation |
| GitHub organisation | https://github.com/surveyjs |
| Live demos | https://surveyjs.io/form-library/examples/overview |
| Pricing / Licensing | https://surveyjs.io/pricing |
