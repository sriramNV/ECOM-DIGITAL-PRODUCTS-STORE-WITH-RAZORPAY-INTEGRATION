import { describe, it, expect, beforeEach } from "vitest";
import { useCartStore } from "@/stores/cart-store";

describe("cartStore", () => {
  beforeEach(() => {
    useCartStore.setState({ items: [] });
  });

  it("adds item to empty cart", () => {
    useCartStore.getState().addItem({
      id: "p-v1", productId: "p1", variantId: "v1",
      title: "Test", image: "", price: 499, quantity: 1,
      size: "M", color: "Black", slug: "test",
    });
    expect(useCartStore.getState().items).toHaveLength(1);
  });

  it("increments quantity for duplicate item", () => {
    const item = { id: "p-v1", productId: "p1", variantId: "v1", title: "Test", image: "", price: 499, quantity: 1, size: "M", color: "Black", slug: "test" };
    useCartStore.getState().addItem(item);
    useCartStore.getState().addItem(item);
    expect(useCartStore.getState().items[0].quantity).toBe(2);
  });

  it("removes item", () => {
    useCartStore.getState().addItem({ id: "p-v1", productId: "p1", variantId: "v1", title: "Test", image: "", price: 499, quantity: 1, size: "M", color: "Black", slug: "test" });
    useCartStore.getState().removeItem("p-v1");
    expect(useCartStore.getState().items).toHaveLength(0);
  });
});
