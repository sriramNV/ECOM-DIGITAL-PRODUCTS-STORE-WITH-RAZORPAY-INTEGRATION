import { NextResponse } from "next/server";
import { z } from "zod";
import { userGuard } from "@/lib/guard";
import { prisma } from "@/lib/db";

const cartItemSchema = z.object({
  productId: z.string().min(1),
  quantity: z.number().int().positive().max(999),
});

export async function POST(req: Request) {
  try {
    const user = await userGuard();
    if (user instanceof NextResponse) return user;

    const body = await req.json();
    const { items } = z.array(cartItemSchema).parse(body);

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
          data: { quantity: existing.quantity + guestItem.quantity },
        });
      } else {
        await prisma.cartItem.create({
          data: {
            cartId: cart.id,
            productId: guestItem.productId,
            quantity: guestItem.quantity,
          },
        });
      }
    }

    return NextResponse.json({ success: true });
  } catch (error) {
    if (error instanceof z.ZodError) {
      return NextResponse.json({ error: "Validation failed" }, { status: 422 });
    }
    console.error("Error in cart merge:", error);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}