# Task 3.4: Create product display components

**Plan:** Plan 03 — Product Catalog
**Depends on:** Task 3.1 (product data shape), Plan 01 (utils, shadcn)
**Produces:** Reusable product UI components

## Files to Create

- `apps/web/components/storefront/product/product-card.tsx`
- `apps/web/components/storefront/product/product-grid.tsx`
- `apps/web/components/storefront/product/product-gallery.tsx`
- `apps/web/components/storefront/product/variant-selector.tsx`
- `apps/web/components/storefront/product/price-display.tsx`
- `apps/web/components/storefront/shared/empty-state.tsx`
- `apps/web/components/storefront/shared/pagination.tsx`
- `apps/web/components/storefront/shared/breadcrumbs.tsx`

Create with exact content from plan file at `docs/superpowers/plans/03-product-catalog.md`.

## Notes

- `add-to-cart-button.tsx` is NOT created here — comes in Plan 04
- `search-bar.tsx`, `filter-panel.tsx` are NOT created here — comes in Plan 03 shared but can be skipped for MVP
- ProductGallery component can be a simple image display with main image + thumbnails. See plan for details.
- All use `cn()` from utils and project tokens
- ProductCard uses `next/image`
- Pagination uses `useRouter` and `useSearchParams` from `next/navigation`
- Breadcrumbs is a server component
- VariantSelector is a client component
