# Task 8.4: Create audit log and settings pages

**Plan:** Plan 08 lines 243-263
**Files:**
- `apps/web/app/api/logs/audit/route.ts`
- `apps/web/app/api/admin/settings/route.ts`
- `apps/web/app/admin/logs/page.tsx`
- `apps/web/app/admin/settings/page.tsx`
- `apps/web/components/admin/logs/audit-log-viewer.tsx`

For audit log API: GET with ?action, ?entity, ?entityId filters using prisma.auditLog.findMany.

For settings API: GET returns current env vars (app name, currency, etc). PATCH updates env (for display only — real update requires server restart).

For audit-log-viewer.tsx: DataTable with columns: Action, Entity, Entity ID, User, Timestamp. Search by action type. Use TanStack Query.

For logs/page.tsx: Render AuditLogViewer.

For settings/page.tsx: Show form fields for app settings read from API.

Commit:
```bash
git add apps/web/app/api/logs apps/web/app/api/admin/settings apps/web/app/admin/logs apps/web/app/admin/settings apps/web/components/admin/logs
git commit -m "feat: add audit log viewer and admin settings pages"
```
