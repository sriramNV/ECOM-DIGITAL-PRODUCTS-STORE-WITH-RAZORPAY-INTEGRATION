# Frontend Fixes Report

## Fix 1: VariantSelector — wired `selectedId` and `onSelect`

**File:** `apps/web/app/(storefront)/products/[slug]/page.tsx`

**Problem:** The page was a server component using `productRepo.getBySlug()` with `selectedId={null}` and `onSelect={() => {}}`, so variant selection never worked.

**Fix:** Converted to a client component (`"use client"`) that:
- Uses `useParams()` via `use(params)` for Next.js 15 async params
- Calls `/api/products/[slug]` with `useEffect` to fetch product data
- Manages `selectedVariantId` with `useState`
- Passes real `selectedId` and `onSelect` to `VariantSelector`
- Passes the selected variant's price/size/color to `AddToCartButton`
- Shows a `Skeleton` loading state while fetching
- Removed `generateMetadata` (server-only; client component alternative would require a headless metadata approach)

---

## Fix 2: `/admin/cms` 404

**File:** `apps/web/app/admin/cms/page.tsx` (created)

**Problem:** CMS pages exist at `/admin/cms/pages`, `/admin/cms/banners`, `/admin/cms/collections` but `/admin/cms` returned 404.

**Fix:** Created a redirect page at `apps/web/app/admin/cms/page.tsx` that redirects to `/admin/cms/pages`.

---

## Fix 3: Admin button on homepage

**File:** `apps/web/components/storefront/layout/navbar.tsx`

**Problem:** No admin dashboard link existed for admin users in the navbar.

**Fix:** Added conditional admin link `(session.user.role === "ADMIN")` in the navbar that links to `/admin`.

---

## Fix 4: Cart ignoring coupons

**File:** `apps/web/components/storefront/cart/cart-summary.tsx`

**Problem:** Cart summary didn't integrate the `CouponInput` component.

**Fix:** 
- Added `"use client"` directive
- Added state for `couponCode`, `discount`, and `couponError`
- Created `handleApplyCoupon` that calls `/api/promotions/coupons/validate`
- Created `handleRemoveCoupon` to reset coupon state
- Integrated `CouponInput` component with all required props
- Added discount line item display in the summary
- Computes `total = subtotal - discount + shipping`

**Also:** Created `apps/web/app/api/promotions/coupons/validate/route.ts` — a public API endpoint that calls `couponService.validateAndApply()`.

---

## Fix 5: Next.js 15 params in admin orders

**File:** `apps/web/app/admin/orders/[id]/page.tsx`

**Problem:** Used `{ params: { id: string } }` (synchronous) — Next.js 15 requires `Promise`.

**Fix:** Changed type to `{ params: Promise<{ id: string }> }` and added `await params`.

---

## Fix 6: Razorpay create-order sends no items

**Files:**
- `apps/web/components/storefront/checkout/razorpay-button.tsx`
- `apps/web/components/storefront/checkout/checkout-form.tsx` (propped through)

**Problem:** `fetch("/api/razorpay/create-order")` sent an empty POST body — no shipping address, no coupon code.

**Fix:** 
- Added `couponCode?: string` prop to `RazorpayButton`
- Changed the `fetch` call to send `{ shippingAddress, couponCode }` as JSON body
- The `create-order` route already reads `body.couponCode`

---

## Pre-existing issues found (not fixed)

- **`apps/web/lib/printify/orders.ts:28`** — trailing comma on object return causes `Expression expected` syntax error. Blocks the full build.
