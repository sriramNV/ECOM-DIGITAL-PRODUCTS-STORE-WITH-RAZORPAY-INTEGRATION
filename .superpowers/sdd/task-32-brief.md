# Task 7.4: Create coupon/promotion system + checkout wiring

**Plan:** Plan 07 lines 263-383
**Files:**
- `apps/web/lib/repositories/coupon-repo.ts`
- `apps/web/lib/services/coupon-service.ts`
- `apps/web/app/api/promotions/coupons/route.ts`
- `apps/web/app/admin/promotions/page.tsx`
- `apps/web/components/admin/promotions/coupon-form.tsx`
- `apps/web/components/admin/promotions/coupon-table.tsx`
- `apps/web/components/storefront/cart/coupon-input.tsx`

**Edit:** `apps/web/lib/services/checkout-service.ts` — add coupon validation before Razorpay order creation

Full code for coupon-repo.ts in plan lines 282-310.
Full code for coupon-service.ts in plan lines 314-362.
Wire-up diff in plan lines 366-376.

Steps:
1. Create coupon-repo.ts and coupon-service.ts
2. Create API routes for /api/promotions/coupons (GET, POST)
3. Create admin promotions page with coupon-table.tsx and coupon-form.tsx
4. Create coupon-input.tsx (client component for use in cart)
5. Wire coupon into checkout-service.ts — read file, add the coupon logic in createRazorpayOrder()
6. Commit

Commit:
```bash
git add apps/web/lib/repositories/coupon-repo.ts apps/web/lib/services/coupon-service.ts apps/web/app/api/promotions apps/web/app/admin/promotions apps/web/components/admin/promotions apps/web/components/storefront/cart/coupon-input.tsx
git commit -m "feat: add coupon system with admin CRUD and checkout validation"
```
