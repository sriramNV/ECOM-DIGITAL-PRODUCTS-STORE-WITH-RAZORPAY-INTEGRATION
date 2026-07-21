import crypto from "crypto";
import { redis } from "./redis";
import { prisma } from "./prisma";
import { logger } from "./logger";

const COUNTER_KEY = "order:counter";

export async function generateOrderNumber(): Promise<string> {
  try {
    const exists = await redis.exists(COUNTER_KEY);
    if (!exists) {
      await redis.set(COUNTER_KEY, 100000);
    }
    const count = await redis.incr(COUNTER_KEY);
    return `POD-${String(count).padStart(6, "0")}`;
  } catch (error) {
    logger.warn({ error }, "Redis unavailable for order counter, using DB fallback");
    const result = await prisma.$queryRaw<[{ nextval: bigint }]>`SELECT nextval('order_number_seq') AS nextval`.catch(() => null);
    if (result) {
      return `POD-${String(Number(result[0].nextval)).padStart(6, "0")}`;
    }
    const ts = Date.now().toString(36).toUpperCase();
    const rand = crypto.randomBytes(3).toString("hex").toUpperCase();
    return `POD-${ts}${rand}`;
  }
}
