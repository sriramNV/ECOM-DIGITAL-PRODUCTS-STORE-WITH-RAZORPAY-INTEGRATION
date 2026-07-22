import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { orderRepo } from "@/lib/repositories/order-repo";
import { handleApiError } from "@/lib/api-error-handler";

export async function GET(request: NextRequest) {
  try {
    const session = await auth();
    if (!session?.user?.id) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { searchParams } = new URL(request.url);
    const page = Math.max(1, parseInt(searchParams.get("page") ?? "1", 10));
    const limit = Math.min(Math.max(parseInt(searchParams.get("limit") ?? "20", 10), 1), 100);

    const result = await orderRepo.getByUserId(session.user.id, page, limit);
    return NextResponse.json(result);
  } catch (error) {
    return handleApiError(error, "orders GET");
  }
}
