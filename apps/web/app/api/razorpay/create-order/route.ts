import { NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { checkoutService } from "@/lib/services/checkout-service";
import { logger } from "@/lib/logger";

export async function POST() {
  const session = await auth();
  if (!session?.user?.id) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  try {
    const result = await checkoutService.createRazorpayOrder(session.user.id);
    return NextResponse.json(result);
  } catch (error) {
    logger.error({ error }, "Failed to create Razorpay order");
    return NextResponse.json({ error: (error as Error).message }, { status: 400 });
  }
}
