# Task 5.4: Create fulfillment service, dead letter repo, webhooks route + wiring

**Plan:** Plan 05 — Printify Integration
**Files:**
- `apps/web/lib/services/fulfillment-service.ts`
- `apps/web/lib/services/printify-sync-service.ts`
- `apps/web/lib/repositories/dead-letter-repo.ts`
- `apps/web/app/api/printify/webhooks/route.ts`

**Edit:** `apps/web/lib/services/checkout-service.ts` — add `fulfillmentService.submitOrder(order.id).catch(logger.error)` after order creation

Full code in `docs/superpowers/plans/05-printify.md` lines 441-614.

Notes:
- `checkout-service.ts` exists at `apps/web/lib/services/checkout-service.ts`
- Read and edit the existing file
- For Step 2 (create fulfillment-service.ts), the handleWebhook method expects 3 args. The webhook route passes `event`, `signature`, `rawBody`. That's fine. But `logger` needs to be imported already in checkout-service.ts — add if not present.
- For Step 4 wiring — in checkout-service.ts verifyPayment(), after `await prisma.order.update` or similar order-creation call, add the fulfillment trigger. Search for the right spot.

```bash
git add apps/web/lib/services/fulfillment-service.ts apps/web/lib/repositories/dead-letter-repo.ts apps/web/app/api/printify
git commit -m "feat: add fulfillment service and Printify webhook handler"
```
