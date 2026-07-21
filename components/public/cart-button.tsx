"use client";
import { useEffect } from "react";
import Link from "next/link";
import { ShoppingCart } from "lucide-react";
import { motion, useAnimationControls } from "framer-motion";
import { useCartStore } from "@/features/cart/store";
import { useCartHydration } from "@/features/cart/use-cart-hydration";

export function CartButton() {
  const hydrated = useCartHydration();
  const count = useCartStore((state) => state.items.reduce((sum, item) => sum + item.quantity, 0));
  const controls = useAnimationControls();
  useEffect(() => {
    const bump = () => void controls.start({ scale: [1, 1.3, 0.88, 1.14, 1], rotate: [0, -13, 11, -6, 0], transition: { duration: 0.6, ease: "easeInOut" } });
    window.addEventListener("cart:bump", bump);
    return () => window.removeEventListener("cart:bump", bump);
  }, [controls]);
  return (
    <motion.div animate={controls} className="relative shrink-0">
      <Link id="cart-fly-target" href="/korpa" aria-label={`Korpa, ${hydrated ? count : 0} artikala`} className="relative grid size-12 place-items-center rounded-full bg-black text-white transition-colors hover:bg-neutral-800">
        <ShoppingCart aria-hidden size={22} strokeWidth={2} />
        {hydrated && count > 0 ? <span className="absolute -right-1 -top-1 grid size-5 place-items-center rounded-full border-2 border-black bg-white text-[10px] font-extrabold leading-none text-black">{count}</span> : null}
      </Link>
    </motion.div>
  );
}
