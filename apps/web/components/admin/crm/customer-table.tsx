"use client";

import { DataTable } from "@/components/ui/data-table";
import { Badge } from "@/components/ui/badge";
import type { Customer } from "./types";
import { formatDate } from "@/lib/utils";

type Props = {
  customers: Customer[];
};

export function CustomerTable({ customers }: Props) {
  const columns = [
    {
      header: "Name",
      accessorKey: "name",
      cell: (_value: unknown, row: Customer) => (
        <span className="font-medium">{row.name ?? "—"}</span>
      ),
    },
    {
      header: "Email",
      accessorKey: "email",
    },
    {
      header: "Orders",
      accessorKey: "_count",
      cell: (value: unknown) => {
        const count = (value as { orders: number }).orders;
        return <Badge variant="secondary">{count}</Badge>;
      },
    },
    {
      header: "Last Order",
      accessorKey: "orders",
      cell: (value: unknown) => {
        const orders = value as { createdAt: string }[];
        if (!orders || orders.length === 0) return "—";
        return <>{new Date(orders[0].createdAt).toLocaleDateString()}</>;
      },
    },
    {
      header: "Joined",
      accessorKey: "createdAt",
      cell: (value: unknown) => formatDate(value as string),
    },
  ];

  return (
    <DataTable
      columns={columns}
      data={customers as unknown as Record<string, unknown>[]}
      onRowClick={(row) => `/admin/customers/${(row as unknown as Customer).id}`}
    />
  );
}
