# Phase 7a — Email Automation

## Objective

Build the transactional email system — order confirmation, shipment notification, delivery confirmation, and abandoned cart recovery — using Nodemailer with HTML email templates.

---

## System Design

### Email Triggers

| Event | Email | Trigger | Timing |
|-------|-------|---------|--------|
| Order paid | Order Confirmation | After payment verification | Immediate |
| Order shipped | Shipment Notification | Printify webhook `order:shipment:created` | Immediate |
| Order delivered | Delivery Confirmation | Printify webhook `order:shipment:delivered` | Immediate |
| Order cancelled | Cancellation Notice | Admin cancellation action | Immediate |
| Abandoned cart | Cart Reminder | 24h after cart created (no checkout) | 24h delay |

### Email Service

```typescript
// lib/services/email-service.ts
import { transporter } from "@/lib/email";

const FROM = `"${storeName}" <${process.env.SMTP_FROM}>`;

export const emailService = {
  async sendOrderConfirmation(order: Order, user: User) {
    const html = renderTemplate("order-confirmation", { order, user });
    await transporter.sendMail({
      from: FROM,
      to: user.email,
      subject: `Order Confirmed — ${order.orderNumber}`,
      html,
    });
  },

  async sendShipmentNotification(order: Order, tracking: { carrier: string; trackingNumber: string; trackingUrl: string }) {
    const html = renderTemplate("order-shipped", { order, tracking });
    await transporter.sendMail({
      from: FROM,
      to: order.user.email,
      subject: `Your Order Has Shipped — ${order.orderNumber}`,
      html,
    });
  },

  async sendDeliveryConfirmation(order: Order) {
    const html = renderTemplate("order-delivered", { order });
    await transporter.sendMail({
      from: FROM,
      to: order.user.email,
      subject: `Order Delivered — ${order.orderNumber}`,
      html,
    });
  },

  async sendCancellationNotice(order: Order, reason: string) {
    const html = renderTemplate("order-cancelled", { order, reason });
    await transporter.sendMail({
      from: FROM,
      to: order.user.email,
      subject: `Order Cancelled — ${order.orderNumber}`,
      html,
    });
  },

  async sendAbandonedCart(email: string, cart: Cart, items: CartItem[]) {
    const html = renderTemplate("abandoned-cart", { cart, items });
    await transporter.sendMail({
      from: FROM,
      to: email,
      subject: "You left something in your cart!",
      html,
    });
  },
};
```

### Email Template Rendering

Templates are HTML strings with dynamic content. For MVP, use a simple template function (no separate template engine):

```typescript
// lib/email/templates/order-confirmation.ts
export function renderOrderConfirmation(order: Order, user: User): string {
  return `
    <!DOCTYPE html>
    <html>
    <head><meta charset="utf-8"></head>
    <body style="font-family: sans-serif; max-width: 600px; margin: 0 auto; padding: 20px;">
      <h1 style="color: #1a1a2e;">Thank you, ${user.name || "Customer"}!</h1>
      <p>Your order <strong>${order.orderNumber}</strong> has been confirmed.</p>

      <table style="width: 100%; border-collapse: collapse; margin: 20px 0;">
        <tr style="background: #f8f9fa;">
          <th style="padding: 10px; text-align: left;">Item</th>
          <th style="padding: 10px; text-align: center;">Qty</th>
          <th style="padding: 10px; text-align: right;">Price</th>
        </tr>
        ${order.items.map((item) => `
          <tr>
            <td style="padding: 10px; border-top: 1px solid #eee;">${item.title}</td>
            <td style="padding: 10px; border-top: 1px solid #eee; text-align: center;">${item.quantity}</td>
            <td style="padding: 10px; border-top: 1px solid #eee; text-align: right;">₹${item.totalPrice}</td>
          </tr>
        `).join("")}
      </table>

      <p><strong>Total: ₹${order.totalAmount}</strong></p>

      <h3>Shipping Address</h3>
      <p>${order.shippingAddress.name}<br>
      ${order.shippingAddress.address1}<br>
      ${order.shippingAddress.city}, ${order.shippingAddress.state} ${order.shippingAddress.zip}</p>

      <p style="color: #6b7280; font-size: 14px;">
        We'll notify you when your order ships. Typically 5-10 business days.
      </p>

      <hr style="border: none; border-top: 1px solid #eee; margin: 30px 0;">
      <p style="color: #9ca3af; font-size: 12px;">
        Need help? <a href="mailto:${process.env.SMTP_FROM}">Contact us</a>
      </p>
    </body>
    </html>
  `;
}
```

---

## Architecture

### Abandoned Cart Recovery

The abandoned cart job runs via Bull queue (Redis-backed), scheduled by a recurring cron worker.

```typescript
// lib/jobs/abandoned-cart.ts
import { Queue, Worker } from "bull";
import { prisma } from "@/lib/prisma";
import { emailService } from "@/lib/services/email-service";

export const abandonedCartQueue = new Queue("abandoned-cart", {
  redis: process.env.REDIS_URL,
});

// Runs every hour via cron in lib/queue.ts
async function processAbandonedCarts() {
  const cutoff = new Date(Date.now() - 24 * 60 * 60 * 1000);
  const oneDayAgo = new Date(Date.now() - 25 * 60 * 60 * 1000);

  const abandonedCarts = await prisma.cart.findMany({
    where: {
      createdAt: { gte: oneDayAgo, lte: cutoff },
      user: { email: { not: null } },
      items: { some: {} },
    },
    include: { items: true, user: true },
  });

  for (const cart of abandonedCarts) {
    await abandonedCartQueue.add("send-reminder", {
      cartId: cart.id,
      userId: cart.userId,
    });
  }
}

// Worker processes each reminder as a separate job
new Worker("abandoned-cart", async (job) => {
  if (job.name === "send-reminder") {
    const { userId } = job.data;
    const cart = await prisma.cart.findUnique({
      where: { userId },
      include: { items: true, user: true },
    });
    if (cart && cart.items.length > 0) {
      await emailService.sendAbandonedCart(cart.user.email!, cart, cart.items);
    }
  }
}, { redis: process.env.REDIS_URL });
```

### Email Logging

Every sent email is logged for debugging:

```prisma
model EmailLog {
  id        String   @id @default(cuid())
  to        String
  subject   String
  type      String                    // "order.confirmation", "cart.abandoned", etc.
  orderId   String?
  status    String                    // "sent", "failed"
  error     String?
  createdAt DateTime @default(now())
}
```

---

## Key Decisions

| Decision | Choice | Rationale |
|----------|--------|-----------|
| Email library | Nodemailer | Open-source, widely used, SMTP-agnostic |
| Template engine | Simple HTML function (no Handlebars/MJML) | No extra dependency, sufficient for transactional emails |
| SMTP provider | Configurable (SendGrid, Mailgun, SMTP2GO, etc.) | Nodemailer works with any SMTP |
| Abandoned cart timing | 24 hours after cart creation | Industry standard, balances urgency vs patience |
| Email sending | Async (fire-and-forget) | Don't block checkout flow on email delivery |
| Email logging | Database table | Debugging delivery issues |

---

## Steps

1. Install `nodemailer` and `@types/nodemailer`
2. Create `lib/email.ts` (Nodemailer transport)
3. Create `lib/email/templates/` directory with HTML template functions
4. Create `lib/email/templates/order-confirmation.ts`
5. Create `lib/email/templates/order-shipped.ts`
6. Create `lib/email/templates/order-delivered.ts`
7. Create `lib/email/templates/order-cancelled.ts`
8. Create `lib/email/templates/abandoned-cart.ts`
9. Create `lib/services/email-service.ts`
10. Create `lib/jobs/abandoned-cart.ts` (cron job)
11. Wire email into checkout service (send confirmation on payment)
12. Wire email into fulfillment service (send shipment/delivery on webhooks)
13. Wire email into order actions (send cancellation)
14. Add EmailLog model to Prisma
15. Verify: place test order, check email received, track in EmailLog

---

## Files Created

| File | Content |
|------|---------|
| `lib/email.ts` | Nodemailer transport |
| `lib/email/templates/order-confirmation.ts` | Order confirmation template |
| `lib/email/templates/order-shipped.ts` | Shipment notification template |
| `lib/email/templates/order-delivered.ts` | Delivery confirmation template |
| `lib/email/templates/order-cancelled.ts` | Cancellation notice template |
| `lib/email/templates/abandoned-cart.ts` | Cart recovery template |
| `lib/services/email-service.ts` | Email sending orchestration |
| `lib/jobs/abandoned-cart.ts` | Abandoned cart job |
| `prisma/schema.prisma` (updated) | EmailLog model |
