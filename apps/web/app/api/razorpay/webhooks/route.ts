import { NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import { createHmac, timingSafeEqual } from "crypto";

export async function POST(req: Request) {
  try {
    const body = await req.text();
    const signature = req.headers.get("x-razorpay-signature");

    const expectedSig = createHmac("sha256", process.env.RAZORPAY_WEBHOOK_SECRET!)
      .update(body)
      .digest("hex");

    const sigBuf = Buffer.from(signature || "");
    const expectedBuf = Buffer.from(expectedSig);
    if (sigBuf.length !== expectedBuf.length || !timingSafeEqual(sigBuf, expectedBuf)) {
      return NextResponse.json({ error: "Invalid signature" }, { status: 400 });
    }

    const event = JSON.parse(body);

    if (event.event === "payment.captured") {
      const payment = event.payload.payment.entity;

      const existingPayment = await prisma.payment.findFirst({
        where: { razorpayPaymentId: payment.id },
      });

      if (existingPayment) {
        return NextResponse.json({ received: true });
      }

      await prisma.$transaction(async (tx) => {
        const order = await tx.order.findFirst({
          where: { razorpayOrderId: payment.order_id },
        });

        if (!order) return;

        await tx.payment.create({
          data: {
            orderId: order.id,
            razorpayOrderId: payment.order_id,
            razorpayPaymentId: payment.id,
            amount: payment.amount / 100,
            status: "COMPLETED",
            method: payment.method,
          },
        });

        if (order.status === "PENDING_PAYMENT") {
          await tx.order.update({
            where: { id: order.id },
            data: {
              status: "PAID",
              statusHistory: { create: { status: "PAID" } },
            },
          });
        }
      });
    }

    return NextResponse.json({ received: true });
  } catch (error) {
    console.error("Error in webhook:", error);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}