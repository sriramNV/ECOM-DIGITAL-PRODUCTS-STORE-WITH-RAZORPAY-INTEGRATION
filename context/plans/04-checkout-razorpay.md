# Phase 2c — Checkout with Razorpay

## Objective

Build the complete checkout flow — shipping address collection, shipping method selection from Printify, Razorpay payment modal integration, and post-payment order creation with automatic Printify fulfillment submission.

---

## System Design

### Payment Flow

```
1. Customer fills checkout form (address, shipping method)
2. POST /api/razorpay/create-order
     → Server validates cart, calculates total
     → Creates Razorpay Order via Razorpay API
     → Returns { razorpayOrderId, amount, currency }
3. Frontend opens Razorpay Checkout modal:
     → Customer sees UPI/CC/NB/Wallet options
     → Customer completes payment
     → Modal returns { payment_id, order_id, signature }
4. POST /api/razorpay/verify
     → Server verifies HMAC SHA256 signature
     → Creates Order in DB (status: PAID)
     → Submits order to Printify (async)
     → Sends confirmation email (async)
     → Returns { success, orderId }
5. Frontend redirects to /checkout/success?orderId=xxx
6. Razorpay sends payment.captured webhook (reconciliation)
     → Server verifies webhook signature
     → Idempotency check
     → If order not already processed → process it
```

### Order Models

GST/tax handling: Indian e-commerce requires tax collection. GST is calculated in `pricing-service.ts` and stored on the Order.

```prisma
model Order {
  id              String   @id @default(cuid())
  orderNumber     String   @unique           // e.g., POD-1001
  userId          String
  status          OrderStatus @default(PENDING_PAYMENT)
  totalAmount     Decimal                    // in INR (subtotal + shipping + tax - discount)
  subtotalAmount  Decimal                    // items total before tax/shipping
  shippingAmount  Decimal   @default(0)
  taxAmount       Decimal   @default(0)      // GST calculated as % of subtotal
  taxRate         Decimal   @default(18)     // GST rate (18% default)
  discountAmount  Decimal   @default(0)
  couponId        String?
  currency        String   @default("INR")
  shippingAddress Json?                      // { name, street, city, state, pincode, country, phone }
  shippingMethod  String?
  printifyOrderId String?                    // Printify order ID after submission
  notes           String?
  createdAt       DateTime @default(now())
  updatedAt       DateTime @updatedAt

  user    User       @relation(fields: [userId], references: [id])
  items   OrderItem[]
  payments Payment[]
  statusHistory OrderStatusHistory[]
  coupon  Coupon?    @relation(fields: [couponId], references: [id])
}

model OrderItem {
  id        String  @id @default(cuid())
  orderId   String
  productId String
  variantId String
  title     String                    // snapshot of product title at time of order
  variant   String                    // snapshot of variant info
  quantity  Int
  unitPrice Decimal                  // price at time of order
  totalPrice Decimal

  order Order @relation(fields: [orderId], references: [id], onDelete: Cascade)
}

model Payment {
  id                String   @id @default(cuid())
  orderId           String
  razorpayPaymentId String?
  razorpayOrderId   String?
  razorpaySignature String?
  amount            Decimal
  currency          String   @default("INR")
  status            PaymentStatus @default(PENDING)
  method            String?           // UPI, card, netbanking, wallet
  createdAt         DateTime @default(now())

  order Order @relation(fields: [orderId], references: [id])
}

model OrderStatusHistory {
  id        String   @id @default(cuid())
  orderId   String
  status    OrderStatus
  note      String?
  createdAt DateTime @default(now())

  order Order @relation(fields: [orderId], references: [id])
}

enum OrderStatus {
  PENDING_PAYMENT
  PAID
  PROCESSING       // submitted to Printify
  PRINTING         // Printify: sent-to-production
  SHIPPED          // Printify: shipment-created
  DELIVERED        // Printify: shipment-delivered
  CANCELLED
  REFUNDED
}

enum PaymentStatus {
  PENDING
  COMPLETED
  FAILED
  REFUNDED
}
```

---

## Architecture

### Razorpay Integration

```typescript
// lib/razorpay.ts
import Razorpay from "razorpay";

export const razorpay = new Razorpay({
  key_id: process.env.RAZORPAY_KEY_ID!,
  key_secret: process.env.RAZORPAY_KEY_SECRET!,
});
```

### Checkout Service

```typescript
// lib/services/checkout-service.ts
export const checkoutService = {
  async createRazorpayOrder(userId: string, cartId: string) {
    // 1. Fetch cart with items
    // 2. Calculate total (items + shipping - discount)
    // 3. Validate inventory (all variants enabled)
    // 4. Create Razorpay order
    const rzpOrder = await razorpay.orders.create({
      amount: Math.round(total * 100), // convert to paise
      currency: "INR",
      receipt: `cart_${cartId}`,
      notes: { userId },
    });
    // 5. Save razorpayOrderId on cart/order record
    // 6. Return { razorpayOrderId, amount: total, currency: "INR" }
  },

  async verifyPayment(paymentId: string, orderId: string, signature: string) {
    // 1. Verify HMAC SHA256
    const expected = crypto
      .createHmac("sha256", process.env.RAZORPAY_KEY_SECRET!)
      .update(`${orderId}|${paymentId}`)
      .digest("hex");
    if (expected !== signature) throw new Error("Invalid signature");

    // 2. Fetch Razorpay payment details
    const payment = await razorpay.payments.fetch(paymentId);

    // 3. Create Order in DB
    const order = await prisma.order.create({
      data: {
        orderNumber: await generateOrderNumber(),
        userId,
        status: "PAID",
        totalAmount: payment.amount / 100,
        // ... shipping address, items from cart
      },
    });

    // 4. Create Payment record
    await prisma.payment.create({
      data: {
        orderId: order.id,
        razorpayPaymentId: paymentId,
        razorpayOrderId: orderId,
        razorpaySignature: signature,
        amount: payment.amount / 100,
        status: "COMPLETED",
        method: payment.method,
      },
    });

    // 5. Clear cart
    // 6. Submit to Printify (async, don't await)
    fulfillmentService.submitOrder(order.id).catch(logger.error);

    // 7. Send confirmation email (async)
    emailService.sendOrderConfirmation(order, user).catch(logger.error);

    return order;
  },
};
```

### Checkout Page Layout

```
┌─────────────────────────────────────────────────────┐
│  Checkout                                            │
│                                                     │
│  ┌──────────────────┐  ┌──────────────────────────┐ │
│  │ Shipping Address  │  │  Order Summary           │ │
│  │  ┌──────────────┐│  │                          │ │
│  │  │ Name *       ││  │  Item 1         ₹699 x 2 │ │
│  │  │ Street *     ││  │  Item 2         ₹499 x 1 │ │
│  │  │ City *       ││  │                          │ │
│  │  │ State *      ││  │  Subtotal:          ₹1897 │ │
│  │  │ Pincode *    ││  │  Shipping:           ₹99  │ │
│  │  │ Phone *      ││  │  Discount:          -₹100 │ │
│  │  └──────────────┘│  │  ───────────────────────  │ │
│  │                   │  │  Total:             ₹1896 │ │
│  │  Shipping Method  │  │                          │ │
│  │  ○ Standard ₹99   │  │  [Pay ₹1,896 via         │ │
│  │  ○ Express ₹199   │  │   Razorpay]              │ │
│  └──────────────────┘  └──────────────────────────┘ │
└─────────────────────────────────────────────────────┘
```

---

## Key Decisions

| Decision | Choice | Rationale |
|----------|--------|-----------|
| Payment gateway | Razorpay Orders API + Checkout modal | Indian market focus, UPI support, no redirect |
| Amount format | Paise (₹1 = 100 paise) | Razorpay requires lowest currency unit |
| Signature verification | HMAC SHA256 (server-side) | Prevents tampering, never trust client |
| Order number | Sequential: `POD-{incrementing}` | Human-readable, customer-facing |
| Order creation timing | On payment verification, not webhook | Immediate confirmation, webhook is backup |
| Shipping calculation | From Printify API (cached) | Accurate rates, but cached for 5 min |
| Address validation | Zod schema | Client + server validation |
| Async fulfillment | Fire-and-forget after payment | Don't block the user on Printify latency |

---

## Steps

1. Install `razorpay` npm package
2. Update Prisma schema with Order, OrderItem, Payment, OrderStatusHistory models
3. Run `pnpm prisma:migrate dev --name add-orders`
4. Create `lib/razorpay.ts`
5. Create `lib/services/checkout-service.ts`
6. Create `lib/services/pricing-service.ts` (calculate totals, apply discounts)
7. Create `lib/repositories/order-repo.ts`
8. Create `app/api/razorpay/create-order/route.ts`
9. Create `app/api/razorpay/verify/route.ts`
10. Create `app/api/razorpay/webhooks/route.ts`
11. Create `components/storefront/checkout/checkout-form.tsx`
12. Create `components/storefront/checkout/shipping-address-form.tsx`
13. Create `components/storefront/checkout/shipping-method-selector.tsx`
14. Create `components/storefront/checkout/order-summary.tsx`
15. Create `components/storefront/checkout/razorpay-button.tsx`
16. Create `app/(storefront)/checkout/page.tsx`
17. Create `app/(storefront)/checkout/success/page.tsx`
18. Create order number generator helper (`lib/order-number.ts`):
    - Uses Redis `INCR` for atomic sequential numbering: `POD-{6-digit}`
    - Falls back to timestamp-based ID if Redis is unavailable
    - Format: `POD-100001`, `POD-100002`, etc.
19. Create `lib/services/pricing-service.ts` with GST calculation:
    - `calculateSubtotal(items)` → sum of item prices × quantities
    - `calculateTax(subtotal, rate)` → subtotal × rate/100
    - `calculateTotal(subtotal, shipping, tax, discount)` → final amount
    - GST shown as separate line item in checkout summary
20. Verify: full checkout flow with test Razorpay payment

---

## Files Created

| File | Content |
|------|---------|
| `prisma/schema.prisma` (updated) | Order, OrderItem, Payment, OrderStatusHistory |
| `lib/razorpay.ts` | Razorpay SDK client |
| `lib/services/checkout-service.ts` | Order creation + payment logic |
| `lib/services/pricing-service.ts` | Price calculation |
| `lib/repositories/order-repo.ts` | Order CRUD |
| `app/api/razorpay/create-order/route.ts` | Create Razorpay order |
| `app/api/razorpay/verify/route.ts` | Verify payment signature |
| `app/api/razorpay/webhooks/route.ts` | Webhook receiver |
| `components/storefront/checkout/checkout-form.tsx` | Main checkout form |
| `components/storefront/checkout/shipping-address-form.tsx` | Address fields |
| `components/storefront/checkout/shipping-method-selector.tsx` | Shipping options |
| `components/storefront/checkout/order-summary.tsx` | Price summary sidebar |
| `components/storefront/checkout/razorpay-button.tsx` | Razorpay modal trigger |
| `app/(storefront)/checkout/page.tsx` | Checkout page |
| `app/(storefront)/checkout/success/page.tsx` | Confirmation page |
