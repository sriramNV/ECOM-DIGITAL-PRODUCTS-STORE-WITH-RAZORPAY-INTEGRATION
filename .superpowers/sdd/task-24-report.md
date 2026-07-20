# Task 6.1 Report: Admin shell layout

**Status:** ✅ Complete

**Files created (6):**
- `apps/web/components/admin/layout/nav-items.ts` — nav item definitions with lucide-react icons
- `apps/web/components/admin/layout/sidebar.tsx` — client-side sidebar with active link highlighting
- `apps/web/components/admin/layout/topbar.tsx` — minimal topbar with user name fetched from session
- `apps/web/components/admin/layout/admin-shell.tsx` — shell layout composing sidebar + topbar + content
- `apps/web/app/admin/layout.tsx` — server layout with auth gate (redirects non-ADMIN to /login)
- `apps/web/app/admin/page.tsx` — redirects `/admin` to `/admin/dashboard`

**Commit:** `0f5bc4c` — `feat: add admin shell with sidebar navigation`

**Dependencies used:** `lucide-react`, `next/navigation`, `@/lib/auth`, `@/lib/utils`
