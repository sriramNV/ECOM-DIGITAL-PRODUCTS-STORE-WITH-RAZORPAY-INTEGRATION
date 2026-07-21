import crypto from "crypto";
import { razorpay } from "@/lib/razorpay";
import { prisma } from "@/lib/prisma";
import { cartRepo } from "@/lib/repositories/cart-repo";
import { generateOrderNumber } from "@/lib/order-number";
import { calculateSubtotal, calculateTax, calculateShipping, calculateTotal } from "./pricing-service";
import { couponService } from "./coupon-service";
import { logger } from "@/lib/logger";
import { fulfillmentService } from "./fulfillment-service";
import { emailService } from "./email-service";
import { shippingAddressSchema } from "@/lib/schemas";

export const checkoutService = {
  async createRazorpayOrder(userId: string, couponCode?: string, shippingAddress?: Record<string, unknown>) {
    const cart = await cartRepo.getByUserId(userId);
    if (!cart || cart.items.length === 0) {
      throw new Error("Cart is empty");
    }

    if (shippingAddress) {
      const parsed = shippingAddressSchema.safeParse(shippingAddress);
      if (!parsed.success) {
        throw new Error("Invalid shipping address: " + JSON.stringify(parsed.error.errors));
      }
    }

    for (const item of cart.items) {
      if (item.variant.stock != null && item.variant.stock < item.quantity) {
        throw new Error(`Insufficient stock for ${item.product?.title ?? "item"}`);
      }
    }

    const items = cart.items.map((i) => ({
      unitPrice: Number(i.variant.price),
      quantity: i.quantity,
    }));

    const subtotal = calculateSubtotal(items);
    const shipping = calculateShipping(subtotal);
    const tax = calculateTax(subtotal);

    let discount = 0;
    let appliedCouponId: string | undefined;
    if (couponCode) {
      const result = await couponService.validateAndApply(couponCode, subtotal, userId);
      if (result.valid) {
        discount = result.discount;
        const coupon = await prisma.coupon.findUnique({ where: { code: result.code } });
        appliedCouponId = coupon?.id;
      }
    }

    const total = calculateTotal(subtotal, shipping, tax, discount);
    const amountInPaise = Math.round(total * 100);

    const notes: Record<string, string> = {
      userId,
      expectedAmount: String(total),
      subtotal: String(subtotal),
      shipping: String(shipping),
      tax: String(tax),
      discount: String(discount),
    };
    if (couponCode) notes.couponCode = couponCode;
    if (appliedCouponId) notes.appliedCouponId = appliedCouponId;

    const rzpOrder = await razorpay.orders.create({
      amount: amountInPaise,
      currency: "INR",
      receipt: `cart_${cart.id}`,
      notes,
    });

    return {
      razorpayOrderId: rzpOrder.id,
      amount: total,
      amountInPaise,
      currency: "INR",
      discount,
      couponCode: appliedCouponId ? couponCode : undefined,
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

    if (shippingAddress) {
      const parsed = shippingAddressSchema.safeParse(shippingAddress);
      if (!parsed.success) {
        throw new Error("Invalid shipping address");
      }
    }

    const rzpOrder = await razorpay.orders.fetch(orderId);
    if (rzpOrder.status === "paid") {
      throw new Error("Order already paid");
    }

    const cart = await cartRepo.getByUserId(userId);
    if (!cart || cart.items.length === 0) {
      throw new Error("Cart is empty");
    }

    for (const item of cart.items) {
      if (item.variant.stock != null && item.variant.stock < item.quantity) {
        throw new Error(`Insufficient stock for ${item.product?.title ?? "item"}`);
      }
    }

    const existingPayment = await prisma.payment.findFirst({
      where: { razorpayPaymentId: paymentId }
    });
    if (existingPayment) {
      const order = await prisma.order.findUnique({
        where: { id: existingPayment.orderId }
      });
      if (order) return { id: order.id, orderNumber: order.orderNumber };
    }

    const items = cart.items.map((i) => ({
      unitPrice: Number(i.variant.price),
      quantity: i.quantity,
    }));

    const subtotal = calculateSubtotal(items);
    const shipping = calculateShipping(subtotal);
    const tax = calculateTax(subtotal);

    const couponCode = rzpOrder.notes?.couponCode as string | undefined;
    let discount = 0;
    let appliedCouponId: string | undefined;
    if (couponCode) {
      discount = Number(rzpOrder.notes?.discount) || 0;
      appliedCouponId = rzpOrder.notes?.appliedCouponId as string | undefined;
      if (!appliedCouponId) {
        const coupon = await prisma.coupon.findUnique({ where: { code: couponCode } });
        appliedCouponId = coupon?.id;
      }
    }

    const total = calculateTotal(subtotal, shipping, tax, discount);

    const expectedAmount = rzpOrder.notes?.expectedAmount;
    if (expectedAmount !== undefined && Number(expectedAmount) !== total) {
      throw new Error("Payment amount mismatch - possible tampering detected");
    }

    // Remove couponCode from stored address to avoid leaking internal fields
    const { couponCode: _, ...cleanAddress } = (shippingAddress ?? {}) as Record<string, unknown>;
    const sanitizedAddress = Object.fromEntries(
      Object.entries(cleanAddress).filter(([_, v]) => typeof v !== "undefined")
    );

    const orderNumber = await generateOrderNumber();

    const order = await prisma.$transaction(async (tx) => {
      const created = await tx.order.create({
        data: {
          orderNumber,
          userId,
          status: "PAID",
          totalAmount: total,
          subtotalAmount: subtotal,
          shippingAmount: shipping,
          taxAmount: tax,
          taxRate: 18,
          discountAmount: discount,
          couponId: appliedCouponId,
          currency: "INR",
          shippingAddress: sanitizedAddress as any,
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

      for (const item of cart.items) {
        await tx.productVariant.update({
          where: { id: item.variantId, stock: { gte: item.quantity } },
          data: { stock: { decrement: item.quantity } },
        });
      }

      return created;
    });

    logger.info({ orderId: order.id, orderNumber }, "Order created after payment");

    const user = await prisma.user.findUnique({ where: { id: userId }, select: { email: true, name: true } });
    if (user) {
      emailService.sendOrderConfirmation(order as any, user as any).catch(logger.error);
    }

    fulfillmentService.submitOrder(order.id).catch(logger.error);

    await cartRepo.clearCart(userId);

    return { id: order.id, orderNumber };
  },
};
