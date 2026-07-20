# Backend Critical Fixes Report

## Summary

Fixed 10 critical backend issues across the e-commerce app. All changes are in `apps/web/lib/` with one API route update.

## Fixes Applied

### Fix 1: Duplicate order creation on payment retry
**File:** `apps/web/lib/services/checkout-service.ts:77-85`
Added idempotency check at the start of `verifyPayment`. Before creating a new order, checks if a `Payment` record already exists with the given `razorpayPaymentId`. If found and an associated order exists, returns the existing order instead of creating a duplicate.

### Fix 2: createRazorpayOrder signature + notes
**File:** `apps/web/lib/services/checkout-service.ts:13,42-43`
- Added `shippingAddress?: Record<string, unknown>` parameter
- Stores `expectedAmount` (computed total) in Razorpay order notes
- Stores `couponCode` in notes if provided
- Updated API route at `apps/web/app/api/razorpay/create-order/route.ts:14` to pass `body.shippingAddress`

### Fix 3: Price mismatch prevention
**File:** `apps/web/lib/services/checkout-service.ts:110-114`
In `verifyPayment`, fetches the Razorpay order and compares `notes.expectedAmount` with the recomputed total. Throws if mismatch detected, preventing amount tampering.

### Fix 4: Coupon oversubscription race condition
**File:** `apps/web/lib/services/coupon-service.ts:12-48`
Wrapped coupon validation in `prisma.$transaction`. Usage count check and coupon lookup are now atomic within the transaction context, reducing the race window between concurrent requests.

### Fix 5: Missing Printify env var validation
**Files:**
- `apps/web/lib/printify/orders.ts:5`
- `apps/web/lib/printify/products.ts:5`
- `apps/web/lib/printify/webhooks.ts:5`
Added runtime validation that `PRINTIFY_SHOP_ID` is configured at module load time.

### Fix 6: Missing Razorpay env var validation
**File:** `apps/web/lib/razorpay.ts:3-7`
Added validation for `RAZORPAY_KEY_ID` and `RAZORPAY_KEY_SECRET` before creating the Razorpay instance.

### Fix 7: Timing-safe HMAC comparison
**File:** `apps/web/lib/services/fulfillment-service.ts:73-78`
Replaced string comparison (`!==`) with `crypto.timingSafeEqual` for Printify webhook signature verification. Uses length check + buffer comparison to prevent timing attacks.

### Fix 8: `as any` casts in order-repo
**File:** `apps/web/lib/repositories/order-repo.ts:4,39,64,68`
Defined `OrderStatus` union type and replaced all `as any` casts with `as OrderStatus`.

### Fix 9: Printify fetch timeout
**File:** `apps/web/lib/printify/client.ts:26-28,54-56`
Added `AbortController` with 30-second timeout to all Printify API requests. Controller is properly cleaned up in all paths via `finally` block.

### Fix 10: Redis error handler
**File:** `apps/web/lib/redis.ts:2,8`
Added Redis connection error handler that logs errors via the structured logger.

## Files Modified

| File | Summary |
|------|---------|
| `apps/web/lib/services/checkout-service.ts` | Fixes 1, 2, 3 |
| `apps/web/lib/services/coupon-service.ts` | Fix 4 |
| `apps/web/lib/services/fulfillment-service.ts` | Fix 7 |
| `apps/web/lib/printify/orders.ts` | Fix 5 |
| `apps/web/lib/printify/products.ts` | Fix 5 |
| `apps/web/lib/printify/webhooks.ts` | Fix 5 |
| `apps/web/lib/printify/client.ts` | Fix 9 |
| `apps/web/lib/razorpay.ts` | Fix 6 |
| `apps/web/lib/repositories/order-repo.ts` | Fix 8 |
| `apps/web/lib/redis.ts` | Fix 10 |
| `apps/web/app/api/razorpay/create-order/route.ts` | Update for Fix 2 |
