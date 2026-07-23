"use client";

import { useState } from "react";
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
  const { data: session } = useSession();
  const router = useRouter();
  const { items, totalAmount, clearCart } = useCartStore();
  const [loading, setLoading] = useState(false);

  if (!session) {
    router.push("/auth/login");
    return null;
  }

  if (items.length === 0) {
    router.push("/cart");
    return null;
  }

  async function handlePayment() {
    setLoading(true);
    try {
      const orderRes = await fetch("/api/razorpay/create-order", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({}),
      });

      if (!orderRes.ok) {
        const err = await orderRes.json();
        toast.error(err.error || "Failed to create order");
        setLoading(false);
        return;
      }

      const order = await orderRes.json();

      const options = {
        key: process.env.NEXT_PUBLIC_RAZORPAY_KEY_ID,
        amount: order.amountInPaise,
        currency: "INR",
        name: "Nexus Store",
        description: "Digital Products",
        order_id: order.razorpayOrderId,
        handler: async function (response: any) {
          const verifyRes = await fetch("/api/razorpay/verify", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({
              razorpay_payment_id: response.razorpay_payment_id,
              razorpay_order_id: response.razorpay_order_id,
              razorpay_signature: response.razorpay_signature,
              amount: order.amount,
            }),
          });

          if (verifyRes.ok) {
            const data = await verifyRes.json();
            clearCart();
            toast.success("Payment successful!");
            router.push(`/account/orders/${data.id}`);
          } else {
            toast.error("Payment verification failed");
          }
        },
        modal: { ondismiss: () => setLoading(false) },
        prefill: { email: session!.user?.email || "" },
        theme: { color: "#00f0ff" },
      };

      const rzp = new (window as any).Razorpay(options);
      rzp.open();
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
