import { NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/db";

export async function DELETE() {
  const session = await auth();
  if (!session?.user?.id) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
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
