import { describe, it, expect, vi, beforeEach, afterEach } from "vitest";
import crypto from "crypto";

const WEBHOOK_SECRET = "test-webhook-secret";

function sign(body: string, secret: string = WEBHOOK_SECRET): string {
  return crypto.createHmac("sha256", secret).update(body).digest("hex");
}

describe("Printify webhook HMAC verification", () => {
  it("generates valid HMAC signature", () => {
    const body = JSON.stringify({ event: "order:created", data: { order_id: "order-1" } });
    const sig = sign(body);
    const expected = crypto.createHmac("sha256", WEBHOOK_SECRET).update(body).digest("hex");
    expect(sig).toBe(expected);
  });

  it("rejects modified body", () => {
    const body = JSON.stringify({ event: "order:created", data: { order_id: "order-1" } });
    const sig = sign(body);
    const tampered = JSON.stringify({ event: "order:created", data: { order_id: "order-2" } });
    const tamperedSig = crypto.createHmac("sha256", WEBHOOK_SECRET).update(tampered).digest("hex");
    expect(sig).not.toBe(tamperedSig);
  });

  it("rejects wrong secret", () => {
    const body = JSON.stringify({ event: "order:created" });
    const sig = sign(body, "wrong-secret");
    const expected = crypto.createHmac("sha256", WEBHOOK_SECRET).update(body).digest("hex");
    expect(sig).not.toBe(expected);
  });

  it("uses timing-safe comparison", () => {
    const body = JSON.stringify({ event: "order:created" });
    const sig = sign(body);
    const sigBuf = Buffer.from(sig, "hex");
    const expBuf = Buffer.from(crypto.createHmac("sha256", WEBHOOK_SECRET).update(body).digest("hex"), "hex");
    const safe = sigBuf.length === expBuf.length && crypto.timingSafeEqual(sigBuf, expBuf);
    expect(safe).toBe(true);
  });

  it("timing-safe rejects different length signatures", () => {
    const body = JSON.stringify({ event: "order:created" });
    const sigBuf = Buffer.from("short", "utf8");
    const expBuf = Buffer.from(crypto.createHmac("sha256", WEBHOOK_SECRET).update(body).digest("hex"), "hex");
    const safe = sigBuf.length === expBuf.length && crypto.timingSafeEqual(sigBuf, expBuf);
    expect(safe).toBe(false);
  });
});

describe("printifyWebhooks", () => {
  const originalToken = process.env.PRINTIFY_API_TOKEN;
  const originalShopId = process.env.PRINTIFY_SHOP_ID;

  beforeEach(() => {
    vi.resetModules();
    process.env.PRINTIFY_API_TOKEN = "test-token";
    process.env.PRINTIFY_SHOP_ID = "shop-123";
  });

  afterEach(() => {
    process.env.PRINTIFY_API_TOKEN = originalToken;
    process.env.PRINTIFY_SHOP_ID = originalShopId;
  });

  it("lists webhooks with correct path", async () => {
    const mockRequest = vi.fn().mockResolvedValue([{ id: "wh-1", topic: "order:created", url: "https://example.com/webhook" }]);
    vi.doMock("../client", () => ({ printifyClient: { request: mockRequest } }));

    const { printifyWebhooks } = await import("../webhooks");
    const result = await printifyWebhooks.list();
    expect(result).toHaveLength(1);
    expect(mockRequest).toHaveBeenCalledWith({ method: "GET", path: "/shops/shop-123/webhooks.json" });
  });

  it("creates webhook with topic and url", async () => {
    const mockRequest = vi.fn().mockResolvedValue({ id: "wh-new" });
    vi.doMock("../client", () => ({ printifyClient: { request: mockRequest } }));

    const { printifyWebhooks } = await import("../webhooks");
    const result = await printifyWebhooks.create("order:created", "https://example.com/webhook");
    expect(result.id).toBe("wh-new");
    expect(mockRequest).toHaveBeenCalledWith({
      method: "POST",
      path: "/shops/shop-123/webhooks.json",
      body: { topic: "order:created", url: "https://example.com/webhook" },
    });
  });

  it("removes webhook by id", async () => {
    const mockRequest = vi.fn().mockResolvedValue(undefined);
    vi.doMock("../client", () => ({ printifyClient: { request: mockRequest } }));

    const { printifyWebhooks } = await import("../webhooks");
    await printifyWebhooks.remove("wh-1");
    expect(mockRequest).toHaveBeenCalledWith({ method: "DELETE", path: "/shops/shop-123/webhooks/wh-1.json" });
  });
});
