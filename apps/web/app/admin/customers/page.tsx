"use client";

import { useEffect, useState } from "react";
import { CustomerTable } from "@/components/admin/crm/customer-table";
import type { Customer } from "@/components/admin/crm/types";

export default function AdminCustomersPage() {
  const [customers, setCustomers] = useState<Customer[]>([]);
  const [search, setSearch] = useState("");
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    setLoading(true);
    const params = new URLSearchParams();
    if (search) params.set("search", search);

    fetch(`/api/admin/customers?${params.toString()}`)
      .then((res) => res.json())
      .then(setCustomers)
      .finally(() => setLoading(false));
  }, [search]);

  return (
    <div>
      <div className="flex items-center justify-between mb-6">
        <h1 className="text-2xl font-bold">Customers</h1>
        <input
          type="text"
          placeholder="Search customers..."
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          className="border border-border rounded-lg px-3 py-2 text-sm w-64 bg-surface"
        />
      </div>
      {loading ? (
        <p className="text-foreground-muted">Loading…</p>
      ) : (
        <CustomerTable customers={customers} />
      )}
    </div>
  );
}
