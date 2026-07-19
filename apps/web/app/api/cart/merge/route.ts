import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { cartRepo } from "@/lib/repositories/cart-repo";

export async function POST(request: NextRequest) {
  const session = await auth();
  if (!session?.user?.id) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const body = await request.json().catch(() => ({}));
  const guestItems = body.items ?? [];

  const cart = await cartRepo.mergeGuestCart(
    session.user.id,
    guestItems.map((i: { productId: string; variantId: string; quantity?: number }) => ({
      productId: i.productId,
      variantId: i.variantId,
      quantity: i.quantity ?? 1,
    })),
  );

  return NextResponse.json(cart);
}
