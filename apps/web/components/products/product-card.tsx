"use client";

import Link from "next/link";
import { motion } from "framer-motion";
import { cn, formatCurrency } from "@/lib/utils";

export function ProductCard({ product, className }: { product: any; className?: string }) {
  const image = product.images?.[0];
  const price = product.salePrice || product.price;
  const hasSale = !!product.salePrice;

  return (
    <motion.div
      whileHover={{ y: -4 }}
      className={cn("group relative overflow-hidden rounded-xl border border-border bg-card transition-colors hover:border-primary/50", className)}
    >
      <Link href={`/products/${product.slug}`}>
        <div className="aspect-[4/3] overflow-hidden bg-muted">
          {image ? (
            <img src={image.url} alt={image.alt || product.title} className="h-full w-full object-cover transition-transform duration-500 group-hover:scale-110" />
          ) : (
            <div className="flex h-full items-center justify-center text-muted-foreground">No image</div>
          )}
        </div>
        <div className="p-4">
          <h3 className="font-medium text-foreground">{product.title}</h3>
          <div className="mt-2 flex items-center gap-2">
            {hasSale && (
              <span className="text-sm text-muted-foreground line-through">{formatCurrency(Number(product.price))}</span>
            )}
            <span className={cn("text-sm font-semibold", hasSale ? "text-accent" : "text-foreground")}>
              {formatCurrency(Number(price))}
            </span>
          </div>
        </div>
      </Link>
    </motion.div>
  );
}
