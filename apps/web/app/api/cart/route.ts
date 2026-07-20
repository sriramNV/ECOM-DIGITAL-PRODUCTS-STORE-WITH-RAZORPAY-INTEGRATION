import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/lib/auth";
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

    await cartRepo.clearCart(session.user.id);

    for (const item of data!.items) {
      await cartRepo.addItem(session.user.id, item.productId, item.variantId, item.quantity);
    }

    return NextResponse.json({ success: true });
  } catch (error) {
    return handleApiError(error, "cart POST");
  }
}
