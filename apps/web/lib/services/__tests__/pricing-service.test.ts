import { describe, it, expect } from "vitest";
import { calculateSubtotal, calculateTax, calculateTotal, calculateShipping } from "../pricing-service";

describe("pricingService", () => {
  it("calculates subtotal correctly", () => {
    expect(calculateSubtotal([{ unitPrice: 699, quantity: 2 }, { unitPrice: 499, quantity: 1 }])).toBe(1897);
  });

  it("calculates 18% GST", () => {
    expect(calculateTax(1000)).toBe(180);
  });

  it("applies free shipping above threshold", () => {
    expect(calculateShipping(1000)).toBe(0);
    expect(calculateShipping(500)).toBe(99);
  });

  it("calculates total with all components", () => {
    expect(calculateTotal(1000, 99, 180, 0)).toBe(1279);
  });
});
