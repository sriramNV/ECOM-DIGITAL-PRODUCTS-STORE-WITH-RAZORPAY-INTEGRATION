# Task 6.5 Report — Customer CRM Pages

**Status:** ✅ Complete

## Files Created

| File | Description |
|------|-------------|
| `apps/web/app/api/admin/customers/route.ts` | API endpoint — searches customers by name/email, returns with `_count.orders` and last order |
| `apps/web/components/admin/crm/types.ts` | Shared TypeScript types (`Customer`, `CustomerOrder`) |
| `apps/web/components/admin/crm/customer-table.tsx` | DataTable with columns: Name, Email, Orders (badge), Last Order (amount), Joined (date). Rows link to customer detail page |
| `apps/web/components/admin/crm/customer-detail.tsx` | Customer info section, order history cards (with items, status badges), and order notes section |
| `apps/web/app/admin/customers/page.tsx` | Customer list page with search input, fetches from `/api/admin/customers` |
| `apps/web/app/admin/customers/[id]/page.tsx` | Customer detail page, fetches customer by `id` URL param |

## Implementation Notes

- **6 files total** (5 required + `types.ts` as shared dependency)
- Uses existing `DataTable` component from `@/components/ui/data-table`
- Uses existing `Badge` component from `@/components/ui/badge`
- Uses existing `formatDate` utility from `@/lib/utils`
- API endpoint follows the exact code from plan lines 447-475 (added `createdAt` and `id` to order selection for detail page)
- Client components use `useEffect` + `fetch` for data loading
- Pre-existing build errors (`printify/orders.ts` syntax, missing `order-status-badge`) are unrelated

**Commit:** `1d29519` — `feat: add customer CRM pages with order history`
