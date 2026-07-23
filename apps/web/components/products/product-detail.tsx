"use client";

import { motion } from "framer-motion";
import { formatCurrency } from "@/lib/utils";
import { AddToCartButton } from "@/components/products/add-to-cart-button";

interface Props {
  product: {
    title: string;
    description: string;
    price: any;
    salePrice: any;
    images: { id: string; url: string; alt: string | null }[];
    category: { name: string } | null;
  };
}

export function ProductDetail({ product }: Props) {
  const price = product.salePrice || product.price;
  const hasSale = !!product.salePrice;

  return (
    <div className="mx-auto max-w-7xl px-4 py-10">
      <div className="grid gap-10 md:grid-cols-2">
        <motion.div
          initial={{ opacity: 0, x: -40 }}
          animate={{ opacity: 1, x: 0 }}
          transition={{ duration: 0.5 }}
          className="space-y-4"
        >
          {product.images.length === 0 && (
            <motion.div
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              transition={{ duration: 0.4 }}
              className="flex aspect-square items-center justify-center rounded-xl border border-border bg-muted text-muted-foreground"
            >
              No images
            </motion.div>
          )}
          {product.images.map((img, i) => (
            <motion.img
              key={img.id}
              src={img.url}
              alt={img.alt || product.title}
              initial={{ opacity: 0, y: 30 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.5, delay: i * 0.15 }}
              className="w-full rounded-xl border border-border"
              whileHover={{ scale: 1.01 }}
            />
          ))}
        </motion.div>

        <motion.div
          initial={{ opacity: 0, x: 40 }}
          animate={{ opacity: 1, x: 0 }}
          transition={{ duration: 0.5, delay: 0.2 }}
        >
          <motion.h1
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.4, delay: 0.3 }}
            className="text-4xl font-bold"
          >
            {product.title}
          </motion.h1>

          {product.category && (
            <motion.p
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ duration: 0.4, delay: 0.4 }}
              className="mt-2 text-sm text-muted-foreground"
            >
              {product.category.name}
            </motion.p>
          )}

          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.4, delay: 0.45 }}
            className="mt-4 flex items-center gap-3"
          >
            {hasSale && <span className="text-2xl text-muted-foreground line-through">{formatCurrency(Number(product.price))}</span>}
            <span className={`text-3xl font-bold ${hasSale ? "text-accent" : ""}`}>{formatCurrency(Number(price))}</span>
          </motion.div>

          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.4, delay: 0.55 }}
            className="mt-6 space-y-4"
          >
            <p className="leading-relaxed text-muted-foreground whitespace-pre-line">{product.description}</p>
          </motion.div>

          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.4, delay: 0.65 }}
            className="mt-8"
          >
            <AddToCartButton product={product} price={Number(price)} />
          </motion.div>
        </motion.div>
      </div>
    </div>
  );
}
