"use client";

import { useEffect, useState } from "react";
import { useParams } from "next/navigation";
import { CustomerDetail } from "@/components/admin/crm/customer-detail";
import type { Customer, CustomerOrder } from "@/components/admin/crm/types";

async function fetchCustomer(id: string) {
  const res = await fetch(`/api/admin/customers?id=${id}`);
  if (!res.ok) return null;
  const data = await res.json();
  return Array.isArray(data) ? data[0] ?? null : data;
}

export default function AdminCustomerDetailPage() {
  const { id } = useParams<{ id: string }>();
  const [customer, setCustomer] = useState<Customer | null>(null);
  const [orders, setOrders] = useState<CustomerOrder[]>([]);
  const [notes, setNotes] = useState<{ createdAt: string; note: string }[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!id) return;
    setLoading(true);
    fetchCustomer(id).then((data) => {
      if (data) {
        setCustomer(data);
        setOrders(data.orders ?? []);
      }
      setLoading(false);
    });
  }, [id]);

  if (loading) return <p className="text-foreground-muted">Loading…</p>;
  if (!customer) return <p className="text-foreground-muted">Customer not found.</p>;

  return (
    <div>
      <h1 className="text-2xl font-bold mb-6">{customer.name ?? customer.email}</h1>
      <CustomerDetail customer={customer} orders={orders} notes={notes} />
    </div>
  );
}
