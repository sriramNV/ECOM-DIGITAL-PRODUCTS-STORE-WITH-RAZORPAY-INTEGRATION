import { prisma } from "@/lib/db";
import { formatCurrency } from "@/lib/utils";

export default async function AdminDashboard() {
  const [productCount, orderCount, userCount, revenue] = await Promise.all([
    prisma.product.count(),
    prisma.order.count(),
    prisma.user.count(),
    prisma.order.aggregate({ _sum: { totalAmount: true }, where: { status: "PAID" } }),
  ]);

  const recentOrders = await prisma.order.findMany({
    include: { user: true },
    orderBy: { createdAt: "desc" },
    take: 10,
  });

  return (
    <div>
      <h1 className="mb-8 text-3xl font-bold">Dashboard</h1>
      <div className="mb-10 grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <div className="rounded-xl border border-border p-4"><p className="text-sm text-muted-foreground">Products</p><p className="text-2xl font-bold">{productCount}</p></div>
        <div className="rounded-xl border border-border p-4"><p className="text-sm text-muted-foreground">Orders</p><p className="text-2xl font-bold">{orderCount}</p></div>
        <div className="rounded-xl border border-border p-4"><p className="text-sm text-muted-foreground">Users</p><p className="text-2xl font-bold">{userCount}</p></div>
        <div className="rounded-xl border border-border p-4"><p className="text-sm text-muted-foreground">Revenue</p><p className="text-2xl font-bold">{formatCurrency(Number(revenue._sum.totalAmount) || 0)}</p></div>
      </div>
      <h2 className="mb-4 text-xl font-semibold">Recent Orders</h2>
      <div className="rounded-xl border border-border">
        <table className="w-full text-left text-sm">
          <thead className="border-b border-border">
            <tr className="text-muted-foreground"><th className="p-3 font-medium">Order</th><th className="p-3 font-medium">User</th><th className="p-3 font-medium">Amount</th><th className="p-3 font-medium">Status</th></tr>
          </thead>
          <tbody>
            {recentOrders.map((order) => (
              <tr key={order.id} className="border-b border-border last:border-0">
                <td className="p-3">{order.orderNumber}</td>
                <td className="p-3">{order.user.email}</td>
                <td className="p-3">{formatCurrency(Number(order.totalAmount))}</td>
                <td className="p-3">{order.status}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
