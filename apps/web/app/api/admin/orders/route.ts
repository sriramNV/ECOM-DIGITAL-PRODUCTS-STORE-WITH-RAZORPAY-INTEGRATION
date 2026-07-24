import { NextResponse } from "next/server";
import { adminGuard } from "@/lib/guard";
import { prisma } from "@/lib/db";
import { rateLimit, getClientIp } from "@/lib/rate-limit";

export async function GET(req: Request) {
  const guard = await adminGuard();
  if (guard) return guard;

  const { allowed } = await rateLimit(`admin-orders:${getClientIp(req)}`, 120, 60);
  if (!allowed) {
    return NextResponse.json({ error: "Too many requests" }, { status: 429 });
  }

  const { searchParams } = new URL(req.url);
  const page = Number(searchParams.get("page")) || 1;
  const limit = Math.min(100, Number(searchParams.get("limit")) || 20);
  const status = searchParams.get("status");
  const search = searchParams.get("search");

  const where: any = {};
  if (status) where.status = status;
  if (search) {
    where.OR = [
      { orderNumber: { contains: search, mode: "insensitive" } },
      { user: { email: { contains: search, mode: "insensitive" } } },
    ];
  }

  const [items, total] = await Promise.all([
    prisma.order.findMany({
      where,
      include: {
        items: true,
        payments: true,
        user: { select: { id: true, name: true, email: true } },
        statusHistory: { orderBy: { createdAt: "desc" }, take: 1 },
      },
      orderBy: { createdAt: "desc" },
      skip: (page - 1) * limit,
      take: limit,
    }),
    prisma.order.count({ where }),
  ]);

  return NextResponse.json({ items, total, page, totalPages: Math.ceil(total / limit) });
}
