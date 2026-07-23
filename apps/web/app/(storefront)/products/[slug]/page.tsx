import { prisma } from "@/lib/db";
import { notFound } from "next/navigation";
import { ProductDetail } from "@/components/products/product-detail";

export default async function ProductDetailPage(props: { params: Promise<{ slug: string }> }) {
  const params = await props.params;
  const product = await prisma.product.findUnique({
    where: { slug: params.slug, isActive: true },
    include: { images: { orderBy: { position: "asc" } }, category: true },
  });

  if (!product) notFound();

  return <ProductDetail product={product} />;
}
