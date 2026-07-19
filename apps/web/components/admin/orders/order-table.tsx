"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { DataTable } from "@/components/ui/data-table";
import { OrderStatusBadge } from "@/components/admin/orders/order-status-badge";
import { formatCurrency, formatDate } from "@/lib/utils";
import { Input } from "@/components/ui/input";

type Order = {
  id: string;
  orderNumber: string;
  status: string;
  totalAmount: number;
  createdAt: string;
  user: { name: string | null; email: string };
  items: { id: string }[];
};

const statusFilters = [
  { label: "All", value: "" },
  { label: "Pending", value: "PENDING_PAYMENT" },
  { label: "Paid", value: "PAID" },
  { label: "Processing", value: "PROCESSING" },
  { label: "Printing", value: "PRINTING" },
  { label: "Shipped", value: "SHIPPED" },
  { label: "Delivered", value: "DELIVERED" },
  { label: "Cancelled", value: "CANCELLED" },
];

export function OrderTable() {
  const router = useRouter();
  const [orders, setOrders] = useState<Order[]>([]);
  const [total, setTotal] = useState(0);
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [search, setSearch] = useState("");
  const [status, setStatus] = useState("");
  const [loading, setLoading] = useState(true);
  const limit = 20;

  useEffect(() => {
    setLoading(true);
    const params = new URLSearchParams();
    params.set("limit", String(limit));
    params.set("page", String(page));
    if (status) params.set("status", status);
    if (search) params.set("search", search);

    fetch(`/api/admin/orders?${params.toString()}`)
      .then((res) => res.json())
      .then((data) => {
        setOrders(data.items ?? []);
        setTotal(data.total ?? 0);
        setTotalPages(data.totalPages ?? 1);
      })
      .finally(() => setLoading(false));
  }, [page, status, search]);

  return (
    <div>
      <div className="flex items-center justify-between mb-6">
        <h1 className="text-2xl font-bold">Orders</h1>
        <div className="flex gap-3">
          <Input
            placeholder="Search by order# or email..."
            value={search}
            onChange={(e) => { setSearch(e.target.value); setPage(1); }}
            className="w-72"
          />
          <select
            value={status}
            onChange={(e) => { setStatus(e.target.value); setPage(1); }}
            className="h-8 rounded-lg border border-input bg-transparent px-2.5 text-sm"
          >
            {statusFilters.map((f) => (
              <option key={f.value} value={f.value}>{f.label}</option>
            ))}
          </select>
        </div>
      </div>

      {loading ? (
        <p className="text-foreground-muted py-8 text-center">Loading…</p>
      ) : (
        <>
          <DataTable
            columns={[
              { header: "Order", accessorKey: "orderNumber" },
              {
                header: "Customer",
                accessorKey: "user",
                cell: (value: unknown) => {
                  const u = value as { name: string | null; email: string };
                  return u?.name ?? u?.email ?? "-";
                },
              },
              {
                header: "Status",
                accessorKey: "status",
                cell: (value: unknown) => <OrderStatusBadge status={value as string} />,
              },
              {
                header: "Total",
                accessorKey: "totalAmount",
                cell: (value: unknown) => formatCurrency(value as number),
              },
              {
                header: "Items",
                accessorKey: "items",
                cell: (value: unknown) => (value as { id: string }[]).length,
              },
              {
                header: "Date",
                accessorKey: "createdAt",
                cell: (value: unknown) => formatDate(value as string),
              },
            ]}
            data={orders as unknown as Record<string, unknown>[]}
            onRowClick={(row: Order) => `/admin/orders/${row.id}`}
          />
          <div className="flex items-center justify-between mt-4 text-sm text-foreground-muted">
            <span>{total} order{total !== 1 ? "s" : ""}</span>
            <div className="flex gap-2 items-center">
              <button
                disabled={page <= 1}
                onClick={() => setPage((p) => Math.max(1, p - 1))}
                className="px-3 py-1 rounded border border-border disabled:opacity-40 hover:bg-muted"
              >
                Prev
              </button>
              <span>Page {page} of {totalPages}</span>
              <button
                disabled={page >= totalPages}
                onClick={() => setPage((p) => p + 1)}
                className="px-3 py-1 rounded border border-border disabled:opacity-40 hover:bg-muted"
              >
                Next
              </button>
            </div>
          </div>
        </>
      )}
    </div>
  );
}
