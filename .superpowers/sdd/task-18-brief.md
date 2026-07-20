# Task 4.3: Set up Razorpay integration

**Plan:** Plan 04 — Cart & Checkout
**Depends on:** Task 4.1 (cartRepo), Plan 01 (order-number.ts)
**Produces:** `checkoutService.createRazorpayOrder()`, `checkoutService.verifyPayment()`

## Files to Create

- `apps/web/lib/razorpay.ts`
- `apps/web/lib/services/pricing-service.ts`
- `apps/web/lib/services/checkout-service.ts`
- `apps/web/lib/repositories/order-repo.ts`
- `apps/web/lib/services/__tests__/pricing-service.test.ts`

Detailed code in `docs/superpowers/plans/04-cart-checkout.md` lines 581-871.

## Steps

1. Install Razorpay SDK: `pnpm add razorpay --filter web`
2. Create all 5 files with code from the plan
3. Run tests: `npx vitest run lib/services/__tests__/pricing-service.test.ts`
4. Commit

## Commit
```bash
git add apps/web/lib/razorpay.ts apps/web/lib/services apps/web/lib/repositories/order-repo.ts
git commit -m "feat: add Razorpay integration, pricing service, and checkout service"
```
