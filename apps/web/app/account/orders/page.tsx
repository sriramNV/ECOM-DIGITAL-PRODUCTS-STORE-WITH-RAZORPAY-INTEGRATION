import { auth } from "@/lib/auth";
import { prisma } from "@/lib/db";
import Link from "next/link";
import { formatCurrency, formatDate } from "@/lib/utils";

export default async function OrdersPage() {
  const session = await auth();
  if (!session?.user) return null;

  const orders = await prisma.order.findMany({
    where: { userId: session.user.id },
    include: { items: true },
    orderBy: { createdAt: "desc" },
  });

  return (
    <div className="mx-auto max-w-4xl px-4 py-10">
      <h1 className="mb-8 text-3xl font-bold">Order History</h1>
      {orders.length === 0 ? (
        <div className="rounded-xl border border-border p-8 text-center text-muted-foreground">
          <p>No orders yet.</p>
          <Link href="/products" className="mt-2 inline-block text-primary hover:underline">Browse products</Link>
        </div>
      ) : (
        <div className="space-y-3">
          {orders.map((order) => (
            <Link key={order.id} href={`/account/orders/${order.id}`}
              className="flex items-center justify-between rounded-xl border border-border p-4 transition-colors hover:border-primary/50"
            >
              <div>
                <p className="font-medium">{order.orderNumber}</p>
                <p className="text-sm text-muted-foreground">{formatDate(order.createdAt)} — {order.items.length} item(s)</p>
              </div>
              <div className="text-right">
                <p className="font-semibold">{formatCurrency(Number(order.totalAmount))}</p>
                <p className="text-xs text-muted-foreground">{order.status}</p>
              </div>
            </Link>
          ))}
        </div>
      )}
    </div>
  );
}
