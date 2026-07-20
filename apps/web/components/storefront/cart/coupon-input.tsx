"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { formatCurrency } from "@/lib/utils";
import { Tag, X } from "lucide-react";

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
        <div className="flex items-center justify-between bg-success-bg border border-success/20 rounded-lg p-3">
          <div className="flex items-center gap-3">
            <Tag className="h-4 w-4 text-success" />
            <div>
              <p className="text-sm font-medium text-foreground">{appliedCode}</p>
              {discount ? (
                <p className="text-sm text-success">-{formatCurrency(discount)}</p>
              ) : null}
            </div>
          </div>
          <button onClick={onRemove} className="text-foreground-faint hover:text-foreground transition-colors" aria-label="Remove coupon">
            <X className="h-4 w-4" />
          </button>
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
            placeholder="Enter coupon code"
            value={code}
            onChange={(e) => setCode(e.target.value)}
            className="flex-1"
          />
          <Button type="submit" variant="outline" size="sm">
            Apply
          </Button>
        </form>
      )}
      {error && <p className="text-xs text-error">{error}</p>}
    </div>
  );
}
