# Questionnaire Builder

A React 19 + TypeScript SPA for building, sharing, and analysing questionnaires using **SurveyJS**.

## Tech Stack

| Concern | Tool |
|---------|------|
| Framework | React 19 + TypeScript (Vite) |
| Routing | TanStack Router (file-based) |
| Server state | TanStack React Query |
| Forms | TanStack React Form |
| HTTP | Axios |
| Styling | Tailwind CSS v4 + Radix UI |
| Form builder UI | `survey-creator-react` |
| Survey renderer | `survey-react-ui` |
| Response analytics | `survey-analytics` |
| PDF export | `survey-pdf` |
| Unit/integration tests | Vitest + Testing Library |
| E2E tests | Playwright |

## Getting Started

```bash
pnpm install
pnpm dev        # http://localhost:5173
```

## Commands

```bash
pnpm dev          # Vite dev server
pnpm build        # tsc -b && vite build
pnpm lint         # ESLint on src/
pnpm lint:fix     # ESLint --fix
pnpm format       # Prettier on src/
pnpm test         # Vitest (unit + integration)
pnpm coverage     # Vitest with coverage
pnpm test:e2e     # Playwright
```

## Feature Overview

Three user flows:

1. **Builder** — `/questionnaires/:id/edit`: drag-and-drop Survey Creator UI, saves `surveyJson` to backend.
2. **Respondent** — `/take/:id`: shareable public URL, renders the survey and submits responses.
3. **Owner** — `/questionnaires/:id/results`: visualises responses as charts; optional PDF export.

## Project Structure

```
src/
  api/            # Axios API functions
  components/     # UI primitives (ui/) and feature components
  hooks/          # React Query hooks
  lib/            # axios, form, queryClient, utils
  routes/         # TanStack Router file-based routes
  types/          # Central TypeScript interfaces
```

See [AGENTS.md](AGENTS.md) for full architecture and conventions.
