import { auth } from "@/lib/auth";
import { redirect } from "next/navigation";
import { prisma } from "@/lib/prisma";
import Link from "next/link";
import { SignOutButton } from "./sign-out-button";

export default async function AccountPage() {
  const session = await auth();
  if (!session?.user) redirect("/login");

  const user = session.user;
  const orders = await prisma.order.findMany({
    where: { userId: user.id },
    orderBy: { createdAt: "desc" },
    take: 20,
  });

  return (
    <div className="max-w-3xl mx-auto px-4 py-8 space-y-8">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold">Account</h1>
          <p className="text-foreground-muted">{user.email}</p>
        </div>
        <SignOutButton />
      </div>

      <section>
        <h2 className="text-lg font-semibold mb-4">Your Orders</h2>
        {orders.length === 0 ? (
          <div className="text-center py-12 bg-surface rounded-xl border border-border">
            <p className="text-foreground-muted">No orders yet</p>
            <Link href="/products" className="text-accent text-sm mt-2 inline-block hover:underline">
              Start shopping
            </Link>
          </div>
        ) : (
          <div className="space-y-3">
            {orders.map((order) => (
              <div key={order.id} className="bg-surface rounded-xl border border-border p-4 flex items-center justify-between">
                <div>
                  <p className="font-medium">{order.orderNumber}</p>
                  <p className="text-sm text-foreground-muted">{new Date(order.createdAt).toLocaleDateString()}</p>
                </div>
                <span className="text-sm font-medium px-2 py-1 rounded-full bg-accent-muted text-accent">
                  {order.status}
                </span>
              </div>
            ))}
          </div>
        )}
      </section>
    </div>
  );
}
