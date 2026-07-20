# Task 9.2: Security Hardening — Report

**Status:** Complete

## Files changed

| File | Action | Description |
|------|--------|-------------|
| `apps/web/middleware.ts` | Edited | Added rate limiting for `/api/*` routes (100 req/min per IP) with try/catch fallback for Edge Runtime. Added `/api/:path*` to matcher. Made auth callback async. |
| `nginx/conf.d/security-headers.conf` | Created | CSP, X-Frame-Options, X-Content-Type-Options, Referrer-Policy, HSTS headers |
| `nginx/conf.d/ssl-params.conf` | Created | TLS protocols (v1.2/v1.3), ciphers, session cache, OCSP stapling |
| `apps/web/sentry.config.ts` | Created | Sentry init with DSN from env, 0.1 traces sample rate, production-only |

## Key decisions

- **Redis in Edge Runtime**: Used dynamic `import("@/lib/redis")` inside the `rateLimit()` function, wrapped in try/catch. If Redis is unavailable (Edge Runtime incompatibility or connection failure), requests are allowed through.
- **Rate limit key**: `ratelimit:{ip}` using `redis.incr` + `redis.expire` pattern per plan specification.
- **CSP**: Includes Razorpay origins (`checkout.razorpay.com`, `api.razorpay.com`) for payment processing.

## Commit

`8f025f8` — `feat: add rate limiting, security headers, and error tracking`
