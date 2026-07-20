import { NextRequest, NextResponse } from "next/server";
import { couponRepo } from "@/lib/repositories/coupon-repo";

export async function GET() {
  const coupons = await couponRepo.list();
  return NextResponse.json(coupons);
}

export async function POST(request: NextRequest) {
  const data = await request.json();
  const coupon = await couponRepo.create({
    code: data.code,
    type: data.type,
    value: Number(data.value),
    minOrder: data.minOrder ? Number(data.minOrder) : 0,
    maxDiscount: data.maxDiscount ? Number(data.maxDiscount) : undefined,
    usageLimit: data.usageLimit ? Number(data.usageLimit) : undefined,
    perUserLimit: data.perUserLimit ? Number(data.perUserLimit) : undefined,
    startDate: new Date(data.startDate),
    endDate: data.endDate ? new Date(data.endDate) : undefined,
  });
  return NextResponse.json(coupon, { status: 201 });
}
