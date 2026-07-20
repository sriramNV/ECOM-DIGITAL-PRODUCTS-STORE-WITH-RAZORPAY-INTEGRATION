# Task 8.3: PostHog analytics — Complete

## What was done

- Installed `posthog-node` and `posthog-js` (web workspace)
- Created `apps/web/lib/analytics.ts` — server-side PostHog client using `posthog-node`
- Created `apps/web/providers/posthog-provider.tsx` — client-side `"use client"` provider that initializes `posthog-js` with `NEXT_PUBLIC_POSTHOG_KEY` and `NEXT_PUBLIC_POSTHOG_HOST` env vars; captures `$pageview` on route changes; wraps children with PostHogProvider
- Edited `apps/web/app/layout.tsx` — imported and wrapped children with `PostHogProvider`
- Committed: `dc2fb0e` — `feat: add PostHog analytics integration`

## Env vars required

- `NEXT_PUBLIC_POSTHOG_KEY`
- `NEXT_PUBLIC_POSTHOG_HOST` (defaults to `https://app.posthog.com`)
