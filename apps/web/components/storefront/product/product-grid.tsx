import { ProductCard } from "./product-card";

type Product = {
  title: string;
  slug: string;
  images: Array<{ url: string; alt: string | null }>;
  variants: Array<{ price: number }>;
};

type Props = {
  products: Product[];
};

export function ProductGrid({ products }: Props) {
  if (products.length === 0) return null;

  return (
    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4 md:gap-6">
      {products.map((product) => (
        <ProductCard
          key={product.slug}
          title={product.title}
          slug={product.slug}
          imageUrl={product.images[0]?.url ?? "/placeholder.svg"}
          imageAlt={product.images[0]?.alt ?? null}
          minPrice={Math.min(...product.variants.map((v) => v.price))}
        />
      ))}
    </div>
  );
}
