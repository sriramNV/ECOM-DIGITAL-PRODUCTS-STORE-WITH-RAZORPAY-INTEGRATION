import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

export async function GET() {
  const today = new Date();
  today.setHours(0, 0, 0, 0);

  const [totalOrders, todayOrders, totalRevenue, todayRevenue, totalCustomers] = await Promise.all([
    prisma.order.count(),
    prisma.order.count({ where: { createdAt: { gte: today } } }),
    prisma.order.aggregate({ _sum: { totalAmount: true } }),
    prisma.order.aggregate({ _sum: { totalAmount: true }, where: { createdAt: { gte: today } } }),
    prisma.user.count({ where: { role: "CUSTOMER" } }),
  ]);

  return NextResponse.json({
    totalOrders,
    todayOrders,
    totalRevenue: Number(totalRevenue._sum.totalAmount ?? 0),
    todayRevenue: Number(todayRevenue._sum.totalAmount ?? 0),
    totalCustomers,
  });
}
