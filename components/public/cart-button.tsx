"use client";
import Link from "next/link";
import { ShoppingCart } from "lucide-react";
import { useCartStore } from "@/features/cart/store";
import { useCartHydration } from "@/features/cart/use-cart-hydration";

export function CartButton() {
  const hydrated = useCartHydration();
  const count = useCartStore((state) => state.items.reduce((sum, item) => sum + item.quantity, 0));
  return (
    <Link href="/korpa" aria-label={`Korpa, ${hydrated ? count : 0} artikala`} className="relative grid size-14 place-items-center rounded-full bg-white text-black shadow-[0_8px_30px_rgba(0,0,0,.08)] transition hover:-translate-y-0.5">
      <ShoppingCart aria-hidden size={25} strokeWidth={1.9} />
      {hydrated && count > 0 ? <span className="absolute -right-1 -top-1 grid size-6 place-items-center rounded-full bg-black text-xs font-bold text-white">{count}</span> : null}
    </Link>
  );
}
