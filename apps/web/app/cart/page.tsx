"use client";

import Link from "next/link";
import { useCartStore } from "@/stores/cart-store";
import { Button } from "@/components/ui/button";
import { formatCurrency } from "@/lib/utils";
import { Trash2 } from "lucide-react";

export default function CartPage() {
  const { items, removeItem, updateQuantity, totalAmount } = useCartStore();

  if (items.length === 0) {
    return (
      <div className="flex min-h-[60vh] flex-col items-center justify-center gap-4">
        <h1 className="text-2xl font-bold">Your cart is empty</h1>
        <Link href="/products"><Button>Browse Products</Button></Link>
      </div>
    );
  }

  return (
    <div className="mx-auto max-w-3xl px-4 py-10">
      <h1 className="mb-8 text-3xl font-bold">Cart</h1>
      <div className="space-y-4">
        {items.map((item) => (
          <div key={item.productId} className="flex items-center justify-between rounded-xl border border-border p-4">
            <div className="flex items-center gap-4">
              {item.image && <img src={item.image} alt={item.title} className="h-16 w-16 rounded-lg object-cover" />}
              <div>
                <h3 className="font-medium">{item.title}</h3>
                <p className="text-sm text-muted-foreground">{formatCurrency(item.price)}</p>
              </div>
            </div>
            <div className="flex items-center gap-3">
              <div className="flex items-center gap-2">
                <Button variant="outline" size="icon" className="h-8 w-8" onClick={() => updateQuantity(item.productId, item.quantity - 1)}>-</Button>
                <span className="w-8 text-center">{item.quantity}</span>
                <Button variant="outline" size="icon" className="h-8 w-8" onClick={() => updateQuantity(item.productId, item.quantity + 1)}>+</Button>
              </div>
              <Button variant="ghost" size="icon" onClick={() => removeItem(item.productId)}><Trash2 className="h-4 w-4" /></Button>
            </div>
          </div>
        ))}
      </div>
      <div className="mt-8 flex items-center justify-between border-t border-border pt-6">
        <span className="text-xl font-bold">Total: {formatCurrency(totalAmount())}</span>
        <Link href="/checkout"><Button size="lg">Proceed to Checkout</Button></Link>
      </div>
    </div>
  );
}
