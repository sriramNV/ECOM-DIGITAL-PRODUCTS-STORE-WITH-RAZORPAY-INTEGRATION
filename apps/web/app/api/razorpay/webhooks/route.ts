import { NextRequest, NextResponse } from "next/server";
import crypto from "crypto";
import { redis } from "@/lib/redis";
import { prisma } from "@/lib/prisma";
import { logger } from "@/lib/logger";
import { handleApiError } from "@/lib/api-error-handler";

const WEBHOOK_SECRET = process.env.RAZORPAY_WEBHOOK_SECRET;

export async function POST(request: NextRequest) {
  try {
    const body = await request.text();

    const signature = request.headers.get("x-razorpay-signature");

    if (!WEBHOOK_SECRET || !signature) {
      return NextResponse.json({ error: "Invalid webhook config" }, { status: 401 });
    }

    const expected = crypto.createHmac("sha256", WEBHOOK_SECRET).update(body).digest("hex");
    const sigBuf = Buffer.from(signature, "hex");
    const expBuf = Buffer.from(expected, "hex");
    const safe = sigBuf.length === expBuf.length && crypto.timingSafeEqual(sigBuf, expBuf);
    if (!safe) {
      return NextResponse.json({ error: "Invalid signature" }, { status: 401 });
    }

    const event = JSON.parse(body);
    const eventId = event.event_id ?? `${event.event}:${(event.payload?.payment?.entity?.id) ?? Date.now()}`;

    const dedupKey = `webhook:${eventId}`;
    const alreadyProcessed = await redis.set(dedupKey, "1", "EX", 86400, "NX");
    if (!alreadyProcessed) {
      return NextResponse.json({ status: "already_processed" });
    }

    if (event.event === "payment.captured") {
      const paymentId = event.payload?.payment?.entity?.id;
      const rzpOrderId = event.payload?.payment?.entity?.order_id;

      if (rzpOrderId) {
        const pendingPayment = await prisma.payment.findFirst({
          where: { razorpayOrderId: rzpOrderId, status: "PENDING" },
          include: { order: true },
        });

        if (pendingPayment && pendingPayment.order.status === "PENDING_PAYMENT") {
          await prisma.$transaction(async (tx) => {
            await tx.payment.update({
              where: { id: pendingPayment.id },
              data: { status: "COMPLETED", razorpayPaymentId: paymentId },
            });
            await tx.order.update({
              where: { id: pendingPayment.orderId },
              data: { status: "PAID" },
            });
            await tx.orderStatusHistory.create({
              data: { orderId: pendingPayment.orderId, status: "PAID", note: "Payment captured via webhook" },
            });
          });
          logger.info({ orderId: pendingPayment.orderId }, "Order paid via webhook (payment.captured)");
        }
      }
    }

    if (event.event === "payment.failed") {
      const paymentId = event.payload?.payment?.entity?.id;
      const rzpOrderId = event.payload?.payment?.entity?.order_id;
      const errorDesc = event.payload?.payment?.entity?.error_description;

      logger.warn({ paymentId, error: errorDesc }, "Razorpay payment failed");

      if (rzpOrderId) {
        const pendingPayment = await prisma.payment.findFirst({
          where: { razorpayOrderId: rzpOrderId, status: "PENDING" },
          include: { order: true },
        });

        if (pendingPayment && pendingPayment.order.status === "PENDING_PAYMENT") {
          await prisma.$transaction(async (tx) => {
            await tx.payment.update({
              where: { id: pendingPayment.id },
              data: { status: "FAILED" },
            });
            await tx.order.update({
              where: { id: pendingPayment.orderId },
              data: { status: "CANCELLED" },
            });
            await tx.orderStatusHistory.create({
              data: { orderId: pendingPayment.orderId, status: "CANCELLED", note: `Payment failed: ${errorDesc ?? "Unknown error"}` },
            });
          });
          logger.info({ orderId: pendingPayment.orderId }, "Order cancelled via webhook (payment.failed)");
        }
      }
    }

    if (event.event === "refund.created" || event.event === "refund.processed") {
      const paymentId = event.payload?.payment?.entity?.id;

      if (paymentId) {
        const payment = await prisma.payment.findFirst({
          where: { razorpayPaymentId: paymentId },
          include: { order: true },
        });

        if (payment && payment.order.status !== "REFUNDED") {
          await prisma.$transaction(async (tx) => {
            await tx.payment.update({
              where: { id: payment.id },
              data: { status: "REFUNDED" },
            });
            await tx.order.update({
              where: { id: payment.orderId },
              data: { status: "REFUNDED" },
            });
            await tx.orderStatusHistory.create({
              data: { orderId: payment.orderId, status: "REFUNDED", note: `Refund ${event.event === "refund.created" ? "initiated" : "processed"} via webhook` },
            });
          });
          logger.info({ orderId: payment.orderId, paymentId }, `Order refunded via webhook (${event.event})`);
        }
      }
    }

    return NextResponse.json({ status: "ok" });
  } catch (error) {
    return handleApiError(error, "razorpay/webhooks POST");
  }
}
