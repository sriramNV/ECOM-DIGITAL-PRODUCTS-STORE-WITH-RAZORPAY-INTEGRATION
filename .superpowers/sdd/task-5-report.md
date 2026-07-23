# Task 5 Report: Auth Service + NextAuth Configuration

## Status: ✅ Complete

## What was done
1. Created `apps/web/lib/auth.ts` — NextAuth v5 config with Credentials + Google OAuth, JWT strategy, Prisma adapter
2. Created `apps/web/app/api/auth/[...nextauth]/route.ts` — Route handler for NextAuth API
3. Created `apps/web/app/api/auth/register/route.ts` — Registration endpoint with Zod validation, password hashing (bcryptjs, 12 rounds), duplicate email check
4. Created `apps/web/app/providers.tsx` — Client-side providers wrapping SessionProvider + React Query + Sonner Toaster
5. Created `apps/web/app/layout.tsx` — Root layout with metadata and providers
6. Created `apps/web/app/globals.css` — Tailwind v4 import
7. Created `apps/web/postcss.config.ts` — PostCSS with `@tailwindcss/postcss` plugin

## Deviations from brief
- Augmented `@auth/core/jwt` instead of `next-auth/jwt` because pnpm's strict module resolution prevents finding `next-auth/jwt` for module augmentation
- Added `@auth/core@0.37.2` as a direct dependency (same version next-auth uses internally) so TypeScript can resolve the JWT module for augmentation
- Made JWT `id` and `role` fields optional (`id?: string; role?: string`) with null guards in callbacks because the authorize callback returns `id` as `string | undefined`

## Build verification
- `pnpm --filter web build` passes successfully (compiled + type-checked + page generation)

## Commits
- `d5b26c5` — `feat: add NextAuth with credentials + Google OAuth, register API`

## Concerns
- `AUTH_SECRET` in `.env` is a placeholder; must be replaced with a real secret for production
- `AUTH_GOOGLE_ID` and `AUTH_GOOGLE_SECRET` are empty and need real values before Google OAuth can work
