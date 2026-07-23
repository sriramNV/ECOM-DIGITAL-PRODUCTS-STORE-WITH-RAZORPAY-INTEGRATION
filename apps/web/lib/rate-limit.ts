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
    return { allowed: true, remaining: maxRequests };
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
  } catch {
    return { allowed: true, remaining: maxRequests };
  }
}
