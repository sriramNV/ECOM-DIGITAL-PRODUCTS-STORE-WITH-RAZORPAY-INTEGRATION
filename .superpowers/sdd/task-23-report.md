# Task 23 Report: Create fulfillment service, dead letter repo, webhooks route + wiring

## Files created
- `apps/web/lib/repositories/dead-letter-repo.ts` — adds failed fulfillment entries to audit log
- `apps/web/lib/services/fulfillment-service.ts` — `submitOrder` and `handleWebhook` methods
- `apps/web/app/api/printify/webhooks/route.ts` — POST endpoint with idempotency via Redis

## Files edited
- `apps/web/lib/services/checkout-service.ts` — added `fulfillmentService` import and fire-and-forget trigger after order creation

## Commit
`31e4a8c` — `feat: add fulfillment service and Printify webhook handler`
