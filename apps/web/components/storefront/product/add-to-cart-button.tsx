"use client";

import { Button } from "@/components/ui/button";

type Props = {
  productId: string;
  variantId?: string;
  disabled?: boolean;
};

export function AddToCartButton({ productId, variantId, disabled }: Props) {
  return (
    <Button className="w-full" size="lg" disabled={disabled}>
      Add to Cart
    </Button>
  );
}
