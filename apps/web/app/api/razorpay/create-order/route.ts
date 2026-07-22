import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { auth } from "@/lib/auth";
import { checkoutService } from "@/lib/services/checkout-service";
import { logger } from "@/lib/logger";

const createOrderSchema = z.object({
  couponCode: z.string().optional(),
  shippingAddress: z.record(z.unknown()).optional(),
});

export async function POST(request: NextRequest) {
  const session = await auth();
  if (!session?.user?.id) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  try {
    const body = createOrderSchema.parse(await request.json());
    const result = await checkoutService.createRazorpayOrder(session.user.id, body.couponCode, body.shippingAddress);
    return NextResponse.json(result);
  } catch (error) {
    logger.error({ error }, "Failed to create Razorpay order");
    if (error instanceof z.ZodError) {
      return NextResponse.json({ error: "Invalid request", details: error.errors }, { status: 400 });
    }
    return NextResponse.json({ error: "Failed to create order" }, { status: 400 });
  }
}
