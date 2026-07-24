import { NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/db";
import { rateLimit } from "@/lib/rate-limit";

export async function DELETE() {
  const session = await auth();
  if (!session?.user?.id) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { allowed } = await rateLimit(`account-delete:${session.user.id}`, 1, 3600);
  if (!allowed) {
    return NextResponse.json({ error: "Too many requests. Try again later." }, { status: 429 });
  }

  const userId = session.user.id;

  const cart = await prisma.cart.findUnique({ where: { userId } });

  await prisma.$transaction([
    prisma.download.deleteMany({ where: { userId } }),
    prisma.payment.deleteMany({ where: { order: { userId } } }),
    prisma.orderStatusHistory.deleteMany({ where: { order: { userId } } }),
    prisma.orderItem.deleteMany({ where: { order: { userId } } }),
    prisma.order.deleteMany({ where: { userId } }),
    ...(cart ? [prisma.cartItem.deleteMany({ where: { cartId: cart.id } })] : []),
    ...(cart ? [prisma.cart.delete({ where: { userId } })] : []),
    prisma.session.deleteMany({ where: { userId } }),
    prisma.account.deleteMany({ where: { userId } }),
    prisma.user.delete({ where: { id: userId } }),
  ]);

  return NextResponse.json({ success: true });
}
