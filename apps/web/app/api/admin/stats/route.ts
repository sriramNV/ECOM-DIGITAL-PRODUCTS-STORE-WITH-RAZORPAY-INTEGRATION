import { NextResponse } from "next/server";
import { adminGuard } from "@/lib/guard";
import { prisma } from "@/lib/db";

export async function GET() {
  const guard = await adminGuard();
  if (guard) return guard;

  const today = new Date();
  today.setHours(0, 0, 0, 0);

  const [totalProducts, totalOrders, totalRevenue, todayOrders, todayRevenue, totalCustomers] = await Promise.all([
    prisma.product.count({ where: { isActive: true } }),
    prisma.order.count(),
    prisma.order.aggregate({ _sum: { totalAmount: true } }),
    prisma.order.count({ where: { createdAt: { gte: today } } }),
    prisma.order.aggregate({ where: { createdAt: { gte: today } }, _sum: { totalAmount: true } }),
    prisma.user.count({ where: { role: "CUSTOMER" } }),
  ]);

  return NextResponse.json({
    totalProducts,
    totalOrders,
    totalRevenue: totalRevenue._sum.totalAmount || 0,
    todayOrders,
    todayRevenue: todayRevenue._sum.totalAmount || 0,
    totalCustomers,
  });
}
