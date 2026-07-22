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

    let sanitizedAddress: Record<string, unknown> | undefined;
    if (shippingAddress) {
      const parsed = shippingAddressSchema.safeParse(shippingAddress);
      if (!parsed.success) {
        throw new Error("Invalid shipping address");
      }
      sanitizedAddress = parsed.data;
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
      const result = await prisma.$transaction(async (tx) => {
        await tx.$queryRawUnsafe(`SELECT id FROM "Coupon" WHERE code = $1 FOR UPDATE`, couponCode);
        return couponService.validateAndApplyOnTx(tx, couponCode, subtotal, userId);
      });
      if (result.valid) {
        discount = result.discount;
        appliedCouponId = result.couponId;
      }
    }

    const total = calculateTotal(subtotal, shipping, tax, discount);
    const amountInPaise = Math.round(total * 100);

    const orderNumber = await generateOrderNumber();

    // Create Razorpay order BEFORE any DB writes so a failure leaves no orphan
    const notes: Record<string, string> = {
      orderId: `pending:${orderNumber}`,
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
      receipt: `order_${orderNumber}`,
      notes,
    });

    // Create order + payment atomically
    const order = await prisma.order.create({
      data: {
        orderNumber,
        userId,
        status: "PENDING_PAYMENT",
        totalAmount: total,
        subtotalAmount: subtotal,
        shippingAmount: shipping,
        taxAmount: tax,
        taxRate: 18,
        discountAmount: discount,
        couponId: appliedCouponId,
        currency: "INR",
        shippingAddress: sanitizedAddress as any,
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
          create: { status: "PENDING_PAYMENT" },
        },
        payments: {
          create: {
            razorpayOrderId: rzpOrder.id,
            amount: total,
            status: "PENDING",
          },
        },
      },
    });

    return {
      orderId: order.id,
      razorpayOrderId: rzpOrder.id,
      amount: total,
      amountInPaise,
      currency: "INR",
      discount,
      couponCode: appliedCouponId ? couponCode : undefined,
    };
  },

  async verifyPayment(userId: string, paymentId: string, razorpayOrderId: string, signature: string) {
    const expected = crypto
      .createHmac("sha256", process.env.RAZORPAY_KEY_SECRET!)
      .update(`${razorpayOrderId}|${paymentId}`)
      .digest("hex");

    const sigBuf = Buffer.from(signature, "hex");
    const expBuf = Buffer.from(expected, "hex");
    const safe = sigBuf.length === expBuf.length && crypto.timingSafeEqual(sigBuf, expBuf);
    if (!safe) {
      throw new Error("Invalid payment signature");
    }

    const payment = await razorpay.payments.fetch(paymentId);
    if (payment.status !== "captured") {
      throw new Error("Payment not yet captured - try again");
    }

    let updatedOrder;
    try {
      updatedOrder = await prisma.$transaction(async (tx) => {
        const pendingPayment = await tx.payment.findFirst({
          where: { razorpayOrderId, status: "PENDING" },
          include: { order: { include: { items: true } } },
        });

        if (!pendingPayment) {
          const completedPayment = await tx.payment.findFirst({
            where: { razorpayPaymentId: paymentId },
            include: { order: true },
          });
          if (completedPayment && completedPayment.status === "COMPLETED") {
            return completedPayment.order;
          }
          throw new Error("Order not found");
        }

        const dbOrder = pendingPayment.order;
        if (dbOrder.status !== "PENDING_PAYMENT") {
          if (dbOrder.status === "PAID") return dbOrder;
          throw new Error(`Order cannot be paid (status: ${dbOrder.status})`);
        }

        const expectedAmount = pendingPayment.amount;
        if (payment.amount !== Math.round(Number(expectedAmount) * 100)) {
          throw new Error("Payment amount mismatch - captured amount differs from expected");
        }

        await tx.payment.update({
          where: { id: pendingPayment.id },
          data: {
            razorpayPaymentId: paymentId,
            razorpaySignature: signature,
            status: "COMPLETED",
          },
        });

        const updated = await tx.order.update({
          where: { id: dbOrder.id },
          data: { status: "PAID" },
          include: { items: true },
        });

        await tx.orderStatusHistory.create({
          data: { orderId: dbOrder.id, status: "PAID", note: "Payment verified successfully" },
        });

        for (const item of dbOrder.items) {
          const result = await tx.productVariant.updateMany({
            where: { id: item.variantId, stock: { gte: item.quantity } },
            data: { stock: { decrement: item.quantity } },
          });
          if (result.count === 0) {
            throw new Error(`Insufficient stock for ${item.title ?? "item"}`);
          }
        }

        return updated;
      });
    } catch (err: unknown) {
      if (err instanceof Error && (err.message.startsWith("Insufficient stock") || err.message.startsWith("Order not found") || err.message.startsWith("Order cannot"))) {
        throw err;
      }
      logger.error({ err, userId }, "Payment verification transaction failed");
      throw new Error("Failed to verify payment - please try again");
    }

    logger.info({ orderId: updatedOrder.id, orderNumber: updatedOrder.orderNumber }, "Order paid successfully");

    const user = await prisma.user.findUnique({ where: { id: userId }, select: { email: true, name: true } });
    if (user) {
      emailService.sendOrderConfirmation(updatedOrder as any, user as any).catch((err: unknown) => logger.error({ err }, "Failed to send order confirmation"));
    }

    cartRepo.clearCart(userId).catch((err: unknown) => logger.error({ err, userId }, "Failed to clear cart after order - cart may need manual cleanup"));

    fulfillmentService.submitOrder(updatedOrder.id)
      .catch((err: unknown) => logger.error({ err }, "Failed to submit order to fulfillment"));

    return { id: updatedOrder.id, orderNumber: updatedOrder.orderNumber };
  },
};
