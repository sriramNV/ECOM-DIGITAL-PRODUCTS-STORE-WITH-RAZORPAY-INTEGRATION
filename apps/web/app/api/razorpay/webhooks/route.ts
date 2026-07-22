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

    if (event.event === "payment.failed") {
      const paymentId = event.payload?.payment?.entity?.id;
      const errorDesc = event.payload?.payment?.entity?.error_description;
      logger.warn({ paymentId, error: errorDesc }, "Razorpay payment failed");
    }

    return NextResponse.json({ status: "ok" });
  } catch (error) {
    return handleApiError(error, "razorpay/webhooks POST");
  }
}
