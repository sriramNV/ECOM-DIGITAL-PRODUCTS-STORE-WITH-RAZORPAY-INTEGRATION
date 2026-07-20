import { NextRequest, NextResponse } from "next/server";
import { orderRepo } from "@/lib/repositories/order-repo";
import { fulfillmentService } from "@/lib/services/fulfillment-service";
import { adminGuard } from "@/lib/admin-guard";
import { handleApiError } from "@/lib/api-error-handler";
import { validateBody, adminOrderActionSchema } from "@/lib/schemas";

export async function GET(
  _request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const guard = await adminGuard();
    if (guard) return guard;
    const { id } = await params;
    const order = await orderRepo.getById(id);
    if (!order) {
      return NextResponse.json({ error: "Order not found" }, { status: 404 });
    }
    return NextResponse.json(order);
  } catch (error) {
    return handleApiError(error, "admin/orders/[id] GET");
  }
}

export async function PATCH(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const guard = await adminGuard();
    if (guard) return guard;
    const { id } = await params;
    const { data, error: validationError } = validateBody(adminOrderActionSchema, await request.json());
    if (validationError) return validationError;

    const order = await orderRepo.getById(id);
    if (!order) {
      return NextResponse.json({ error: "Order not found" }, { status: 404 });
    }

    switch (data!.action) {
      case "submit_to_printify":
        if (order.status !== "PAID") {
          return NextResponse.json({ error: "Order must be PAID to submit to Printify" }, { status: 400 });
        }
        await fulfillmentService.submitOrder(id);
        break;
      case "cancel":
        if (!["PAID", "PROCESSING", "PRINTING"].includes(order.status)) {
          return NextResponse.json({ error: "Order cannot be cancelled in current status" }, { status: 400 });
        }
        await orderRepo.updateStatus(id, "CANCELLED");
        break;
      case "mark_delivered":
        if (order.status !== "SHIPPED") {
          return NextResponse.json({ error: "Order must be SHIPPED to mark delivered" }, { status: 400 });
        }
        await orderRepo.updateStatus(id, "DELIVERED");
        break;
    }

    return NextResponse.json({ success: true });
  } catch (error) {
    return handleApiError(error, "admin/orders/[id] PATCH");
  }
}
