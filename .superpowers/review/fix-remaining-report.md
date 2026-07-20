# Fix Remaining Issues — Report

**Date:** 2026-07-20

## Summary

Applied 10 fixes across the codebase to address frontend and misc issues. Two new API routes were also created.

## Completed Fixes

| # | File | Change | Status |
|---|------|--------|--------|
| 1 | `apps/web/components/auth/login-form.tsx` | Guest cart merge now reads items from `localStorage("guest-cart")` and removes key after POST | ✅ |
| 2 | `apps/web/components/storefront/blocks/newsletter-block.tsx` | Added `status` state and async `handleSubmit` that POSTs to `/api/newsletter/subscribe` | ✅ |
| 3 | `apps/web/app/(marketing)/contact/page.tsx` | Converted to client component with controlled inputs, `handleSubmit` posting to `/api/contact`, and status feedback | ✅ |
| 4 | `apps/web/components/admin/products/product-form.tsx` | Added `useEffect` to re-populate state fields when `product` query data loads | ✅ |
| 5 | `apps/web/app/admin/customers/[id]/page.tsx` | Added `setNotes(data.notes ?? [])` after `setOrders()` in fetch callback | ✅ |
| 6 | `apps/web/components/admin/orders/order-actions.tsx` | Wrapped fetch in try/catch, added response `!res.ok` error check with `alert()` | ✅ |
| 7 | `apps/web/app/(storefront)/products/page.tsx` | Imported `Pagination` from shared components, rendered after `ProductGrid` when `totalPages > 1` | ✅ |
| 8 | `apps/web/app/api/admin/settings/route.ts` | Replaced in-memory `pendingSettings` with Redis persistence via `loadSettings()`/`saveSettings()` | ✅ |
| 9 | `apps/web/app/(storefront)/products/page.tsx` | Moved `productRepo.list()` fetch into `ProductGridSection` component wrapped with `<Suspense>` | ✅ |
| 10 | `apps/web/components/storefront/shared/pagination.tsx` | Replaced static `Math.min(totalPages, 5)` with sliding window `getPageNumbers()` logic | ✅ |

## New API Routes Created

- `apps/web/app/api/newsletter/subscribe/route.ts` — POST handler with email validation
- `apps/web/app/api/contact/route.ts` — POST handler with required field validation
