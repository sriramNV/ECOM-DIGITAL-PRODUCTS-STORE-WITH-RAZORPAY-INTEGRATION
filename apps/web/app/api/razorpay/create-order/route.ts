import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { checkoutService } from "@/lib/services/checkout-service";
import { logger } from "@/lib/logger";

export async function POST(request: NextRequest) {
  const session = await auth();
  if (!session?.user?.id) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  try {
    const body = await request.json().catch(() => ({}));
    const result = await checkoutService.createRazorpayOrder(session.user.id, body.couponCode, body.shippingAddress);
    return NextResponse.json(result);
  } catch (error) {
    logger.error({ error }, "Failed to create Razorpay order");
    return NextResponse.json({ error: "Failed to create order" }, { status: 400 });
  }
}
