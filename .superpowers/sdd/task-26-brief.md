# Task 6.3: Create order management pages

**Plan:** Plan 06 lines 258-357
**Files:**
- `apps/web/app/admin/orders/page.tsx`
- `apps/web/app/admin/orders/[id]/page.tsx`
- `apps/web/components/admin/orders/order-table.tsx`
- `apps/web/components/admin/orders/order-detail.tsx`
- `apps/web/components/admin/orders/order-status-badge.tsx`
- `apps/web/components/admin/orders/order-actions.tsx`
- `apps/web/app/api/admin/orders/route.ts`
- `apps/web/app/api/admin/orders/[id]/route.ts`

Note: The plan doesn't have explicit API routes for orders. Create them:
- `api/admin/orders/route.ts` — GET with ?limit, ?status, ?search params using orderRepo
- `api/admin/orders/[id]/route.ts` — PATCH that handles actions: submit_to_printify, cancel, mark_delivered

Full code for status-badge and actions in plan lines 278-351.

For order-table.tsx, use DataTable similar to product-table.tsx.
For order-detail.tsx, show order info, items table, status history.
For orders/page.tsx, render OrderTable.
For orders/[id]/page.tsx, render OrderDetail + OrderActions.

**Important:** Make sure to use `"use client"` for components that use hooks (useQuery, useRouter, useState).

Commit:
```bash
git add apps/web/app/admin/orders apps/web/components/admin/orders apps/web/app/api/admin/orders
git commit -m "feat: add order management pages with actions"
```
