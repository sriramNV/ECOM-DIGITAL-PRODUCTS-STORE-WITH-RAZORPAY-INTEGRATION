# Phase 7b — Security & Performance

## Objective

Harden the application for production — implement rate limiting, security headers, input sanitization, database optimization, and performance improvements to achieve high Lighthouse scores.

---

## System Design

### Security Layers

```
┌────────────────────────────────────────────────────────────┐
│ Nginx Reverse Proxy                                         │
│  - TLS termination (Let's Encrypt)                         │
│  - Rate limiting at edge                                   │
│  - Security headers added to every response                │
│  - Static asset caching                                    │
├────────────────────────────────────────────────────────────┤
│ Next.js Middleware                                          │
│  - Authentication check (admin routes)                     │
│  - CSRF protection (API routes)                            │
├────────────────────────────────────────────────────────────┤
│ API Routes                                                  │
│  - Rate limiting per route (Redis-backed)                  │
│  - Input validation (Zod)                                  │
│  - Authentication + authorization checks                   │
├────────────────────────────────────────────────────────────┤
│ Data Layer                                                  │
│  - Prisma prepared statements (SQL injection safe)         │
│  - Parameterized queries only                              │
└────────────────────────────────────────────────────────────┘
```

---

## Architecture

### Rate Limiting

```typescript
// lib/rate-limiter.ts
import { redis } from "./redis";

export async function rateLimit(
  key: string,
  limit: number,
  window: number // seconds
): Promise<{ allowed: boolean; remaining: number }> {
  const now = Date.now();
  const windowKey = `ratelimit:${key}:${Math.floor(now / (window * 1000))}`;

  const current = await redis.incr(windowKey);
  if (current === 1) {
    await redis.expire(windowKey, window);
  }

  return {
    allowed: current <= limit,
    remaining: Math.max(0, limit - current),
  };
}

// Usage in API route
const { allowed, remaining } = await rateLimit(`api:${userId || ip}`, 100, 60);
if (!allowed) {
  return NextResponse.json(
    { error: "Too many requests" },
    { status: 429, headers: { "X-RateLimit-Remaining": String(remaining) } }
  );
}
```

### Rate Limit Tiers

| Tier | Limit | Window | Routes |
|------|-------|--------|--------|
| Public browsing | 100 req | 60s | Products, catalog, pages |
| Checkout | 30 req | 60s | Create order, verify payment |
| Auth | 10 req | 60s | Login, register |
| Admin API | 200 req | 60s | All admin endpoints |
| Webhooks | No limit (IP whitelist) | — | Razorpay, Printify webhooks |

### Security Headers (Nginx)

```nginx
# nginx/security-headers.conf
add_header X-Frame-Options "SAMEORIGIN" always;
add_header X-Content-Type-Options "nosniff" always;
add_header X-XSS-Protection "1; mode=block" always;
add_header Referrer-Policy "strict-origin-when-cross-origin" always;
add_header Permissions-Policy "camera=(), microphone=(), geolocation=()" always;
add_header Content-Security-Policy "
  default-src 'self';
  script-src 'self' 'unsafe-inline' 'unsafe-eval' https://checkout.razorpay.com;
  style-src 'self' 'unsafe-inline';
  img-src 'self' data: https://*.printify.com https://*.minio.com;
  font-src 'self';
  connect-src 'self' https://api.printify.com https://api.razorpay.com;
  frame-src https://checkout.razorpay.com;
" always;
add_header Strict-Transport-Security "max-age=31536000; includeSubDomains" always;
```

### Input Validation & Sanitization

```typescript
// All API routes validate with Zod
const createProductSchema = z.object({
  title: z.string().min(1).max(200),
  description: z.string().max(5000),
  price: z.number().positive(),
  variants: z.array(z.object({
    size: z.string().optional(),
    color: z.string().optional(),
    price: z.number().positive(),
  })).min(1),
});

// HTML sanitization for CMS content
import { sanitize } from "isomorphic-dompurify";

function sanitizeHtml(html: string): string {
  return sanitize(html, {
    ALLOWED_TAGS: ["p", "b", "i", "em", "strong", "a", "ul", "ol", "li", "br", "img"],
    ALLOWED_ATTR: ["href", "src", "alt", "class"],
  });
}
```

### Database Optimizations

```sql
-- Indexes to add (beyond Prisma auto-indexes on PKs/FKs)

CREATE INDEX idx_orders_user_id ON "Order"("userId");
CREATE INDEX idx_orders_status ON "Order"("status");
CREATE INDEX idx_orders_created_at ON "Order"("createdAt");
CREATE INDEX idx_order_items_order_id ON "OrderItem"("orderId");
CREATE INDEX idx_products_category_id ON "Product"("categoryId");
CREATE INDEX idx_products_slug ON "Product"("slug");
CREATE INDEX idx_products_is_active ON "Product"("isActive");
CREATE INDEX idx_coupons_code ON "Coupon"("code");
CREATE INDEX idx_audit_log_created_at ON "AuditLog"("createdAt");
CREATE INDEX idx_webhook_log_created_at ON "WebhookLog"("createdAt");
```

### Prisma Query Optimization

```typescript
// BAD — N+1 queries
const orders = await prisma.order.findMany();
for (const order of orders) {
  const items = await prisma.orderItem.findMany({ where: { orderId: order.id } });
}

// GOOD — include relations
const orders = await prisma.order.findMany({
  include: { items: true, payments: true },
});

// Use select to fetch only needed fields
const product = await prisma.product.findUnique({
  where: { id },
  select: { title: true, price: true, images: { where: { isMockup: true }, take: 1 } },
});
```

### Image Optimization

```tsx
// next/image with proper sizing
<Image
  src={product.images[0].url}
  alt={product.title}
  fill
  className="object-cover"
  sizes="(max-width: 640px) 100vw, (max-width: 1024px) 50vw, 25vw"
  priority={isHero}
/>
```

---

## Key Decisions

| Decision | Choice | Rationale |
|----------|--------|-----------|
| Rate limiting store | Redis (sliding window) | Fast, can share across instances |
| CSP strategy | Restrictive with Razorpay exceptions | Security without breaking checkout |
| HTML sanitization | DOMPurify (isomorphic) | Client + server side safety for CMS |
| Image optimization | next/image built-in | Automatic WebP, responsive sizes, lazy loading |
| Caching strategy | TanStack Query (client) + Redis (server) | Multi-layer: state cache + data cache |
| Bundle analysis | `@next/bundle-analyzer` | Identify large dependencies |

---

## Steps

1. Create `lib/rate-limiter.ts` (Redis-backed sliding window)
2. Add rate limiting middleware to all API routes
3. Configure security headers (CSP, HSTS, etc.)
4. Set up Nginx reverse proxy with TLS (certbot)
5. Add input sanitization (Zod + DOMPurify)
6. Audit and add database indexes
7. Refactor any N+1 Prisma queries
8. Configure next/image optimization (formats, loader)
9. Add Sentry error tracking (`@sentry/nextjs`)
10. Run Lighthouse audit → address issues
11. Run `pnpm build` → verify bundle size
12. Verify: security headers present, rate limits enforced, Lighthouse > 80

---

## Files Created

| File | Content |
|------|---------|
| `lib/rate-limiter.ts` | Rate limiting utility |
| `middleware.ts` (updated) | Add security headers |
| `nginx/security-headers.conf` | CSP + HSTS + other headers |
| `nginx/default.conf` | Full Nginx config with TLS |
| `sentry.client.config.ts` | Sentry client config |
| `sentry.server.config.ts` | Sentry server config |
| `next.config.js` (updated) | Image optimization config |
