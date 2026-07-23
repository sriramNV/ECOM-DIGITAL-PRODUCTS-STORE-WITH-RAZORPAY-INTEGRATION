import { NextResponse } from "next/server";
import { adminGuard } from "@/lib/guard";
import { prisma } from "@/lib/db";

export async function GET(req: Request, { params }: { params: { id: string } }) {
  const guard = await adminGuard();
  if (guard) return guard;

  const order = await prisma.order.findUnique({
    where: { id: params.id },
    include: {
      items: { include: { product: true } },
      payments: true,
      user: { select: { id: true, name: true, email: true } },
      statusHistory: { orderBy: { createdAt: "desc" } },
    },
  });

  if (!order) {
    return NextResponse.json({ error: "Not found" }, { status: 404 });
  }

  return NextResponse.json(order);
}

export async function PATCH(req: Request, { params }: { params: { id: string } }) {
  const guard = await adminGuard();
  if (guard) return guard;

  const { status, note } = await req.json();
  const order = await prisma.order.update({
    where: { id: params.id },
    data: {
      status,
      statusHistory: { create: { status, note } },
    },
  });

  return NextResponse.json(order);
}
