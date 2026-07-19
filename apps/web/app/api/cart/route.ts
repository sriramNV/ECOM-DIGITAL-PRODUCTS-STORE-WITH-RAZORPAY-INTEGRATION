import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { cartRepo } from "@/lib/repositories/cart-repo";

export async function GET() {
  const session = await auth();
  if (!session?.user?.id) {
    return NextResponse.json({ items: [] });
  }

  const cart = await cartRepo.getByUserId(session.user.id);
  return NextResponse.json(cart ?? { items: [] });
}

export async function POST(request: NextRequest) {
  const session = await auth();
  if (!session?.user?.id) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { items } = await request.json();
  await cartRepo.clearCart(session.user.id);

  for (const item of items) {
    await cartRepo.addItem(session.user.id, item.productId, item.variantId, item.quantity);
  }

  return NextResponse.json({ success: true });
}
