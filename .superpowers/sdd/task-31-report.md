# Task 7.3 Report: Storefront CMS Renderer

**Status:** ✅ Complete

## Files Created

| File | Description |
|------|-------------|
| `apps/web/components/storefront/blocks/hero-block.tsx` | "use client" — full-width image/color background with heading, subtitle, CTA button using shadcn Button |
| `apps/web/components/storefront/blocks/text-block.tsx` | Rich text content rendered in a container using dangerouslySetInnerHTML |
| `apps/web/components/storefront/blocks/product-grid-block.tsx` | "use client" — fetches products by collection slug via TanStack Query, renders ProductCard grid with loading skeleton |
| `apps/web/components/storefront/blocks/cta-banner-block.tsx` | Background banner with text + button (server component) |
| `apps/web/components/storefront/blocks/newsletter-block.tsx` | "use client" — email input + subscribe button (UI only) |
| `apps/web/components/storefront/cms-page.tsx` | Block renderer with switch statement mapping block types to components |
| `apps/web/app/(marketing)/[slug]/page.tsx` | Server component — fetches page by slug via cmsRepo.getPageBySlug(), renders CmsPage; generateStaticParams returns empty for dynamic rendering |

## Commit

```
5112b87 feat: add CMS block renderers and dynamic page routing
```

## Notes

- cmsRepo does not exist yet (Task 7.1) — the `[slug]/page.tsx` import is a forward reference
- product-grid-block fetches from `/api/cms/collections?slug=...` which is created in Task 7.1
- Newsletter block is UI-only; no backend subscription handling
- All components use existing project conventions (`@/components/ui/button`, `@/components/ui/input`, Tailwind 4 classes, cn utility)
