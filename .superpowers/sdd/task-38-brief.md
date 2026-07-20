# Task 9.2: Security hardening

**Plan:** Plan 09 lines 217-263
**Files:**
- `apps/web/middleware.ts` (edit to add rate limiting)
- `nginx/conf.d/security-headers.conf`
- `nginx/conf.d/ssl-params.conf`
- `apps/web/sentry.config.ts`

For middleware.ts: Read the existing file first. It currently uses NextAuth middleware pattern. Add rate limiting:
- Import `redis` from `@/lib/redis`
- Add rateLimit() helper function using redis.incr + redis.expire pattern
- In the handler, check if pathname starts with "/api/" and apply rate limiting (100 req/min)
- The existing matcher config only covers `/admin`, `/account`, `/login`, `/register`. The rate limiting for `/api/` also needs to be matched. Add `/api/:path*` to the matcher config.

For sentry.config.ts: Simple Sentry init config.

Be careful: The middleware uses Next.js Edge Runtime — Redis may not work in Edge Runtime. Create a try/catch fallback that allows requests through if Redis is unavailable.

Commit:
```bash
git add apps/web/middleware.ts nginx/conf.d apps/web/sentry.config.ts
git commit -m "feat: add rate limiting, security headers, and error tracking"
```
