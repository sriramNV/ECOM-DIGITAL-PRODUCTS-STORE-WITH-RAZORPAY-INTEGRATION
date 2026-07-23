import { NextResponse } from "next/server";
import { userGuard } from "@/lib/guard";
import { verifyPayment, createOrderFromPayment } from "@/lib/services/payments";

export async function POST(req: Request) {
  const user = await userGuard();
  if (user instanceof NextResponse) return user;

  try {
    const { razorpay_payment_id, razorpay_order_id, razorpay_signature, amount } = await req.json();

    const isValid = await verifyPayment({
      razorpay_payment_id,
      razorpay_order_id,
      razorpay_signature,
    });

    if (!isValid) {
      return NextResponse.json({ error: "Payment verification failed" }, { status: 400 });
    }

    const order = await createOrderFromPayment(
      user.id,
      razorpay_order_id,
      razorpay_payment_id,
      razorpay_signature,
      amount
    );

    return NextResponse.json({ id: order.id, orderNumber: order.orderNumber });
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 400 });
  }
}
