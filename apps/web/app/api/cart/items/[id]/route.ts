import { NextResponse } from "next/server";
import { userGuard } from "@/lib/guard";
import { prisma } from "@/lib/db";

export async function DELETE(req: Request, props: { params: Promise<{ id: string }> }) {
  try {
    const params = await props.params;
    const user = await userGuard();
    if (user instanceof NextResponse) return user;

    const cart = await prisma.cart.findUnique({ where: { userId: user.id } });
    if (!cart) return NextResponse.json({ error: "Cart not found" }, { status: 404 });

    await prisma.cartItem.deleteMany({
      where: { id: params.id, cartId: cart.id },
    });

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("Cart item delete failed:", error);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}
