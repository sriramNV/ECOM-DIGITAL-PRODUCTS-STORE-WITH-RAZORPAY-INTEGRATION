import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { cartRepo } from "@/lib/repositories/cart-repo";
import { handleApiError } from "@/lib/api-error-handler";
import { validateBody, cartMergeSchema } from "@/lib/schemas";

export async function POST(request: NextRequest) {
  try {
    const session = await auth();
    if (!session?.user?.id) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { data, error: validationError } = validateBody(cartMergeSchema, await request.json().catch(() => ({})));
    if (validationError) return validationError;

    const cart = await cartRepo.mergeGuestCart(
      session.user.id,
      data!.items.map((i) => ({
        productId: i.productId,
        variantId: i.variantId,
        quantity: i.quantity,
      })),
    );

    return NextResponse.json(cart);
  } catch (error) {
    return handleApiError(error, "cart/merge POST");
  }
}
