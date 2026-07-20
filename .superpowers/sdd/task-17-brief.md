# Task 4.2: Create cart API routes and components

**Plan:** Plan 04 — Cart & Checkout
**Depends on:** Task 4.1 (cartRepo, useCartStore), Plan 02 (auth)
**Produces:** Working cart with guest→DB merge, cart page, add-to-cart functionality

## Files to Create

- `apps/web/app/api/cart/route.ts`
- `apps/web/app/api/cart/merge/route.ts`
- `apps/web/app/api/cart/items/[id]/route.ts`
- `apps/web/components/storefront/cart/cart-drawer.tsx`
- `apps/web/components/storefront/cart/cart-item-row.tsx`
- `apps/web/components/storefront/cart/cart-summary.tsx`
- `apps/web/components/storefront/product/add-to-cart-button.tsx` (overwrite placeholder)
- `apps/web/app/(storefront)/cart/page.tsx`

Detailed code in `docs/superpowers/plans/04-cart-checkout.md` lines 303-577.

## Notes

- The existing `add-to-cart-button.tsx` from Task 3.5 is a placeholder — replace it
- Cart page already redirects to /checkout which requires auth (Plan 04 Task 4.4)
- Cart merge route is called by login-form.tsx (Plan 02)
- cart-drawer.tsx is a slide-over panel — can be a simple component for now

## Commit
```bash
git add apps/web/app/api/cart apps/web/app/\(storefront\)/cart apps/web/components/storefront/cart apps/web/components/storefront/product/add-to-cart-button.tsx
git commit -m "feat: add cart API, pages, and components"
```
