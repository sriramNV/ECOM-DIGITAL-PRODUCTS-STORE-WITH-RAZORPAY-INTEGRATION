"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";
import { useCartStore } from "@/stores/cart-store";
import { Check, ShoppingCart } from "lucide-react";

type Props = {
  productId: string;
  variantId?: string;
  title: string;
  image: string;
  price: number;
  size?: string;
  color?: string;
  slug: string;
  disabled?: boolean;
};

export function AddToCartButton({ productId, variantId, title, image, price, size, color, slug, disabled }: Props) {
  const [added, setAdded] = useState(false);
  const addItem = useCartStore((s) => s.addItem);

  function handleClick() {
    if (!variantId) return;

    addItem({
      id: `${productId}::${variantId}`,
      productId,
      variantId,
      title,
      image,
      price,
      quantity: 1,
      size: size ?? "",
      color: color ?? "",
      slug,
    });

    setAdded(true);
    setTimeout(() => setAdded(false), 2000);
  }

  return (
    <Button
      onClick={handleClick}
      disabled={disabled || !variantId}
      className="w-full"
      size="lg"
    >
      {added ? (
        <span className="flex items-center gap-2">
          <Check className="h-4 w-4" />
          Added to Cart
        </span>
      ) : disabled ? (
        "Sold Out"
      ) : (
        <span className="flex items-center gap-2">
          <ShoppingCart className="h-4 w-4" />
          Add to Cart
        </span>
      )}
    </Button>
  );
}
