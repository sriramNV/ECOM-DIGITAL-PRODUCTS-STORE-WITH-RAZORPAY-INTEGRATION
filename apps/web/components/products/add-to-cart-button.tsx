"use client";

import { useCartStore } from "@/stores/cart-store";
import { Button } from "@/components/ui/button";
import { toast } from "sonner";

export function AddToCartButton({ product, price }: { product: any; price: number }) {
  const addItem = useCartStore((s) => s.addItem);

  function handleAdd() {
    addItem({
      productId: product.id,
      title: product.title,
      price,
      image: product.images?.[0]?.url,
      quantity: 1,
    });
    toast.success("Added to cart");
  }

  return <Button size="lg" className="w-full" onClick={handleAdd}>Add to Cart</Button>;
}
