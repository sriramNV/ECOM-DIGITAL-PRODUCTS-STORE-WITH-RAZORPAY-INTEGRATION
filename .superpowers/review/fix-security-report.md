# Security Fix Report

## Summary

Fixed 4 security issues in the Next.js e-commerce application.

## Issues Fixed

### C1: Admin API routes had zero authentication (Critical)

Created `apps/web/lib/admin-guard.ts` — a reusable helper that verifies the session exists and the user has `ADMIN` role, returning `401 Unauthorized` or `403 Forbidden` responses as appropriate.

Added the guard to 12 admin/analytics/logs/cms/promotions API route files:
- `apps/web/app/api/admin/stats/route.ts` — GET
- `apps/web/app/api/admin/settings/route.ts` — GET, PATCH
- `apps/web/app/api/admin/customers/route.ts` — GET
- `apps/web/app/api/admin/orders/route.ts` — GET
- `apps/web/app/api/admin/orders/[id]/route.ts` — GET, PATCH
- `apps/web/app/api/analytics/overview/route.ts` — GET
- `apps/web/app/api/analytics/revenue/route.ts` — GET
- `apps/web/app/api/analytics/funnel/route.ts` — GET
- `apps/web/app/api/logs/audit/route.ts` — GET
- `apps/web/app/api/cms/pages/route.ts` — POST only (GET kept public for storefront)
- `apps/web/app/api/cms/pages/[id]/route.ts` — PATCH only (GET kept public)
- `apps/web/app/api/promotions/coupons/route.ts` — POST only (GET kept public)

### C2: IDOR in cart item DELETE (High)

**File:** `apps/web/app/api/cart/items/[id]/route.ts`

**Vulnerability:** The DELETE handler used `cartRepo.removeItem(id)` without verifying the cart item belonged to the authenticated user. Any user could delete any cart item by its ID.

**Fix:** Replaced with direct Prisma queries that scope the delete to the authenticated user's cart. First looks up the user's cart, then verifies the item belongs to that cart before deleting.

### C3: Stored XSS in CMS text-block (High)

**File:** `apps/web/components/storefront/blocks/text-block.tsx`

**Vulnerability:** Used `dangerouslySetInnerHTML={{ __html: content.body }}` which rendered raw HTML from CMS data, allowing stored XSS attacks through the CMS.

**Fix:** Replaced with safe `<p>` tag rendering. The content is now split on newlines and each paragraph is rendered as a `<p>` element with React's built-in text escaping.

### C4: Missing security headers in proxy (Medium)

**File:** `apps/web/proxy.ts`

**Vulnerability:** No `X-Content-Type-Options`, `X-Frame-Options`, or `Referrer-Policy` headers were set on responses.

**Fix:** Added security headers to the response using `NextResponse.next()`:
- `X-Content-Type-Options: nosniff` — prevents MIME type sniffing
- `X-Frame-Options: DENY` — prevents clickjacking
- `Referrer-Policy: strict-origin-when-cross-origin` — controls referrer information leakage
