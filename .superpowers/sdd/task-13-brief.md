# Task 3.3: Create storefront layout components

**Plan:** Plan 03 — Product Catalog
**Depends on:** Plan 02 (auth session), Plan 01 (shadcn/ui components)
**Produces:** Reusable storefront layout with Navbar, Footer, Announcement bar

## Files to Create

- `apps/web/components/storefront/layout/navbar.tsx`
- `apps/web/components/storefront/layout/footer.tsx`
- `apps/web/components/storefront/layout/mobile-menu.tsx`
- `apps/web/components/storefront/layout/announcement-bar.tsx`
- `apps/web/app/(storefront)/layout.tsx`

## Steps

Create each file with exact content from the plan. Navbar is a client component using `"use client"`, `useSession`, and `signOut` from `next-auth/react`. Uses `useCartStore` from `@/stores/cart-store` (doesn't exist yet — wrap in try/catch or optional chaining).

Footer and AnnouncementBar are server components. MobileMenu is a client component.

The storefront layout wraps children with AnnouncementBar, Navbar, and Footer.

## Notes

- The cart store doesn't exist yet (comes in Plan 04) — the navbar `totalItems` will be 0 by default. Use optional chaining on `useCartStore` or just let it default to 0.
- Actually, since `useCartStore` doesn't exist yet, you may need to either skip the cart store import or stub it. The simplest approach: remove the cart icon from navbar for now and add it in Plan 04, OR stub a simple cart-store.ts.
- Better approach: just create the navbar without the cart store dependency — remove the `useCartStore` import and `totalItems` for now. The plan can update in Plan 04.
- The mobile menu receives `open` and `onClose` props.
- All components use shadcn (Button) and lucide-react icons.
