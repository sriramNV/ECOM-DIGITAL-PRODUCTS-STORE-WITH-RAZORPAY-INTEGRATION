# Task 7.3: Create storefront CMS renderer

**Plan:** Plan 07 lines 203-261
**Files:**
- `apps/web/components/storefront/blocks/hero-block.tsx`
- `apps/web/components/storefront/blocks/text-block.tsx`
- `apps/web/components/storefront/blocks/product-grid-block.tsx`
- `apps/web/components/storefront/blocks/cta-banner-block.tsx`
- `apps/web/components/storefront/blocks/newsletter-block.tsx`
- `apps/web/components/storefront/cms-page.tsx`
- `apps/web/app/(marketing)/[slug]/page.tsx`

Full code for cms-page.tsx in plan lines 224-253.

For block components:
- hero-block.tsx — "use client"; full-width image/color background with heading, subtitle, CTA button. Use shadcn Button.
- text-block.tsx — Rich text content rendered in a container
- product-grid-block.tsx — "use client"; fetch products by collection slug using TanStack Query, render grid of ProductCard
- cta-banner-block.tsx — Background banner with text + button
- newsletter-block.tsx — Simple email input + subscribe button (UI only for now)

For `(marketing)/[slug]/page.tsx` — Server component that fetches page by slug from cmsRepo, renders CmsPage with page.content blocks. Use generateStaticParams returning empty (dynamic rendering).

Note: The `(marketing)` route group may need to exist — create the directory.

Commit:
```bash
git add apps/web/components/storefront/blocks apps/web/components/storefront/cms-page.tsx "apps/web/app/(marketing)"
git commit -m "feat: add CMS block renderers and dynamic page routing"
```
