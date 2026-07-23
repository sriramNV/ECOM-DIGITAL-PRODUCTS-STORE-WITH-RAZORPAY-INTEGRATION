export const dynamic = "force-dynamic";

import { auth } from "@/lib/auth";
import { prisma } from "@/lib/db";
import Link from "next/link";
import { buttonVariants } from "@/lib/button-variants";
import { cn, formatCurrency, formatDate } from "@/lib/utils";
import { DeleteAccountButton, DownloadAllButton } from "@/components/account/account-actions";

export default async function AccountPage() {
  const session = await auth();
  if (!session?.user) return null;

  const recentOrders = await prisma.order.findMany({
    where: { userId: session.user.id },
    include: { items: true },
    orderBy: { createdAt: "desc" },
    take: 5,
  });

  return (
    <div className="mx-auto max-w-4xl px-4 py-10">
      <h1 className="mb-2 text-3xl font-bold">Welcome, {session.user.name || "User"}</h1>
      <div className="mb-10 flex flex-wrap gap-3">
        <Link href="/account/orders" className={cn(buttonVariants({ variant: "outline", size: "sm" }))}>View All Orders</Link>
        <DownloadAllButton />
      </div>

      <h2 className="mb-4 text-xl font-semibold">Recent Orders</h2>
      {recentOrders.length === 0 ? (
        <div className="rounded-xl border border-border p-8 text-center text-muted-foreground">
          <p>No orders yet.</p>
          <Link href="/products" className="mt-2 inline-block text-primary hover:underline">Browse products</Link>
        </div>
      ) : (
        <div className="space-y-3">
          {recentOrders.map((order) => (
            <Link key={order.id} href={`/account/orders/${order.id}`}
              className="flex items-center justify-between rounded-xl border border-border p-4 transition-colors hover:border-primary/50"
            >
              <div>
                <p className="font-medium">{order.orderNumber}</p>
                <p className="text-sm text-muted-foreground">{formatDate(order.createdAt)} — {order.items.length} item(s)</p>
              </div>
              <span className="font-semibold">{formatCurrency(Number(order.totalAmount))}</span>
            </Link>
          ))}
        </div>
      )}

      <div className="mt-12">
        <DeleteAccountButton />
      </div>
    </div>
  );
}
