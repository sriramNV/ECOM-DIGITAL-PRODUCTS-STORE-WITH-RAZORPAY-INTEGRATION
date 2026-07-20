# Task 9.1: Create email infrastructure

**Plan:** Plan 09 lines 60-215
**Files:**
- `apps/web/lib/email.ts`
- `apps/web/lib/email/templates/order-confirmation.ts`
- `apps/web/lib/email/templates/order-shipped.ts`
- `apps/web/lib/email/templates/order-delivered.ts`
- `apps/web/lib/email/templates/order-cancelled.ts`
- `apps/web/lib/email/templates/abandoned-cart.ts`
- `apps/web/lib/services/email-service.ts`
- `apps/web/lib/jobs/abandoned-cart.ts`

**Edit:** `apps/web/lib/services/checkout-service.ts` — add email trigger
**Edit:** `apps/web/lib/services/fulfillment-service.ts` — add email triggers

Install: `pnpm add nodemailer @types/nodemailer --filter web`

Full code in plan lines 82-214.

For the wiring edits:
1. In checkout-service.ts verifyPayment(), after order creation but before the return, add: `emailService.sendOrderConfirmation(order, user).catch(logger.error)`. Note: `user` needs to be available — look for where the user is fetched.
2. In fulfillment-service.ts handleWebhook(), after order status updates, add email triggers.

For abandoned-cart job: Create a Bull queue worker that queries carts older than 24h with items but no order, then sends email.

Commit:
```bash
git add apps/web/lib/email.ts apps/web/lib/email apps/web/lib/services/email-service.ts apps/web/lib/jobs
git commit -m "feat: add email infrastructure with templates and abandoned cart job"
```
