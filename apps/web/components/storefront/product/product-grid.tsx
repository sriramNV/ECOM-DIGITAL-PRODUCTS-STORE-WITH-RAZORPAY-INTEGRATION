import { PackageSearch } from "lucide-react";
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
  if (products.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center py-20 text-center">
        <div className="w-12 h-12 rounded-full bg-muted flex items-center justify-center mb-4">
          <PackageSearch className="h-6 w-6 text-foreground-muted" />
        </div>
        <p className="text-foreground font-medium">No products found</p>
        <p className="text-sm text-foreground-muted mt-1 max-w-sm">
          Try browsing a different category or check back later — new products are added regularly.
        </p>
      </div>
    );
  }

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
