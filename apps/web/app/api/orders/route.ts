import { NextResponse } from "next/server";
import { userGuard } from "@/lib/guard";
import { getUserOrders } from "@/lib/services/orders";

export async function GET(req: Request) {
  const user = await userGuard();
  if (user instanceof NextResponse) return user;

  const { searchParams } = new URL(req.url);
  const orders = await getUserOrders(
    user.id,
    Number(searchParams.get("page")) || 1,
    Number(searchParams.get("limit")) || 20
  );

  return NextResponse.json(orders);
}
