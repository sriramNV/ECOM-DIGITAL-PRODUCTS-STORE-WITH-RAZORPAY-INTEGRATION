"use client";

import Image from "next/image";
import Link from "next/link";
import { Trash2 } from "lucide-react";
import { useCartStore } from "@/stores/cart-store";
import { formatCurrency } from "@/lib/utils";
import type { CartItem } from "@/types";

type Props = { item: CartItem };

export function CartItemRow({ item }: Props) {
  const updateQuantity = useCartStore((s) => s.updateQuantity);
  const removeItem = useCartStore((s) => s.removeItem);

  return (
    <div className="flex gap-4 py-4 border-b border-border">
      <Link href={`/products/${item.slug}`} className="w-20 h-20 relative rounded-md overflow-hidden flex-shrink-0 bg-surface">
        <Image src={item.image} alt={item.title} fill className="object-cover" sizes="80px" />
      </Link>
      <div className="flex-1 min-w-0">
        <Link href={`/products/${item.slug}`} className="text-sm font-medium text-foreground truncate block hover:underline">
          {item.title}
        </Link>
        <p className="text-xs text-foreground-faint">{item.color} / {item.size}</p>
        <div className="flex items-center gap-3 mt-2">
          <select
            value={item.quantity}
            onChange={(e) => updateQuantity(item.id, Number(e.target.value))}
            className="text-sm border border-border rounded px-2 py-1 bg-background"
          >
            {[1, 2, 3, 4, 5, 6, 7, 8, 9, 10].map((n) => (
              <option key={n} value={n}>{n}</option>
            ))}
          </select>
          <span className="text-sm font-medium text-foreground">{formatCurrency(item.price * item.quantity)}</span>
        </div>
      </div>
      <button onClick={() => removeItem(item.id)} className="text-foreground-faint hover:text-error" aria-label="Remove item">
        <Trash2 className="h-4 w-4" />
      </button>
    </div>
  );
}
