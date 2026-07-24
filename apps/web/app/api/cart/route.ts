import { NextResponse } from "next/server";
import { z } from "zod";
import { userGuard } from "@/lib/guard";
import { prisma } from "@/lib/db";
import { rateLimit } from "@/lib/rate-limit";

const cartItemSchema = z.object({
  productId: z.string().min(1),
  quantity: z.number().int().positive().max(999),
});
const cartSyncSchema = z.object({
  items: z.array(cartItemSchema),
});

export async function GET() {
  const user = await userGuard();
  if (user instanceof NextResponse) return user;

  const { allowed } = await rateLimit(`user-cart:${user.id}`, 30, 60);
  if (!allowed) {
    return NextResponse.json({ error: "Too many requests" }, { status: 429 });
  }

  const cart = await prisma.cart.findUnique({
    where: { userId: user.id },
    include: { items: { include: { product: { include: { images: true } } } } },
  });

  return NextResponse.json(cart || { items: [] });
}

export async function POST(req: Request) {
  try {
    const user = await userGuard();
    if (user instanceof NextResponse) return user;

    const body = await req.json();
    const { items } = cartSyncSchema.parse(body);

    await prisma.$transaction(async (tx) => {
      const cart = await tx.cart.upsert({
        where: { userId: user.id },
        update: {},
        create: { userId: user.id },
      });

      await tx.cartItem.deleteMany({ where: { cartId: cart.id } });

      if (items?.length) {
        await tx.cartItem.createMany({
          data: items.map((item) => ({
            cartId: cart.id,
            productId: item.productId,
            quantity: item.quantity,
          })),
        });
      }
    });

    return NextResponse.json({ success: true });
  } catch (error) {
    if (error instanceof z.ZodError) {
      return NextResponse.json({ error: "Validation failed" }, { status: 422 });
    }
    console.error("Error in cart POST:", error);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}