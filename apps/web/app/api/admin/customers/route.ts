import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

export async function GET(request: NextRequest) {
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
}
