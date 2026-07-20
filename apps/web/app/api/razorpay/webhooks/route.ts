import { NextRequest, NextResponse } from "next/server";
import crypto from "crypto";
import { redis } from "@/lib/redis";
import { prisma } from "@/lib/prisma";
import { logger } from "@/lib/logger";
import { handleApiError } from "@/lib/api-error-handler";

const WEBHOOK_SECRET = process.env.RAZORPAY_WEBHOOK_SECRET!;

export async function POST(request: NextRequest) {
  try {
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

    await redis.set(`webhook:${eventId}`, "1", "EX", 86400);

    return NextResponse.json({ status: "ok" });
  } catch (error) {
    return handleApiError(error, "razorpay/webhooks POST");
  }
}
