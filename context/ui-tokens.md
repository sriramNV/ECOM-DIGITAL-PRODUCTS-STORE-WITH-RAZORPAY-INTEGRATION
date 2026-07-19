# UI Tokens

Design tokens for the POD e-commerce platform. Clean, modern, trust-oriented e-commerce design — high contrast, clear hierarchy, accessible, conversion-focused. The design prioritizes product imagery and clarity over decoration.

**Reference tier:** Standard Oil, Allbirds, Taylor Stitch — minimalist e-commerce that lets products speak.

---

## How to Use

This project uses **Tailwind CSS v4**. Tokens are defined as CSS custom properties on `:root`, then exposed to Tailwind via `@theme inline`. Components use semantic token names only — never raw color values.

```tsx
// Correct — semantic, theme-aware
className="bg-background text-foreground"

// Never
className="bg-white"
className="text-[#1a1a1a]"
```

---

## globals.css — Complete Token Definition

```css
@import "tailwindcss";

:root {
  /* Backgrounds */
  --bg: #ffffff;
  --surface: #f8f9fa;
  --surface-raised: #ffffff;
  --surface-inverse: #1a1a2e;

  /* Text */
  --fg: #1a1a2e;
  --fg-muted: #6b7280;
  --fg-faint: #9ca3af;
  --fg-inverse: #ffffff;

  /* Borders */
  --border: #e5e7eb;
  --border-strong: #d1d5db;

  /* Brand / Accent */
  --accent: #2563eb;
  --accent-fg: #ffffff;
  --accent-hover: #1d4ed8;
  --accent-muted: #dbeafe;

  /* Semantic */
  --success: #059669;
  --success-bg: #ecfdf5;
  --warning: #d97706;
  --warning-bg: #fffbeb;
  --error: #dc2626;
  --error-bg: #fef2f2;
  --info: #0284c7;
  --info-bg: #f0f9ff;

  /* Overlay */
  --overlay: rgba(0, 0, 0, 0.5);

  /* Shadows */
  --shadow-sm: 0 1px 2px rgba(0, 0, 0, 0.05);
  --shadow-md: 0 4px 6px -1px rgba(0, 0, 0, 0.1);
  --shadow-lg: 0 10px 15px -3px rgba(0, 0, 0, 0.1);
  --shadow-xl: 0 20px 25px -5px rgba(0, 0, 0, 0.1);
}

@theme inline {
  --font-sans: var(--font-inter), system-ui, sans-serif;

  --color-background: var(--bg);
  --color-surface: var(--surface);
  --color-surface-raised: var(--surface-raised);
  --color-surface-inverse: var(--surface-inverse);

  --color-foreground: var(--fg);
  --color-foreground-muted: var(--fg-muted);
  --color-foreground-faint: var(--fg-faint);
  --color-foreground-inverse: var(--fg-inverse);

  --color-border: var(--border);
  --color-border-strong: var(--border-strong);

  --color-accent: var(--accent);
  --color-accent-foreground: var(--accent-fg);
  --color-accent-hover: var(--accent-hover);
  --color-accent-muted: var(--accent-muted);

  --color-success: var(--success);
  --color-success-background: var(--success-bg);
  --color-warning: var(--warning);
  --color-warning-background: var(--warning-bg);
  --color-error: var(--error);
  --color-error-background: var(--error-bg);
  --color-info: var(--info);
  --color-info-background: var(--info-bg);

  --color-overlay: var(--overlay);

  --shadow-sm: var(--shadow-sm);
  --shadow-md: var(--shadow-md);
  --shadow-lg: var(--shadow-lg);
  --shadow-xl: var(--shadow-xl);

  --radius-sm: 4px;
  --radius-md: 8px;
  --radius-lg: 12px;
  --radius-xl: 16px;
  --radius-full: 9999px;
}

body {
  background: var(--bg);
  color: var(--fg);
  font-family: var(--font-sans);
}
```

---

## Color Usage Guide

### Page Layout

| Element | Token |
|---------|-------|
| Page background | `bg-background` |
| Card / raised panel | `bg-surface-raised border border-border` |
| Section background | `bg-surface` |
| Inverse / dark section | `bg-surface-inverse text-foreground-inverse` |
| Overlay / modal backdrop | `bg-overlay` |

### Typography

| Element | Token |
|---------|-------|
| Primary text / headings | `text-foreground` |
| Secondary / body text | `text-foreground-muted` |
| Placeholder / meta | `text-foreground-faint` |
| Text on accent background | `text-accent-foreground` |

### Accent

| Element | Token |
|---------|-------|
| Primary button background | `bg-accent` |
| Primary button text | `text-accent-foreground` |
| Primary button hover | `bg-accent-hover` |
| Links | `text-accent hover:underline` |
| Subtle accent bg | `bg-accent-muted` |

### Semantic

| Element | Token |
|---------|-------|
| Success (shipped, paid) | `text-success` / `bg-success-background` |
| Warning (pending, processing) | `text-warning` / `bg-warning-background` |
| Error (failed, refunded) | `text-error` / `bg-error-background` |
| Info (note, update) | `text-info` / `bg-info-background` |

---

## Typography

| Element | Size | Weight | Line Height | Token |
|---------|------|--------|-------------|-------|
| Hero headline | `text-4xl md:text-5xl lg:text-6xl` | 700 (bold) | 1.1 | `text-foreground` |
| Section heading | `text-2xl md:text-3xl` | 600 (semibold) | 1.2 | `text-foreground` |
| Card title | `text-lg font-semibold` | 600 | 1.3 | `text-foreground` |
| Product title | `text-xl` | 500 | 1.3 | `text-foreground` |
| Body text | `text-base` | 400 | 1.6 | `text-foreground-muted` |
| Small / meta | `text-sm` | 400 | 1.5 | `text-foreground-faint` |
| Price (large) | `text-2xl font-bold` | 700 | 1 | `text-foreground` |
| Price (sale) | `text-lg font-semibold` | 600 | 1 | `text-error` |
| Eyebrow / label | `text-xs uppercase tracking-wider` | 500 | 1 | `text-foreground-faint` |
| Button text | `text-sm font-medium` | 500 | 1 | varies |
| Nav link | `text-sm font-medium` | 500 | 1 | `text-foreground muted-hover` |

---

## Spacing

| Token | Value | Usage |
|-------|-------|-------|
| `gap-1` | 4px | Inline icon/text gaps |
| `gap-2` | 8px | Tag/badge gaps, button icon spacing |
| `gap-3` | 12px | Form field internal spacing |
| `gap-4` | 16px | Card internal padding, grid gaps |
| `gap-6` | 24px | Section internal spacing, form groups |
| `gap-8` | 32px | Between related sections |
| `gap-12` | 48px | Between major sections |
| `gap-16` | 64px | Page section separators |
| Page horizontal | `px-4 md:px-6 lg:px-8` | Consistent page padding |
| Section vertical | `py-12 md:py-16 lg:py-24` | Every full section |
| Product grid | `grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4 md:gap-6` | Responsive product grid |
| Max content width | `max-w-7xl mx-auto` | Constrained content areas |

---

## Component Tokens

### Buttons

**Primary:**
```
bg-accent text-accent-foreground hover:bg-accent-hover
rounded-lg px-6 py-3 text-sm font-medium
transition-colors duration-200
disabled:opacity-50 disabled:cursor-not-allowed
```

**Secondary (outline):**
```
bg-transparent text-foreground border border-border-strong
hover:bg-surface
rounded-lg px-6 py-3 text-sm font-medium
transition-colors duration-200
```

**Ghost:**
```
bg-transparent text-foreground-muted hover:text-foreground hover:bg-surface
rounded-lg px-3 py-2 text-sm font-medium
transition-colors duration-200
```

**Danger:**
```
bg-error text-white hover:bg-error/90
rounded-lg px-6 py-3 text-sm font-medium
```

**Size variants:**
- `sm`: `px-3 py-1.5 text-xs`
- `default`: `px-6 py-3 text-sm`
- `lg`: `px-8 py-4 text-base`
- `icon`: `h-10 w-10 p-2`

### Cards

```
bg-surface-raised border border-border rounded-lg overflow-hidden
shadow-sm hover:shadow-md transition-shadow duration-200
```

### Form Inputs

```
w-full rounded-lg border border-border bg-background px-4 py-3 text-sm
placeholder:text-foreground-faint
focus:outline-none focus:ring-2 focus:ring-accent focus:border-transparent
disabled:opacity-50 disabled:cursor-not-allowed
transition-colors duration-200
```

### Selects
Same as inputs, with `appearance-none` and custom chevron.

### Data Tables (Admin)

```
w-full border-collapse
th: bg-surface text-foreground-faint text-xs uppercase tracking-wider font-medium px-4 py-3 text-left
td: px-4 py-3 text-sm border-t border-border
tr:hover: bg-surface/50
```

### Badges

```
inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-medium
Status variants:
  - paid/shipped/delivered: bg-success-background text-success
  - pending/processing: bg-warning-background text-warning
  - failed/cancelled/refunded: bg-error-background text-error
  - draft/archived: bg-surface text-foreground-muted
```

### Skeleton Loading

```
animate-pulse rounded bg-surface
```

---

## Admin Dashboard Tokens

| Element | Token |
|---------|-------|
| Sidebar background | `bg-surface-inverse text-foreground-inverse` |
| Sidebar active item | `bg-white/10 text-white` |
| Sidebar hover item | `bg-white/5 text-white/80` |
| Admin topbar | `bg-surface-raised border-b border-border` |
| Stat card background | `bg-surface-raised border border-border` |
| Stat card value | `text-2xl font-bold text-foreground` |
| Stat card label | `text-sm text-foreground-faint` |
| Chart area | `bg-surface-raised border border-border rounded-lg p-6` |

---

## Invariants

- Never use hex values directly in components — always use CSS variables via Tailwind tokens
- Never use raw Tailwind color classes like `bg-black`, `text-white`, `bg-gray-100` — use project tokens only
- All borders default to `border-border` or `border-border-strong`
- Section vertical padding always uses the `py-12 md:py-16 lg:py-24` scale
- Product grid columns are responsive, never fixed
- Every new token must be added to both the `:root` block and `@theme inline` block
- Skeleton loading states must match the dimensions of the content they replace (prevent layout shift)
