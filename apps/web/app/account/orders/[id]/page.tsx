import { auth } from "@/lib/auth";
import { prisma } from "@/lib/db";
import { formatCurrency, formatDate } from "@/lib/utils";
import { DownloadButton } from "@/components/account/download-button";
import { notFound } from "next/navigation";

export default async function OrderDetailPage(props: { params: Promise<{ id: string }> }) {
  const params = await props.params;
  const session = await auth();
  if (!session?.user) return null;

  const order = await prisma.order.findFirst({
    where: { id: params.id, userId: session.user.id },
    include: {
      items: { include: { product: true } },
      payments: true,
      statusHistory: { orderBy: { createdAt: "desc" } },
    },
  });

  if (!order) notFound();

  return (
    <div className="mx-auto max-w-3xl px-4 py-10">
      <h1 className="mb-2 text-3xl font-bold">Order {order.orderNumber}</h1>
      <p className="mb-8 text-sm text-muted-foreground">Placed on {formatDate(order.createdAt)}</p>

      <div className="space-y-4">
        {order.items.map((item) => (
          <div key={item.id} className="flex items-center justify-between rounded-xl border border-border p-4">
            <div>
              <p className="font-medium">{item.title}</p>
              <p className="text-sm text-muted-foreground">Qty: {item.quantity} × {formatCurrency(Number(item.unitPrice))}</p>
            </div>
            <div className="flex items-center gap-4">
              <span className="font-semibold">{formatCurrency(Number(item.totalPrice))}</span>
              {order.status === "PAID" || order.status === "COMPLETED" ? (
                <DownloadButton orderId={order.id} itemId={item.id} />
              ) : null}
            </div>
          </div>
        ))}
      </div>

      <div className="mt-8 border-t border-border pt-6">
        <div className="flex justify-between font-bold">
          <span>Total</span>
          <span>{formatCurrency(Number(order.totalAmount))}</span>
        </div>
        {order.payments.length > 0 && (
          <p className="mt-2 text-sm text-muted-foreground">Paid via {order.payments[0].method || "Razorpay"}</p>
        )}
      </div>
    </div>
  );
}
