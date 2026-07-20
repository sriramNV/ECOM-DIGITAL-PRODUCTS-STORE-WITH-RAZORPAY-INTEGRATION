# Task 4.3: Set up Razorpay integration — Report

**Status:** Complete

**Commits:**
- `7724421` feat: add Razorpay integration, pricing service, and checkout service

**Files Created:**
- `apps/web/lib/razorpay.ts` — Razorpay client singleton
- `apps/web/lib/services/pricing-service.ts` — subtotal/tax/shipping/total calculators
- `apps/web/lib/services/checkout-service.ts` — `createRazorpayOrder()` & `verifyPayment()`
- `apps/web/lib/repositories/order-repo.ts` — CRUD for orders (getById, getByUserId, list, updateStatus)
- `apps/web/lib/services/__tests__/pricing-service.test.ts` — 4 unit tests

**Test Results:** 4/4 passed (pricing-service unit tests)
