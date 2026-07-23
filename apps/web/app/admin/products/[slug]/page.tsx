import { prisma } from "@/lib/db";
import { ProductForm } from "@/components/admin/product-form";
import { notFound } from "next/navigation";

export default async function EditProductPage(props: { params: Promise<{ slug: string }> }) {
  const params = await props.params;
  const product = await prisma.product.findUnique({
    where: { slug: params.slug },
    include: { images: { orderBy: { position: "asc" } } },
  });
  if (!product) notFound();

  const categories = await prisma.category.findMany({ orderBy: { name: "asc" } });

  return (
    <div>
      <h1 className="mb-8 text-3xl font-bold">Edit Product</h1>
      <ProductForm product={product} categories={categories} isNew={false} />
    </div>
  );
}
