import { prisma } from "@/lib/prisma";

export const analyticsRepo = {
  async getOverview() {
    const now = new Date();
    const startOfMonth = new Date(now.getFullYear(), now.getMonth(), 1);
    const startOfDay = new Date(now.getFullYear(), now.getMonth(), now.getDate());

    const [totalRevenue, todayRevenue, monthRevenue, totalOrders, todayOrders, totalCustomers, totalProducts] =
      await Promise.all([
        prisma.order.aggregate({ _sum: { totalAmount: true }, where: { status: { in: ["PAID", "PROCESSING", "PRINTING", "SHIPPED", "DELIVERED"] } } }),
        prisma.order.aggregate({ _sum: { totalAmount: true }, where: { createdAt: { gte: startOfDay }, status: { not: "PENDING_PAYMENT" } } }),
        prisma.order.aggregate({ _sum: { totalAmount: true }, where: { createdAt: { gte: startOfMonth }, status: { not: "PENDING_PAYMENT" } } }),
        prisma.order.count({ where: { status: { not: "PENDING_PAYMENT" } } }),
        prisma.order.count({ where: { createdAt: { gte: startOfDay }, status: { not: "PENDING_PAYMENT" } } }),
        prisma.user.count({ where: { role: "CUSTOMER" } }),
        prisma.product.count({ where: { isActive: true } }),
      ]);

    return {
      totalRevenue: Number(totalRevenue._sum.totalAmount ?? 0),
      todayRevenue: Number(todayRevenue._sum.totalAmount ?? 0),
      monthRevenue: Number(monthRevenue._sum.totalAmount ?? 0),
      totalOrders,
      todayOrders,
      totalCustomers,
      totalProducts,
      aov: totalOrders > 0 ? Math.round(Number(totalRevenue._sum.totalAmount ?? 0) / totalOrders) : 0,
    };
  },

  async getRevenueHistory(days: number) {
    const since = new Date();
    since.setDate(since.getDate() - days);

    const orders = await prisma.order.findMany({
      where: { createdAt: { gte: since }, status: { not: "PENDING_PAYMENT" } },
      select: { totalAmount: true, createdAt: true },
      orderBy: { createdAt: "asc" },
    });

    const dailyMap = new Map<string, number>();
    for (const order of orders) {
      const date = order.createdAt.toISOString().slice(0, 10);
      dailyMap.set(date, (dailyMap.get(date) ?? 0) + Number(order.totalAmount));
    }

    return Array.from(dailyMap.entries()).map(([date, revenue]) => ({ date, revenue }));
  },

  async getFunnel() {
    const totalVisitors = 0;
    const totalProducts = await prisma.product.count({ where: { isActive: true } });
    const addedToCart = await prisma.cartItem.groupBy({ by: ["cartId"], _count: true });
    const checkoutStarted = await prisma.order.count({ where: { status: { not: "PENDING_PAYMENT" } } });
    const paid = await prisma.payment.count({ where: { status: "COMPLETED" } });

    return {
      visitors: totalVisitors,
      productsViewed: totalProducts,
      addedToCart: addedToCart.length,
      checkoutStarted,
      paid,
    };
  },
};
