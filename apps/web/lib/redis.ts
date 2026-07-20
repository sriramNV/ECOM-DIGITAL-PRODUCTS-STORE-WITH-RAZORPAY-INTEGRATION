import Redis from "ioredis";
import { logger } from "@/lib/logger";

const globalForRedis = globalThis as unknown as { redis: Redis };

export const redis = globalForRedis.redis ?? new Redis(process.env.REDIS_URL ?? "redis://localhost:6379");

redis.on("error", (err) => logger.error({ err }, "Redis connection error"));

if (process.env.NODE_ENV !== "production") globalForRedis.redis = redis;
