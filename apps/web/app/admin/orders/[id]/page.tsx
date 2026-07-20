import { OrderDetail } from "@/components/admin/orders/order-detail";
import { notFound } from "next/navigation";

export default async function AdminOrderDetailPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;

  try {
    const res = await fetch(`${process.env.NEXT_PUBLIC_APP_URL ?? "http://localhost:3000"}/api/admin/orders/${id}`, { cache: "no-store" });
    if (res.status === 404) notFound();
  } catch {
    // OrderDetail client component handles error state
  }

  return <OrderDetail orderId={id} />;
}
