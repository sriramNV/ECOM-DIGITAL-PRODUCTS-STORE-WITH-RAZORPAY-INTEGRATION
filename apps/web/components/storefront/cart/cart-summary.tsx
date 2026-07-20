"use client";

import { useState } from "react";
import { useCartStore } from "@/stores/cart-store";
import { formatCurrency } from "@/lib/utils";
import { CouponInput } from "./coupon-input";

export function CartSummary() {
  const items = useCartStore((s) => s.items);
  const [couponCode, setCouponCode] = useState<string | undefined>();
  const [discount, setDiscount] = useState(0);
  const [couponError, setCouponError] = useState<string | undefined>();

  const subtotal = items.reduce((sum, i) => sum + i.price * i.quantity, 0);
  const shipping = subtotal >= 999 ? 0 : 99;

  async function handleApplyCoupon(code: string) {
    try {
      const res = await fetch("/api/promotions/coupons/validate", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ code, subtotal }),
      });
      const data = await res.json();
      if (data.valid) {
        setDiscount(data.discount);
        setCouponCode(code);
        setCouponError(undefined);
      } else {
        setDiscount(0);
        setCouponCode(undefined);
        setCouponError(data.error ?? "Invalid coupon");
      }
    } catch {
      setCouponError("Failed to validate coupon");
    }
  }

  function handleRemoveCoupon() {
    setCouponCode(undefined);
    setDiscount(0);
    setCouponError(undefined);
  }

  const total = subtotal - discount + shipping;

  return (
    <div className="bg-surface rounded-lg p-6 space-y-3">
      <CouponInput
        subtotal={subtotal}
        onApply={handleApplyCoupon}
        onRemove={handleRemoveCoupon}
        appliedCode={couponCode}
        discount={discount}
        error={couponError}
      />
      <div className="flex justify-between text-sm">
        <span className="text-foreground-muted">Subtotal</span>
        <span className="text-foreground">{formatCurrency(subtotal)}</span>
      </div>
      {discount > 0 && (
        <div className="flex justify-between text-sm">
          <span className="text-foreground-muted">Discount</span>
          <span className="text-green-600">-{formatCurrency(discount)}</span>
        </div>
      )}
      <div className="flex justify-between text-sm">
        <span className="text-foreground-muted">Shipping</span>
        <span className="text-foreground">{shipping === 0 ? "Free" : formatCurrency(shipping)}</span>
      </div>
      {shipping > 0 && subtotal < 999 && (
        <p className="text-xs text-foreground-faint">Free shipping above {formatCurrency(999)}</p>
      )}
      <div className="border-t border-border pt-3 flex justify-between font-medium">
        <span className="text-foreground">Total</span>
        <span className="text-foreground">{formatCurrency(total)}</span>
      </div>
    </div>
  );
}
