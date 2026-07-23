import { prisma } from "@/lib/db";
import Link from "next/link";
import { formatCurrency, formatDate } from "@/lib/utils";

export default async function AdminOrdersPage() {
  const orders = await prisma.order.findMany({
    include: { user: true, items: true },
    orderBy: { createdAt: "desc" },
  });

  return (
    <div>
      <h1 className="mb-8 text-3xl font-bold">Orders</h1>
      <div className="rounded-xl border border-border">
        <table className="w-full text-left text-sm">
          <thead className="border-b border-border">
            <tr className="text-muted-foreground"><th className="p-3 font-medium">Order #</th><th className="p-3 font-medium">User</th><th className="p-3 font-medium">Items</th><th className="p-3 font-medium">Amount</th><th className="p-3 font-medium">Status</th><th className="p-3 font-medium">Date</th></tr>
          </thead>
          <tbody>
            {orders.map((order) => (
              <tr key={order.id} className="border-b border-border last:border-0">
                <td className="p-3 font-medium"><Link href={`/admin/orders/${order.id}`} className="text-primary hover:underline">{order.orderNumber}</Link></td>
                <td className="p-3">{order.user.email}</td>
                <td className="p-3">{order.items.length}</td>
                <td className="p-3">{formatCurrency(Number(order.totalAmount))}</td>
                <td className="p-3">{order.status}</td>
                <td className="p-3 text-muted-foreground">{formatDate(order.createdAt)}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
