"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { useCartStore } from "@/stores/cart-store";
import { formatCurrency } from "@/lib/utils";

declare global {
  interface Window {
    Razorpay: new (options: Record<string, unknown>) => { open: () => void };
  }
}

type Props = {
  shippingAddress: Record<string, unknown>;
  disabled?: boolean;
  couponCode?: string;
};

export function RazorpayButton({ shippingAddress, disabled, couponCode }: Props) {
  const router = useRouter();
  const items = useCartStore((s) => s.items);
  const clearCart = useCartStore((s) => s.clearCart);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const subtotal = items.reduce((sum, i) => sum + i.price * i.quantity, 0);
  const shipping = subtotal >= 999 ? 0 : 99;
  const total = subtotal + shipping;

  async function handlePayment() {
    setLoading(true);
    setError(null);

    try {
      const res = await fetch("/api/razorpay/create-order", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          shippingAddress,
          couponCode,
        }),
      });
      if (!res.ok) {
        const err = await res.json();
        throw new Error(err.error ?? "Failed to create order");
      }

      const { razorpayOrderId, amountInPaise } = await res.json();

      const options = {
        key: process.env.NEXT_PUBLIC_RAZORPAY_KEY_ID,
        amount: amountInPaise,
        currency: "INR",
        name: "POD Store",
        order_id: razorpayOrderId,
        handler: async function (response: { razorpay_payment_id: string; razorpay_order_id: string; razorpay_signature: string }) {
          const verifyRes = await fetch("/api/razorpay/verify", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ ...response, shippingAddress }),
          });

          if (verifyRes.ok) {
            clearCart();
            const order = await verifyRes.json();
            router.push(`/checkout/success?orderId=${order.id}`);
          } else {
            setError("Payment verification failed. Please contact support.");
          }
        },
        modal: {
          ondismiss: function () {
            setLoading(false);
          },
        },
        prefill: {
          name: (shippingAddress.fullName as string) ?? "",
          email: (shippingAddress.email as string) ?? "",
          contact: (shippingAddress.phone as string) ?? "",
        },
        theme: { color: "#2563eb" },
      };

      const rzp = new window.Razorpay(options);
      rzp.open();
    } catch (err) {
      setError((err as Error).message);
      setLoading(false);
    }
  }

  return (
    <div className="space-y-2">
      <Button onClick={handlePayment} disabled={disabled || loading} className="w-full" size="lg">
        {loading ? "Processing..." : `Pay ${formatCurrency(total)}`}
      </Button>
      {error && <p className="text-sm text-error">{error}</p>}
    </div>
  );
}
