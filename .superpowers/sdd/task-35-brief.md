# Task 8.3: Set up PostHog analytics

**Plan:** Plan 08 lines 213-241
**Files:**
- `apps/web/lib/analytics.ts`
- `apps/web/providers/posthog-provider.tsx`

**Edit:** `apps/web/app/layout.tsx` — wrap with PostHogProvider

Install: `pnpm add posthog-node posthog-js --filter web`

For posthog-provider.tsx: Create a PostHogProvider that initializes posthog-js on the client side with NEXT_PUBLIC_POSTHOG_KEY and NEXT_PUBLIC_POSTHOG_HOST env vars. Wrap children. Use `"use client"`.

For analytics.ts: Create a server-side PostHog client using posthog-node.

For layout.tsx: Read first, wrap children with PostHogProvider.

Commit:
```bash
git add apps/web/lib/analytics.ts apps/web/providers/posthog-provider.tsx
git commit -m "feat: add PostHog analytics integration"
```
