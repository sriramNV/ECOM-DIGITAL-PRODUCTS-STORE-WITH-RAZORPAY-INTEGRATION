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
        throw new Error("Invalid shipping address");
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

    const sigBuf = Buffer.from(signature, "hex");
    const expBuf = Buffer.from(expected, "hex");
    const safe = sigBuf.length === expBuf.length && crypto.timingSafeEqual(sigBuf, expBuf);
    if (!safe) {
      throw new Error("Invalid payment signature");
    }

    const rzpOrder = await razorpay.orders.fetch(orderId);
    const payment = await razorpay.payments.fetch(paymentId);
    if (payment.status !== "captured") {
      throw new Error("Payment not yet captured - try again");
    }

    const cart = await cartRepo.getByUserId(userId);
    if (!cart || cart.items.length === 0) {
      throw new Error("Cart is empty");
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

    const total = calculateTotal(subtotal, shipping, tax, discount);

    const expectedAmount = rzpOrder.notes?.expectedAmount;
    if (expectedAmount !== undefined && Number(expectedAmount) !== total) {
      throw new Error("Payment amount mismatch - possible tampering detected");
    }

    // Use validated shipping address data instead of raw input
    const sanitizedAddress: Record<string, unknown> = {};
    if (shippingAddress) {
      const parsed = shippingAddressSchema.safeParse(shippingAddress);
      if (!parsed.success) {
        throw new Error("Invalid shipping address");
      }
      Object.assign(sanitizedAddress, parsed.data);
    }

    const orderNumber = await generateOrderNumber();

    let order;
    try {
      order = await prisma.$transaction(async (tx) => {
        if (couponCode) {
          const currentCoupon = await tx.coupon.findUnique({ where: { code: couponCode } });
          if (!currentCoupon || !currentCoupon.isActive) {
            throw new Error("Coupon is no longer valid");
          }
          const now = new Date();
          if (now < currentCoupon.startDate || (currentCoupon.endDate && now > currentCoupon.endDate)) {
            throw new Error("Coupon has expired");
          }
          if (subtotal < Number(currentCoupon.minOrder)) {
            throw new Error(`Minimum order of ₹${currentCoupon.minOrder} required`);
          }
          const usageCount = await tx.order.count({ where: { couponId: currentCoupon.id } });
          if (currentCoupon.usageLimit && usageCount >= currentCoupon.usageLimit) {
            throw new Error("Coupon usage limit reached");
          }
          if (currentCoupon.perUserLimit) {
            const userUsageCount = await tx.order.count({ where: { couponId: currentCoupon.id, userId } });
            if (userUsageCount >= currentCoupon.perUserLimit) {
              throw new Error("Coupon per-user limit reached");
            }
          }
          let calculatedDiscount = 0;
          if (currentCoupon.type === "percentage") {
            calculatedDiscount = Math.round((subtotal * Number(currentCoupon.value)) / 100);
            if (currentCoupon.maxDiscount) {
              calculatedDiscount = Math.min(calculatedDiscount, Number(currentCoupon.maxDiscount));
            }
          } else if (currentCoupon.type === "fixed") {
            calculatedDiscount = Number(currentCoupon.value);
          }
          discount = calculatedDiscount;
          appliedCouponId = currentCoupon.id;
        }

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
          const result = await tx.productVariant.updateMany({
            where: { id: item.variantId, stock: { gte: item.quantity } },
            data: { stock: { decrement: item.quantity } },
          });
          if (result.count === 0) {
            throw new Error(`Insufficient stock for ${item.product?.title ?? "item"}`);
          }
        }

        return created;
      });
    } catch (err: unknown) {
      if (err instanceof Error && err.message.startsWith("Insufficient stock")) {
        throw err;
      }
      logger.error({ err, userId }, "Order creation transaction failed");
      throw new Error("Failed to create order - please try again");
    }

    logger.info({ orderId: order.id, orderNumber }, "Order created after payment");

    const user = await prisma.user.findUnique({ where: { id: userId }, select: { email: true, name: true } });
    if (user) {
      emailService.sendOrderConfirmation(order as any, user as any).catch((err: unknown) => logger.error({ err }, "Failed to send order confirmation"));
    }

    fulfillmentService.submitOrder(order.id).catch((err: unknown) => logger.error({ err }, "Failed to submit order to fulfillment"));

    try {
      await cartRepo.clearCart(userId);
    } catch (err) {
      logger.error({ err, userId }, "Failed to clear cart after order - cart may need manual cleanup");
    }

    return { id: order.id, orderNumber };
  },
};
