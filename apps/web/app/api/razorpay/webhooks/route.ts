import { NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import { createHmac } from "crypto";

export async function POST(req: Request) {
  const body = await req.text();
  const signature = req.headers.get("x-razorpay-signature");

  const expectedSig = createHmac("sha256", process.env.RAZORPAY_WEBHOOK_SECRET!)
    .update(body)
    .digest("hex");

  if (signature !== expectedSig) {
    return NextResponse.json({ error: "Invalid signature" }, { status: 400 });
  }

  const event = JSON.parse(body);

  if (event.event === "payment.captured") {
    const payment = event.payload.payment.entity;

    const existingPayment = await prisma.payment.findFirst({
      where: { razorpayOrderId: payment.order_id },
    });

    if (existingPayment && existingPayment.status !== "COMPLETED") {
      await prisma.payment.update({
        where: { id: existingPayment.id },
        data: {
          razorpayPaymentId: payment.id,
          status: "COMPLETED",
          method: payment.method,
        },
      });

      const order = await prisma.order.findFirst({
        where: { payments: { some: { id: existingPayment.id } } },
      });

      if (order && order.status === "PENDING_PAYMENT") {
        await prisma.order.update({
          where: { id: order.id },
          data: {
            status: "PAID",
            statusHistory: { create: { status: "PAID" } },
          },
        });
      }
    }
  }

  return NextResponse.json({ received: true });
}
