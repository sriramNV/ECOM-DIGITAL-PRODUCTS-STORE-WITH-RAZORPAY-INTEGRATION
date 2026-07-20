# Security Review: POD Store

**Date:** 2026-07-20  
**Scope:** Next.js e-commerce app auth system, API routes, middleware, env configuration  
**Reviewer:** Automated security audit

---

## Critical Issues (Must Fix Now)

### C1. All Admin API Routes Have Zero Authentication

Every `/api/admin/*`, `/api/analytics/*`, `/api/logs/audit`, `/api/cms/pages/*`, and `/api/promotions/coupons/*` route is completely unprotected. The proxy.ts middleware only guards `/admin` (page routes) via pathname prefix — it does NOT guard `/api/admin/*` API routes. No route calls `auth()`, checks `role`, or validates the session.

**Files (12 routes, 7 without any auth at all):**

| File | Method | Missing |
|------|--------|---------|
| `apps/web/app/api/admin/stats/route.ts:4` | GET | auth + admin check |
| `apps/web/app/api/admin/settings/route.ts:5,14` | GET, PATCH | auth + admin check |
| `apps/web/app/api/admin/customers/route.ts:4` | GET | auth + admin check |
| `apps/web/app/api/admin/orders/route.ts:4` | GET | auth + admin check |
| `apps/web/app/api/admin/orders/[id]/route.ts:5,16` | GET, PATCH | auth + admin check |
| `apps/web/app/api/analytics/revenue/route.ts:4` | GET | auth + admin check |
| `apps/web/app/api/analytics/overview/route.ts:4` | GET | auth + admin check |
| `apps/web/app/api/analytics/funnel/route.ts:4` | GET | auth + admin check |
| `apps/web/app/api/logs/audit/route.ts:4` | GET | auth + admin check |
| `apps/web/app/api/cms/pages/route.ts:15` | POST | auth + admin check |
| `apps/web/app/api/cms/pages/[id]/route.ts:24` | PATCH | auth + admin check |
| `apps/web/app/api/promotions/coupons/route.ts:9` | POST | auth + admin check |

**Fix:** Add an `adminGuard()` helper that calls `auth()` and returns 401/403, use it in every admin route. Example:

```ts
import { auth } from "@/lib/auth";

async function adminGuard(): Promise<NextResponse | null> {
  const session = await auth();
  if (!session?.user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  if (session.user.role !== "ADMIN") return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  return null;
}
```

Then at the top of every admin route handler:

```ts
const guard = await adminGuard();
if (guard) return guard;
```

---

### C2. IDOR — Cart Item DELETE Lacks Ownership Verification

`apps/web/app/api/cart/items/[id]/route.ts:9-15` checks the session but `cartRepo.removeItem(id)` (`apps/web/lib/repositories/cart-repo.ts:51-53`) deletes any cart item by ID without verifying it belongs to the authenticated user's cart.

**Fix:** Scope the delete to the user's cart:
```ts
const cart = await prisma.cart.findUnique({ where: { userId: session.user.id } });
if (!cart) return NextResponse.json({ error: "Cart not found" }, { status: 404 });
const item = await prisma.cartItem.findFirst({ where: { id, cartId: cart.id } });
if (!item) return NextResponse.json({ error: "Item not found" }, { status: 404 });
await prisma.cartItem.delete({ where: { id } });
```

---

### C3. Stored XSS via CMS TextBlock

`apps/web/components/storefront/blocks/text-block.tsx:15` uses `dangerouslySetInnerHTML` with CMS content. Since the CMS API (`/api/cms/pages`) is unprotected (see C1), any attacker can create pages with arbitrary HTML/JavaScript.

**Fix:** Either (a) sanitize HTML with DOMPurify on the server before storage, (b) render markdown instead of raw HTML, or (c) at minimum add auth guards to CMS mutation endpoints and sanitize on output.

---

### C4. No CSRF Protection on Any Mutation Endpoint

Zero application endpoints verify CSRF tokens. NextAuth's built-in CSRF only protects its own `signIn`/`signOut` endpoints. Every POST/PATCH/DELETE endpoint is vulnerable to cross-site request forgery.

**Affected endpoints:** cart (POST), cart/merge (POST), cart/items/[id] (DELETE), admin/settings (PATCH), admin/orders/[id] (PATCH), cms/pages (POST), cms/pages/[id] (PATCH), promotions/coupons (POST), auth/register (POST), razorpay/create-order (POST), razorpay/verify (POST).

**Fix options:**
- **Next.js Server Actions** — use form actions which get automatic CSRF protection
- **Custom token** — generate a CSRF token via `auth()` endpoint, include it in `X-CSRF-Token` header on mutations, verify server-side
- **SameSite=Lax/Strict cookies** — already somewhat protected if NextAuth session cookie uses SameSite, but not sufficient alone

---

## Important Issues (Fix Before Production)

### I1. Timing-Attack Vulnerable HMAC Comparison in Razorpay Webhook

`apps/web/app/api/razorpay/webhooks/route.ts:14` — Compares HMAC signatures with `!==` (character-by-character comparison that exits early on first mismatch, allowing timing attacks).

**Fix:** Use `crypto.timingSafeEqual`:
```ts
const sigBuffer = Buffer.from(signature ?? "", "hex");
const expectedBuffer = Buffer.from(expected, "hex");
const safe = sigBuffer.length === expectedBuffer.length && crypto.timingSafeEqual(sigBuffer, expectedBuffer);
if (!safe) return NextResponse.json({ error: "Invalid signature" }, { status: 401 });
```

Note: `PRINTIFY_WEBHOOK_SECRET` in `apps/web/lib/services/fulfillment-service.ts:73` has the same issue.

---

### I2. Settings Endpoint — In-Memory State + No Persistence

`apps/web/app/api/admin/settings/route.ts:3` stores settings in a module-level `pendingSettings` object. Lost on server restart. No database persistence.

**Fix:** Store settings in the database. Add auth guard (see C1).

---

### I3. Audit Logs Exposed Without Auth

`apps/web/app/api/logs/audit/route.ts` — Anyone can query audit logs including entity IDs, actions, and timestamps.

**Fix:** Add `adminGuard()` (see C1).

---

### I4. Printify Webhook Parses JSON Before Signature Verification

`apps/web/app/api/printify/webhooks/route.ts:11` calls `JSON.parse(body)` before signature verification in `fulfillmentService.handleWebhook`. A large or malformed payload could cause resource exhaustion before the signature check rejects it.

**Fix:** Verify signature before parsing. Move the verification logic into the route handler before `JSON.parse`.

---

### I5. Guest Cart Merge on Login is Broken

`apps/web/components/auth/login-form.tsx:37` calls `fetch("/api/cart/merge", { method: "POST" })` with no body. The handler (`apps/web/app/api/cart/merge/route.ts:11-12`) treats empty body as `{}`, resulting in an empty `guestItems` array. Guest cart items from localStorage are never sent to the server.

**Fix:** Read guest cart items from localStorage and send them in the request body:
```ts
const guestCart = JSON.parse(localStorage.getItem("guest-cart") ?? "[]");
await fetch("/api/cart/merge", {
  method: "POST",
  headers: { "Content-Type": "application/json" },
  body: JSON.stringify({ items: guestCart }),
});
```

---

## Minor Issues (Nice to Fix)

### M1. Missing NEXTAUTH_URL / AUTH_URL

No `AUTH_URL` or `NEXTAUTH_URL` is set in `.env`. NextAuth may miscompute callback URLs and CSRF token origins in production deployments behind proxies.

**Fix:** Set `AUTH_URL=https://yourdomain.com` in production `.env`.

### M2. Health Check Leaks Infrastructure Status

`apps/web/app/api/health/route.ts` — Anyone can probe database and Redis connectivity. Useful for attackers mapping the stack.

**Fix:** Restrict to internal IPs or add basic auth.

### M3. Missing Security Headers

No Content-Security-Policy, Strict-Transport-Security, X-Content-Type-Options, or X-Frame-Options headers. The proxy.ts middleware (`apps/web/web/proxy.ts`) returns `NextResponse.next()` without adding security headers.

**Fix:** Add security headers in the middleware:
```ts
const response = NextResponse.next();
response.headers.set("X-Content-Type-Options", "nosniff");
response.headers.set("X-Frame-Options", "DENY");
response.headers.set("Strict-Transport-Security", "max-age=63072000; includeSubDomains; preload");
response.headers.set("Referrer-Policy", "strict-origin-when-cross-origin");
// Add CSP in production
```

### M4. POST /api/cart Accepts Arbitrary Items Without Validation

`apps/web/app/api/cart/route.ts:21` destructures `items` from `request.json()` with zero schema validation. Malformed or excessively large payloads could cause issues.

**Fix:** Use a Zod schema to validate item structure (productId, variantId, quantity).

### M5. Admin Settings PATCH Has No Input Validation

`apps/web/app/api/admin/settings/route.ts:14-21` — Validates keys against an allowlist but doesn't validate value types or lengths.

### M6. Promotions Coupons POST Has No Auth or Validation

`apps/web/app/api/promotions/coupons/route.ts:9-22` — No auth guard, no input schema validation. Anybody can create coupons.

---

## Summary

| Severity | Count | Key Issues |
|----------|-------|------------|
| Critical | 4 | Admin API auth bypass, IDOR, stored XSS, no CSRF |
| Important | 5 | Timing-vulnerable HMAC, in-memory settings, exposed audit logs, premature JSON parse, broken cart merge |
| Minor | 6 | Missing NEXTAUTH_URL, health leak, security headers, input validation gaps |

**Priority action:** Add `adminGuard()` to all admin/analytics/logs/cms/promotions API routes. Then add CSRF protection. Then fix the timing-safe comparison.
