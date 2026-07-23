import { NextResponse } from "next/server";
import { userGuard } from "@/lib/guard";
import { createRazorpayOrder } from "@/lib/services/payments";

export async function POST(req: Request) {
  const user = await userGuard();
  if (user instanceof NextResponse) return user;

  try {
    const { couponCode } = await req.json();
    const order = await createRazorpayOrder(user.id, couponCode);
    return NextResponse.json(order);
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 400 });
  }
}
