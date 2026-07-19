import { NextRequest, NextResponse } from "next/server";
import { redis } from "@/lib/redis";
import { fulfillmentService } from "@/lib/services/fulfillment-service";
import { logger } from "@/lib/logger";

export async function POST(request: NextRequest) {
  const body = await request.text();
  const signature = request.headers.get("x-printify-signature") ?? "";

  try {
    const event = JSON.parse(body);
    const eventId = `${event.event}:${event.data?.order_id ?? Date.now()}`;

    const processed = await redis.get(`printify-webhook:${eventId}`);
    if (processed) {
      return NextResponse.json({ status: "already_processed" });
    }

    await fulfillmentService.handleWebhook(event, signature, body);

    await redis.set(`printify-webhook:${eventId}`, "1", { EX: 86400 });

    return NextResponse.json({ status: "ok" });
  } catch (error) {
    logger.error({ error }, "Printify webhook processing failed");
    return NextResponse.json({ status: "error" }, { status: 500 });
  }
}
