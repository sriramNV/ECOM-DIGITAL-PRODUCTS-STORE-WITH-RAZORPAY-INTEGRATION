"use client";

import type { Customer, CustomerOrder } from "./types";
import { formatDate } from "@/lib/utils";

type Props = {
  customer: Customer;
  orders: CustomerOrder[];
  notes: { createdAt: string; note: string }[];
};

const statusColors: Record<string, string> = {
  PENDING_PAYMENT: "bg-yellow-100 text-yellow-800",
  PAID: "bg-blue-100 text-blue-800",
  PROCESSING: "bg-indigo-100 text-indigo-800",
  PRINTING: "bg-purple-100 text-purple-800",
  SHIPPED: "bg-cyan-100 text-cyan-800",
  DELIVERED: "bg-green-100 text-green-800",
  CANCELLED: "bg-red-100 text-red-800",
  REFUNDED: "bg-gray-100 text-gray-800",
};

export function CustomerDetail({ customer, orders, notes }: Props) {
  return (
    <div className="space-y-8">
      <section>
        <h2 className="text-lg font-semibold mb-3">Customer Info</h2>
        <div className="grid grid-cols-2 gap-4 text-sm">
          <div>
            <span className="text-foreground-muted">Name</span>
            <p className="font-medium">{customer.name ?? "—"}</p>
          </div>
          <div>
            <span className="text-foreground-muted">Email</span>
            <p className="font-medium">{customer.email}</p>
          </div>
          <div>
            <span className="text-foreground-muted">Phone</span>
            <p className="font-medium">{customer.phone ?? "—"}</p>
          </div>
          <div>
            <span className="text-foreground-muted">Joined</span>
            <p className="font-medium">{formatDate(customer.createdAt)}</p>
          </div>
          <div>
            <span className="text-foreground-muted">Total Orders</span>
            <p className="font-medium">{customer._count.orders}</p>
          </div>
        </div>
      </section>

      <section>
        <h2 className="text-lg font-semibold mb-3">Order History</h2>
        {orders.length === 0 ? (
          <p className="text-foreground-muted text-sm">No orders yet.</p>
        ) : (
          <div className="space-y-3">
            {orders.map((order) => (
              <div key={order.id} className="border border-border rounded-lg p-4">
                <div className="flex items-center justify-between mb-2">
                  <span className="font-medium">#{order.orderNumber}</span>
                  <span className={`text-xs font-medium px-2 py-0.5 rounded-full ${statusColors[order.status] ?? ""}`}>
                    {order.status}
                  </span>
                </div>
                <div className="text-sm text-foreground-muted space-y-1">
                  <p>{formatDate(order.createdAt)}</p>
                  <p>₹{Number(order.totalAmount).toLocaleString()}</p>
                  {order.items.length > 0 && (
                    <ul className="list-disc list-inside mt-1">
                      {order.items.map((item) => (
                        <li key={item.id}>
                          {item.title} ({item.variant}) × {item.quantity}
                        </li>
                      ))}
                    </ul>
                  )}
                </div>
              </div>
            ))}
          </div>
        )}
      </section>

      <section>
        <h2 className="text-lg font-semibold mb-3">Order Notes</h2>
        {notes.length === 0 ? (
          <p className="text-foreground-muted text-sm">No notes.</p>
        ) : (
          <div className="space-y-2">
            {notes.map((note, i) => (
              <div key={i} className="border border-border rounded-lg p-3 text-sm">
                <p className="text-foreground-muted text-xs">{formatDate(note.createdAt)}</p>
                <p className="mt-1">{note.note}</p>
              </div>
            ))}
          </div>
        )}
      </section>
    </div>
  );
}
