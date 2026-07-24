import { createClient } from "redis";

function createRedisClient() {
  try {
    const client = createClient({ url: process.env.REDIS_URL });
    client.connect().catch(() => {});
    return client;
  } catch {
    return null;
  }
}

const redis = createRedisClient();

export async function rateLimit(
  key: string,
  maxRequests: number,
  windowSeconds: number
): Promise<{ allowed: boolean; remaining: number }> {
  if (!redis) {
    console.error("Rate limit: Redis unavailable — failing closed");
    return { allowed: false, remaining: 0 };
  }

  const now = Date.now();
  const windowKey = `ratelimit:${key}:${Math.floor(now / (windowSeconds * 1000))}`;

  try {
    const count = await redis.incr(windowKey);
    if (count === 1) {
      await redis.expire(windowKey, windowSeconds);
    }
    return {
      allowed: count <= maxRequests,
      remaining: Math.max(0, maxRequests - count),
    };
  } catch (err) {
    console.error("Rate limit: Redis error — failing closed", err);
    return { allowed: false, remaining: 0 };
  }
}
