# Task 6.1: Create admin shell layout and topbar

**Plan:** Plan 06 lines 73-207
**Files:**
- `apps/web/components/admin/layout/admin-shell.tsx`
- `apps/web/components/admin/layout/sidebar.tsx`
- `apps/web/components/admin/layout/topbar.tsx`
- `apps/web/components/admin/layout/nav-items.ts`
- `apps/web/app/admin/layout.tsx`
- `apps/web/app/admin/page.tsx`

Full code in plan. Create exactly as specified. Topbar can be minimal:
```typescript
"use client";
import { auth } from "@/lib/auth";
import { useEffect, useState } from "react";

export function Topbar() {
  const [name, setName] = useState("Admin");
  useEffect(() => { fetch("/api/auth/session").then(r => r.json()).then(s => setName(s?.user?.name ?? "Admin")) }, []);
  return (
    <header className="h-14 border-b border-border flex items-center justify-between px-6 bg-surface">
      <div />
      <span className="text-sm text-foreground-muted">{name}</span>
    </header>
  );
}
```

Commit:
```bash
git add apps/web/components/admin/layout apps/web/app/admin/layout.tsx apps/web/app/admin/page.tsx
git commit -m "feat: add admin shell with sidebar navigation"
```
