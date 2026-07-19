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
