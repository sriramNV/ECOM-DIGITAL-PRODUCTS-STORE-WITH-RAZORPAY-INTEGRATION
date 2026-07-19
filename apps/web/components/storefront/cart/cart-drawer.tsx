"use client";

import { X } from "lucide-react";
import { useCartStore } from "@/stores/cart-store";
import { CartItemRow } from "./cart-item-row";
import { CartSummary } from "./cart-summary";
import { Button } from "@/components/ui/button";
import Link from "next/link";

type Props = {
  open: boolean;
  onClose: () => void;
};

export function CartDrawer({ open, onClose }: Props) {
  const items = useCartStore((s) => s.items);

  return (
    <>
      {open && (
        <div className="fixed inset-0 z-50">
          <div className="absolute inset-0 bg-black/40" onClick={onClose} />
          <div className="absolute right-0 top-0 h-full w-full max-w-md bg-background shadow-xl flex flex-col">
            <div className="flex items-center justify-between px-4 py-3 border-b border-border">
              <h2 className="text-lg font-semibold">Cart ({items.length})</h2>
              <button onClick={onClose} aria-label="Close cart">
                <X className="h-5 w-5" />
              </button>
            </div>
            <div className="flex-1 overflow-y-auto px-4">
              {items.length === 0 ? (
                <p className="text-center text-foreground-muted mt-8">Your cart is empty.</p>
              ) : (
                items.map((item) => <CartItemRow key={item.id} item={item} />)
              )}
            </div>
            {items.length > 0 && (
              <div className="px-4 py-4 border-t border-border space-y-3">
                <CartSummary />
                <Link href="/cart" onClick={onClose}>
                  <Button className="w-full">View Cart</Button>
                </Link>
              </div>
            )}
          </div>
        </div>
      )}
    </>
  );
}
