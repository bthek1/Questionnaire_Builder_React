# Recovery Metrics Brand Style Guide

## Brand Identity

**Recovery Metrics** is a healthcare SaaS platform for mental health and allied health practices.
The brand communicates clinical trust, data confidence, and professional warmth.

---

## Logo

### Assets

| File | Usage |
|---|---|
| `static/images/Light_Primary_Logo.svg` | Default - use on white or light backgrounds |
| `static/images/Dark_Logo.svg` | Use on dark navy or dark backgrounds |
| `static/images/Primary_Condensed_Logo_Light.svg` | Compact/condensed variant for tight spaces (e.g. navbar) |

### Usage Rules

- Minimum display height: **40px** (navbar uses `height: 50px`)
- Maintain aspect ratio at all times - never stretch or distort
- Do not recolor the logo
- Use the light logo on dark backgrounds; use the dark/primary logo on white or light backgrounds
- Clear space: maintain at least the logo height as white space around the logo on all sides
- Do not place the logo on busy photographic backgrounds

---

## Color Palette

### Primary Brand Colors

| Name | Hex | HSL | Usage |
|---|---|---|---|
| Deep Navy | `#002738` | `198 100% 11%` | Primary text, sidebar, brand color, buttons |
| Dark Teal | `#00354D` | ~`198 100% 15%` | Footer background, darker accents |
| Light Blue-Gray | `#e0e6e7` | `188 13% 88%` | Navbar background, secondary surfaces, muted |
| Warm White | `#FFF4E5` | - | Footer text, text on dark backgrounds |
| Neutral Gray | `#F5F5F5` | `0 0% 96%` | Page background |

### Secondary / UI Colors

| Name | Hex | Usage |
|---|---|---|
| Slate Gray | `#5b6268` | Navbar link text, subdued labels, dropdown backgrounds |
| Dark Charcoal | `#333333` | Hover text (navbar, dropdowns) |
| White | `#ffffff` | Cards, hover surfaces, dropdown hover background |

### Functional / State Colors

| Name | Usage |
|---|---|
| Destructive (red) | Errors, delete actions - Bootstrap `danger` / `hsl(0 84.2% 60.2%)` |
| Success (green) | Confirmations - Bootstrap `success` |
| Warning (yellow) | Warnings - Bootstrap `warning` |

### Dark Mode Tokens (React)

| Token | HSL | Description |
|---|---|---|
| `--background` | `198 100% 7%` | Very dark navy page background |
| `--foreground` | `0 0% 98%` | Near-white primary text |
| `--primary` | `198 80% 45%` | Lighter navy-teal for dark backgrounds |
| `--muted` | `198 30% 18%` | Dark muted surface |
| `--muted-foreground` | `215 20.2% 65.1%` | Muted gray text |

### Color Usage Principles

1. **Deep Navy (`#002738`)** is the brand anchor - use for headings, key CTAs, and brand moments
2. **Never** use pure black (`#000`) for body text - use Deep Navy instead
3. **Neutral gray (`#F5F5F5`)** as the page canvas keeps layouts airy and clinical
4. **Warm white (`#FFF4E5`)** only on dark navy/teal backgrounds for contrast
5. Reserve red/destructive tones strictly for error states and destructive actions

---

## Typography

### Scale

| Context | Size | Notes |
|---|---|---|
| Base (mobile) | `14px` | Applied to `html` element |
| Base (desktop >= 768px) | `16px` | Responsive breakpoint on `html` |
| Body text | inherit (16px) | From Bootstrap 5 defaults |
| Small/labels | `text-sm` / `0.875rem` | Used in form labels, secondary info |

### Font Stack

- **Legacy (Django templates)**: Bootstrap 5 system font stack:
  `system-ui, -apple-system, "Segoe UI", Roboto, "Helvetica Neue", Arial, sans-serif`
- **React SPA**: Tailwind CSS default sans-serif stack (same underlying system fonts)

### Text Color

- Body text: **Deep Navy `#002738`**
- Muted/secondary text: **Slate Gray `#5b6268`**
- Text on dark surfaces: **Warm White `#FFF4E5`** or near-white `#fafafa`

### Hierarchy Principles

- Use **font weight** and **size** to establish hierarchy, not color alone
- Headings: bold weight, Deep Navy
- Labels: `text-sm font-medium` (React) or Bootstrap `.form-label`
- Never use more than three distinct type sizes on a single screen

---

## Spacing and Layout

### Page Structure

```
+---------------------------------------+
| Navbar (.navbar-custom, #e0e6e7)      |
+----------+----------------------------+
| Sidebar  | Main Content Area          |
| #002738  | (container-fluid, p-4)     |
|          |                            |
+----------+----------------------------+
| Footer (.footer, #00354D, 60px tall)  |
+---------------------------------------+
```

### Key Dimensions

| Element | Value |
|---|---|
| Navbar logo height | `50px` |
| Sidebar background | `#002738` with `transition: 0.3s ease` |
| Footer height | `60px` |
| Footer line-height | `60px` |
| Body margin-bottom | `60px` (reserves footer space) |
| Max container width (legacy) | `960px` |
| Default border radius | `0.5rem` |

### React SPA Layout

| Element | Tailwind Classes |
|---|---|
| Page wrapper | `min-h-screen flex items-center justify-center p-4` |
| Auth card max-width | `max-w-md` (28rem) |
| Signup wizard max-width | `max-w-lg` (32rem) |
| Card shadow | `shadow-lg` |
| Inner card padding | `p-4` / `pb-2` |

### Spacing Scale

Follow Tailwind / Bootstrap 5 spacing scale (multiples of `4px`/`0.25rem`):

| Token | Value |
|---|---|
| `p-1` / `spacing-1` | `4px` |
| `p-2` / `spacing-2` | `8px` |
| `p-3` / `spacing-3` | `12px` |
| `p-4` / `spacing-4` | `16px` |
| `p-6` / `spacing-6` | `24px` |
| `p-8` / `spacing-8` | `32px` |

---

## Components

### Buttons

- All buttons use Bootstrap 5 variants or React `Button` component variants
- Global hover: `filter: brightness(85%)` darkens on hover (legacy CSS)
- Primary CTA: `btn-primary` / `variant="default"` - Deep Navy background
- Destructive: `btn-danger` / `variant="destructive"` - Red
- Secondary: `btn-secondary` / `variant="secondary"` - Light Blue-Gray

**React Button sizes**

| Size | Classes |
|---|---|
| Default | `h-9 px-4 py-2` |
| Small | `h-8 px-3 text-xs` |
| Large | `h-10 px-8` |
| Icon | `h-9 w-9` |

### Navbar

- Background: `#e0e6e7` (Light Blue-Gray)
- Link color: `#5b6268`, hover text `#333333`, hover background `#ffffff`
- Logo: condensed variant, `height: 50px`, `padding-left: 30px`
- Dropdown background: `#5b6268`, dropdown text: `#fff4e5`
- All transitions: `0.3s ease`

### Sidebar

- Background: `#002738` (Deep Navy)
- Transition: `background-color 0.3s ease`

### Footer

- Background: `#00354D` (Dark Teal)
- Text: `#FFF4E5` (Warm White)
- Height: `60px`, centered vertically via `line-height: 60px`
- Position: `absolute bottom-0 width-100%`

### Cards (React)

- Background: `bg-card` (`#ffffff`)
- Border: `border` token (`hsl(214.3 31.8% 91.4%)`)
- Border radius: `rounded-lg` (`0.5rem`)
- Shadow: `shadow-lg`

### Form Inputs

- Height: `h-10`
- Border radius: `rounded-md`
- Full width by default
- Focus ring: Deep Navy (`#002738` / `--ring` token)

### Toast Notifications

- Position: fixed top-right (`top-0 end-0 p-3`)
- Component: Bootstrap Toast
- Trigger via `setToast(message, type)` in `static/app/js/toast.js`

### Tables

- Component: DataTables 1.13.x with Bootstrap 5 theme
- Sortable and searchable by default
- Initialised via `static/app/js/tables.js`

### Charts

- Library: Plotly 3.0.1
- Used for interactive dashboards and outcome tracking visualisations

---

## Iconography

| Library | Usage |
|---|---|
| Bootstrap Icons 1.10.5 | Primary icon set on Django-template pages |
| Font Awesome 5.15.3 | Supplemental icons where Bootstrap Icons lacks coverage |

- Use icons at consistent sizes within a context (e.g. all nav icons 1rem)
- Icons must have accessible labels (`aria-label` or accompanying visible text)

---

## Brand Voice and Tone

| Principle | Description |
|---|---|
| Clinical but warm | Professional enough for healthcare; approachable for practitioners |
| Data confident | Clear, precise language around metrics, outcomes, and reports |
| Reassuring | Privacy and security language should be calm, not alarming |
| Concise | Short sentences; avoid jargon where plain language works |

---

## Accessibility

- **Color contrast**: All text must meet WCAG AA minimum (4.5:1 for body, 3:1 for large text)
  - Deep Navy `#002738` on `#F5F5F5` passes AA
  - Warm White `#FFF4E5` on `#00354D` passes AA
- **Focus rings**: All interactive elements use the Deep Navy focus ring (`:focus-visible`)
- **Icons**: Always pair decorative icons with visible text or `aria-label`
- **Forms**: All inputs must have associated `<label>` elements
- **Disabled states**: Use `opacity-50` (Tailwind) or Bootstrap `.disabled` - never remove focus styling

---

## File References

| Asset | Path |
|---|---|
| Primary logo (light) | `static/images/Light_Primary_Logo.svg` |
| Dark logo | `static/images/Dark_Logo.svg` |
| Condensed logo | `static/images/Primary_Condensed_Logo_Light.svg` |
| Base CSS (legacy) | `static/css/base.css` |
| React design tokens | `frontend/src/index.css` |
| React UI components | `frontend/src/components/ui/` |
| Toast JS utility | `static/app/js/toast.js` |
| Tables JS utility | `static/app/js/tables.js` |
| Full design system docs | `docs/UI/STYLE_AND_DESIGN.md` |
