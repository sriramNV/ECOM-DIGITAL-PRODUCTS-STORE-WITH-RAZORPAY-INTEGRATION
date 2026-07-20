import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { adminGuard } from "@/lib/admin-guard";
import { handleApiError } from "@/lib/api-error-handler";

export async function GET(request: NextRequest) {
  try {
    const guard = await adminGuard();
    if (guard) return guard;
    const { searchParams } = new URL(request.url);
    const search = searchParams.get("search") ?? "";

    const customers = await prisma.user.findMany({
      where: {
        role: "CUSTOMER",
        OR: search
          ? [
              { email: { contains: search, mode: "insensitive" } },
              { name: { contains: search, mode: "insensitive" } },
            ]
          : undefined,
      },
      include: {
        _count: { select: { orders: true } },
        orders: { take: 1, orderBy: { createdAt: "desc" }, select: { totalAmount: true, createdAt: true } },
      },
      orderBy: { createdAt: "desc" },
      take: 50,
    });

    return NextResponse.json(customers);
  } catch (error) {
    return handleApiError(error, "admin/customers GET");
  }
}
