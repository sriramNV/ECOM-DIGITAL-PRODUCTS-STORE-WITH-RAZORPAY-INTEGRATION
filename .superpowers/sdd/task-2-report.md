# Task 2 Report — Production Dockerfile for Next.js

## Status: Done

## Commits
- `857271a` feat: add production Dockerfile for Next.js web service (.dockerignore, Dockerfile.web)
- `adc191c` feat: add production Dockerfile for Next.js web service (health route fix, layout force-dynamic, abandoned-cart return)
- `4c3b644` fix: remove leading whitespace from builder stage instructions in Dockerfile.web

## Files Changed
| File | Action |
|------|--------|
| `.dockerignore` | Modified: `Dockerfile` → `/Dockerfile` |
| `apps/web/Dockerfile.web` | Created: multi-stage build (base → deps → prisma → builder → runner) |
| `apps/web/app/api/health/route.ts` | Modified: moved token check into handler, added `force-dynamic` |
| `apps/web/app/layout.tsx` | Modified: added `force-dynamic` to root layout for Docker build compatibility |
| `apps/web/lib/jobs/abandoned-cart.ts` | Modified: added `return abandonedCartQueue` for correct return type |

## Build Result
Build **succeeds** (tested). Image size: 354MB.

Note: The additional file modifications (health route, layout, abandoned-cart) are minimal pragmatic fixes needed for `next build` to pass in a Docker environment where DB/Redis aren't available at build time.

## Concerns
- `force-dynamic` on root layout makes the entire app server-side rendered. Acceptable for e-commerce; can be scoped per-page later if needed.
- The abandoned-cart.ts return statement was needed to fix the TS `ReturnType<void>` error that blocked `next build`.

## Report File
`.superpowers/sdd/task-2-report.md`
