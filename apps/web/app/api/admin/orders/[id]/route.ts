import { NextResponse } from "next/server";
import { adminGuard } from "@/lib/guard";
import { prisma } from "@/lib/db";
import { rateLimit, getClientIp } from "@/lib/rate-limit";

const ALLOWED_TRANSITIONS: Record<string, string[]> = {
  PENDING_PAYMENT: ["PAID", "CANCELLED"],
  PAID: ["COMPLETED", "REFUNDED"],
  COMPLETED: ["REFUNDED"],
  CANCELLED: [],
  REFUNDED: [],
};

function isValidTransition(from: string, to: string): boolean {
  return ALLOWED_TRANSITIONS[from]?.includes(to) ?? false;
}

export async function GET(req: Request, props: { params: Promise<{ id: string }> }) {
  const params = await props.params;
  const guard = await adminGuard();
  if (guard) return guard;

  const { allowed } = await rateLimit(`admin-order:${getClientIp(req)}`, 120, 60);
  if (!allowed) {
    return NextResponse.json({ error: "Too many requests" }, { status: 429 });
  }

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

export async function PATCH(req: Request, props: { params: Promise<{ id: string }> }) {
  const params = await props.params;
  const guard = await adminGuard();
  if (guard) return guard;

  const { status, note } = await req.json();

  const existing = await prisma.order.findUnique({ where: { id: params.id }, select: { status: true } });
  if (existing && !isValidTransition(existing.status, status)) {
    return NextResponse.json(
      { error: `Cannot transition from ${existing.status} to ${status}` },
      { status: 400 }
    );
  }

  const order = await prisma.order.update({
    where: { id: params.id },
    data: {
      status,
      statusHistory: { create: { status, note } },
    },
  });

  return NextResponse.json(order);
}
