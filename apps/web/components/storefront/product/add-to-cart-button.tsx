"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";
import { useCartStore } from "@/stores/cart-store";

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
    >
      {added ? "Added!" : disabled ? "Sold Out" : "Add to Cart"}
    </Button>
  );
}
