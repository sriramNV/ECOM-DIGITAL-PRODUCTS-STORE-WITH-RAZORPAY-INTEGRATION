import { NextRequest, NextResponse } from "next/server";
import crypto from "crypto";
import { redis } from "@/lib/redis";
import { logger } from "@/lib/logger";
import { fulfillmentService } from "@/lib/services/fulfillment-service";
import { handleApiError } from "@/lib/api-error-handler";

const WEBHOOK_SECRET = process.env.PRINTIFY_WEBHOOK_SECRET!;

export async function POST(request: NextRequest) {
  try {
    const body = await request.text();
    const signature = request.headers.get("x-printify-signature");

    if (!WEBHOOK_SECRET || !signature) {
      return NextResponse.json({ error: "Invalid webhook config" }, { status: 401 });
    }

    const expected = crypto
      .createHmac("sha256", WEBHOOK_SECRET)
      .update(body)
      .digest("hex");

    const sigBuf = Buffer.from(signature, "hex");
    const expBuf = Buffer.from(expected, "hex");
    const safe = sigBuf.length === expBuf.length && crypto.timingSafeEqual(sigBuf, expBuf);
    if (!safe) {
      return NextResponse.json({ error: "Invalid signature" }, { status: 401 });
    }

    const event = JSON.parse(body);
    const orderId = event.data?.order_id;
    if (!orderId) {
      logger.warn({ event: event.event }, "Printify webhook missing order_id, skipping dedup");
    }
    const eventId = `${event.event}:${orderId ?? event.data?.external_id ?? Date.now()}`;

    const dedupKey = `printify-webhook:${eventId}`;
    const alreadyProcessed = await redis.set(dedupKey, "1", "EX", 86400, "NX");
    if (!alreadyProcessed) {
      return NextResponse.json({ status: "already_processed" });
    }

    await fulfillmentService.handleWebhook(event, signature, body);

    return NextResponse.json({ status: "ok" });
  } catch (error) {
    return handleApiError(error, "printify/webhooks POST");
  }
}
