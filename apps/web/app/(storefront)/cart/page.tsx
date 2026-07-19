"use client";

import Link from "next/link";
import { ShoppingBag } from "lucide-react";
import { useCartStore } from "@/stores/cart-store";
import { CartItemRow } from "@/components/storefront/cart/cart-item-row";
import { CartSummary } from "@/components/storefront/cart/cart-summary";
import { EmptyState } from "@/components/storefront/shared/empty-state";
import { Button } from "@/components/ui/button";

export default function CartPage() {
  const items = useCartStore((s) => s.items);

  if (items.length === 0) {
    return (
      <div className="max-w-7xl mx-auto px-4 py-8">
        <EmptyState
          icon={ShoppingBag}
          title="Your cart is empty"
          description="Looks like you haven't added anything yet."
          action={{ label: "Start Shopping", href: "/products" }}
        />
      </div>
    );
  }

  return (
    <div className="max-w-7xl mx-auto px-4 md:px-6 lg:px-8 py-8">
      <h1 className="text-2xl font-bold text-foreground mb-8">Shopping Cart</h1>
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        <div className="lg:col-span-2">
          {items.map((item) => (
            <CartItemRow key={item.id} item={item} />
          ))}
        </div>
        <div className="space-y-4">
          <CartSummary />
          <Link href="/checkout">
            <Button className="w-full">Proceed to Checkout</Button>
          </Link>
        </div>
      </div>
    </div>
  );
}
