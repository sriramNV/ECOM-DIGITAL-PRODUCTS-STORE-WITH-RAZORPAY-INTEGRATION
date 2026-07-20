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
    const body = await request.json().catch(() => { throw new Error("Invalid request body"); });
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
