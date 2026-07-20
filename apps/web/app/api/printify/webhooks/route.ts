import { NextRequest, NextResponse } from "next/server";
import crypto from "crypto";
import { redis } from "@/lib/redis";
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
    const eventId = `${event.event}:${event.data?.order_id ?? Date.now()}`;

    const processed = await redis.get(`printify-webhook:${eventId}`);
    if (processed) {
      return NextResponse.json({ status: "already_processed" });
    }

    await fulfillmentService.handleWebhook(event, signature, body);

    await redis.set(`printify-webhook:${eventId}`, "1", "EX", 86400);

    return NextResponse.json({ status: "ok" });
  } catch (error) {
    return handleApiError(error, "printify/webhooks POST");
  }
}
