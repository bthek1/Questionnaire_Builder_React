---
description: "Use when planning new features, designing technical solutions, or starting any multi-phase implementation. Covers plan file structure, phase requirements, deliverables, and completion criteria."
applyTo: "Docs/**"
---

# Planning Guidelines

## Where Plans Live

All feature planning and technical design must be documented as markdown files in `Docs/`.

- **Location**: `Docs/` - use subdirectories to organize by status
  - `Docs/In-progress/` - active work
  - `Docs/Completed/` - finished features
- **Format**: One markdown file per feature (e.g., `PLAN-07-feature-name.md`), numbered sequentially
- **Phases**: Break every plan into clearly numbered phases

## Phase Requirements

Each phase must:

- Represent a **self-contained, deployable increment** - the codebase must remain functional after completing it
- Include **specific deliverables** (models, views, APIs, templates, etc.)
- Include **testing requirements** - unit tests and/or integration tests that verify stability
- Be **completable independently** before the next phase begins

## Phase Template

```markdown
## Phase N: <Short Title>

**Status**: Not started | 🔄 In Progress | ✅ Completed <date>

**Goal**: One-sentence description of what this phase delivers.

**Deliverables**:

- [ ] Item 1
- [ ] Item 2

**Tests**:

- [ ] Test coverage for item 1
- [ ] Test coverage for item 2

**Stability Criteria**: What must pass before this phase is considered complete.

**Notes**: Deviations, decisions, or follow-up items (fill in when completing the phase).
```

## Rules

- **DO plan in phases** - never design a feature as a single monolithic block
- **DO write the plan file first** before starting implementation
- **DO update the plan after every phase** - mark the phase complete, add status notes, mark the next phase as in progress, and record what was actually built (deviations, decisions, follow-up items) in the phase's **Notes** section
- **DO NOT skip testing requirements** - each phase must have passing tests before the next begins
- Plans are living documents; move the file from `Docs/In-progress/` to `Docs/Completed/` when done
- **AT THE END OF EVERY PLAN**: run `pnpm build` and `pnpm lint` and fix any errors before considering the plan complete
- **UPDATE RELEVANT DOCS**: after completing a plan, update `AGENTS.md` and any `Docs/` files that describe the changed behaviour - do not leave docs out of sync with the implementation
