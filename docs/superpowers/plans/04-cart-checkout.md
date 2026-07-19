# Plan 04: Cart & Checkout

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development or superpowers:executing-plans. Steps use `- [ ]` syntax.

**Goal:** Build the shopping cart (guest + authenticated) and complete Razorpay checkout flow with order creation

**Architecture:** Zustand store with localStorage persist for guest carts, PostgreSQL-backed cart for authenticated users. Cart merges on login. Razorpay Orders API creates orders server-side; Razorpay Checkout opens as modal on frontend. Signature verification is always server-side.

**Tech Stack:** Zustand, TanStack Query, Razorpay SDK, Zod, Prisma, crypto (Node.js)

---

## Global Constraints

- Amount always in paise for Razorpay (₹1 = 100 paise)
- Signature verification server-side only
- Webhook is secondary reconciliation — order created on payment verification
- GST (18% default) calculated in pricing service
- Order numbers: sequential `POD-{6-digit}` via Redis INCR
- Guest cart merges into DB on login via `POST /api/cart/merge`
- Abandoned cart emails triggered via Bull queue (24h delay)

---

## File Structure

```
apps/web/
├── app/(storefront)/
│   ├── cart/page.tsx              # Full cart page
│   └── checkout/
│       ├── page.tsx               # Checkout page
│       └── success/page.tsx       # Order confirmation
├── app/api/
│   ├── cart/
│   │   ├── route.ts               # GET cart, POST sync
│   │   ├── merge/route.ts         # POST merge guest→DB
│   │   └── items/[id]/route.ts    # PUT/DELETE cart items
│   ├── razorpay/
│   │   ├── create-order/route.ts  # POST create Razorpay order
│   │   ├── verify/route.ts        # POST verify payment
│   │   └── webhooks/route.ts      # POST webhook receiver
│   └── orders/
│       └── route.ts               # GET user orders
├── components/storefront/
│   ├── cart/
│   │   ├── cart-drawer.tsx
│   │   ├── cart-item-row.tsx
│   │   ├── cart-summary.tsx
│   │   └── coupon-input.tsx
│   ├── checkout/
│   │   ├── checkout-form.tsx
│   │   ├── shipping-address-form.tsx
│   │   ├── shipping-method-selector.tsx
│   │   ├── order-summary.tsx
│   │   └── razorpay-button.tsx
│   └── product/
│       └── add-to-cart-button.tsx
├── lib/
│   ├── razorpay.ts                # Razorpay SDK client
│   ├── services/
│   │   ├── checkout-service.ts    # Order creation + payment logic
│   │   └── pricing-service.ts     # Price + GST calculation
│   └── repositories/
│       ├── cart-repo.ts           # Cart DB operations
│       └── order-repo.ts          # Order DB operations
├── stores/
│   └── cart-store.ts              # Zustand cart store
├── hooks/
│   └── use-cart.ts                # React hook for cart
└── types/
    └── cart.ts                    # Cart item type
```

---

### Task 4.1: Create cart store and repository

**Files:**
- Create: `apps/web/stores/cart-store.ts`
- Create: `apps/web/lib/repositories/cart-repo.ts`
- Create: `apps/web/types/cart.ts`

**Interfaces:**
- Consumes: `prisma` from Plan 01, `CartItem` type
- Produces: `useCartStore` Zustand hook, `cartRepo` with CRUD + merge

- [ ] **Step 1: Create apps/web/stores/cart-store.ts**

```typescript
import { create } from "zustand";
import { persist } from "zustand/middleware";
import type { CartItem } from "@/types";

type CartStore = {
  items: CartItem[];
  addItem: (item: CartItem) => void;
  removeItem: (id: string) => void;
  updateQuantity: (id: string, quantity: number) => void;
  clearCart: () => void;
  setItems: (items: CartItem[]) => void;
};

export const useCartStore = create<CartStore>()(
  persist(
    (set, get) => ({
      items: [],
      addItem: (item) => {
        const existing = get().items.find((i) => i.id === item.id);
        if (existing) {
          set({
            items: get().items.map((i) =>
              i.id === item.id ? { ...i, quantity: Math.min(i.quantity + 1, 10) } : i,
            ),
          });
        } else {
          set({ items: [...get().items, { ...item, quantity: 1 }] });
        }
      },
      removeItem: (id) => set({ items: get().items.filter((i) => i.id !== id) }),
      updateQuantity: (id, quantity) =>
        set({
          items: quantity <= 0
            ? get().items.filter((i) => i.id !== id)
            : get().items.map((i) => (i.id === id ? { ...i, quantity: Math.min(quantity, 10) } : i)),
        }),
      clearCart: () => set({ items: [] }),
      setItems: (items) => set({ items }),
    }),
    { name: "pod-cart" },
  ),
);
```

- [ ] **Step 2: Create apps/web/types/cart.ts**

```typescript
export type CartItem = {
  id: string;
  productId: string;
  variantId: string;
  title: string;
  image: string;
  price: number;
  quantity: number;
  size: string;
  color: string;
  slug: string;
};
```

- [ ] **Step 3: Create apps/web/lib/repositories/cart-repo.ts**

```typescript
import { prisma } from "@/lib/prisma";

export const cartRepo = {
  async getByUserId(userId: string) {
    return prisma.cart.findUnique({
      where: { userId },
      include: {
        items: {
          include: {
            product: { select: { title: true, slug: true } },
            variant: { select: { title: true, price: true, size: true, color: true } },
          },
        },
      },
    });
  },

  async addItem(userId: string, productId: string, variantId: string, quantity: number) {
    const cart = await prisma.cart.upsert({
      where: { userId },
      create: { userId },
      update: {},
    });

    const existing = await prisma.cartItem.findFirst({
      where: { cartId: cart.id, variantId },
    });

    if (existing) {
      return prisma.cartItem.update({
        where: { id: existing.id },
        data: { quantity: Math.min(existing.quantity + quantity, 10) },
      });
    }

    return prisma.cartItem.create({
      data: { cartId: cart.id, productId, variantId, quantity },
    });
  },

  async updateItemQuantity(itemId: string, quantity: number) {
    if (quantity <= 0) {
      return prisma.cartItem.delete({ where: { id: itemId } });
    }
    return prisma.cartItem.update({
      where: { id: itemId },
      data: { quantity: Math.min(quantity, 10) },
    });
  },

  async removeItem(itemId: string) {
    return prisma.cartItem.delete({ where: { id: itemId } });
  },

  async mergeGuestCart(userId: string, guestItems: Array<{ productId: string; variantId: string; quantity: number }>) {
    const cart = await prisma.cart.upsert({
      where: { userId },
      create: { userId },
      update: {},
    });

    for (const guest of guestItems) {
      const existing = await prisma.cartItem.findFirst({
        where: { cartId: cart.id, variantId: guest.variantId },
      });

      if (existing) {
        await prisma.cartItem.update({
          where: { id: existing.id },
          data: { quantity: Math.min(existing.quantity + guest.quantity, 10) },
        });
      } else {
        await prisma.cartItem.create({
          data: {
            cartId: cart.id,
            productId: guest.productId,
            variantId: guest.variantId,
            quantity: guest.quantity,
          },
        });
      }
    }

    return cartRepo.getByUserId(userId);
  },

  async clearCart(userId: string) {
    const cart = await prisma.cart.findUnique({ where: { userId } });
    if (cart) {
      await prisma.cartItem.deleteMany({ where: { cartId: cart.id } });
    }
  },
};
```

- [ ] **Step 4: Add cart store test**

```typescript
// stores/__tests__/cart-store.test.ts
import { describe, it, expect, beforeEach } from "vitest";
import { useCartStore } from "@/stores/cart-store";

describe("cartStore", () => {
  beforeEach(() => {
    useCartStore.setState({ items: [] });
  });

  it("adds item to empty cart", () => {
    useCartStore.getState().addItem({
      id: "p-v1", productId: "p1", variantId: "v1",
      title: "Test", image: "", price: 499, quantity: 1,
      size: "M", color: "Black", slug: "test",
    });
    expect(useCartStore.getState().items).toHaveLength(1);
  });

  it("increments quantity for duplicate item", () => {
    const item = { id: "p-v1", productId: "p1", variantId: "v1", title: "Test", image: "", price: 499, quantity: 1, size: "M", color: "Black", slug: "test" };
    useCartStore.getState().addItem(item);
    useCartStore.getState().addItem(item);
    expect(useCartStore.getState().items[0].quantity).toBe(2);
  });

  it("removes item", () => {
    useCartStore.getState().addItem({ id: "p-v1", productId: "p1", variantId: "v1", title: "Test", image: "", price: 499, quantity: 1, size: "M", color: "Black", slug: "test" });
    useCartStore.getState().removeItem("p-v1");
    expect(useCartStore.getState().items).toHaveLength(0);
  });
});
```

- [ ] **Step 5: Run tests**

```bash
npx vitest run stores/__tests__/cart-store.test.ts
```

Expected: All 3 tests pass.

- [ ] **Step 6: Commit**

```bash
git add apps/web/stores/cart-store.ts apps/web/types/cart.ts apps/web/lib/repositories/cart-repo.ts
git commit -m "feat: add cart store with Zustand and cart repository"
```

---

### Task 4.2: Create cart API routes and components

**Files:**
- Create: `apps/web/app/api/cart/route.ts`
- Create: `apps/web/app/api/cart/merge/route.ts`
- Create: `apps/web/app/api/cart/items/[id]/route.ts`
- Create: `apps/web/components/storefront/cart/cart-drawer.tsx`
- Create: `apps/web/components/storefront/cart/cart-item-row.tsx`
- Create: `apps/web/components/storefront/cart/cart-summary.tsx`
- Create: `apps/web/components/storefront/cart/coupon-input.tsx`
- Create: `apps/web/components/storefront/product/add-to-cart-button.tsx`
- Create: `apps/web/app/(storefront)/cart/page.tsx`

**Interfaces:**
- Consumes: `cartRepo` from Task 4.1, `useCartStore` from Task 4.1, `auth()` from Plan 02
- Produces: working cart with guest→DB persistence, merge on login

- [ ] **Step 1: Create apps/web/app/api/cart/route.ts**

```typescript
import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { cartRepo } from "@/lib/repositories/cart-repo";

export async function GET() {
  const session = await auth();
  if (!session?.user?.id) {
    return NextResponse.json({ items: [] });
  }

  const cart = await cartRepo.getByUserId(session.user.id);
  return NextResponse.json(cart ?? { items: [] });
}

export async function POST(request: NextRequest) {
  const session = await auth();
  if (!session?.user?.id) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { items } = await request.json();
  await cartRepo.clearCart(session.user.id);

  for (const item of items) {
    await cartRepo.addItem(session.user.id, item.productId, item.variantId, item.quantity);
  }

  return NextResponse.json({ success: true });
}
```

- [ ] **Step 2: Create apps/web/app/api/cart/merge/route.ts**

```typescript
import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { cartRepo } from "@/lib/repositories/cart-repo";

export async function POST(request: NextRequest) {
  const session = await auth();
  if (!session?.user?.id) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const body = await request.json().catch(() => ({}));
  const guestItems = body.items ?? [];

  const cart = await cartRepo.mergeGuestCart(
    session.user.id,
    guestItems.map((i: { productId: string; variantId: string; quantity?: number }) => ({
      productId: i.productId,
      variantId: i.variantId,
      quantity: i.quantity ?? 1,
    })),
  );

  return NextResponse.json(cart);
}
```

- [ ] **Step 3: Create add-to-cart-button.tsx**

```typescript
"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";
import { useCartStore } from "@/stores/cart-store";

type Props = {
  productId: string;
  variantId?: string;
  title: string;
  image: string;
  price: number;
  size?: string;
  color?: string;
  slug: string;
  disabled?: boolean;
};

export function AddToCartButton({ productId, variantId, title, image, price, size, color, slug, disabled }: Props) {
  const [added, setAdded] = useState(false);
  const addItem = useCartStore((s) => s.addItem);

  function handleClick() {
    if (!variantId) return;

    addItem({
      id: `${productId}-${variantId}`,
      productId,
      variantId,
      title,
      image,
      price,
      quantity: 1,
      size: size ?? "",
      color: color ?? "",
      slug,
    });

    setAdded(true);
    setTimeout(() => setAdded(false), 2000);
  }

  return (
    <Button
      onClick={handleClick}
      disabled={disabled || !variantId}
      className="w-full"
    >
      {added ? "Added!" : disabled ? "Sold Out" : "Add to Cart"}
    </Button>
  );
}
```

- [ ] **Step 4: Create cart page and drawer components**

```typescript
// apps/web/components/storefront/cart/cart-item-row.tsx
"use client";

import Image from "next/image";
import Link from "next/link";
import { Trash2 } from "lucide-react";
import { useCartStore } from "@/stores/cart-store";
import { formatCurrency } from "@/lib/utils";
import type { CartItem } from "@/types";

type Props = { item: CartItem };

export function CartItemRow({ item }: Props) {
  const updateQuantity = useCartStore((s) => s.updateQuantity);
  const removeItem = useCartStore((s) => s.removeItem);

  return (
    <div className="flex gap-4 py-4 border-b border-border">
      <Link href={`/products/${item.slug}`} className="w-20 h-20 relative rounded-md overflow-hidden flex-shrink-0 bg-surface">
        <Image src={item.image} alt={item.title} fill className="object-cover" sizes="80px" />
      </Link>
      <div className="flex-1 min-w-0">
        <Link href={`/products/${item.slug}`} className="text-sm font-medium text-foreground truncate block hover:underline">
          {item.title}
        </Link>
        <p className="text-xs text-foreground-faint">{item.color} / {item.size}</p>
        <div className="flex items-center gap-3 mt-2">
          <select
            value={item.quantity}
            onChange={(e) => updateQuantity(item.id, Number(e.target.value))}
            className="text-sm border border-border rounded px-2 py-1 bg-background"
          >
            {[1, 2, 3, 4, 5, 6, 7, 8, 9, 10].map((n) => (
              <option key={n} value={n}>{n}</option>
            ))}
          </select>
          <span className="text-sm font-medium text-foreground">{formatCurrency(item.price * item.quantity)}</span>
        </div>
      </div>
      <button onClick={() => removeItem(item.id)} className="text-foreground-faint hover:text-error" aria-label="Remove item">
        <Trash2 className="h-4 w-4" />
      </button>
    </div>
  );
}
```

```typescript
// apps/web/components/storefront/cart/cart-summary.tsx
import { useCartStore } from "@/stores/cart-store";
import { formatCurrency } from "@/lib/utils";

export function CartSummary() {
  const items = useCartStore((s) => s.items);
  const subtotal = items.reduce((sum, i) => sum + i.price * i.quantity, 0);
  const shipping = subtotal >= 999 ? 0 : 99;
  const total = subtotal + shipping;

  return (
    <div className="bg-surface rounded-lg p-6 space-y-3">
      <div className="flex justify-between text-sm">
        <span className="text-foreground-muted">Subtotal</span>
        <span className="text-foreground">{formatCurrency(subtotal)}</span>
      </div>
      <div className="flex justify-between text-sm">
        <span className="text-foreground-muted">Shipping</span>
        <span className="text-foreground">{shipping === 0 ? "Free" : formatCurrency(shipping)}</span>
      </div>
      {shipping > 0 && subtotal < 999 && (
        <p className="text-xs text-foreground-faint">Free shipping above {formatCurrency(999)}</p>
      )}
      <div className="border-t border-border pt-3 flex justify-between font-medium">
        <span className="text-foreground">Total</span>
        <span className="text-foreground">{formatCurrency(total)}</span>
      </div>
    </div>
  );
}
```

```typescript
// apps/web/app/(storefront)/cart/page.tsx
"use client";

import Link from "next/link";
import { ShoppingBag } from "lucide-react";
import { useCartStore } from "@/stores/cart-store";
import { CartItemRow } from "@/components/storefront/cart/cart-item-row";
import { CartSummary } from "@/components/storefront/cart/cart-summary";
import { EmptyState } from "@/components/storefront/shared/empty-state";
import { Button } from "@/components/ui/button";

export default function CartPage() {
  const items = useCartStore((s) => s.items);

  if (items.length === 0) {
    return (
      <div className="max-w-7xl mx-auto px-4 py-8">
        <EmptyState
          icon={ShoppingBag}
          title="Your cart is empty"
          description="Looks like you haven't added anything yet."
          action={{ label: "Start Shopping", href: "/products" }}
        />
      </div>
    );
  }

  return (
    <div className="max-w-7xl mx-auto px-4 md:px-6 lg:px-8 py-8">
      <h1 className="text-2xl font-bold text-foreground mb-8">Shopping Cart</h1>
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        <div className="lg:col-span-2">
          {items.map((item) => (
            <CartItemRow key={item.id} item={item} />
          ))}
        </div>
        <div className="space-y-4">
          <CartSummary />
          <Link href="/checkout">
            <Button className="w-full">Proceed to Checkout</Button>
          </Link>
        </div>
      </div>
    </div>
  );
}
```

- [ ] **Step 5: Commit**

```bash
git add apps/web/app/api/cart apps/web/app/\(storefront\)/cart apps/web/components/storefront/cart apps/web/components/storefront/product/add-to-cart-button.tsx
git commit -m "feat: add cart API, pages, and components"
```

---

### Task 4.3: Set up Razorpay integration

**Files:**
- Create: `apps/web/lib/razorpay.ts`
- Create: `apps/web/lib/services/pricing-service.ts`
- Create: `apps/web/lib/services/checkout-service.ts`
- Create: `apps/web/lib/repositories/order-repo.ts`

**Interfaces:**
- Consumes: `prisma`, `generateOrderNumber()` from Plan 01, `cartRepo` from Task 4.1
- Produces: `checkoutService.createRazorpayOrder()`, `checkoutService.verifyPayment()`

- [ ] **Step 1: Install Razorpay SDK**

```bash
pnpm add razorpay --filter web
```

- [ ] **Step 2: Create apps/web/lib/razorpay.ts**

```typescript
import Razorpay from "razorpay";

export const razorpay = new Razorpay({
  key_id: process.env.RAZORPAY_KEY_ID!,
  key_secret: process.env.RAZORPAY_KEY_SECRET!,
});
```

- [ ] **Step 3: Create apps/web/lib/services/pricing-service.ts**

```typescript
export function calculateSubtotal(items: Array<{ unitPrice: number; quantity: number }>): number {
  return items.reduce((sum, item) => sum + item.unitPrice * item.quantity, 0);
}

export function calculateTax(subtotal: number, rate: number = 18): number {
  return Math.round((subtotal * rate) / 100);
}

export function calculateTotal(
  subtotal: number,
  shipping: number = 0,
  tax: number = 0,
  discount: number = 0,
): number {
  return subtotal + shipping + tax - discount;
}

export function calculateShipping(subtotal: number, freeThreshold: number = 999): number {
  if (subtotal >= freeThreshold) return 0;
  return 99;
}
```

- [ ] **Step 4: Create apps/web/lib/services/checkout-service.ts**

```typescript
import crypto from "crypto";
import { razorpay } from "@/lib/razorpay";
import { prisma } from "@/lib/prisma";
import { cartRepo } from "@/lib/repositories/cart-repo";
import { generateOrderNumber } from "@/lib/order-number";
import { calculateSubtotal, calculateTax, calculateShipping, calculateTotal } from "./pricing-service";
import { logger } from "@/lib/logger";

export const checkoutService = {
  async createRazorpayOrder(userId: string) {
    const cart = await cartRepo.getByUserId(userId);
    if (!cart || cart.items.length === 0) {
      throw new Error("Cart is empty");
    }

    const items = cart.items.map((i) => ({
      unitPrice: Number(i.variant.price),
      quantity: i.quantity,
    }));

    const subtotal = calculateSubtotal(items);
    const shipping = calculateShipping(subtotal);
    const tax = calculateTax(subtotal);
    const total = calculateTotal(subtotal, shipping, tax);
    const amountInPaise = Math.round(total * 100);

    const rzpOrder = await razorpay.orders.create({
      amount: amountInPaise,
      currency: "INR",
      receipt: `cart_${cart.id}`,
      notes: { userId },
    });

    return {
      razorpayOrderId: rzpOrder.id,
      amount: total,
      amountInPaise,
      currency: "INR",
    };
  },

  async verifyPayment(userId: string, paymentId: string, orderId: string, signature: string, shippingAddress: Record<string, unknown>) {
    const expected = crypto
      .createHmac("sha256", process.env.RAZORPAY_KEY_SECRET!)
      .update(`${orderId}|${paymentId}`)
      .digest("hex");

    if (expected !== signature) {
      throw new Error("Invalid payment signature");
    }

    const cart = await cartRepo.getByUserId(userId);
    if (!cart || cart.items.length === 0) {
      throw new Error("Cart is empty");
    }

    const items = cart.items.map((i) => ({
      unitPrice: Number(i.variant.price),
      quantity: i.quantity,
    }));

    const subtotal = calculateSubtotal(items);
    const shipping = calculateShipping(subtotal);
    const tax = calculateTax(subtotal);
    const total = calculateTotal(subtotal, shipping, tax);

    const orderNumber = await generateOrderNumber();

    const order = await prisma.order.create({
      data: {
        orderNumber,
        userId,
        status: "PAID",
        totalAmount: total,
        subtotalAmount: subtotal,
        shippingAmount: shipping,
        taxAmount: tax,
        taxRate: 18,
        currency: "INR",
        shippingAddress,
        payments: {
          create: {
            razorpayPaymentId: paymentId,
            razorpayOrderId: orderId,
            razorpaySignature: signature,
            amount: total,
            status: "COMPLETED",
          },
        },
        items: {
          create: cart.items.map((ci) => ({
            productId: ci.productId,
            variantId: ci.variantId,
            title: ci.product.title,
            variant: ci.variant.title,
            quantity: ci.quantity,
            unitPrice: Number(ci.variant.price),
            totalPrice: Number(ci.variant.price) * ci.quantity,
          })),
        },
        statusHistory: {
          create: { status: "PAID" },
        },
      },
      include: { items: true },
    });

    await cartRepo.clearCart(userId);

    logger.info({ orderId: order.id, orderNumber }, "Order created after payment");

    return { id: order.id, orderNumber };
  },
};
```

- [ ] **Step 5: Create apps/web/lib/repositories/order-repo.ts**

```typescript
import { prisma } from "@/lib/prisma";
import type { Prisma } from "@prisma/client";

export const orderRepo = {
  async getById(id: string) {
    return prisma.order.findUnique({
      where: { id },
      include: {
        items: true,
        payments: true,
        statusHistory: { orderBy: { createdAt: "desc" } },
      },
    });
  },

  async getByUserId(userId: string, page = 1, limit = 20) {
    const skip = (page - 1) * limit;
    const [items, total] = await Promise.all([
      prisma.order.findMany({
        where: { userId },
        include: { items: true, payments: true },
        orderBy: { createdAt: "desc" },
        skip,
        take: limit,
      }),
      prisma.order.count({ where: { userId } }),
    ]);

    return { items, total, page, totalPages: Math.ceil(total / limit) };
  },

  async list(options: { page?: number; limit?: number; status?: string; search?: string }) {
    const { page = 1, limit = 20, status, search } = options;
    const skip = (page - 1) * limit;

    const where: Prisma.OrderWhereInput = {};
    if (status) where.status = status as any;
    if (search) {
      where.OR = [
        { orderNumber: { contains: search, mode: "insensitive" } },
        { user: { email: { contains: search, mode: "insensitive" } } },
      ];
    }

    const [items, total] = await Promise.all([
      prisma.order.findMany({
        where,
        include: { items: true, user: { select: { name: true, email: true } } },
        orderBy: { createdAt: "desc" },
        skip,
        take: limit,
      }),
      prisma.order.count({ where }),
    ]);

    return { items, total, page, totalPages: Math.ceil(total / limit) };
  },

  async updateStatus(id: string, status: string, note?: string) {
    const order = await prisma.order.update({
      where: { id },
      data: { status: status as any },
    });

    await prisma.orderStatusHistory.create({
      data: { orderId: id, status: status as any, note },
    });

    return order;
  },
};
```

- [ ] **Step 6: Pricing service test**

```typescript
// lib/services/__tests__/pricing-service.test.ts
import { describe, it, expect } from "vitest";
import { calculateSubtotal, calculateTax, calculateTotal, calculateShipping } from "../pricing-service";

describe("pricingService", () => {
  it("calculates subtotal correctly", () => {
    expect(calculateSubtotal([{ unitPrice: 699, quantity: 2 }, { unitPrice: 499, quantity: 1 }])).toBe(1897);
  });

  it("calculates 18% GST", () => {
    expect(calculateTax(1000)).toBe(180);
  });

  it("applies free shipping above threshold", () => {
    expect(calculateShipping(1000)).toBe(0);
    expect(calculateShipping(500)).toBe(99);
  });

  it("calculates total with all components", () => {
    expect(calculateTotal(1000, 99, 180, 0)).toBe(1279);
  });
});
```

- [ ] **Step 7: Run tests**

```bash
npx vitest run lib/services/__tests__/pricing-service.test.ts
```

Expected: All 4 tests pass.

- [ ] **Step 8: Commit**

```bash
git add apps/web/lib/razorpay.ts apps/web/lib/services apps/web/lib/repositories/order-repo.ts
git commit -m "feat: add Razorpay integration, pricing service, and checkout service"
```

---

### Task 4.4: Create checkout API routes and UI

**Files:**
- Create: `apps/web/app/api/razorpay/create-order/route.ts`
- Create: `apps/web/app/api/razorpay/verify/route.ts`
- Create: `apps/web/app/api/razorpay/webhooks/route.ts`
- Create: `apps/web/components/storefront/checkout/checkout-form.tsx`
- Create: `apps/web/components/storefront/checkout/shipping-address-form.tsx`
- Create: `apps/web/components/storefront/checkout/order-summary.tsx`
- Create: `apps/web/components/storefront/checkout/razorpay-button.tsx`
- Create: `apps/web/app/(storefront)/checkout/page.tsx`
- Create: `apps/web/app/(storefront)/checkout/success/page.tsx`

**Interfaces:**
- Consumes: `checkoutService` from Task 4.3, `useCartStore` from Task 4.1
- Produces: complete checkout flow with Razorpay payment

- [ ] **Step 1: Create apps/web/app/api/razorpay/create-order/route.ts**

```typescript
import { NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { checkoutService } from "@/lib/services/checkout-service";
import { logger } from "@/lib/logger";

export async function POST() {
  const session = await auth();
  if (!session?.user?.id) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  try {
    const result = await checkoutService.createRazorpayOrder(session.user.id);
    return NextResponse.json(result);
  } catch (error) {
    logger.error({ error }, "Failed to create Razorpay order");
    return NextResponse.json({ error: (error as Error).message }, { status: 400 });
  }
}
```

- [ ] **Step 2: Create apps/web/app/api/razorpay/verify/route.ts**

```typescript
import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { auth } from "@/lib/auth";
import { checkoutService } from "@/lib/services/checkout-service";
import { logger } from "@/lib/logger";

const verifySchema = z.object({
  razorpay_payment_id: z.string(),
  razorpay_order_id: z.string(),
  razorpay_signature: z.string(),
  shippingAddress: z.record(z.unknown()),
});

export async function POST(request: NextRequest) {
  const session = await auth();
  if (!session?.user?.id) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  try {
    const body = await request.json();
    const data = verifySchema.parse(body);

    const order = await checkoutService.verifyPayment(
      session.user.id,
      data.razorpay_payment_id,
      data.razorpay_order_id,
      data.razorpay_signature,
      data.shippingAddress,
    );

    return NextResponse.json(order);
  } catch (error) {
    if (error instanceof z.ZodError) {
      return NextResponse.json({ error: error.errors }, { status: 422 });
    }
    logger.error({ error }, "Payment verification failed");
    return NextResponse.json({ error: "Payment verification failed" }, { status: 400 });
  }
}
```

- [ ] **Step 3: Create apps/web/app/api/razorpay/webhooks/route.ts**

```typescript
import { NextRequest, NextResponse } from "next/server";
import crypto from "crypto";
import { redis } from "@/lib/redis";
import { prisma } from "@/lib/prisma";
import { logger } from "@/lib/logger";

const WEBHOOK_SECRET = process.env.RAZORPAY_WEBHOOK_SECRET!;

export async function POST(request: NextRequest) {
  const body = await request.text();
  const signature = request.headers.get("x-razorpay-signature");

  const expected = crypto.createHmac("sha256", WEBHOOK_SECRET).update(body).digest("hex");
  if (signature !== expected) {
    return NextResponse.json({ error: "Invalid signature" }, { status: 401 });
  }

  const event = JSON.parse(body);
  const eventId = event.event_id ?? `${event.event}:${(event.payload?.payment?.entity?.id) ?? Date.now()}`;

  const processed = await redis.get(`webhook:${eventId}`);
  if (processed) {
    return NextResponse.json({ status: "already_processed" });
  }

  if (event.event === "payment.captured") {
    const paymentId = event.payload?.payment?.entity?.id;
    if (paymentId) {
      const payment = await prisma.payment.findFirst({
        where: { razorpayPaymentId: paymentId },
        include: { order: true },
      });

      if (payment && payment.status === "COMPLETED" && payment.order.status === "PENDING_PAYMENT") {
        await prisma.order.update({
          where: { id: payment.orderId },
          data: { status: "PAID" },
        });
      }
    }
  }

  await redis.set(`webhook:${eventId}`, "1", { EX: 86400 });

  return NextResponse.json({ status: "ok" });
}
```

- [ ] **Step 4: Create apps/web/components/storefront/checkout/razorpay-button.tsx**

```typescript
"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { useCartStore } from "@/stores/cart-store";
import { formatCurrency } from "@/lib/utils";

declare global {
  interface Window {
    Razorpay: new (options: Record<string, unknown>) => { open: () => void };
  }
}

type Props = {
  shippingAddress: Record<string, unknown>;
  disabled?: boolean;
};

export function RazorpayButton({ shippingAddress, disabled }: Props) {
  const router = useRouter();
  const items = useCartStore((s) => s.items);
  const clearCart = useCartStore((s) => s.clearCart);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const subtotal = items.reduce((sum, i) => sum + i.price * i.quantity, 0);
  const shipping = subtotal >= 999 ? 0 : 99;
  const total = subtotal + shipping;

  async function handlePayment() {
    setLoading(true);
    setError(null);

    try {
      const res = await fetch("/api/razorpay/create-order", { method: "POST" });
      if (!res.ok) {
        const err = await res.json();
        throw new Error(err.error ?? "Failed to create order");
      }

      const { razorpayOrderId, amountInPaise } = await res.json();

      const options = {
        key: process.env.NEXT_PUBLIC_RAZORPAY_KEY_ID,
        amount: amountInPaise,
        currency: "INR",
        name: "POD Store",
        order_id: razorpayOrderId,
        handler: async function (response: { razorpay_payment_id: string; razorpay_order_id: string; razorpay_signature: string }) {
          const verifyRes = await fetch("/api/razorpay/verify", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ ...response, shippingAddress }),
          });

          if (verifyRes.ok) {
            clearCart();
            const order = await verifyRes.json();
            router.push(`/checkout/success?orderId=${order.id}`);
          } else {
            setError("Payment verification failed. Please contact support.");
          }
        },
        modal: {
          ondismiss: function () {
            setLoading(false);
          },
        },
        prefill: {
          name: (shippingAddress.name as string) ?? "",
          email: (shippingAddress.email as string) ?? "",
          contact: (shippingAddress.phone as string) ?? "",
        },
        theme: { color: "#2563eb" },
      };

      const rzp = new window.Razorpay(options);
      rzp.open();
    } catch (err) {
      setError((err as Error).message);
      setLoading(false);
    }
  }

  return (
    <div className="space-y-2">
      <Button onClick={handlePayment} disabled={disabled || loading} className="w-full" size="lg">
        {loading ? "Processing..." : `Pay ${formatCurrency(total)}`}
      </Button>
      {error && <p className="text-sm text-error">{error}</p>}
    </div>
  );
}
```

- [ ] **Step 5: Create checkout page**

```typescript
// apps/web/app/(storefront)/checkout/page.tsx
import { auth } from "@/lib/auth";
import { redirect } from "next/navigation";
import { CheckoutForm } from "@/components/storefront/checkout/checkout-form";

export const metadata = { title: "Checkout — POD Store" };

export default async function CheckoutPage() {
  const session = await auth();
  if (!session?.user) redirect("/login?redirect=/checkout");

  return (
    <div className="max-w-7xl mx-auto px-4 md:px-6 lg:px-8 py-8">
      <h1 className="text-2xl font-bold text-foreground mb-8">Checkout</h1>
      <CheckoutForm />
    </div>
  );
}
```

```typescript
// apps/web/app/(storefront)/checkout/success/page.tsx
import Link from "next/link";
import { Button } from "@/components/ui/button";
import { CheckCircle } from "lucide-react";

type Props = { searchParams: Promise<{ orderId?: string }> };

export default async function CheckoutSuccessPage({ searchParams }: Props) {
  const { orderId } = await searchParams;

  return (
    <div className="max-w-lg mx-auto px-4 py-16 text-center">
      <CheckCircle className="h-16 w-16 text-success mx-auto mb-4" />
      <h1 className="text-2xl font-bold text-foreground mb-2">Order Confirmed!</h1>
      {orderId && <p className="text-sm text-foreground-muted mb-6">Order ID: {orderId}</p>}
      <p className="text-sm text-foreground-muted mb-8">
        Thank you for your purchase. You&apos;ll receive a confirmation email shortly.
      </p>
      <div className="flex gap-4 justify-center">
        <Link href="/account/orders"><Button variant="outline">View Orders</Button></Link>
        <Link href="/products"><Button>Continue Shopping</Button></Link>
      </div>
    </div>
  );
}
```

- [ ] **Step 6: Commit**

```bash
git add apps/web/app/api/razorpay apps/web/app/\(storefront\)/checkout apps/web/components/storefront/checkout
git commit -m "feat: add checkout flow with Razorpay payment integration"
```

---

## Spec Coverage Check

| Requirement | Task |
|-------------|------|
| Zustand cart store with localStorage persist | 4.1 |
| Cart API (GET, POST sync, merge, items) | 4.2 |
| Cart page + drawer with quantity controls | 4.2 |
| Cart merge on login (guest → DB) | 4.1, 4.2 |
| Empty cart state | 4.2 |
| Razorpay Orders API (server-side create) | 4.3, 4.4 |
| Razorpay Checkout modal (frontend) | 4.4 |
| Signature verification (server-side HMAC) | 4.3 |
| Webhook receiver (reconciliation) | 4.4 |
| Order + Payment DB models | 4.3 |
| Order number generation (Redis INCR) | 4.3 |
| GST calculation (18%) | 4.3 |
| Checkout form + address collection | 4.4 |
| Order confirmation page | 4.4 |
| Empty cart on successful payment | 4.4 |
