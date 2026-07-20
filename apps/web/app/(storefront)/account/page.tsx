"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { SignOutButton } from "./sign-out-button";

type Order = {
  id: string;
  orderNumber: string;
  status: string;
  total: number;
  createdAt: string;
};

export default function AccountPage() {
  const router = useRouter();
  const [user, setUser] = useState<{ name?: string; email: string; role: string } | null>(null);
  const [orders, setOrders] = useState<Order[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    (async () => {
      const res = await fetch("/api/auth/session");
      const session = await res.json();
      if (!session?.user) {
        router.push("/login");
        return;
      }
      setUser(session.user);

      const ordersRes = await fetch("/api/orders");
      if (ordersRes.ok) {
        const data = await ordersRes.json();
        setOrders(Array.isArray(data) ? data : data.items ?? []);
      }
      setLoading(false);
    })();
  }, [router]);

  if (loading) return <div className="max-w-3xl mx-auto px-4 py-16">Loading...</div>;
  if (!user) return null;

  return (
    <div className="max-w-3xl mx-auto px-4 py-16">
      <h1 className="text-3xl font-bold text-foreground mb-8">My Account</h1>

      <div className="space-y-6">
        <section className="rounded-lg border border-border bg-surface p-6">
          <h2 className="text-lg font-semibold text-foreground mb-4">Profile</h2>
          <dl className="space-y-3">
            <div>
              <dt className="text-sm text-foreground-muted">Name</dt>
              <dd className="text-foreground">{user.name ?? "—"}</dd>
            </div>
            <div>
              <dt className="text-sm text-foreground-muted">Email</dt>
              <dd className="text-foreground">{user.email}</dd>
            </div>
            <div>
              <dt className="text-sm text-foreground-muted">Role</dt>
              <dd className="text-foreground">{user.role}</dd>
            </div>
          </dl>
        </section>

        <section className="rounded-lg border border-border bg-surface p-6">
          <h2 className="text-lg font-semibold text-foreground mb-4">Orders</h2>
          {orders.length === 0 ? (
            <p className="text-sm text-foreground-muted">No orders yet.</p>
          ) : (
            <ul className="space-y-3">
              {orders.map((order) => (
                <li key={order.id} className="flex items-center justify-between py-2 border-b border-border last:border-0">
                  <div>
                    <p className="text-sm font-medium text-foreground">{order.orderNumber}</p>
                    <p className="text-xs text-foreground-muted">{new Date(order.createdAt).toLocaleDateString()}</p>
                  </div>
                  <div className="text-right">
                    <p className="text-sm font-semibold text-foreground">₹{Number(order.total).toLocaleString()}</p>
                    <p className="text-xs text-foreground-muted">{order.status}</p>
                  </div>
                </li>
              ))}
            </ul>
          )}
        </section>

        <div className="flex justify-end">
          <SignOutButton />
        </div>
      </div>
    </div>
  );
}
