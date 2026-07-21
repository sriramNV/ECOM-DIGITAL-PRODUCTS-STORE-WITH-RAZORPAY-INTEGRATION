import { NextRequest, NextResponse } from "next/server";
import { couponRepo } from "@/lib/repositories/coupon-repo";
import { adminGuard } from "@/lib/admin-guard";
import { handleApiError } from "@/lib/api-error-handler";
import { validateBody, couponCreateSchema } from "@/lib/schemas";

export async function GET(request: NextRequest) {
  try {
    const guard = await adminGuard();
    if (guard) return guard;
    const { searchParams } = new URL(request.url);
    const page = parseInt(searchParams.get("page") ?? "1", 10);
    const limit = parseInt(searchParams.get("limit") ?? "20", 10);
    const result = await couponRepo.list(page, limit);
    return NextResponse.json(result);
  } catch (error) {
    return handleApiError(error, "promotions/coupons GET");
  }
}

export async function POST(request: NextRequest) {
  try {
    const guard = await adminGuard();
    if (guard) return guard;
    const { data, error: validationError } = validateBody(couponCreateSchema, await request.json());
    if (validationError) return validationError;

    const coupon = await couponRepo.create({
      code: data!.code,
      type: data!.type,
      value: data!.value,
      minOrder: data!.minOrder ?? 0,
      maxDiscount: data!.maxDiscount,
      usageLimit: data!.usageLimit,
      perUserLimit: data!.perUserLimit,
      startDate: new Date(data!.startDate),
      endDate: data!.endDate ? new Date(data!.endDate) : undefined,
    });
    return NextResponse.json(coupon, { status: 201 });
  } catch (error) {
    return handleApiError(error, "promotions/coupons POST");
  }
}
