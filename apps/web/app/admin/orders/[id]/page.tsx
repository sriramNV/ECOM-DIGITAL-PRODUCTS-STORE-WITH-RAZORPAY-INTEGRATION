import { OrderDetail } from "@/components/admin/orders/order-detail";

export default function AdminOrderDetailPage({ params }: { params: { id: string } }) {
  return <OrderDetail orderId={params.id} />;
}
