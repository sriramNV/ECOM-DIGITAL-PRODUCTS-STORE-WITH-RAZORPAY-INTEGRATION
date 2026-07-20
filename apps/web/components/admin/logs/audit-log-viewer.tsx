"use client";

import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { DataTable } from "@/components/ui/data-table";
import { Input } from "@/components/ui/input";
import { formatDate } from "@/lib/utils";

const actionFilters = [
  { label: "All", value: "" },
  { label: "Created", value: "CREATE" },
  { label: "Updated", value: "UPDATE" },
  { label: "Deleted", value: "DELETE" },
  { label: "Login", value: "LOGIN" },
  { label: "Logout", value: "LOGOUT" },
];

type AuditEntry = {
  id: string;
  userId: string | null;
  action: string;
  entity: string;
  entityId: string | null;
  metadata: Record<string, unknown> | null;
  ip: string | null;
  createdAt: string;
};

export function AuditLogViewer() {
  const [page, setPage] = useState(1);
  const [action, setAction] = useState("");
  const [search, setSearch] = useState("");
  const limit = 50;

  const { data, isLoading } = useQuery({
    queryKey: ["audit-logs", page, action, search],
    queryFn: async ({ signal }) => {
      const params = new URLSearchParams();
      params.set("page", String(page));
      params.set("limit", String(limit));
      if (action) params.set("action", action);
      if (search) params.set("entity", search);
      const res = await fetch(`/api/logs/audit?${params.toString()}`, { signal });
      return res.json() as Promise<{
        items: AuditEntry[];
        total: number;
        page: number;
        totalPages: number;
      }>;
    },
  });

  return (
    <div>
      <div className="flex items-center justify-between mb-6">
        <h1 className="text-2xl font-bold">Audit Logs</h1>
        <div className="flex gap-3">
          <Input
            placeholder="Search by entity..."
            value={search}
            onChange={(e) => { setSearch(e.target.value); setPage(1); }}
            className="w-56"
          />
          <select
            value={action}
            onChange={(e) => { setAction(e.target.value); setPage(1); }}
            className="h-8 rounded-lg border border-input bg-transparent px-2.5 text-sm"
          >
            {actionFilters.map((f) => (
              <option key={f.value} value={f.value}>{f.label}</option>
            ))}
          </select>
        </div>
      </div>

      {isLoading ? (
        <p className="text-foreground-muted py-8 text-center">Loading…</p>
      ) : (
        <>
          <DataTable
            columns={[
              {
                header: "Action",
                accessorKey: "action",
                cell: (value: unknown) => (
                  <span className="font-medium capitalize">{(value as string).toLowerCase()}</span>
                ),
              },
              { header: "Entity", accessorKey: "entity" },
              { header: "Entity ID", accessorKey: "entityId" },
              { header: "User", accessorKey: "userId" },
              {
                header: "Timestamp",
                accessorKey: "createdAt",
                cell: (value: unknown) => formatDate(value as string),
              },
            ]}
            data={(data?.items ?? []) as unknown as Record<string, unknown>[]}
          />
          <div className="flex items-center justify-between mt-4 text-sm text-foreground-muted">
            <span>{data?.total ?? 0} log{data?.total !== 1 ? "s" : ""}</span>
            <div className="flex gap-2 items-center">
              <button
                disabled={page <= 1}
                onClick={() => setPage((p) => Math.max(1, p - 1))}
                className="px-3 py-1 rounded border border-border disabled:opacity-40 hover:bg-muted"
              >
                Prev
              </button>
              <span>Page {page} of {data?.totalPages ?? 1}</span>
              <button
                disabled={page >= (data?.totalPages ?? 1)}
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
