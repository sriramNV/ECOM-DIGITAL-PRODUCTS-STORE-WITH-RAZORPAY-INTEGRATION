# Task 2.1 Report: Install auth dependencies and configure NextAuth

**Status:** ✅ Complete

**Commit:** `7f78ef4` - feat: add NextAuth v5 with credentials provider and middleware

## Files Created
- `apps/web/lib/auth.ts` — NextAuth v5 config with Credentials provider, JWT strategy, session/user type augmentation
- `apps/web/app/api/auth/[...nextauth]/route.ts` — NextAuth handler route export
- `apps/web/middleware.ts` — Auth middleware protecting `/admin`, `/account`, redirecting logged-in users from `/login` and `/register`
- `apps/web/app/api/auth/register/route.ts` — POST handler with Zod validation, duplicate email check, bcrypt hashing
- `apps/web/app/api/auth/register/route.test.ts` — Integration tests for invalid email and short password (422 validation)

## Dependencies Added
- `next-auth@beta` (5.0.0-beta.31), `bcryptjs`, `@types/bcryptjs`, `zod` — all in `apps/web/package.json`

## Tests
- `npx vitest run apps/web/app/api/auth/register/route.test.ts` — **2/2 passed** (requires dev server running on :3000)

## Summary
Task 2.1 delivers the authentication foundation: `auth()`, `signIn()`, `signOut()` exports from `@/lib/auth`, middleware-based route protection, and a registration API with server-side validation. All dependencies installed and tests passing.

## Concerns
- Prisma client had not been generated (`prisma generate` needed before the route would compile)
- Tests are integration tests requiring a running dev server with database
- Next.js 16 deprecates the `middleware.ts` file convention in favor of `proxy` (warning only, non-blocking)
