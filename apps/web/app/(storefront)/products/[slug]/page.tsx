import { prisma } from "@/lib/db";
import { formatCurrency } from "@/lib/utils";
import { AddToCartButton } from "@/components/products/add-to-cart-button";
import { notFound } from "next/navigation";

export default async function ProductDetailPage(props: { params: Promise<{ slug: string }> }) {
  const params = await props.params;
  const product = await prisma.product.findUnique({
    where: { slug: params.slug, isActive: true },
    include: { images: { orderBy: { position: "asc" } }, category: true },
  });

  if (!product) notFound();

  const price = product.salePrice || product.price;
  const hasSale = !!product.salePrice;

  return (
    <div className="mx-auto max-w-7xl px-4 py-10">
      <div className="grid gap-10 md:grid-cols-2">
        <div className="space-y-4">
          {product.images.map((img) => (
            <img key={img.id} src={img.url} alt={img.alt || product.title} className="w-full rounded-xl border border-border" />
          ))}
          {product.images.length === 0 && (
            <div className="flex aspect-square items-center justify-center rounded-xl border border-border bg-muted text-muted-foreground">No images</div>
          )}
        </div>
        <div>
          <h1 className="text-4xl font-bold">{product.title}</h1>
          {product.category && (
            <p className="mt-2 text-sm text-muted-foreground">{product.category.name}</p>
          )}
          <div className="mt-4 flex items-center gap-3">
            {hasSale && <span className="text-2xl text-muted-foreground line-through">{formatCurrency(Number(product.price))}</span>}
            <span className={`text-3xl font-bold ${hasSale ? "text-accent" : ""}`}>{formatCurrency(Number(price))}</span>
          </div>
          <div className="mt-6 space-y-4">
            <p className="text-muted-foreground leading-relaxed whitespace-pre-line">{product.description}</p>
          </div>
          <div className="mt-8">
            <AddToCartButton product={product} price={Number(price)} />
          </div>
        </div>
      </div>
    </div>
  );
}
