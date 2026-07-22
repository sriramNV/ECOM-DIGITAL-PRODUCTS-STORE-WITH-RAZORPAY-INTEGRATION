import { describe, it, expect, vi, beforeEach, afterEach } from "vitest";

describe("printifyOrders", () => {
  const originalShopId = process.env.PRINTIFY_SHOP_ID;

  beforeEach(() => {
    vi.resetModules();
  });

  afterEach(() => {
    process.env.PRINTIFY_SHOP_ID = originalShopId;
  });

  it("throws when SHOP_ID is not configured", async () => {
    delete process.env.PRINTIFY_SHOP_ID;
    const { printifyOrders } = await import("../orders");
    await expect(printifyOrders.submit({} as any)).rejects.toThrow("PRINTIFY_SHOP_ID");
  });

  it("throws when SHOP_ID is empty", async () => {
    process.env.PRINTIFY_SHOP_ID = "";
    const { printifyOrders } = await import("../orders");
    await expect(printifyOrders.submit({} as any)).rejects.toThrow("PRINTIFY_SHOP_ID");
  });

  it("submits order with correct shop ID", async () => {
    process.env.PRINTIFY_SHOP_ID = "shop-123";
    const mockRequest = vi.fn().mockResolvedValue({ id: "printify-order-1" });
    vi.doMock("../client", () => ({
      printifyClient: { request: mockRequest },
    }));

    const { printifyOrders } = await import("../orders");
    const result = await printifyOrders.submit({ external_id: "order-1", line_items: [], shipping_method: 1, address_to: {} as any });

    expect(result).toEqual({ id: "printify-order-1" });
    expect(mockRequest).toHaveBeenCalledWith({
      method: "POST",
      path: "/shops/shop-123/orders.json",
      body: { external_id: "order-1", line_items: [], shipping_method: 1, address_to: {} },
    });
  });

  it("gets order status with correct shop ID", async () => {
    process.env.PRINTIFY_SHOP_ID = "shop-123";
    const mockRequest = vi.fn().mockResolvedValue({ id: "printify-order-1", status: "pending" });
    vi.doMock("../client", () => ({
      printifyClient: { request: mockRequest },
    }));

    const { printifyOrders } = await import("../orders");
    const result = await printifyOrders.getStatus("printify-order-1");

    expect(result.status).toBe("pending");
    expect(mockRequest).toHaveBeenCalledWith({
      method: "GET",
      path: "/shops/shop-123/orders/printify-order-1.json",
    });
  });

  it("calculates shipping with correct shop ID", async () => {
    process.env.PRINTIFY_SHOP_ID = "shop-123";
    const mockRequest = vi.fn().mockResolvedValue({ standard: 500, express: 1500 });
    vi.doMock("../client", () => ({
      printifyClient: { request: mockRequest },
    }));

    const { printifyOrders } = await import("../orders");
    const result = await printifyOrders.calculateShipping(
      [{ product_id: "prod-1", variant_id: 123, quantity: 1 }],
      { country: "US" },
    );

    expect(result.standard).toBe(500);
    expect(mockRequest).toHaveBeenCalledWith({
      method: "POST",
      path: "/shops/shop-123/orders/shipping.json",
      body: { line_items: [{ product_id: "prod-1", variant_id: 123, quantity: 1 }], address_to: { country: "US" } },
    });
  });
});
