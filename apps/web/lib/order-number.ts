import { redis } from "./redis";
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
    logger.warn({ error }, "Redis unavailable for order counter, using fallback");
    const ts = Date.now().toString(36).toUpperCase();
    const rand = Math.random().toString(36).substring(2, 6).toUpperCase();
    return `POD-${ts}${rand}`;
  }
}
