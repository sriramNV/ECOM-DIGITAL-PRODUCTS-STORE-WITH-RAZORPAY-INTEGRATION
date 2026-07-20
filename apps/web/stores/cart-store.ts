import { create } from "zustand";
import { persist } from "zustand/middleware";
import type { CartItem } from "@/types";

// Cart item IDs use the format `${productId}::${variantId}` (double colon separator)
// to prevent collision between product IDs and variant IDs.

type CartStore = {
  items: CartItem[];
  addItem: (item: CartItem) => void;
  removeItem: (id: string) => void;
  updateQuantity: (id: string, quantity: number) => void;
  clearCart: () => void;
  setItems: (items: CartItem[]) => void;
};

export const useCartStore = create<CartStore>()(
  persist(
    (set, get) => ({
      items: [],
      addItem: (item) => {
        const existing = get().items.find((i) => i.id === item.id);
        if (existing) {
          set({
            items: get().items.map((i) =>
              i.id === item.id ? { ...i, quantity: Math.min(i.quantity + 1, 10) } : i,
            ),
          });
        } else {
          set({ items: [...get().items, { ...item, quantity: 1 }] });
        }
      },
      removeItem: (id) => set({ items: get().items.filter((i) => i.id !== id) }),
      updateQuantity: (id, quantity) =>
        set({
          items: quantity <= 0
            ? get().items.filter((i) => i.id !== id)
            : get().items.map((i) => (i.id === id ? { ...i, quantity: Math.min(quantity, 10) } : i)),
        }),
      clearCart: () => set({ items: [] }),
      setItems: (items) => set({ items }),
    }),
    {
      name: "pod-cart",
      version: 2,
      migrate: (persistedState: any, version: number) => {
        if (version < 2) {
          return { items: [] };
        }
        return persistedState as CartStore;
      },
    },
  ),
);
