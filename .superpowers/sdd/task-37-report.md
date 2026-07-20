# Task 9.1: Email Infrastructure — Report

**Status:** Complete

## Created files

| File | Purpose |
|------|---------|
| `apps/web/lib/email.ts` | Nodemailer transporter configured from env vars |
| `apps/web/lib/email/templates/order-confirmation.ts` | Order confirmation HTML template |
| `apps/web/lib/email/templates/order-shipped.ts` | Shipment notification HTML template |
| `apps/web/lib/email/templates/order-delivered.ts` | Delivery confirmation HTML template |
| `apps/web/lib/email/templates/order-cancelled.ts` | Cancellation notice HTML template |
| `apps/web/lib/email/templates/abandoned-cart.ts` | Abandoned cart reminder HTML template |
| `apps/web/lib/services/email-service.ts` | Email service — `sendEmail` helper + `emailService` object with 5 methods. Logs to `EmailLog` table on send/failure. |
| `apps/web/lib/jobs/abandoned-cart.ts` | Bull queue worker — queries carts older than 24h with items but no orders, sends reminders. |

## Edited files

| File | Change |
|------|--------|
| `apps/web/lib/services/checkout-service.ts` | Added `emailService.sendOrderConfirmation(order, user)` after order creation in `verifyPayment()` (line 147-150) |
| `apps/web/lib/services/fulfillment-service.ts` | Added email triggers in `handleWebhook()` — sends shipment notification on `SHIPPED`, delivery confirmation on `DELIVERED` (lines 100-112) |

## Installed

- `nodemailer` + `@types/nodemailer` — peer dep warning for next-auth is pre-existing

## Notes

- TypeScript check passes for new files. Pre-existing error in `lib/printify/orders.ts:28` is unrelated.
- `tsconfig.json` had unrelated drift (jsx/preserve→jsx, added `.next/dev/types` include) — restored from index before commit.
- `user` fetch added inline at the call sites since `verifyPayment` didn't have it in scope.
