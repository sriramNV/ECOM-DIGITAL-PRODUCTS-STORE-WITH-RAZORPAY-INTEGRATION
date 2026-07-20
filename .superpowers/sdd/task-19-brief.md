# Task 4.4: Create checkout API routes and UI

**Plan:** Plan 04 — Cart & Checkout
**Depends on:** Task 4.3 (checkoutService, pricingService, orderRepo)
**Produces:** Complete checkout flow with Razorpay payment

## Files to Create

- `apps/web/app/api/razorpay/create-order/route.ts`
- `apps/web/app/api/razorpay/verify/route.ts`
- `apps/web/app/api/razorpay/webhooks/route.ts`
- `apps/web/components/storefront/checkout/checkout-form.tsx`
- `apps/web/components/storefront/checkout/razorpay-button.tsx`
- `apps/web/app/(storefront)/checkout/page.tsx`
- `apps/web/app/(storefront)/checkout/success/page.tsx`

Detailed code in `docs/superpowers/plans/04-cart-checkout.md` lines 875-1167.

## Notes

- Checkout form requires auth — redirects to /login if not logged in
- RazorpayButton uses Razorpay SDK loaded from CDN (window.Razorpay)
- The webhook route verifies Razorpay signature and handles payment.captured events
- webhook handler uses Redis for idempotency

## Required: CheckoutForm and ShippingAddressForm

The plan reference CheckoutForm component. Create a minimal working version:
- A client component that shows shipping address fields + RazorpayButton
- Use shadcn Input components

## Commit
```bash
git add apps/web/app/api/razorpay apps/web/app/\(storefront\)/checkout apps/web/components/storefront/checkout
git commit -m "feat: add checkout flow with Razorpay payment integration"
```
