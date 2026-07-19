# Task 1.6 Report: Install shadcn/ui primitives

**Status:** Done

**Commits:** `2cf4416` — feat: install shadcn/ui primitives (Task 1.6)

## Summary

- Ran `shadcn@latest init --defaults` — created `components.json`, `button.tsx`, updated `globals.css`, `utils.ts`, `layout.tsx`
- Installed 8 components individually: `input`, `badge`, `card`, `skeleton`, `dialog`, `dropdown-menu`, `table`, `sonner`
- `toast` is deprecated in shadcn v4 registry — replaced with `sonner` (shadcn's recommended toast alternative)
- Restored custom utility functions (`formatCurrency`, `formatDate`, `slugify`) that shadcn init overwrote
- Mapped shadcn CSS variables (`--background`, `--foreground`, `--card`, etc.) to our custom design tokens for consistency
- Replaced Inter font with Geist (shadcn v4 default); cleaned up unused Inter import
- Added dependencies: `class-variance-authority`, `lucide-react`
- Verified `pnpm dev` starts successfully (Next.js 16.2.10)

## Components installed

| Component | File |
|-----------|------|
| button | `components/ui/button.tsx` |
| input | `components/ui/input.tsx` |
| badge | `components/ui/badge.tsx` |
| card | `components/ui/card.tsx` |
| skeleton | `components/ui/skeleton.tsx` |
| dialog | `components/ui/dialog.tsx` |
| dropdown-menu | `components/ui/dropdown-menu.tsx` |
| table | `components/ui/table.tsx` |
| sonner | `components/ui/sonner.tsx` |

**Concerns:**
- `npx shadcn@latest add ... --yes` with multiple components silently exits without installing anything. Must install components one at a time.
- `toast` component is removed from shadcn v4 registry. Replaced with `sonner`.
- shadcn init overwrote `lib/utils.ts` (deleted `formatCurrency`, `formatDate`, `slugify`) — restored manually.
- shadcn init replaced Inter font with Geist in `layout.tsx` — kept Geist (shadcn default).
- shadcn init overwrote custom `--border` and `--accent` hex values with oklch — restored original design token values.

**Report path:** `D:\Projects\web\pod\.superpowers\sdd\task-6-report.md`
