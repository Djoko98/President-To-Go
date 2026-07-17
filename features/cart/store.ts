"use client";

import { create } from "zustand";
import { persist } from "zustand/middleware";
import type { CartItem, Product } from "@/types/domain";

interface CartState {
  items: CartItem[];
  hydrated: boolean;
  add: (product: Product, quantity: number) => void;
  setQuantity: (productId: string, quantity: number) => void;
  remove: (productId: string) => void;
  clear: () => void;
  setHydrated: (value: boolean) => void;
}

export const useCartStore = create<CartState>()(persist(
  (set) => ({
    items: [], hydrated: false,
    add: (product, quantity) => set((state) => {
      const existing = state.items.find((item) => item.product.id === product.id);
      const nextQuantity = Math.min((existing?.quantity ?? 0) + quantity, product.max_quantity_per_order);
      return { items: existing ? state.items.map((item) => item.product.id === product.id ? { product, quantity: nextQuantity } : item) : [...state.items, { product, quantity: Math.min(quantity, product.max_quantity_per_order) }] };
    }),
    setQuantity: (productId, quantity) => set((state) => ({ items: state.items.flatMap((item) => item.product.id === productId ? quantity > 0 ? [{ ...item, quantity: Math.min(quantity, item.product.max_quantity_per_order) }] : [] : [item]) })),
    remove: (productId) => set((state) => ({ items: state.items.filter((item) => item.product.id !== productId) })),
    clear: () => set({ items: [] }),
    setHydrated: (hydrated) => set({ hydrated }),
  }),
  { name: "president-to-go-cart", partialize: (state) => ({ items: state.items }), skipHydration: true },
));
