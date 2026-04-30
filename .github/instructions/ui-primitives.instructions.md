---
description: "Use when creating or modifying UI primitive components in src/components/ui/. Covers the CVA variants pattern, Radix UI asChild/Slot composition, forwardRef, and Tailwind v4 CSS variable theming."
applyTo: "Frontend/src/components/ui/**,Frontend/src/components/survey/**"
---

# UI Primitives — Conventions

All components in `src/components/ui/` follow the [shadcn/ui](https://ui.shadcn.com/) pattern adapted for this project.

## Required Structure

Use [`Button.tsx`](../../src/components/ui/Button.tsx) as the reference implementation.

### 1. CVA variants

Define variants with `cva()` from `class-variance-authority`:

```ts
import { cva, type VariantProps } from 'class-variance-authority'

const componentVariants = cva(
  'base classes here',
  {
    variants: {
      variant: { default: '...', outline: '...' },
      size: { default: '...', sm: '...', lg: '...' },
    },
    defaultVariants: { variant: 'default', size: 'default' },
  },
)
```

Export both the component and the variants function (e.g. `export { Button, buttonVariants }`).

### 2. Props interface

Extend the native HTML element attributes and include `VariantProps` + `asChild`:

```ts
export interface ButtonProps
  extends React.ButtonHTMLAttributes<HTMLButtonElement>,
    VariantProps<typeof buttonVariants> {
  asChild?: boolean
}
```

### 3. forwardRef + Slot

Always use `React.forwardRef` and support `asChild` via Radix `Slot`:

```tsx
import { Slot } from '@radix-ui/react-slot'

const MyComponent = React.forwardRef<HTMLButtonElement, MyComponentProps>(
  ({ className, variant, size, asChild = false, ...props }, ref) => {
    const Comp = asChild ? Slot : 'button'
    return <Comp className={cn(myVariants({ variant, size, className }))} ref={ref} {...props} />
  },
)
MyComponent.displayName = 'MyComponent'
```

### 4. className merging

Always use `cn()` from [`src/lib/utils.ts`](../../src/lib/utils.ts) to merge classes — never string concatenation.

### 5. Tailwind v4 theming

Reference CSS variables defined in [`src/index.css`](../../src/index.css) for theme-sensitive colors:

```ts
// ✅ correct — uses runtime CSS variable
'bg-[var(--color-primary)] text-[var(--color-primary-foreground)]'

// ❌ avoid — hardcodes a Tailwind color, bypasses theming
'bg-blue-600'
```

Available tokens (defined in `src/index.css` under `@theme`): `--color-primary`, `--color-primary-foreground`, `--color-muted`, `--color-border`, `--color-background`, `--color-foreground`.

## Checklist for New Primitives

- [ ] Wraps a Radix UI headless component or native HTML element
- [ ] Exports the component + the CVA variants function
- [ ] Props interface extends native attributes + `VariantProps` + `asChild?: boolean`
- [ ] Uses `React.forwardRef` and sets `displayName`
- [ ] Uses `cn()` for all className merging
- [ ] Uses `var(--color-*)` CSS variables for themed colors
