"use client";

import { useEffect } from "react";
import { X, ShoppingBag } from "lucide-react";
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

  useEffect(() => {
    const handler = (e: KeyboardEvent) => { if (e.key === "Escape") onClose(); };
    document.addEventListener("keydown", handler);
    return () => document.removeEventListener("keydown", handler);
  }, [onClose]);

  return (
    <>
      {open && (
        <div className="fixed inset-0 z-50" role="dialog" aria-modal="true" aria-label="Shopping cart">
          <div className="absolute inset-0 bg-overlay animate-in fade-in duration-150" onClick={onClose} />
          <div className="absolute right-0 top-0 h-full w-full max-w-md bg-background shadow-xl flex flex-col animate-in slide-in-from-right duration-200">
            <div className="flex items-center justify-between px-4 py-3.5 border-b border-border">
              <h2 className="text-base font-semibold text-foreground">Cart ({items.length})</h2>
              <button onClick={onClose} aria-label="Close cart" className="p-1 text-foreground-muted hover:text-foreground transition-colors">
                <X className="h-5 w-5" />
              </button>
            </div>
            <div className="flex-1 overflow-y-auto px-4">
              {items.length === 0 ? (
                <div className="flex flex-col items-center justify-center mt-16 text-center">
                  <div className="w-12 h-12 rounded-full bg-muted flex items-center justify-center mb-3">
                    <ShoppingBag className="h-6 w-6 text-foreground-muted" />
                  </div>
                  <p className="text-foreground font-medium">Your cart is empty</p>
                  <p className="text-sm text-foreground-muted mt-1">Add some products to get started.</p>
                </div>
              ) : (
                items.map((item) => <CartItemRow key={item.id} item={item} />)
              )}
            </div>
            {items.length > 0 && (
              <div className="px-4 py-4 border-t border-border space-y-3 bg-muted/30">
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
