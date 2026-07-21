export function calculateSubtotal(items: Array<{ unitPrice: number; quantity: number }>): number {
  return items.reduce((sum, item) => sum + item.unitPrice * item.quantity, 0);
}

export function calculateTax(subtotal: number, rate: number = 18): number {
  return Math.round((subtotal * rate) / 100);
}

export function calculateTotal(
  subtotal: number,
  shipping: number = 0,
  tax: number = 0,
  discount: number = 0,
): number {
  return Math.max(0, subtotal + shipping + tax - discount);
}

export function calculateShipping(subtotal: number, freeThreshold: number = 999): number {
  if (subtotal >= freeThreshold) return 0;
  return 99;
}
