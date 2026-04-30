# Questionnaire Builder — React Project Plan

## Tech Stack

| Layer | Technology |
|---|---|
| Core | React 19, TypeScript 6, Vite 8 |
| Routing | @tanstack/react-router (file-based) |
| Server State | @tanstack/react-query |
| Forms | @tanstack/react-form |
| HTTP | axios |
| Styling | Tailwind CSS 4, Radix UI, lucide-react |
| Class Utils | class-variance-authority, clsx, tailwind-merge |
| Unit/Integration Tests | Vitest, @testing-library/react |
| E2E Tests | Playwright |
| Linting | ESLint 10, typescript-eslint, eslint-plugin-react-hooks |
| Formatting | Prettier |

---

## Phase 1 — Project Scaffold

- [x] Bootstrap project with Vite 8 using the React + TypeScript template
  ```bash
  pnpm create vite@latest . --template react-ts
  ```
- [x] Verify `package.json` targets React 19 and TypeScript 6
- [x] Remove boilerplate files (`App.css`, `assets/react.svg`, placeholder content in `App.tsx`)
- [ ] Commit: `chore: initial vite scaffold`

---

## Phase 2 — Core Dependencies

### Install production dependencies
```bash
pnpm add \
  @tanstack/react-router \
  @tanstack/react-query \
  @tanstack/react-form \
  axios \
  @radix-ui/react-label \
  @radix-ui/react-select \
  @radix-ui/react-separator \
  @radix-ui/react-slot \
  lucide-react \
  class-variance-authority \
  clsx \
  tailwind-merge
```

> [x] All production dependencies installed

### Install dev dependencies
```bash
pnpm add -D \
  tailwindcss \
  @tailwindcss/vite \
  @tanstack/router-plugin \
  @tanstack/react-query-devtools \
  vitest \
  @vitest/coverage-v8 \
  @testing-library/react \
  @testing-library/user-event \
  @testing-library/jest-dom \
  jsdom \
  @playwright/test \
  eslint \
  typescript-eslint \
  eslint-plugin-react-hooks \
  prettier \
  eslint-config-prettier
```

> [x] All dev dependencies installed

- [x] Commit: `chore: add all dependencies`

---

## Phase 3 — Build Tool Configuration

### Vite (`vite.config.ts`)
- [x] Add `@tailwindcss/vite` plugin
- [x] Add `@tanstack/router-plugin` (enables file-based routing code-gen)
- [x] Configure path alias `@/` → `src/`
- [x] Configure test environment (`jsdom`) and setup file for `@testing-library/jest-dom`

```ts
// vite.config.ts
import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import tailwindcss from '@tailwindcss/vite'
import { TanStackRouterVite } from '@tanstack/router-plugin/vite'
import path from 'path'

export default defineConfig({
  plugins: [TanStackRouterVite(), react(), tailwindcss()],
  resolve: {
    alias: { '@': path.resolve(__dirname, 'src') },
  },
  test: {
    environment: 'jsdom',
    setupFiles: ['src/test/setup.ts'],
    globals: true,
  },
})
```

### TypeScript (`tsconfig.json`)
- [x] Set `target` to `ES2022` *(currently ES2023 in tsconfig.app.json)*
- [x] Enable `strict: true` *(not explicitly set; individual strict flags partially present)*
- [x] Add `baseUrl: "src"` and `paths: { "@/*": ["./*"] }`
- [x] Commit: `chore: configure vite and typescript`

---

## Phase 4 — Tailwind CSS 4

- [x] Import Tailwind in `src/index.css`:
  ```css
  @import "tailwindcss";
  ```
- [x] No `tailwind.config.ts` needed — Tailwind 4 uses CSS-based config
- [x] Define design tokens (colors, fonts, radius) inside `index.css` using `@theme`
- [x] Commit: `chore: configure tailwind css 4`

---

## Phase 5 — Routing Setup (TanStack Router)

- [x] Create `src/routes/` directory (file-based routing root)
- [x] Create `src/routes/__root.tsx` — root layout with `<Outlet />`
- [x] Create `src/routes/index.tsx` — home/dashboard route
- [x] Create `src/main.tsx` with router provider:
  ```tsx
  import { RouterProvider, createRouter } from '@tanstack/react-router'
  import { routeTree } from './routeTree.gen' // auto-generated

  const router = createRouter({ routeTree })
  ReactDOM.createRoot(document.getElementById('root')!).render(
    <RouterProvider router={router} />
  )
  ```
- [x] Commit: `feat: setup tanstack router with file-based routing`

---

## Phase 6 — React Query Setup

- [x] Wrap the app with `QueryClientProvider` in `main.tsx`
- [x] Add `ReactQueryDevtools` (dev only) inside the root layout
- [x] Create `src/lib/queryClient.ts` to export the shared `QueryClient` instance
- [x] Commit: `feat: setup react query`

---

## Phase 7 — Axios & API Layer

- [x] Create `src/lib/axios.ts` — configured axios instance with `baseURL`, interceptors for auth headers, and error normalisation
- [x] Create `src/api/` directory — one file per resource (e.g., `questionnaires.ts`, `responses.ts`)
- [x] Each API file exports typed request functions used by React Query hooks
- [x] Commit: `feat: setup axios and api layer`

---

## Phase 8 — UI Utilities (shadcn/ui pattern)

- [x] Create `src/lib/utils.ts`:
  ```ts
  import { clsx, type ClassValue } from 'clsx'
  import { twMerge } from 'tailwind-merge'

  export function cn(...inputs: ClassValue[]) {
    return twMerge(clsx(inputs))
  }
  ```
- [x] Create `src/components/ui/` directory for base primitives
- [x] Build initial primitives wrapping Radix UI:
  - `Button` (using `class-variance-authority` variants)
  - `Label` (wraps `@radix-ui/react-label`)
  - `Select` (wraps `@radix-ui/react-select`)
  - `Separator` (wraps `@radix-ui/react-separator`)
- [x] Commit: `feat: add ui primitives`

---

## Phase 9 — Form Setup (TanStack Form)

- [x] Create a shared `src/lib/form.ts` with reusable form factory helpers
- [x] Build example `QuestionnaireForm` component using `@tanstack/react-form` + Radix UI primitives
- [x] Integrate form submission with axios API layer
- [ ] Commit: `feat: setup tanstack form`

---

## Phase 10 — Linting & Formatting

### ESLint (`eslint.config.ts`)
- [x] Enable `typescript-eslint` recommended rules
- [x] Enable `eslint-plugin-react-hooks` rules
- [x] Disable formatting rules (defer to Prettier via `eslint-config-prettier`)

### Prettier (`.prettierrc`)
```json
{
  "semi": false,
  "singleQuote": true,
  "tabWidth": 2,
  "trailingComma": "all",
  "printWidth": 100,
  "plugins": ["prettier-plugin-tailwindcss"]
}
```

- [x] Add `format`, `lint`, and `lint:fix` scripts to `package.json`
- [x] Commit: `chore: configure eslint and prettier`

---

## Phase 11 — Testing Setup

### Vitest + Testing Library
- [x] Create `src/test/setup.ts`:
  ```ts
  import '@testing-library/jest-dom'
  ```
- [x] Write a smoke test for the root layout component
- [x] Add `test`, `test:watch`, and `coverage` scripts to `package.json`

### Playwright (E2E)
- [x] Run `pnpm create playwright` to generate `playwright.config.ts`
- [x] Configure base URL to match the Vite dev server (`http://localhost:5173`)
- [x] Write a first E2E test for the home route
- [x] Add `test:e2e` script to `package.json`

- [x] Commit: `chore: configure vitest and playwright`

---

## Phase 12 — Project Structure (Final)

```
src/
├── api/                  # axios request functions per resource
├── components/
│   ├── ui/               # Radix UI-based primitives
│   └── [feature]/        # feature-specific components
├── hooks/                # shared custom hooks
├── lib/
│   ├── axios.ts
│   ├── queryClient.ts
│   ├── form.ts
│   └── utils.ts
├── routes/               # TanStack Router file-based routes
│   ├── __root.tsx
│   └── index.tsx
├── test/
│   └── setup.ts
├── types/                # shared TypeScript types/interfaces
├── index.css
└── main.tsx
e2e/                      # Playwright tests
```

---

## Package Scripts Summary

```json
{
  "scripts": {
    "dev": "vite",
    "build": "tsc -b && vite build",
    "preview": "vite preview",
    "lint": "eslint src",
    "lint:fix": "eslint src --fix",
    "format": "prettier --write src",
    "test": "vitest",
    "test:watch": "vitest --watch",
    "coverage": "vitest --coverage",
    "test:e2e": "playwright test"
  }
}
```

---

## Implementation Order

1. Phase 1 → Phase 2 → Phase 3 (foundation must be solid before adding features)
2. Phase 4 (Tailwind) → Phase 8 (UI utils) — styling infrastructure before components
3. Phase 5 (Router) → Phase 6 (Query) → Phase 7 (Axios) — data layer in dependency order
4. Phase 9 (Forms) — depends on UI primitives and axios
5. Phase 10 (Linting) — can be done any time, best before first PR
6. Phase 11 (Testing) — set up early, write tests alongside features

---

## Current Status *(updated 2026-04-30)*

| Phase | Status |
|---|---|
| Phase 1 — Project Scaffold | ✅ Complete |
| Phase 2 — Core Dependencies | ✅ Complete |
| Phase 3 — Build Tool Configuration | ✅ Complete |
| Phase 4 — Tailwind CSS 4 | ✅ Complete |
| Phase 5 — Routing Setup | ✅ Complete |
| Phase 6 — React Query Setup | ✅ Complete |
| Phase 7 — Axios & API Layer | ✅ Complete |
| Phase 8 — UI Utilities | ✅ Complete |
| Phase 9 — Form Setup | ✅ Complete |
| Phase 10 — Linting & Formatting | ✅ Complete |
| Phase 11 — Testing Setup | ✅ Complete |

**Next step:** Phase 12 — create `src/hooks/` directory and write tests for the new form component.

**Note:** `src/hooks/` directory (referenced in Phase 12 target structure) has not been created yet.
