"use client";

import { useState, useEffect } from "react";
import { useSession } from "next-auth/react";
import { useRouter } from "next/navigation";
import { useCartStore } from "@/stores/cart-store";
import { Button } from "@/components/ui/button";
import { formatCurrency } from "@/lib/utils";
import { toast } from "sonner";

declare global {
  interface Window { Razorpay: any; }
}

export default function CheckoutPage() {
  const { data: session, status } = useSession();
  const router = useRouter();
  const { items, totalAmount, clearCart } = useCartStore();
  const [loading, setLoading] = useState(false);
  const [hydrated, setHydrated] = useState(false);

  useEffect(() => {
    setHydrated(useCartStore.persist.hasHydrated());
    const unsub = useCartStore.persist.onFinishHydration(() => setHydrated(true));
    return unsub;
  }, []);

  useEffect(() => {
    if (status === "unauthenticated") router.push("/auth/login");
  }, [status, router]);

  useEffect(() => {
    if (hydrated && status === "authenticated" && items.length === 0) router.push("/cart");
  }, [hydrated, status, items, router]);

  if (status === "loading" || !hydrated) return <div className="flex min-h-screen items-center justify-center"><p className="text-muted-foreground">Loading...</p></div>;
  if (status === "unauthenticated" || (hydrated && items.length === 0)) return null;

  async function handlePayment() {
    setLoading(true);
    try {
      const syncRes = await fetch("/api/cart", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ items }),
      });
      if (!syncRes.ok) {
        toast.error("Failed to sync cart");
        setLoading(false);
        return;
      }

      const orderRes = await fetch("/api/orders", { method: "POST" });

      if (!orderRes.ok) {
        const err = await orderRes.json();
        toast.error(err.error || "Failed to create order");
        setLoading(false);
        return;
      }

      const order = await orderRes.json();
      clearCart();
      toast.success("Payment successful!");
      router.push(`/account/orders/${order.id}`);
    } catch (error) {
      toast.error("Something went wrong");
      setLoading(false);
    }
  }

  return (
    <div className="mx-auto max-w-2xl px-4 py-10">
      <h1 className="mb-8 text-3xl font-bold">Checkout</h1>
      <div className="space-y-4 rounded-xl border border-border p-6">
        <h2 className="text-lg font-semibold">Order Summary</h2>
        {items.map((item) => (
          <div key={item.productId} className="flex justify-between text-sm">
            <span>{item.title} × {item.quantity}</span>
            <span>{formatCurrency(item.price * item.quantity)}</span>
          </div>
        ))}
        <div className="border-t border-border pt-4">
          <div className="flex justify-between font-bold">
            <span>Total</span>
            <span>{formatCurrency(totalAmount())}</span>
          </div>
        </div>
        <Button size="lg" className="w-full" onClick={handlePayment} disabled={loading}>
          {loading ? "Processing..." : `Pay ${formatCurrency(totalAmount())}`}
        </Button>
      </div>
    </div>
  );
}
