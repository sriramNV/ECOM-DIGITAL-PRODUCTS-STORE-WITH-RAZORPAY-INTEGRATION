import { prisma } from "@/lib/db";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import { formatCurrency } from "@/lib/utils";

export default async function AdminProductsPage() {
  const products = await prisma.product.findMany({
    include: { category: true, images: { take: 1 } },
    orderBy: { createdAt: "desc" },
  });

  return (
    <div>
      <div className="mb-6 flex items-center justify-between">
        <h1 className="text-3xl font-bold">Products</h1>
        <Link href="/admin/products/new"><Button>Add Product</Button></Link>
      </div>
      <div className="rounded-xl border border-border">
        <table className="w-full text-left text-sm">
          <thead className="border-b border-border">
            <tr className="text-muted-foreground"><th className="p-3 font-medium">Title</th><th className="p-3 font-medium">Category</th><th className="p-3 font-medium">Price</th><th className="p-3 font-medium">Active</th><th className="p-3 font-medium">Actions</th></tr>
          </thead>
          <tbody>
            {products.map((p) => (
              <tr key={p.id} className="border-b border-border last:border-0">
                <td className="p-3 font-medium">{p.title}</td>
                <td className="p-3">{p.category?.name || "-"}</td>
                <td className="p-3">{formatCurrency(Number(p.salePrice || p.price))}</td>
                <td className="p-3">{p.isActive ? "Yes" : "No"}</td>
                <td className="p-3"><Link href={`/admin/products/${p.slug}`} className="text-primary hover:underline">Edit</Link></td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
