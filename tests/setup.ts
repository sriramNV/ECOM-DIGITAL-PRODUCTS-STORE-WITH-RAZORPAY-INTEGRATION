import { beforeAll, afterAll } from "vitest";

beforeAll(() => {
  process.env.DATABASE_URL = "postgresql://pod:password@localhost:5432/pod_test";
  process.env.REDIS_URL = "redis://localhost:6379";
  process.env.LOG_LEVEL = "silent";
});

afterAll(() => {
  // Cleanup
});
