# SurveyJS Dashboard (`survey-analytics`)

**Package:** `survey-analytics`  
**License:** Commercial  
**GitHub:** https://github.com/surveyjs/survey-analytics  
**Docs:** https://surveyjs.io/dashboard/documentation/overview

---

## What It Does

SurveyJS Dashboard (formerly *survey-analytics*) is a **data visualisation layer** that takes an array of survey response objects and automatically generates interactive charts and tables — one visualiser per question. It requires no backend chart server; all rendering is client-side.

Use it to build the "results" or "analytics" section of your application where survey owners review aggregated responses.

---

## How It Works

```
Array of response objects (e.g. from your database)
        │
        ▼
new VisualizationPanel(surveyQuestions, responses, options)
        │
        ▼
Renders a chart/table for each question
   • Bar, Pie, Doughnut — choice questions
   • Histogram — numeric / rating questions
   • Word Cloud — open text questions
   • Statistics table — summary stats
        │
        ▼
User can interactively filter, reorder, and change chart type
```

---

## Supported Chart Types

| Chart | Best for |
|-------|---------|
| Bar | Single / multiple choice questions |
| Pie | Single choice questions |
| Doughnut | Single choice questions |
| Histogram | Numeric / rating scales |
| Gauge | NPS, rating questions |
| Bullet | Rating / numeric with targets |
| Radar / Spider | Matrix questions |
| Stacked bar | Matrix / multiple choice comparison |
| Word cloud | Open-ended text answers |
| Text table | Tabular display of all responses |
| Statistics table | Count, mean, median, std-dev |
| NPS Visualiser | Net Promoter Score questions |

---

## React Integration

### Installation

```bash
pnpm add survey-analytics
# Peer dependency — already installed if you use the Form Library:
pnpm add survey-core
```

### Basic Usage

```tsx
import { Model } from 'survey-core';
import { VisualizationPanel } from 'survey-analytics';
import 'survey-analytics/survey.analytics.css';
import { useEffect, useRef } from 'react';

const surveyJson = { /* your survey JSON schema */ };
const responses  = [
  { satisfaction: 4, comments: 'Great product' },
  { satisfaction: 2, comments: 'Needs improvement' },
  // ...fetched from your backend
];

export default function AnalyticsDashboard() {
  const containerRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!containerRef.current) return;

    const survey = new Model(surveyJson);
    const panel  = new VisualizationPanel(
      survey.getAllQuestions(),
      responses,
      { allowHideQuestions: true }
    );

    panel.render(containerRef.current);

    return () => {
      panel.clear();
    };
  }, []);

  return <div ref={containerRef} />;
}
```

---

## Key Options

| Option | Type | Description |
|--------|------|-------------|
| `allowHideQuestions` | `boolean` | Let users hide individual question charts |
| `allowChangeChartType` | `boolean` | Let users switch between chart types |
| `allowDragDrop` | `boolean` | Let users reorder charts via drag and drop |
| `allowShowPercentages` | `boolean` | Show percentage labels on charts |
| `seriesValues` | `string[]` | Used for filter / series grouping |
| `chartTypes` | `string[]` | Restrict available chart types globally |

---

## Interactive Filtering

Users can click on a chart segment to **cross-filter** all other charts on the panel — e.g. clicking "Very satisfied" in a bar chart updates every other question's chart to show only responses from satisfied users.

```ts
// Programmatic filter
panel.setFilter('satisfaction', [4, 5]);
panel.refresh();
```

---

## Custom Visualisations

Register a custom visualiser for a specific question type:

```ts
import { VisualizationManager } from 'survey-analytics';

VisualizationManager.registerVisualizerForType(
  'myCustomType',
  MyCustomVisualizer // extends VisualizerBase
);
```

---

## Data Flow with the Rest of the Stack

```
1. Survey Creator  ──►  produces survey JSON  ──►  stored in DB
2. Form Library    ──►  renders form, collects responses  ──►  responses stored in DB
3. Dashboard       ──►  fetches [surveyJson, responses[]]  ──►  renders charts
```

---

## Licensing

SurveyJS Dashboard is **not free for commercial use**. A commercial license (same tier as Survey Creator) is required. See https://surveyjs.io/pricing.

---

## Further Reading

- [Chart types reference](https://surveyjs.io/dashboard/documentation/chart-types)
- [Get started — React](https://surveyjs.io/dashboard/documentation/get-started-react)
- [Get started — Angular](https://surveyjs.io/dashboard/documentation/get-started-angular)
- [Get started — Vue](https://surveyjs.io/dashboard/documentation/get-started-vue)
- [Demo examples](https://surveyjs.io/Examples/Analytics)
