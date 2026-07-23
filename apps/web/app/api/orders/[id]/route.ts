import { NextResponse } from "next/server";
import { userGuard } from "@/lib/guard";
import { getUserOrder } from "@/lib/services/orders";

export async function GET(req: Request, props: { params: Promise<{ id: string }> }) {
  const params = await props.params;
  const user = await userGuard();
  if (user instanceof NextResponse) return user;

  const order = await getUserOrder(user.id, params.id);
  if (!order) {
    return NextResponse.json({ error: "Order not found" }, { status: 404 });
  }

  return NextResponse.json(order);
}
