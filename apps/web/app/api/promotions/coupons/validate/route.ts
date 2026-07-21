import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { couponService } from "@/lib/services/coupon-service";
import { handleApiError } from "@/lib/api-error-handler";

export async function POST(request: NextRequest) {
  try {
    const { code, subtotal } = await request.json();
    if (!code || typeof subtotal !== "number") {
      return NextResponse.json({ valid: false, error: "Invalid request" }, { status: 400 });
    }

    const session = await auth();
    const userId = session?.user?.id ?? "guest";
    const result = await couponService.validateAndApply(code, subtotal, userId);
    return NextResponse.json({ valid: result.valid, discount: result.discount, code: result.code, error: result.error ?? null });
  } catch (error) {
    return handleApiError(error, "promotions/coupons/validate POST");
  }
}
