# Plan 03 — Shareable Link Generation

## Goal
Let questionnaire owners copy a public URL that respondents can open without logging in.

---

## Scope

| File | Action |
|------|--------|
| `Frontend/src/routes/questionnaires/index.tsx` | Add "Copy link" button per row |
| `Frontend/src/lib/utils.ts` | Add `buildShareUrl(id)` helper |
| `Frontend/src/components/ui/CopyButton.tsx` | New — reusable copy-to-clipboard button with feedback |

---

## Steps

### 1. URL helper (`Frontend/src/lib/utils.ts`)
```ts
export function buildShareUrl(id: string): string {
  return `${window.location.origin}/take/${id}`
}
```

### 2. `CopyButton` component (`Frontend/src/components/ui/CopyButton.tsx`)
- Props: `value: string`, optional `label?: string`.
- On click → `navigator.clipboard.writeText(value)`.
- Toggle button label/icon between "Copy link" and "Copied!" for 2 seconds using `useState` + `setTimeout`.
- Style with existing `Button` primitive (`variant="outline"`, `size="sm"`).
- Handle clipboard API unavailability gracefully (show an `<input readonly>` fallback with the URL).

### 3. Wire into the questionnaire list
In `Frontend/src/routes/questionnaires/index.tsx`, render `<CopyButton value={buildShareUrl(q.id)} label="Share" />` in each row's actions column.

### 4. (Optional) Share modal
If a modal UX is preferred over a plain button:
- Show a small popover/dialog with:
  - A read-only `<Input>` displaying the full URL.
  - A `<CopyButton>` next to it.
  - A QR code (out of scope for this plan; defer).

---

## Acceptance Criteria
- [ ] Each questionnaire row has a "Copy link" button.
- [ ] Clicking it writes `<origin>/take/:id` to the clipboard.
- [ ] The button text changes to "Copied!" for 2 s then resets.
- [ ] Works in Chrome, Firefox, and Safari (clipboard API available on HTTPS / localhost).
- [ ] `pnpm build` passes.

---

## Dependencies
- `buildShareUrl` must align with the `/take/:id` route defined in Plan 04.
- No new packages required (`navigator.clipboard` is native).
