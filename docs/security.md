# POD Security Architecture

## 1. Authentication

**Framework:** NextAuth v5 (Auth.js) with JWT strategy.

- **Credentials provider** (`apps/web/lib/auth.ts:1`): Email + password authentication using bcryptjs `compare()` for verification.
- **JWT session strategy** (`auth.ts:60`): No database sessions. JWT carries `id`, `email`, `name`, and `role` — no sensitive data.
- **Registration** (`apps/web/app/api/auth/register/route.ts:23`): Passwords hashed with bcryptjs `hash()` at cost factor 12 before storage.
- **Session helper**: `auth()` returns the session in API routes; `SessionProvider` delivers it to the client.
- **Role enum** (`prisma/schema.prisma:10`): `ADMIN` and `CUSTOMER` enforced at the database level via Prisma enum.

Secrets: `AUTH_SECRET` lives in environment variables only, never in code.

## 2. Authorization

**Route Guard:**
- `adminGuard()` (`apps/web/lib/admin-guard.ts:4`): Returns `401 Unauthorized` if no session, `403 Forbidden` if role is not `ADMIN`. Used on all admin API routes and admin page layouts.

**Middleware:**
- `proxy.ts:29-35`: Redirects `/admin/*` to `/login` if unauthenticated, redirects to `/` if not ADMIN. Same pattern for `/account/*` (auth required) and `/login`/`/register` (redirect to `/account` if already logged in).

**Data access scoping:**
- Payment verification (`apps/web/app/api/razorpay/verify/route.ts:15`): Uses `session.user.id` from auth, not user-supplied IDs.
- Checkout order creation uses authenticated `userId` throughout.

## 3. Payment Security

**Order Creation** (`apps/web/lib/services/checkout-service.ts:14`):
- Amount calculated entirely server-side: subtotal from cart items + shipping + tax - discount.
- No client-supplied price values accepted. Stock levels verified server-side before creation.
- Razorpay order created with `notes` containing `userId` and `expectedAmount`.

**Verification** (`checkout-service.ts:76`):
- HMAC-SHA256 signature verification using `RAZORPAY_KEY_SECRET` over `${orderId}|${paymentId}`.
- Amount tampering prevention (`checkout-service.ts:139`): After HMAC verification, the Razorpay order is fetched and its `notes.expectedAmount` is compared against the server-recalculated total. Mismatch throws `"Payment amount mismatch - possible tampering detected"`.
- Duplicate payment prevention (`checkout-service.ts:104`): Checks for existing `razorpayPaymentId` before creating a new order.

**Webhook** (`apps/web/app/api/razorpay/webhooks/route.ts:15`):
- HMAC-SHA256 verification using `RAZORPAY_WEBHOOK_SECRET` over the raw request body.
- Idempotency via Redis (`redis.get("webhook:${eventId}")`). Processed events stored with 24h TTL.
- Only processes `payment.captured` events. Order status transitions guarded by current state check.

## 4. Webhook Verification

| Webhook | Verification Method | File |
|---------|-------------------|------|
| Razorpay | HMAC-SHA256, string comparison | `apps/web/app/api/razorpay/webhooks/route.ts:15` |
| Printify | HMAC-SHA256, `crypto.timingSafeEqual` | `apps/web/app/api/printify/webhooks/route.ts:23-25` |

Both use `crypto.createHmac("sha256", WEBHOOK_SECRET).update(rawBody).digest("hex")` for signature generation.

Printify additionally validates signature length before calling `crypto.timingSafeEqual` to prevent timing attacks on HMAC comparison. The Razorpay webhook uses direct string comparison (acceptable because HMAC output is fixed-length and the comparison is done server-side with no user-controlled timing signal).

Idempotency: Both webhooks use Redis key with `NX + EX 86400` to prevent duplicate processing.

## 5. Rate Limiting

**Implementation** (`apps/web/proxy.ts:4`):
- Custom Redis-based sliding window using `INCR` + `EXPIRE`.
- 100 requests per 60 seconds per IP.
- IP extracted from `x-forwarded-for` header.
- Fail-open: if Redis is unavailable, rate limiting is bypassed (returns `true`).

**Scope:** Applied in middleware on all `/api/*` routes via NextAuth middleware wrapper.

## 6. HTTP Security

**Middleware** (`apps/web/proxy.ts:46-48`):
- `X-Content-Type-Options: nosniff`
- `X-Frame-Options: DENY`
- `Referrer-Policy: strict-origin-when-cross-origin`

**Production Nginx** (`nginx/conf.d/security-headers.conf`):
- `Content-Security-Policy`: Restrictive default-src `'self'`. Razorpay whitelisted: `checkout.razorpay.com` (scripts, frames) and `api.razorpay.com` (connect). `'unsafe-inline'` for styles, `'unsafe-eval'` for Next.js.
- `Strict-Transport-Security`: `max-age=31536000; includeSubDomains`
- Duplicates middleware headers at the Nginx layer as defense-in-depth.

**TLS** (`nginx/conf.d/ssl-params.conf`):
- Protocols: TLSv1.2 and TLSv1.3 only.
- Strong cipher suite, OCSP stapling enabled.
- Session tickets disabled.

## 7. Data Protection

**Passwords:**
- Hashed with bcrypt at cost 12 (`register/route.ts:23`, `prisma/seed.ts:13`).
- Never stored in plaintext. Database `password` field is nullable (OAuth users may not have one).

**JWT Tokens:**
- Contain only `id`, `email`, `name`, `role` — no passwords, payment info, or PII.

**Environment Variables:**
- All secrets (AUTH_SECRET, RAZORPAY_KEY_SECRET, RAZORPAY_WEBHOOK_SECRET, PRINTIFY_API_TOKEN, PRINTIFY_WEBHOOK_SECRET, DATABASE_URL, SMTP credentials, MinIO keys) are environment variables only. No hardcoded secrets.
- `.env.example` and `.env.production.example` document required variables with placeholder values.

**SQL Injection:**
- Prisma ORM generates parameterized queries. No raw SQL in the codebase.

**Shipping Address Sanitization:**
- `checkout-service.ts:144`: Internal fields like `couponCode` stripped before persisting.
- `checkout-service.ts:145-147`: Undefined values filtered, only clean address data stored as JSON.

## 8. Audit Logging

**AuditLog Model** (`prisma/schema.prisma:316`):
```
id        String   @id
userId    String?
action    String
entity    String
entityId  String?
metadata  Json?
ip        String?
createdAt DateTime
```

**Usage:**
- Fulfillment failures logged via `deadLetterRepo.add()` (`apps/web/lib/repositories/dead-letter-repo.ts:5`) with action `"fulfillment_failed"`, entity `"order"`, and error context.
- User registration events logged with `userId` (`register/route.ts:34`).
- Payment verification failures logged with error context (`verify/route.ts:37`).
- Order creation logged with `orderId` and `orderNumber` (`checkout-service.ts:194`).

**Admin interface** (`apps/web/app/api/logs/audit/route.ts`):
- Protected by `adminGuard()`.
- Supports filtering by `action`, `entity`, `entityId`.
- Paginated with max 100 results per page.

## 9. Dependency Security

- **bcryptjs**: Pure JS bcrypt for password hashing (no native compilation needed).
- **crypto**: Node.js built-in for HMAC, timing-safe comparisons.
- **zod**: Input validation on all API routes (registration, payment verification, shipping address, audit log queries).
- **Prisma**: Type-safe database access with parameterized queries.

## Threat Model Summary

| Threat | Mitigation |
|--------|-----------|
| Brute force login | bcrypt cost 12, rate limiting (100/60s) |
| JWT tampering | JWT signed with AUTH_SECRET via NextAuth |
| Payment amount tampering | Server-side amount recalculation + Razorpay notes comparison |
| Replay payment ID | Duplicate payment check, webhook idempotency |
| Webhook forgery | HMAC-SHA256 signature verification |
| Timing attacks | crypto.timingSafeEqual on Printify webhooks |
| XSS | CSP headers, React's built-in escaping |
| Clickjacking | X-Frame-Options: DENY |
| MIME sniffing | X-Content-Type-Options: nosniff |
| Man-in-the-middle | HSTS, TLS 1.2/1.3 only |
| SQL injection | Prisma parameterized queries |
| Sensitive data exposure | No secrets in JWT, env-only secrets |
| Coupon abuse | Server-side validation, per-user limits |
| CSRF | NextAuth built-in CSRF protection, JWT-based sessions |
| Admin privilege escalation | Role enum + adminGuard() on every admin route + middleware redirect |
