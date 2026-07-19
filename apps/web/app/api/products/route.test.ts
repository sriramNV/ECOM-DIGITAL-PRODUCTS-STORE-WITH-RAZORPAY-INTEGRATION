import { describe, it, expect } from "vitest";

describe("GET /api/products", () => {
  it("returns 200 with paginated response", async () => {
    const res = await fetch("http://localhost:3000/api/products?page=1&limit=10");
    expect(res.status).toBe(200);
    const body = await res.json();
    expect(body).toHaveProperty("items");
    expect(body).toHaveProperty("total");
    expect(body).toHaveProperty("page");
  });

  it("returns 422 for invalid params", async () => {
    const res = await fetch("http://localhost:3000/api/products?page=-1");
    expect(res.status).toBe(422);
  });
});
