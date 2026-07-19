"use client";

import { useQuery } from "@tanstack/react-query";
import { OrderStatusBadge } from "@/components/admin/orders/order-status-badge";
import { OrderActions } from "@/components/admin/orders/order-actions";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { formatCurrency, formatDate } from "@/lib/utils";
import { Skeleton } from "@/components/ui/skeleton";

type OrderItem = {
  id: string;
  title: string;
  variant: string;
  quantity: number;
  unitPrice: number;
  totalPrice: number;
};

type StatusHistory = {
  id: string;
  status: string;
  note: string | null;
  createdAt: string;
};

type Address = {
  name: string;
  street: string;
  city: string;
  state: string;
  pincode: string;
  country: string;
  phone: string;
};

type Order = {
  id: string;
  orderNumber: string;
  status: string;
  totalAmount: number;
  subtotalAmount: number;
  shippingAmount: number;
  taxAmount: number;
  discountAmount: number;
  currency: string;
  shippingAddress: Address | null;
  shippingMethod: string | null;
  notes: string | null;
  createdAt: string;
  updatedAt: string;
  user: { name: string | null; email: string };
  items: OrderItem[];
  payments: { id: string; amount: number; status: string; method: string | null; createdAt: string }[];
  statusHistory: StatusHistory[];
};

type Props = {
  orderId: string;
};

export function OrderDetail({ orderId }: Props) {
  const { data: order, isLoading, error } = useQuery<Order>({
    queryKey: ["admin-order", orderId],
    queryFn: () => fetch(`/api/admin/orders/${orderId}`).then((r) => r.json()),
  });

  if (isLoading) {
    return (
      <div className="space-y-6">
        <Skeleton className="h-8 w-48" />
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
          <Skeleton className="h-32 rounded-xl" />
          <Skeleton className="h-32 rounded-xl" />
          <Skeleton className="h-32 rounded-xl" />
        </div>
        <Skeleton className="h-64 rounded-xl" />
      </div>
    );
  }

  if (error || !order) {
    return <p className="text-destructive">Failed to load order.</p>;
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold">Order {order.orderNumber}</h1>
          <p className="text-foreground-muted text-sm">{formatDate(order.createdAt)}</p>
        </div>
        <OrderActions orderId={order.id} status={order.status} />
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
        <Card>
          <CardHeader><CardTitle>Customer</CardTitle></CardHeader>
          <CardContent className="space-y-1 text-sm">
            <p>{order.user.name ?? order.user.email}</p>
            <p className="text-foreground-muted">{order.user.email}</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader><CardTitle>Status</CardTitle></CardHeader>
          <CardContent>
            <OrderStatusBadge status={order.status} />
          </CardContent>
        </Card>

        <Card>
          <CardHeader><CardTitle>Shipping</CardTitle></CardHeader>
          <CardContent className="space-y-1 text-sm">
            {order.shippingAddress ? (
              <>
                <p>{order.shippingAddress.name}</p>
                <p>{order.shippingAddress.street}</p>
                <p>{order.shippingAddress.city}, {order.shippingAddress.state} - {order.shippingAddress.pincode}</p>
                <p className="text-foreground-muted">{order.shippingAddress.phone}</p>
              </>
            ) : (
              <p className="text-foreground-muted">No address</p>
            )}
            {order.shippingMethod && (
              <p className="text-foreground-muted text-xs mt-2">{order.shippingMethod}</p>
            )}
          </CardContent>
        </Card>
      </div>

      <Card>
        <CardHeader><CardTitle>Items</CardTitle></CardHeader>
        <CardContent>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Product</TableHead>
                <TableHead>Variant</TableHead>
                <TableHead className="text-right">Qty</TableHead>
                <TableHead className="text-right">Price</TableHead>
                <TableHead className="text-right">Total</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {order.items.map((item) => (
                <TableRow key={item.id}>
                  <TableCell>{item.title}</TableCell>
                  <TableCell>{item.variant}</TableCell>
                  <TableCell className="text-right">{item.quantity}</TableCell>
                  <TableCell className="text-right">{formatCurrency(item.unitPrice)}</TableCell>
                  <TableCell className="text-right">{formatCurrency(item.totalPrice)}</TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </CardContent>
      </Card>

      <Card>
        <CardHeader><CardTitle>Summary</CardTitle></CardHeader>
        <CardContent>
          <div className="space-y-1 text-sm max-w-xs ml-auto">
            <div className="flex justify-between">
              <span className="text-foreground-muted">Subtotal</span>
              <span>{formatCurrency(order.subtotalAmount)}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-foreground-muted">Shipping</span>
              <span>{formatCurrency(order.shippingAmount)}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-foreground-muted">Tax</span>
              <span>{formatCurrency(order.taxAmount)}</span>
            </div>
            {order.discountAmount > 0 && (
              <div className="flex justify-between">
                <span className="text-foreground-muted">Discount</span>
                <span>-{formatCurrency(order.discountAmount)}</span>
              </div>
            )}
            <div className="flex justify-between font-semibold border-t pt-1 mt-1">
              <span>Total</span>
              <span>{formatCurrency(order.totalAmount)}</span>
            </div>
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader><CardTitle>Status History</CardTitle></CardHeader>
        <CardContent>
          {order.statusHistory.length === 0 ? (
            <p className="text-foreground-muted text-sm">No history yet.</p>
          ) : (
            <div className="space-y-3">
              {order.statusHistory.map((h) => (
                <div key={h.id} className="flex items-start gap-3 text-sm">
                  <div className="mt-1.5 h-2 w-2 rounded-full bg-foreground-muted shrink-0" />
                  <div>
                    <div className="flex items-center gap-2">
                      <OrderStatusBadge status={h.status} />
                      <span className="text-foreground-muted text-xs">{formatDate(h.createdAt)}</span>
                    </div>
                    {h.note && <p className="text-foreground-muted mt-0.5">{h.note}</p>}
                  </div>
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
