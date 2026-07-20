import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { adminGuard } from "@/lib/admin-guard";
import { handleApiError } from "@/lib/api-error-handler";

export async function GET() {
  try {
    const guard = await adminGuard();
    if (guard) return guard;
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
  } catch (error) {
    return handleApiError(error, "admin/stats GET");
  }
}
