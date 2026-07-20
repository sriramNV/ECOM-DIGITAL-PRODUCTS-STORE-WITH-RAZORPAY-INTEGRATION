# API & Service Layer Code Review

**Date:** 2026-07-20  
**Scope:** All API routes, repositories, services, Printify modules, and utility libraries in `apps/web/`

---

## Critical Issues (Must Fix Now)

### C1. Duplicate order creation on payment verification retry

**Files:** `apps/web/lib/services/checkout-service.ts:59-155`, `apps/web/app/api/razorpay/webhooks/route.ts:26-41`

The `verifyPayment` method is **not idempotent**. If the client retries the same `razorpay_payment_id` (network timeout, user double-click, browser re-send), a **new duplicate order is created** for the same payment. There is no check for existing payment records before creating the order.

The webhook handler also has no dedup that would prevent this — it looks up payments by `razorpayPaymentId` but only acts on `PENDING_PAYMENT` orders, while `verifyPayment` always creates orders as `PAID`.

**Fix:** Add an idempotency check at the start of `verifyPayment`:
```ts
const existingPayment = await prisma.payment.findUnique({
  where: { razorpayPaymentId: paymentId }
});
if (existingPayment) {
  // Return the existing order instead of creating a duplicate
  const order = await prisma.order.findUnique({ where: { id: existingPayment.orderId } });
  if (order) return { id: order.id, orderNumber: order.orderNumber };
}
```

Also add a unique constraint on `razorpayPaymentId` at the database level as a safety net.

---

### C2. No authentication on admin, analytics, promotions, or logs endpoints

**Files:**
- `apps/web/app/api/admin/stats/route.ts` — no auth
- `apps/web/app/api/admin/orders/route.ts` — no auth
- `apps/web/app/api/admin/orders/[id]/route.ts` — no auth
- `apps/web/app/api/admin/settings/route.ts` — no auth
- `apps/web/app/api/admin/customers/route.ts` — no auth
- `apps/web/app/api/logs/audit/route.ts` — no auth
- `apps/web/app/api/analytics/overview/route.ts` — no auth
- `apps/web/app/api/analytics/revenue/route.ts` — no auth
- `apps/web/app/api/analytics/funnel/route.ts` — no auth
- `apps/web/app/api/promotions/coupons/route.ts` — no auth
- `apps/web/app/api/cms/pages/route.ts:15` (POST) — no auth

Every single one of these routes exposes sensitive data (orders, customer PII, revenue, audit logs, admin settings) with **zero authentication or authorization**. Anyone who discovers these URLs can access them.

**Fix:** Add auth + admin role check to each:
```ts
const session = await auth();
if (!session?.user || session.user.role !== "ADMIN") {
  return NextResponse.json({ error: "Forbidden" }, { status: 403 });
}
```

---

### C3. Coupon race condition — oversubscription of limited-use coupons

**File:** `apps/web/lib/services/coupon-service.ts:27-32`

```ts
if (coupon.usageLimit) {
  const usageCount = await couponRepo.getUsageCount(coupon.id);
  if (usageCount >= coupon.usageLimit) {
    return { valid: false, discount: 0, code, error: "Coupon usage limit reached" };
  }
}
```

The usage check and order creation are not in a transaction. Two concurrent users can both pass the check before either order commits, allowing a coupon with `usageLimit: 1` to be used **multiple times**.

**Fix:** Move usage validation into a Prisma `$transaction` with a pessimistic check, or use Redis atomic increment/decrement as a token-bucket for coupon usage.

---

### C4. No stock/inventory check before order creation

**File:** `apps/web/lib/services/checkout-service.ts:13-57, 59-155`

Neither `createRazorpayOrder` nor `verifyPayment` verify that product variants have sufficient inventory. Users can purchase out-of-stock items, leading to fulfillment failures.

**Fix:** Add a stock check in both methods before proceeding. Query variant inventory and reject if insufficient.

---

### C5. Missing `PRINTIFY_SHOP_ID` env var leads to silent failure

**Files:**
- `apps/web/lib/printify/orders.ts:4`
- `apps/web/lib/printify/products.ts:4`
- `apps/web/lib/printify/webhooks.ts:4`

```ts
const SHOP_ID = process.env.PRINTIFY_SHOP_ID;
```

If `PRINTIFY_SHOP_ID` is unset, `SHOP_ID` is `undefined` and API calls go to `/shops/undefined/orders.json`. Printify returns a 404 which becomes a `PrintifyError` with no clear indication the config is wrong.

**Fix:** Validate at module init:
```ts
const SHOP_ID = process.env.PRINTIFY_SHOP_ID;
if (!SHOP_ID) throw new Error("PRINTIFY_SHOP_ID is not configured");
```

---

## Important Issues (Fix Before Production)

### I1. Price mismatch between order creation and payment verification

**File:** `apps/web/lib/services/checkout-service.ts`

`createRazorpayOrder` computes totals from cart items and creates a Razorpay order. `verifyPayment` **recomputes** totals from the cart again. If:
- Cart items changed between the two calls (user modified cart in another tab)
- Product prices changed (admin updated pricing)

The verified amount may differ from what the user authorized with Razorpay. The Razorpay signature verification ensures the payment IDs match, but **not the amount**.

**Fix:** Store the expected total in the Razorpay order notes during creation (`notes: { userId, expectedAmount }`) and verify it matches during payment verification. Or store the computed discount/coupon info in the Razorpay order notes and reuse it instead of re-validating.

---

### I2. Re-validation of coupon in verifyPayment is inconsistent

**File:** `apps/web/lib/services/checkout-service.ts:83-93`

```ts
const couponCode = shippingAddress?.couponCode as string | undefined;
// ...re-validates coupon...
```

The coupon is validated again during `verifyPayment` and extracted from `shippingAddress`. If the coupon expired between order creation and payment, the user sees a different discount. Also, `couponCode` is stored inside `shippingAddress` and then removed, which is fragile.

**Fix:** Store the coupon code and computed discount in the Razorpay order `notes` during `createRazorpayOrder`, then read them in `verifyPayment` instead of re-validating.

---

### I3. Missing input validation on several endpoints

**Files:**
- `apps/web/app/api/cart/route.ts:21` — no body validation for POST
- `apps/web/app/api/promotions/coupons/route.ts:10` — no body validation for POST
- `apps/web/app/api/cms/pages/route.ts:17` — no body validation for POST
- `apps/web/app/api/admin/orders/[id]/route.ts:20` — no validation for `action` field
- `apps/web/lib/services/checkout-service.ts:59` — `shippingAddress` is `Record<string, unknown>` with no schema

Any of these endpoints receiving malformed data will produce hard-to-debug runtime errors or Prisma-level validation failures.

**Fix:** Add Zod schemas for request bodies in all POST/PATCH/PUT endpoints.

---

### I4. In-memory admin settings — lost on restart, not thread-safe

**File:** `apps/web/app/api/admin/settings/route.ts:3`

```ts
let pendingSettings: Record<string, string> = {};
```

Settings are stored in a module-level variable. In serverless environments (Vercel), each cold start resets this. Concurrent requests can also race on the mutable object.

**Fix:** Store settings in the database or Redis.

---

### I5. No pagination on coupons, banners, or CMS pages

**Files:**
- `apps/web/lib/repositories/coupon-repo.ts:4` — `findMany` with no pagination
- `apps/web/lib/repositories/cms-repo.ts:4` — `listPages` with no pagination
- `apps/web/lib/repositories/cms-repo.ts:24` — `listBanners` with no pagination
- `apps/web/lib/repositories/category-repo.ts:19` — `getBySlug` loads ALL products in a category

For growing datasets, these unbounded queries will cause memory pressure and slow responses.

**Fix:** Add `take`/`skip` parameters to all list queries. For `category-repo.getBySlug`, add pagination for the `products` include.

---

### I6. Missing error handling (no try/catch, no logging)

**Files with zero error handling:**
- `apps/web/app/api/admin/stats/route.ts`
- `apps/web/app/api/admin/orders/route.ts`
- `apps/web/app/api/admin/orders/[id]/route.ts`
- `apps/web/app/api/admin/customers/route.ts`
- `apps/web/app/api/admin/settings/route.ts`
- `apps/web/app/api/logs/audit/route.ts`
- `apps/web/app/api/analytics/overview/route.ts`
- `apps/web/app/api/analytics/revenue/route.ts`
- `apps/web/app/api/analytics/funnel/route.ts`
- `apps/web/app/api/promotions/coupons/route.ts`
- `apps/web/app/api/cart/route.ts`
- `apps/web/app/api/cart/merge/route.ts`
- `apps/web/app/api/cart/items/[id]/route.ts`
- `apps/web/app/api/razorpay/webhooks/route.ts`

Any database error, Redis failure, or unexpected exception in these routes will result in either a 500 with a stack trace leak (in development), an unhandled promise rejection, or a hanging request.

**Fix:** Add try/catch blocks with `logger.error()` and return `{ error: "Internal server error" }` with status 500.

---

### I7. `as any` casts on order status defeat type safety

**File:** `apps/web/lib/repositories/order-repo.ts:37,62,66`

```ts
where.status = status as any; // line 37
data: { status: status as any }, // line 62
data: { orderId: id, status: status as any, note }, // line 66
```

Passing arbitrary strings to Prisma enum fields will cause runtime Prisma errors if the value doesn't match the enum. The `as any` cast suppresses all compile-time checking.

**Fix:** Define a union type `type OrderStatus = "PAID" | "PROCESSING" | "PRINTING" | "SHIPPED" | "DELIVERED" | "CANCELLED"` and use it instead of `as any`.

---

### I8. `fulfillment-service.ts` — Next.js 15 `params` not awaited

**File:** `apps/web/app/api/admin/orders/[id]/route.ts:7-8, 18-19`

```ts
{ params }: { params: { id: string } }  // Should be Promise<{ id: string }>
```

In Next.js 15, dynamic `params` are asynchronous and must be awaited. The `GET` and `PATCH` handlers access `params.id` directly, which will break in newer versions.

**Fix:**
```ts
{ params }: { params: Promise<{ id: string }> }
// ...
const { id } = await params;
```

---

### I9. `fetch` calls to Printify have no timeout

**File:** `apps/web/lib/printify/client.ts:26-34`

```ts
const response = await fetch(url, { ... });
```

No `AbortController` / `AbortSignal` is set. In serverless environments, a hanging Printify API call will hold the function open until the platform timeout, wasting resources.

**Fix:** Add a timeout:
```ts
const controller = new AbortController();
const timeout = setTimeout(() => controller.abort(), 30000);
try {
  const response = await fetch(url, { ..., signal: controller.signal });
} finally {
  clearTimeout(timeout);
}
```

---

### I10. Order import for `category-repo.getBySlug` is unbounded

**File:** `apps/web/lib/repositories/category-repo.ts:18-23`

The `products` include has no `take` limit. A category with 10,000 products loads all of them in a single query. This also loads `images` for each product via the include.

**Fix:** Add `take: 20` (or a configurable limit) to the `products` include and support a `cursor` or `skip` parameter.

---

## Minor Issues (Nice to Fix)

### M1. Hardcoded values in pricing

**Files:**
- `apps/web/lib/services/pricing-service.ts:5` — tax rate hardcoded at 18%
- `apps/web/lib/services/pricing-service.ts:18` — free shipping threshold hardcoded at ₹999
- `apps/web/lib/services/fulfillment-service.ts:35` — Printify shipping method hardcoded to `1`

**Fix:** Make these configurable via database settings or environment variables.

### M2. `mergeGuestCart` processes items sequentially (N+1)

**File:** `apps/web/lib/repositories/cart-repo.ts:62-82`

Each guest cart item triggers individual `findFirst` then `update`/`create` queries in a `for` loop. For 20 guest items, this is 20-40 sequential DB calls.

**Fix:** Use `Promise.all` to parallelize independent operations, or batch-insert new cart items and update existing ones in bulk.

### M3. Razorpay webhook event ID fallback is fragile

**File:** `apps/web/app/api/razorpay/webhooks/route.ts:19`

```ts
const eventId = event.event_id ?? `${event.event}:${(event.payload?.payment?.entity?.id) ?? Date.now()}`;
```

If `event_id` is missing AND `payload.payment.entity.id` is null, two events at the same millisecond collide. Every legitimate Razorpay webhook should have `event_id`.

**Fix:** Just use `event.event_id` and log a warning if missing. Add a random suffix as a last resort: `${event.event_id ?? `${Date.now()}-${Math.random()}`}`.

### M4. `user as any` type coercion in email call

**File:** `apps/web/lib/services/checkout-service.ts:149`

```ts
emailService.sendOrderConfirmation(order, user as any)
```

The `user` object only has `email` and `name` selected, but `sendOrderConfirmation` expects a full `User` type. This suppresses type errors but causes undefined fields at runtime if the template uses them.

**Fix:** Either select all required `User` fields in the query, or make the `sendOrderConfirmation` parameter type accept `Pick<User, 'email' | 'name'>`.

### M5. `logger.error` used as bare `.catch` callback

**Files:**
- `apps/web/lib/services/checkout-service.ts:149`
- `apps/web/lib/services/fulfillment-service.ts:107, 110`

```ts
.catch(logger.error)
```

This passes the Error object directly to pino as a structured property. Pino will log it, but without a descriptive message string. Better form:
```ts
.catch((err) => logger.error(err, "Failed to send order confirmation"))
```

### M6. Razorpay env vars not validated at startup

**File:** `apps/web/lib/razorpay.ts:3-5`

```ts
new Razorpay({
  key_id: process.env.RAZORPAY_KEY_ID!,
  key_secret: process.env.RAZORPAY_KEY_SECRET!,
});
```

Missing env vars produce a confusing Razorpay error rather than a clear configuration error.

**Fix:** Add validation at the module level with a helpful error message.

### M7. Redis client created without error handler

**File:** `apps/web/lib/redis.ts:5`

No `.on("error", ...)` handler means Redis connection errors are swallowed or become unhandled rejections.

**Fix:** Add `redis.on("error", (err) => logger.error(err, "Redis connection error"));`

### M8. `analyticsRepo.getFunnel` has hardcoded `totalVisitors = 0`

**File:** `apps/web/lib/repositories/analytics-repo.ts:52`

```ts
const totalVisitors = 0;
```

The visitor count is always 0, making the funnel conversion rate from "visitors" meaningless. Either implement tracking or remove the field.

### M9. `admin/settings/route.ts` calls `GET()` re-entrantly

**File:** `apps/web/app/api/admin/settings/route.ts:24`

```ts
settings: await GET().then((r) => r.json()),
```

PATCH calls the GET handler function directly to format the response. This is fragile and unconventional. Extract a shared `getSettings()` function instead.

### M10. No `RETRY-AFTER` validation in Printify rate limit handler

**File:** `apps/web/lib/printify/client.ts:37`

```ts
const retryAfter = Number(response.headers.get("Retry-After")) || 5;
```

If `Retry-After` is a non-numeric value (e.g., `"Fri, 31 Dec 1999 23:59:59 GMT"` HTTP-date format), `Number()` returns `NaN`, so the fallback of `5` seconds is used. Printify uses seconds format, but this is fragile.

**Fix:** Add explicit NaN check: `const retryAfter = Math.max(1, Math.min(Number(...) || 5, 60))`.

### M11. `deadLetterRepo` stores error message without stack trace

**File:** `apps/web/lib/repositories/dead-letter-repo.ts:8-10`

Only `error.message` is passed. The stack trace is invaluable for debugging.

**Fix:** Include the stack trace: `context: { error, stack: (error as Error).stack }`.

### M12. Redundant Razorpay webhook handler

**File:** `apps/web/app/api/razorpay/webhooks/route.ts:26-41`

The webhook checks for `payment.captured` events and updates `PENDING_PAYMENT` orders to `PAID`. But in the current checkout flow, orders are created directly as `PAID`. The webhook is a no-op in the happy path. It only helps if some external/different flow creates orders as `PENDING_PAYMENT`.

**Fix:** Either remove it or document its purpose and ensure the webhook properly logs when it actually takes action vs. being a no-op.

### M13. Test files connect to localhost:3000

**Files:**
- `apps/web/app/api/products/route.test.ts:5`
- `apps/web/app/api/auth/register/route.test.ts:3-4`

Integration tests hardcode `http://localhost:3000` and assume the server is already running. These can't run in CI without a running server and will fail if the port differs.

**Fix:** Use a test helper that starts/controls the server, or use MSW to mock HTTP.

---

## Summary

| Severity | Count | Key Concerns |
|----------|-------|-------------|
| **Critical** | 5 | No auth on admin/analytics APIs, duplicate order creation, coupon race condition, no stock check, missing Printify config validation |
| **Important** | 10 | Price mismatch between create-order and verify, re-validation of coupons, missing input validation, in-memory settings, unbounded queries, no error handling on many routes, `as any` type abuse, un-awaited Next.js 15 params, no fetch timeout, unbounded category product loading |
| **Minor** | 13 | Hardcoded values, N+1 queries, type coercion, logger misuse, missing env validation, no Redis error handler, dead letter missing stack traces, test fragility |
