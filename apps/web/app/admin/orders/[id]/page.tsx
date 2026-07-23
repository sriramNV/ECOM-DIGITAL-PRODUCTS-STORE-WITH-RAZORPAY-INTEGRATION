import { prisma } from "@/lib/db";
import { formatCurrency, formatDate } from "@/lib/utils";
import { OrderStatusUpdate } from "@/components/admin/order-status-update";
import { notFound } from "next/navigation";

export default async function AdminOrderDetailPage(props: { params: Promise<{ id: string }> }) {
  const params = await props.params;
  const order = await prisma.order.findUnique({
    where: { id: params.id },
    include: { user: true, items: true, payments: true, statusHistory: { orderBy: { createdAt: "desc" } } },
  });

  if (!order) notFound();

  return (
    <div className="max-w-3xl">
      <h1 className="mb-2 text-3xl font-bold">Order {order.orderNumber}</h1>
      <p className="mb-8 text-sm text-muted-foreground">{formatDate(order.createdAt)} by {order.user.email}</p>

      <div className="mb-8 flex items-center gap-4">
        <span className="text-sm text-muted-foreground">Status:</span>
        <OrderStatusUpdate orderId={order.id} currentStatus={order.status} />
      </div>

      <div className="mb-8 space-y-3">
        <h2 className="text-lg font-semibold">Items</h2>
        {order.items.map((item) => (
          <div key={item.id} className="flex justify-between rounded-xl border border-border p-4">
            <span>{item.title} × {item.quantity}</span>
            <span>{formatCurrency(Number(item.totalPrice))}</span>
          </div>
        ))}
        <div className="flex justify-between font-bold border-t border-border pt-3">
          <span>Total</span>
          <span>{formatCurrency(Number(order.totalAmount))}</span>
        </div>
      </div>

      {order.payments.length > 0 && (
        <div className="mb-8">
          <h2 className="mb-3 text-lg font-semibold">Payments</h2>
          {order.payments.map((p) => (
            <div key={p.id} className="rounded-xl border border-border p-4 text-sm">
              <p>ID: {p.id}</p>
              <p>Method: {p.method || "Razorpay"}</p>
              <p>Status: {p.status}</p>
              {p.razorpayPaymentId && <p>Razorpay: {p.razorpayPaymentId}</p>}
            </div>
          ))}
        </div>
      )}

      {order.statusHistory.length > 0 && (
        <div>
          <h2 className="mb-3 text-lg font-semibold">Status History</h2>
          <div className="space-y-2">
            {order.statusHistory.map((h) => (
              <div key={h.id} className="flex justify-between rounded-lg border border-border p-3 text-sm">
                <span>{h.status}</span>
                <span className="text-muted-foreground">{formatDate(h.createdAt)}</span>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
