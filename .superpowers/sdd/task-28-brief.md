# Task 6.5: Create customer CRM pages

**Plan:** Plan 06 lines 434-482
**Files:**
- `apps/web/app/admin/customers/page.tsx`
- `apps/web/app/admin/customers/[id]/page.tsx`
- `apps/web/components/admin/crm/customer-table.tsx`
- `apps/web/components/admin/crm/customer-detail.tsx`
- `apps/web/app/api/admin/customers/route.ts`

Full code for API endpoint in plan lines 447-475.

For customer-table.tsx: Use DataTable with columns: Name, Email, Orders, Last Order, Joined.
For customer-detail.tsx: Show customer info, order history, notes.
For pages: Render respective components.

Commit:
```bash
git add apps/web/app/admin/customers apps/web/components/admin/crm apps/web/app/api/admin/customers
git commit -m "feat: add customer CRM pages with order history"
```
