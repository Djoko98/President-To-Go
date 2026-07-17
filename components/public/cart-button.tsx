"use client";
import Link from "next/link";
import { ShoppingCart } from "lucide-react";
import { useCartStore } from "@/features/cart/store";
import { useCartHydration } from "@/features/cart/use-cart-hydration";

export function CartButton() {
  const hydrated = useCartHydration();
  const count = useCartStore((state) => state.items.reduce((sum, item) => sum + item.quantity, 0));
  return (
    <Link href="/korpa" aria-label={`Korpa, ${hydrated ? count : 0} artikala`} className="relative grid size-12 shrink-0 place-items-center rounded-full bg-black text-white transition-colors hover:bg-neutral-800">
      <ShoppingCart aria-hidden size={22} strokeWidth={2} />
      {hydrated && count > 0 ? <span className="absolute -right-1 -top-1 grid size-5 place-items-center rounded-full border-2 border-black bg-white text-[10px] font-extrabold leading-none text-black">{count}</span> : null}
    </Link>
  );
}
