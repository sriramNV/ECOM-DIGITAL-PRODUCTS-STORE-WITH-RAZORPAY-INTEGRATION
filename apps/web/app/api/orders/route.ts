import { NextResponse } from "next/server";
import { userGuard } from "@/lib/guard";
import { getUserOrders } from "@/lib/services/orders";
import { createOrderFromCart } from "@/lib/services/payments";
import { rateLimit } from "@/lib/rate-limit";

export async function GET(req: Request) {
  const user = await userGuard();
  if (user instanceof NextResponse) return user;

  const { allowed } = await rateLimit(`user-orders:${user.id}`, 30, 60);
  if (!allowed) {
    return NextResponse.json({ error: "Too many requests" }, { status: 429 });
  }

  const { searchParams } = new URL(req.url);
  const orders = await getUserOrders(
    user.id,
    Number(searchParams.get("page")) || 1,
    Number(searchParams.get("limit")) || 20
  );

  return NextResponse.json(orders);
}

export async function POST() {
  const user = await userGuard();
  if (user instanceof NextResponse) return user;

  const { allowed } = await rateLimit(`order:${user.id}`, 5, 3600);
  if (!allowed) {
    return NextResponse.json({ error: "Too many orders. Try again later." }, { status: 429 });
  }

  try {
    const order = await createOrderFromCart(user.id);
    return NextResponse.json(order);
  } catch (error) {
    console.error("Order creation failed:", error);
    return NextResponse.json({ error: "Failed to create order" }, { status: 400 });
  }
}
