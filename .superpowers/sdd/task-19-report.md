# Task 4.4 Report — Checkout API Routes & UI

**Status:** Complete

## Created Files (7)

| File | Description |
|------|-------------|
| `apps/web/app/api/razorpay/create-order/route.ts` | POST — creates Razorpay order via checkoutService, requires auth |
| `apps/web/app/api/razorpay/verify/route.ts` | POST — verifies payment signature via checkoutService, creates order in DB |
| `apps/web/app/api/razorpay/webhooks/route.ts` | POST — validates webhook signature, idempotent via Redis, handles payment.captured |
| `apps/web/components/storefront/checkout/razorpay-button.tsx` | Client component — loads Razorpay SDK, shows Pay button with amount, handles full payment flow |
| `apps/web/components/storefront/checkout/checkout-form.tsx` | Client component — shipping address form (name, email, phone, street, city, state, pincode) + RazorpayButton |
| `apps/web/app/(storefront)/checkout/page.tsx` | Server component — checks auth (redirects to /login), renders CheckoutForm |
| `apps/web/app/(storefront)/checkout/success/page.tsx` | Server component — shows order confirmation with order ID, links to orders/products |

## Fix Applied

- `webhooks/route.ts`: Changed `redis.set(..., { EX: 86400 })` (ioredis object syntax not supported) to `redis.set(..., "EX", 86400)` (positional args).

## Build Verification

- `pnpm --filter web build` — compiled successfully
- Only pre-existing type error in `lib/auth.ts:21` (`next-auth/jwt` module augmentation) unrelated to this work

## Commits

```
3203e54 feat: add checkout flow with Razorpay payment integration
```
