# SurveyJS PDF Generator (`survey-pdf`)

**Package:** `survey-pdf`  
**License:** Commercial  
**GitHub:** https://github.com/surveyjs/survey-pdf  
**Docs:** https://surveyjs.io/pdf-generator/documentation/overview

---

## What It Does

SurveyJS PDF Generator is a **client-side extension** over the SurveyJS Form Library that exports a rendered survey — optionally pre-filled with response data — to a PDF document. The PDF can be:

- **Static** — a read-only snapshot of questions and answers (useful for archiving or sending results).
- **Interactive** — a fillable PDF with form fields, so users can fill it in a PDF viewer (Adobe Reader, browsers, etc.) and submit later.

No server-side rendering pipeline (like Puppeteer) is required — the library generates PDF bytes entirely in the browser or in Node.js.

---

## How It Works

```
SurveyPDF instance
  ├─ surveyJson    (the survey schema)
  └─ surveyData    (optional response data to pre-fill)
        │
        ▼
SurveyPDF renders each question into PDF primitives
(text blocks, form fields, images, tables …)
        │
        ├─► .save('filename.pdf')        — download in browser
        └─► .raw('datauristring')        — get Base64 data URI
             .raw('arraybuffer')         — get ArrayBuffer (Node.js)
```

---

## React Integration

### Installation

```bash
pnpm add survey-pdf
# Peer dependency:
pnpm add survey-core
```

### Export a Blank Survey (No Answers)

```tsx
import { Model } from 'survey-core';
import { SurveyPDF } from 'survey-pdf';

const surveyJson = { /* your survey JSON schema */ };

function exportToPdf() {
  const surveyPdf = new SurveyPDF(surveyJson, {
    fontSize: 14,
    margins: { left: 10, right: 10, top: 10, bot: 10 },
  });

  surveyPdf.save('survey.pdf');
}

export default function ExportButton() {
  return <button onClick={exportToPdf}>Download PDF</button>;
}
```

### Export with Pre-filled Responses

```tsx
const responses = {
  satisfaction: 4,
  comments: 'Great product!',
};

function exportResultsToPdf() {
  const surveyPdf = new SurveyPDF(surveyJson);
  // Populate answers
  const model = new Model(surveyJson);
  model.data = responses;

  surveyPdf.data = responses;
  surveyPdf.save('results.pdf');
}
```

### Node.js Export (Server-side)

```ts
import { SurveyPDF } from 'survey-pdf';

const surveyPdf = new SurveyPDF(surveyJson);
surveyPdf.data = responses;

// Get raw bytes as ArrayBuffer
const pdfBuffer = await surveyPdf.raw('arraybuffer');
// Write to disk or send as HTTP response
```

---

## Constructor Options

| Option | Type | Description |
|--------|------|-------------|
| `fontSize` | `number` | Base font size in pt (default: `14`) |
| `margins` | `{ left, right, top, bot }` | Page margins in mm |
| `format` | `string \| number[]` | Page format: `'a4'`, `'letter'`, `[width, height]` |
| `orientation` | `'p' \| 'l'` | Portrait or landscape |
| `haveCommercialLicense` | `boolean` | Suppress the license watermark |
| `readonlyRenderAs` | `'text' \| 'acroform'` | How to render read-only questions |
| `textFieldRenderAs` | `'singleLine' \| 'multiLine'` | How to render text fields |

---

## Supported Features

- All built-in SurveyJS Form Library question types
- Export of survey results (pre-filled answers)
- Interactive (fillable) PDF form fields
- Automatic page breaks
- Markdown in question titles and descriptions
- Custom page format and font
- Header and footer support
- `save()` (browser download) and `raw()` (programmatic bytes) APIs

---

## Known Limitations

| Limitation |
|-----------|
| Dynamic elements (conditional visibility, skip logic) are **not applied** — all questions are rendered |
| Validation and navigation buttons are not included |
| Implied screen resolution for width calculation is 72 dpi |
| `text` questions only support `text`, `password`, `color` input types |
| Radiogroup questions do not support individual read-only items |
| ImagePicker `imageFit` is always `"fill"` |
| HTML questions support only a restricted subset of HTML |
| Panels cannot be collapsed |
| Dynamic panels only support `"list"` display mode and cannot be collapsed |

---

## Data Flow with the Rest of the Stack

```
1. Survey Creator  ──►  produces survey JSON  ──►  stored in DB
2. Form Library    ──►  renders form, collects responses  ──►  stored in DB
3. PDF Generator   ──►  surveyJson + optional responses  ──►  .pdf file
```

---

## Licensing

SurveyJS PDF Generator is **not free for commercial use**. A commercial license is required. See https://surveyjs.io/pricing.

---

## Further Reading

- [Get started — React](https://surveyjs.io/pdf-generator/documentation/get-started-react)
- [Get started — Node.js](https://surveyjs.io/pdf-generator/documentation/get-started-nodejs)
- [API reference](https://surveyjs.io/pdf-generator/documentation/api-reference)
- [Demo examples](https://surveyjs.io/Examples/Pdf-Export)
