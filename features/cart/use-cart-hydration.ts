"use client";

import { useEffect } from "react";
import { useCartStore } from "@/features/cart/store";

export function useCartHydration() {
  const hydrated = useCartStore((state) => state.hydrated);
  const setHydrated = useCartStore((state) => state.setHydrated);
  useEffect(() => {
    void Promise.resolve(useCartStore.persist.rehydrate()).then(() => setHydrated(true));
  }, [setHydrated]);
  return hydrated;
}
