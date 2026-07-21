"use client";

import { useQuery } from "@tanstack/react-query";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import { DataTable } from "@/components/ui/data-table";
import { formatCurrency, formatDate } from "@/lib/utils";

export function ProductTable() {
  const { data, isLoading } = useQuery({
    queryKey: ["admin-products"],
    queryFn: () => fetch("/api/products?limit=100&isActive=all").then((r) => r.json()),
  });

  return (
    <div>
      <div className="flex justify-between items-center mb-4">
        <h1 className="text-2xl font-bold text-foreground">Products</h1>
        <Link href="/admin/products/new">
          <Button>+ New Product</Button>
        </Link>
      </div>

      {isLoading ? (
        <div className="space-y-2">
          {Array.from({ length: 5 }).map((_, i) => (
            <div key={i} className="h-12 bg-surface rounded animate-pulse" />
          ))}
        </div>
      ) : (
        <DataTable
          columns={[
            { header: "Title", accessorKey: "title" },
            { header: "Price", accessorKey: "basePrice", cell: (v: unknown) => formatCurrency(v as number) },
            { header: "Status", accessorKey: "isActive", cell: (v: unknown) => v ? "Active" : "Draft" },
            { header: "Created", accessorKey: "createdAt", cell: (v: unknown) => formatDate(v as string) },
          ]}
          data={data?.items ?? []}
          onRowClick={(row: { slug: string }) => `/admin/products/${row.slug}`}
        />
      )}
    </div>
  );
}
