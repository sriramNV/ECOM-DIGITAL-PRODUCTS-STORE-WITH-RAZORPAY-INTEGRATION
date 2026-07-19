import { NextRequest, NextResponse } from "next/server";
import { orderRepo } from "@/lib/repositories/order-repo";
import { fulfillmentService } from "@/lib/services/fulfillment-service";

export async function GET(
  _request: NextRequest,
  { params }: { params: { id: string } }
) {
  const order = await orderRepo.getById(params.id);
  if (!order) {
    return NextResponse.json({ error: "Order not found" }, { status: 404 });
  }
  return NextResponse.json(order);
}

export async function PATCH(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  const { action } = await request.json();

  const order = await orderRepo.getById(params.id);
  if (!order) {
    return NextResponse.json({ error: "Order not found" }, { status: 404 });
  }

  switch (action) {
    case "submit_to_printify":
      if (order.status !== "PAID") {
        return NextResponse.json({ error: "Order must be PAID to submit to Printify" }, { status: 400 });
      }
      await fulfillmentService.submitOrder(params.id);
      break;
    case "cancel":
      if (!["PAID", "PROCESSING", "PRINTING"].includes(order.status)) {
        return NextResponse.json({ error: "Order cannot be cancelled in current status" }, { status: 400 });
      }
      await orderRepo.updateStatus(params.id, "CANCELLED");
      break;
    case "mark_delivered":
      if (order.status !== "SHIPPED") {
        return NextResponse.json({ error: "Order must be SHIPPED to mark delivered" }, { status: 400 });
      }
      await orderRepo.updateStatus(params.id, "DELIVERED");
      break;
    default:
      return NextResponse.json({ error: "Invalid action" }, { status: 400 });
  }

  return NextResponse.json({ success: true });
}
