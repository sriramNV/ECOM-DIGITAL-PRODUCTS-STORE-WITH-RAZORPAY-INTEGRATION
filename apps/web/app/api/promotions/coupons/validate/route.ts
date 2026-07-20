import { NextRequest, NextResponse } from "next/server";
import { couponService } from "@/lib/services/coupon-service";

export async function POST(request: NextRequest) {
  try {
    const { code, subtotal } = await request.json();
    if (!code || typeof subtotal !== "number") {
      return NextResponse.json({ valid: false, error: "Invalid request" }, { status: 400 });
    }

    const result = await couponService.validateAndApply(code, subtotal, "guest");
    return NextResponse.json(result);
  } catch {
    return NextResponse.json({ valid: false, error: "Failed to validate coupon" }, { status: 500 });
  }
}
