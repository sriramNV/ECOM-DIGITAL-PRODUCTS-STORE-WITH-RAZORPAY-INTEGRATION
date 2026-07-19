import { useCartStore } from "@/stores/cart-store";
import { formatCurrency } from "@/lib/utils";

export function CartSummary() {
  const items = useCartStore((s) => s.items);
  const subtotal = items.reduce((sum, i) => sum + i.price * i.quantity, 0);
  const shipping = subtotal >= 999 ? 0 : 99;
  const total = subtotal + shipping;

  return (
    <div className="bg-surface rounded-lg p-6 space-y-3">
      <div className="flex justify-between text-sm">
        <span className="text-foreground-muted">Subtotal</span>
        <span className="text-foreground">{formatCurrency(subtotal)}</span>
      </div>
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
