"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { formatCurrency } from "@/lib/utils";

type Props = {
  subtotal: number;
  onApply: (code: string) => void;
  onRemove: () => void;
  appliedCode?: string;
  discount?: number;
  error?: string;
};

export function CouponInput({ subtotal, onApply, onRemove, appliedCode, discount, error }: Props) {
  const [code, setCode] = useState("");

  return (
    <div className="space-y-2">
      {appliedCode ? (
        <div className="flex items-center justify-between bg-surface rounded-lg p-3">
          <div>
            <p className="text-sm font-medium text-foreground">{appliedCode}</p>
            {discount ? (
              <p className="text-sm text-green-600">-{formatCurrency(discount)}</p>
            ) : null}
          </div>
          <Button variant="ghost" size="sm" onClick={onRemove}>
            Remove
          </Button>
        </div>
      ) : (
        <form
          onSubmit={(e) => {
            e.preventDefault();
            if (code.trim()) onApply(code.trim().toUpperCase());
          }}
          className="flex gap-2"
        >
          <Input
            placeholder="Coupon code"
            value={code}
            onChange={(e) => setCode(e.target.value)}
            className="flex-1"
          />
          <Button type="submit" variant="outline" size="sm">
            Apply
          </Button>
        </form>
      )}
      {error && <p className="text-xs text-red-500">{error}</p>}
    </div>
  );
}
