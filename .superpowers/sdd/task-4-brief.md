# Task 1.4: Set up Tailwind v4 with design tokens

**Plan:** Plan 01 — Foundation & Project Setup
**Depends on:** Task 1.1 (monorepo)
**Produces:** Themed Next.js 16 app with Inter font, design tokens, placeholder page

## Files to Create

- `apps/web/app/globals.css`
- `apps/web/app/layout.tsx`
- `apps/web/app/page.tsx`
- `apps/web/postcss.config.mjs`

## Steps

### Step 1: Create apps/web/postcss.config.mjs
```javascript
/** @type {import('postcss-load-config').Config} */
const config = {
  plugins: {
    "@tailwindcss/postcss": {},
  },
};

export default config;
```

### Step 2: Create apps/web/app/globals.css

```css
@import "tailwindcss";

:root {
  --bg: #ffffff;
  --surface: #f8f9fa;
  --surface-raised: #ffffff;
  --surface-inverse: #1a1a2e;

  --fg: #1a1a2e;
  --fg-muted: #6b7280;
  --fg-faint: #9ca3af;
  --fg-inverse: #ffffff;

  --border: #e5e7eb;
  --border-strong: #d1d5db;

  --accent: #2563eb;
  --accent-fg: #ffffff;
  --accent-hover: #1d4ed8;
  --accent-muted: #dbeafe;

  --success: #059669;
  --success-bg: #ecfdf5;
  --warning: #d97706;
  --warning-bg: #fffbeb;
  --error: #dc2626;
  --error-bg: #fef2f2;
  --info: #0284c7;
  --info-bg: #f0f9ff;

  --overlay: rgba(0, 0, 0, 0.5);

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

### Step 3: Create apps/web/app/layout.tsx
```typescript
import type { Metadata } from "next";
import { Inter } from "next/font/google";
import "./globals.css";

const inter = Inter({ subsets: ["latin"], variable: "--font-sans" });

export const metadata: Metadata = {
  title: "POD Store",
  description: "Premium print-on-demand products",
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en" className={inter.variable}>
      <body>{children}</body>
    </html>
  );
}
```

### Step 4: Create apps/web/app/page.tsx
```typescript
export default function HomePage() {
  return (
    <main className="max-w-7xl mx-auto px-4 md:px-6 lg:px-8 py-12 md:py-16 lg:py-24">
      <h1 className="text-4xl md:text-5xl lg:text-6xl font-bold text-foreground">POD Store</h1>
      <p className="text-lg md:text-xl text-foreground-muted mt-4">Coming soon.</p>
    </main>
  );
}
```

### Step 5: Verify Tailwind is working
```bash
pnpm dev
```

Open localhost:3000 — page should show "POD Store" heading in Inter font, styled with Tailwind tokens.

## Notes

- Task 1.1 already created minimal layout.tsx and page.tsx that made the dev server start — these will be REPLACED with the styled versions above
- Tailwind v4 uses `@import "tailwindcss"` not `@tailwind base/components/utilities`
- No tailwind.config.ts — all tokens in CSS via @theme inline
- All classes reference project tokens: `text-foreground`, `text-foreground-muted` — never `text-gray-900` etc.
