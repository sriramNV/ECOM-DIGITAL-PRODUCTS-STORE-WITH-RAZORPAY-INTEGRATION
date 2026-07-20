# Fix: Input Validation & Error Handling on API Routes

## Changes Made

### Fix 1: Shared Error Handler

**Created:** `apps/web/lib/api-error-handler.ts`
- `handleApiError(error, context?)` — catches errors, logs them via pino, returns 500 JSON response

### Fix 2: Zod Validation Schemas

**Created:** `apps/web/lib/schemas.ts`
- `validateBody(schema, body)` — shared helper that returns `{ data }` or `{ error: NextResponse }` (400 with Zod details)
- **Schemas:** `cartAddSchema`, `cartMergeSchema`, `couponCreateSchema`, `cmsPageSchema`, `adminOrderActionSchema`, `adminSettingsSchema`, `shippingAddressSchema`, `auditLogQuerySchema`, `revenueQuerySchema`, `customerQuerySchema`, `orderQuerySchema`

### Fix 3: Try/Catch Added to 15 API Route Files

| Route | Handlers |
|---|---|
| `apps/web/app/api/admin/stats/route.ts` | GET |
| `apps/web/app/api/admin/settings/route.ts` | GET, PATCH (+ validation) |
| `apps/web/app/api/admin/customers/route.ts` | GET |
| `apps/web/app/api/admin/orders/route.ts` | GET |
| `apps/web/app/api/admin/orders/[id]/route.ts` | GET, PATCH (+ validation) |
| `apps/web/app/api/logs/audit/route.ts` | GET |
| `apps/web/app/api/analytics/overview/route.ts` | GET |
| `apps/web/app/api/analytics/revenue/route.ts` | GET |
| `apps/web/app/api/analytics/funnel/route.ts` | GET |
| `apps/web/app/api/promotions/coupons/route.ts` | GET, POST (+ validation) |
| `apps/web/app/api/cart/route.ts` | GET, POST (+ validation) |
| `apps/web/app/api/cart/merge/route.ts` | POST (+ validation) |
| `apps/web/app/api/cart/items/[id]/route.ts` | DELETE |
| `apps/web/app/api/razorpay/webhooks/route.ts` | POST |
| `apps/web/app/api/cms/pages/route.ts` | POST (+ validation) |

### Fix 4: Checkout Service Validation

**File:** `apps/web/lib/services/checkout-service.ts`
- Added `shippingAddressSchema` validation in `createRazorpayOrder` and `verifyPayment`
- Added stock check (`item.variant.stock < item.quantity`) in both methods (Variant model has `stock` field with default 999)

### TypeScript Check

```
npx tsc --noEmit — no errors in changed files (single pre-existing error in lib/printify/orders.ts:29)
```
