import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { cartRepo } from "@/lib/repositories/cart-repo";
import { handleApiError } from "@/lib/api-error-handler";
import { validateBody, cartAddSchema } from "@/lib/schemas";

export async function GET() {
  try {
    const session = await auth();
    if (!session?.user?.id) {
      return NextResponse.json({ items: [] });
    }

    const cart = await cartRepo.getByUserId(session.user.id);
    return NextResponse.json(cart ?? { items: [] });
  } catch (error) {
    return handleApiError(error, "cart GET");
  }
}

export async function POST(request: NextRequest) {
  try {
    const session = await auth();
    if (!session?.user?.id) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { data, error: validationError } = validateBody(cartAddSchema, await request.json());
    if (validationError) return validationError;

    const cart = await prisma.cart.upsert({
      where: { userId: session.user.id },
      create: { userId: session.user.id },
      update: {},
    });

    await prisma.$transaction(async (tx) => {
      await tx.cartItem.deleteMany({ where: { cartId: cart.id } });
      for (const item of data!.items) {
        const variant = await tx.productVariant.findFirst({
          where: { id: item.variantId, product: { isActive: true, id: item.productId } },
        });
        if (!variant) throw new Error(`Product variant ${item.variantId} not found or inactive`);
        await tx.cartItem.create({
          data: { cartId: cart.id, productId: item.productId, variantId: item.variantId, quantity: Math.min(item.quantity, 10) },
        });
      }
    });

    return NextResponse.json({ success: true });
  } catch (error) {
    return handleApiError(error, "cart POST");
  }
}
