import { NextResponse } from "next/server";
import { userGuard } from "@/lib/guard";
import { prisma } from "@/lib/db";

export async function GET() {
  const user = await userGuard();
  if (user instanceof NextResponse) return user;

  const cart = await prisma.cart.findUnique({
    where: { userId: user.id },
    include: { items: { include: { product: { include: { images: true } } } } },
  });

  return NextResponse.json(cart || { items: [] });
}

export async function POST(req: Request) {
  const user = await userGuard();
  if (user instanceof NextResponse) return user;

  const { items } = await req.json();

  const cart = await prisma.cart.upsert({
    where: { userId: user.id },
    update: {},
    create: { userId: user.id },
  });

  await prisma.cartItem.deleteMany({ where: { cartId: cart.id } });

  if (items?.length) {
    await prisma.cartItem.createMany({
      data: items.map((item: any) => ({
        cartId: cart.id,
        productId: item.productId,
        quantity: item.quantity,
      })),
    });
  }

  return NextResponse.json({ success: true });
}
