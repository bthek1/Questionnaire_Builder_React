# PLAN-20 — Batteries (Grouped Questionnaire Sets)

**Status**: ✅ Completed 2025-07-31

## Overview

A **Battery** groups multiple `QuestionnaireType`s into a single unit that a respondent completes together via one shareable link. Each constituent questionnaire is stored as its own `Questionnaire` instance (reusing existing logic). The battery exists at two levels — mirroring the existing two-level model:

| Level | Model | Description |
|-------|-------|-------------|
| Template | `BatteryType` | Ordered list of `QuestionnaireType` IDs (stored as JSON array) |
| Instance | `Battery` | Deployed set; has a `shareToken`; linked `Questionnaire` instances via reverse FK |

### Key rules
- Creating a `Battery` automatically creates one `Questionnaire` instance per `QuestionnaireType` in `BatteryType.questionnaire_type_ids`, in order.
- Each created `Questionnaire` gets a FK back to the `Battery` (`battery` field, nullable on `Questionnaire`).
- The respondent accesses `/take-battery/:shareToken` and steps through each questionnaire sequentially.
- Each questionnaire is submitted individually using the existing `submitAnswers` endpoint.
- A `Battery` is considered **complete** when all its linked `Questionnaire` instances have `submittedAt` set.
- Battery instances are **immutable after creation** — editing `BatteryType.questionnaire_type_ids` does not affect already-deployed batteries.

---

## Data Model

### Backend (Django)

Two new models + one new nullable FK field on the existing `Questionnaire` model:

```
BatteryType
  id                      UUID PK
  owner                   FK → User (nullable)
  title                   CharField
  description             TextField (optional)
  questionnaire_type_ids  JSONField(default=list)  # ordered list of QuestionnaireType UUIDs
  created_at              auto
  updated_at              auto

Battery  (instance)
  id           UUID PK
  battery_type FK → BatteryType (on_delete=CASCADE)
  name         CharField (optional label, e.g. "Cohort A")
  share_token  UUID unique index
  created_at   auto
  updated_at   auto
  # status is derived: all linked Questionnaire.submitted_at set → complete

Questionnaire  (existing model — add one field)
  battery      FK → Battery (null=True, blank=True, on_delete=SET_NULL, related_name="questionnaires")
  battery_order  PositiveIntegerField (null=True, blank=True)  # position within battery
```

Creating a `Battery` iterates `battery_type.questionnaire_type_ids` in order and creates one `Questionnaire` per entry, setting `battery=<battery>` and `battery_order=<index>`.

### Frontend (TypeScript)

```ts
interface BatteryType {
  id: string
  title: string
  description?: string
  questionnaireTypeIds: string[]   // ordered list of QuestionnaireType UUIDs
  createdAt: string
  updatedAt: string
}

interface Battery {
  id: string
  batteryTypeId: string
  batteryTypeName: string          // for display
  name: string
  shareToken: string
  questionnaires: BatterySlot[]    // ordered by battery_order
  isComplete: boolean              // derived: all questionnaires submitted
  createdAt: string
  updatedAt: string
}

interface BatterySlot {
  order: number
  questionnaireId: string
  shareToken: string               // Questionnaire.shareToken
  questionnaireTypeName: string    // for display
  submittedAt: string | null
}
```

---

## API Endpoints

| Method | URL | Auth | Description |
|--------|-----|------|-------------|
| GET | `/api/battery-types/` | required | List battery types |
| POST | `/api/battery-types/` | required | Create battery type |
| GET | `/api/battery-types/:id/` | required | Get battery type detail |
| PATCH | `/api/battery-types/:id/` | required | Update title/description/questionnaireTypeIds |
| DELETE | `/api/battery-types/:id/` | required | Delete battery type |
| GET | `/api/batteries/` | required | List battery instances |
| POST | `/api/batteries/` | required | Create battery (auto-creates Questionnaires) |
| GET | `/api/batteries/:id/` | required | Get battery detail + questionnaire statuses |
| DELETE | `/api/batteries/:id/` | required | Delete battery (Questionnaires set battery=null) |
| GET | `/api/batteries/by-token/:token/` | **public** | Respondent: fetch battery + ordered questionnaire tokens |

The `POST /api/batteries/` request body:
```json
{ "battery_type": "<uuid>", "name": "optional label" }
```
Server creates `Battery` + one `Questionnaire` per UUID in `battery_type.questionnaire_type_ids` (in order), setting `battery=<battery>` and `battery_order=<index>` on each.

The `GET /api/batteries/by-token/:token/` response:
```json
{
  "id": "...",
  "name": "...",
  "batteryTypeName": "...",
  "questionnaires": [
    {
      "order": 0,
      "shareToken": "...",
      "questionnaireTypeName": "...",
      "submittedAt": null
    }
  ]
}
```

---

## Route Structure (Frontend)

```
Frontend/src/routes/
  battery-types/
    index.tsx          # List BatteryTypes — Edit / Deploy buttons
    new.tsx            # Create new BatteryType → redirect to detail
    $id/
      index.tsx        # Edit BatteryType: title, description, ordered list of QuestionnaireTypes
  batteries/
    index.tsx          # List Battery instances (Complete/Pending badges, copy share link)
    new.tsx            # Deploy a Battery from a BatteryType
    $id/
      index.tsx        # Battery detail: share link, per-questionnaire status
  take-battery/
    $shareToken.tsx    # Public respondent view — sequential questionnaire flow
```

---

## Phase 1: Backend Models + Migrations

**Status**: Not started

**Goal**: Add `BatteryType` and `Battery` models, add `battery`/`battery_order` fields to `Questionnaire`, and generate a migration; creating a `Battery` automatically creates `Questionnaire` instances.

**Deliverables**:

- [ ] `BatteryType` model in `Backend/questionnaires/models.py` with `questionnaire_type_ids` JSONField
- [ ] `Battery` model with `share_token` (UUID, unique) and FK to `BatteryType`
- [ ] Add `battery = FK → Battery (null, SET_NULL)` and `battery_order = PositiveIntegerField(null)` to `Questionnaire`
- [ ] Service function `create_battery(battery_type, name)` — creates `Battery` + one `Questionnaire` per UUID in `questionnaire_type_ids` (in order)
- [ ] Django migration file (auto-generated)
- [ ] `__str__` methods on `BatteryType` and `Battery`
- [ ] Register both new models in `Backend/questionnaires/admin.py`

**Tests**:

- [ ] `test_models.py`: `create_battery` creates correct number of Questionnaires in order
- [ ] `test_models.py`: `Questionnaire.battery_order` values are sequential (0, 1, 2…)
- [ ] `test_models.py`: Deleting a Battery sets `Questionnaire.battery = null` (SET_NULL)
- [ ] `test_models.py`: `BatteryType.__str__` and `Battery.__str__` return expected strings

**Stability Criteria**: `python manage.py migrate` runs cleanly; all existing backend tests remain green; new model tests pass.

**Notes**:

---

## Phase 2: Backend Serializers, Views, URLs + Tests

**Status**: Not started

**Goal**: Full REST API for battery types and battery instances, including a public by-token endpoint.

**Deliverables**:

- [ ] `BatteryTypeSerializer` — fields: `id`, `title`, `description`, `questionnaire_type_ids`, `created_at`, `updated_at`
- [ ] `BatterySlotSerializer` — read-only, exposes `order`, `share_token`, `questionnaire_type_name`, `submitted_at` (sourced from `Questionnaire.battery_order` + FK lookups)
- [ ] `BatterySerializer` — fields: `id`, `battery_type`, `battery_type_name`, `name`, `share_token`, nested `questionnaires` (read-only, ordered by `battery_order`), `is_complete` (SerializerMethodField)
- [ ] `BatteryTypeViewSet` (ModelViewSet) at `/api/battery-types/`
- [ ] `BatteryViewSet` (ModelViewSet) at `/api/batteries/`
  - `create` override: calls `create_battery(battery_type, name)` service function
  - Custom action `by_token`: `GET /api/batteries/by-token/<token>/` (no auth) — public endpoint
- [ ] URL registration in `Backend/questionnaires/urls.py`

**Tests**:

- [ ] `test_serializers.py`: `BatteryTypeSerializer` round-trips correctly
- [ ] `test_serializers.py`: `BatterySerializer.is_complete` is `False` when any questionnaire lacks `submitted_at`, `True` when all set
- [ ] `test_views.py`: CRUD for `/api/battery-types/` — list, create, retrieve, partial_update, destroy
- [ ] `test_views.py`: `POST /api/batteries/` creates Battery + N Questionnaires with correct `battery_order`
- [ ] `test_views.py`: `GET /api/batteries/by-token/<token>/` returns correct shape (public, no auth)
- [ ] `test_views.py`: `GET /api/batteries/by-token/<invalid>/` returns 404

**Stability Criteria**: All backend tests green (`pytest`).

**Notes**:

---

## Phase 3: Frontend Types, API, Hooks

**Status**: Not started

**Goal**: TypeScript interfaces, Axios API functions, and TanStack Query hooks for batteries and battery types.

**Deliverables**:

- [ ] Add `BatteryType`, `Battery`, `BatterySlot` interfaces to `Frontend/src/types/index.ts`
- [ ] `Frontend/src/api/batteryTypes.ts` — `getBatteryTypes`, `getBatteryType`, `createBatteryType`, `updateBatteryType`, `deleteBatteryType`
- [ ] `Frontend/src/api/batteries.ts` — `getBatteries`, `getBattery`, `createBattery`, `deleteBattery`, `getBatteryByToken`
- [ ] `Frontend/src/hooks/useBatteryTypes.ts` — `batteryTypeKeys`, `useBatteryTypes`, `useBatteryType`, `useCreateBatteryType`, `useUpdateBatteryType`, `useDeleteBatteryType`
- [ ] `Frontend/src/hooks/useBatteries.ts` — `batteryKeys`, `useBatteries`, `useBattery`, `useBatteryByToken`, `useCreateBattery`, `useDeleteBattery`

**Tests**:

- [ ] `Frontend/src/test/api.batteries.test.ts` — unit tests for all API functions (mock axios)
- [ ] `Frontend/src/test/useBatteries.test.tsx` — hook tests with `QueryClientProvider`, mocked API

**Stability Criteria**: `pnpm test` green; `pnpm build` passes.

**Notes**:

---

## Phase 4: Battery Types UI

**Status**: Not started

**Goal**: Pages to list, create, and edit battery types (selecting and ordering questionnaire types).

**Deliverables**:

- [ ] `Frontend/src/routes/battery-types/index.tsx` — list page
  - Table/list of `BatteryType` rows: title, description, questionnaire count
  - **Edit** button → `battery-types/$id`
  - **Deploy** button → `batteries/new?batteryTypeId=:id`
  - **Delete** button with confirmation
  - **New Battery Type** button → `battery-types/new`
- [ ] `Frontend/src/routes/battery-types/new.tsx` — create form
  - Fields: title (required), description (optional)
  - On submit → `POST /api/battery-types/` → redirect to `battery-types/$id` to add questionnaire types
- [ ] `Frontend/src/routes/battery-types/$id/index.tsx` — edit page
  - Editable title + description
  - Ordered list of selected `QuestionnaireType`s (add from dropdown, remove, drag-to-reorder or up/down arrows)
  - Save button → `PATCH /api/battery-types/:id/`
- [ ] Nav bar link to `/battery-types` in `__root.tsx`

**Tests**:

- [ ] `Frontend/src/test/BatteryTypesPage.test.tsx` — list renders, delete calls API, deploy navigates
- [ ] `Frontend/src/test/BatteryTypeEditPage.test.tsx` — add/remove questionnaire types, save calls PATCH

**Stability Criteria**: `pnpm build` and `pnpm test` green.

**Notes**:

---

## Phase 5: Batteries UI (Owner View)

**Status**: Not started

**Goal**: Pages to deploy battery instances and inspect their status.

**Deliverables**:

- [ ] `Frontend/src/routes/batteries/index.tsx` — list page
  - Table of `Battery` rows: name, battery type name, complete/pending badge, created date
  - **Copy link** button (copies `/take-battery/:shareToken`)
  - **View** button → `batteries/$id`
  - **Delete** button with confirmation
  - **Deploy New Battery** button → `batteries/new`
- [ ] `Frontend/src/routes/batteries/new.tsx` — deploy form
  - Select `BatteryType` from dropdown (required)
  - Name field (optional)
  - On submit → `POST /api/batteries/` → redirect to `batteries/$id`
- [ ] `Frontend/src/routes/batteries/$id/index.tsx` — battery detail page
  - Battery name + type name header
  - Share link with copy button
  - Overall status badge (Complete / Pending)
  - Per-questionnaire status table: questionnaire type name, status (Submitted / Pending), submitted timestamp
  - Link to individual questionnaire results (`/questionnaires/:questionnaireId/results`)

**Tests**:

- [ ] `Frontend/src/test/BatteriesPage.test.tsx` — list renders, badges, copy link, delete
- [ ] `Frontend/src/test/NewBatteryPage.test.tsx` — form renders, submit calls API, redirect
- [ ] `Frontend/src/test/BatteryDetailPage.test.tsx` — detail renders status table, share link present

**Stability Criteria**: `pnpm build` and `pnpm test` green.

**Notes**:

---

## Phase 6: Take Battery (Respondent View)

**Status**: Not started

**Goal**: Public page at `/take-battery/:shareToken` that walks the respondent through each questionnaire in sequence and submits each on completion.

**Deliverables**:

- [ ] `Frontend/src/routes/take-battery/$shareToken.tsx` — public respondent view
  - Fetch battery by token (`useBatteryByToken`)
  - Show progress indicator: "Survey 2 of 3" or step dots
  - Render the current (first unsubmitted) questionnaire using `SurveyRenderer`
    - Pass `shareToken` of the individual `Questionnaire` to `SurveyRenderer`'s submit handler
    - On complete: call `submitAnswers(questionnaire.shareToken, answers, metrics)` (existing hook)
    - Then advance to the next unsubmitted questionnaire
  - After all questionnaires submitted: show **completion screen** ("Thank you — all surveys complete")
  - If already fully submitted: show completion screen immediately
- [ ] Handle `404` (invalid token) gracefully

**Tests**:

- [ ] `Frontend/src/test/TakeBatteryPage.test.tsx`
  - Renders first questionnaire when none submitted
  - Advances to next after first submission
  - Shows completion screen after all submitted
  - Shows completion screen when battery already complete on load
  - Shows 404/error state for invalid token

**Stability Criteria**: `pnpm build` and `pnpm test` green; full respondent flow works end-to-end in dev server.

**Notes**:

---

**Status**: ✅ Completed

**Goal**: Wire up navigation, add battery counts to type pages, and ensure the whole build + lint + tests pass clean.

**Deliverables**:

- [ ] Add **Battery Types** and **Batteries** links to the nav bar in `__root.tsx`
- [ ] On the `questionnaire-types/$id` detail page, show a read-only list of batteries that include this type (optional / nice-to-have)
- [ ] On the `batteries/index` page, show total questionnaires and submitted count
- [ ] `pnpm lint` clean (fix any `noUnusedLocals` / `noUnusedParameters` errors)
- [ ] `pnpm build` clean
- [ ] `pnpm test` all passing
- [ ] Update `AGENTS.md` with new routes, hooks, API files, types
- [ ] Update `/memories/repo/questionnaire-builder-state.md`

**Tests**:

- [ ] All existing tests still pass (no regressions)
- [ ] New test count ≥ previous count + 40

**Stability Criteria**: `pnpm build`, `pnpm lint`, `pnpm test`, and `pytest` all exit 0.

**Notes**:

---

## Completion Checklist

- [ ] Phase 1 complete — models + migrations
- [ ] Phase 2 complete — backend API + tests
- [ ] Phase 3 complete — frontend types + API + hooks
- [ ] Phase 4 complete — Battery Types UI
- [ ] Phase 5 complete — Batteries UI
- [ ] Phase 6 complete — Take Battery respondent view
- [ ] Phase 7 complete — nav, polish, final build
- [ ] `AGENTS.md` updated
- [ ] `Docs/In-progress/PLAN-20-batteries.md` moved to `Docs/Completed/`
