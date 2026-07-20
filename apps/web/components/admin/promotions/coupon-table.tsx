"use client";

import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { Button } from "@/components/ui/button";
import { DataTable } from "@/components/ui/data-table";
import { formatCurrency, formatDate } from "@/lib/utils";
import { CouponForm } from "./coupon-form";

type Coupon = {
  id: string;
  code: string;
  type: string;
  value: number;
  minOrder: number;
  maxDiscount: number | null;
  usageLimit: number | null;
  startDate: string;
  endDate: string | null;
  isActive: boolean;
  createdAt: string;
};

export function CouponTable() {
  const [showForm, setShowForm] = useState(false);

  const { data: coupons, isLoading } = useQuery({
    queryKey: ["admin-coupons"],
    queryFn: () => fetch("/api/promotions/coupons").then((r) => r.json()),
  });

  return (
    <div>
      <div className="flex justify-between items-center mb-4">
        <h1 className="text-2xl font-bold text-foreground">Promotions</h1>
        <Button onClick={() => setShowForm(true)}>+ New Coupon</Button>
      </div>

      {isLoading ? (
        <div className="space-y-2">
          {Array.from({ length: 3 }).map((_, i) => (
            <div key={i} className="h-12 bg-surface rounded animate-pulse" />
          ))}
        </div>
      ) : (
        <DataTable
          columns={[
            { header: "Code", accessorKey: "code" },
            { header: "Type", accessorKey: "type", cell: (v: unknown) => (v as string).replace("_", " ") },
            { header: "Value", accessorKey: "value", cell: (_: unknown, row: Coupon) =>
              row.type === "percentage" ? `${row.value}%` : formatCurrency(row.value)
            },
            { header: "Active", accessorKey: "isActive", cell: (v: unknown) => v ? "Yes" : "No" },
            { header: "Created", accessorKey: "createdAt", cell: (v: unknown) => formatDate(v as string) },
          ]}
          data={(coupons ?? []) as Coupon[]}
        />
      )}

      <CouponForm open={showForm} onClose={() => setShowForm(false)} />
    </div>
  );
}
