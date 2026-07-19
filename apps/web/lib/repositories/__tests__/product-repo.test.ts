import { describe, it, expect } from "vitest";
import { productRepo } from "../product-repo";

describe("productRepo", () => {
  it("list returns paginated results", async () => {
    const result = await productRepo.list({ page: 1, limit: 10 });
    expect(Array.isArray(result.items)).toBe(true);
    expect(result.page).toBe(1);
    expect(result.totalPages).toBeGreaterThanOrEqual(0);
  });

  it("getBySlug returns null for non-existent product", async () => {
    const result = await productRepo.getBySlug("non-existent-product");
    expect(result).toBeNull();
  });
});
