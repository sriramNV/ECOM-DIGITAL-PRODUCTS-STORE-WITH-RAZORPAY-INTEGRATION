import { NextResponse } from "next/server";
import { userGuard } from "@/lib/guard";
import { prisma } from "@/lib/db";

export async function POST(req: Request) {
  const user = await userGuard();
  if (user instanceof NextResponse) return user;

  const { items } = await req.json();
  if (!items?.length) return NextResponse.json({ success: true });

  const cart = await prisma.cart.upsert({
    where: { userId: user.id },
    update: {},
    create: { userId: user.id },
  });

  const existingItems = await prisma.cartItem.findMany({ where: { cartId: cart.id } });

  for (const guestItem of items) {
    const existing = existingItems.find((i) => i.productId === guestItem.productId);
    if (existing) {
      await prisma.cartItem.update({
        where: { id: existing.id },
        data: { quantity: existing.quantity + (guestItem.quantity || 1) },
      });
    } else {
      await prisma.cartItem.create({
        data: {
          cartId: cart.id,
          productId: guestItem.productId,
          quantity: guestItem.quantity || 1,
        },
      });
    }
  }

  return NextResponse.json({ success: true });
}
