"use client";

import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { AnimatePresence, motion, useReducedMotion } from "framer-motion";
import { ChevronLeft, ChevronRight } from "lucide-react";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import { CategorySelector } from "@/components/public/category-selector";
import { FloatingAddBar } from "@/components/public/floating-add-bar";
import { ProductImage } from "@/components/shared/product-image";
import { useCartStore } from "@/features/cart/store";
import { formatMoney } from "@/lib/money";
import type { CatalogData } from "@/types/domain";

export function CatalogExperience({ catalog, initialCategory }: { catalog: CatalogData; initialCategory?: string }) {
  const router = useRouter();
  const reduceMotion = useReducedMotion();
  const category = catalog.categories.find((item) => item.slug === initialCategory) ?? catalog.categories[0];
  const [activeCategoryId, setActiveCategoryId] = useState(category?.id ?? "");
  const [productIndex, setProductIndex] = useState(0);
  const [direction, setDirection] = useState(1);
  const [quantity, setQuantity] = useState(1);
  const add = useCartStore((state) => state.add);
  const pointerStart = useRef<{ x: number; y: number } | null>(null);

  const products = useMemo(() => catalog.products.filter((item) => item.category_id === activeCategoryId), [catalog.products, activeCategoryId]);
  const product = products[productIndex] ?? products[0];

  const go = useCallback((next: number) => {
    if (!products.length) return;
    setDirection(next > productIndex ? 1 : -1);
    setProductIndex((next + products.length) % products.length);
    setQuantity(1);
  }, [productIndex, products.length]);

  useEffect(() => {
    const onKey = (event: KeyboardEvent) => {
      if (event.key === "ArrowRight") go(productIndex + 1);
      if (event.key === "ArrowLeft") go(productIndex - 1);
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [go, productIndex]);

  if (!category || !product) {
    return <div className="mx-auto mt-20 max-w-md px-6 text-center"><h1 className="text-2xl font-bold">Katalog je trenutno prazan</h1><p className="mt-2 text-neutral-500">Pokušaj ponovo malo kasnije.</p></div>;
  }

  const activeCategory = catalog.categories.find((item) => item.id === activeCategoryId) ?? category;
  const changeCategory = (next: typeof activeCategory) => {
    setActiveCategoryId(next.id); setProductIndex(0); setQuantity(1);
    router.replace(`/?category=${next.slug}`, { scroll: false });
  };
  const onPointerUp = (event: React.PointerEvent) => {
    const start = pointerStart.current; pointerStart.current = null;
    if (!start) return;
    const dx = event.clientX - start.x; const dy = event.clientY - start.y;
    if (Math.abs(dx) < 48 || Math.abs(dx) < Math.abs(dy) * 1.4) return;
    go(productIndex + (dx < 0 ? 1 : -1));
  };
  const addToCart = () => {
    if (!product.is_available) return;
    add(product, quantity);
    toast.success(`${quantity} × ${product.name} je dodato u korpu.`);
  };

  return (
    <main className="pb-40 sm:pb-44">
      {!catalog.orderingEnabled ? <div role="status" className="mx-auto mt-3 max-w-xl rounded-2xl bg-amber-50 px-4 py-3 text-center text-sm font-semibold text-amber-950">Online poručivanje je trenutno pauzirano.</div> : null}
      <CategorySelector categories={catalog.categories} activeId={activeCategoryId} onChange={changeCategory} />
      <section aria-label={`${activeCategory.name}: ${product.name}`} className="relative mx-auto flex min-h-[500px] w-full max-w-[820px] flex-col items-center justify-start overflow-hidden px-5 sm:min-h-[600px]">
        <div aria-hidden className="pointer-events-none absolute left-1/2 top-20 h-[360px] w-[360px] -translate-x-1/2 rounded-full blur-3xl transition-colors duration-500 sm:h-[440px] sm:w-[440px]" style={{ backgroundColor: product.accent_color, opacity: .68 }} />
        <button type="button" aria-label="Prethodni proizvod" onClick={() => go(productIndex - 1)} className="touch-target absolute left-5 top-48 z-20 hidden place-items-center rounded-full bg-white/80 shadow sm:grid"><ChevronLeft /></button>
        <button type="button" aria-label="Sledeći proizvod" onClick={() => go(productIndex + 1)} className="touch-target absolute right-5 top-48 z-20 hidden place-items-center rounded-full bg-white/80 shadow sm:grid"><ChevronRight /></button>
        <div className="relative z-10 h-[330px] w-[255px] cursor-grab touch-pan-y select-none active:cursor-grabbing sm:h-[430px] sm:w-[330px]" onPointerDown={(event) => { pointerStart.current = { x: event.clientX, y: event.clientY }; event.currentTarget.setPointerCapture(event.pointerId); }} onPointerUp={onPointerUp} onPointerCancel={() => { pointerStart.current = null; }}>
          <AnimatePresence mode="popLayout" initial={false} custom={direction}>
            <motion.div key={product.id} custom={direction} initial={reduceMotion ? false : { opacity: 0, x: direction * 42 }} animate={{ opacity: product.is_available ? 1 : .46, x: 0 }} exit={reduceMotion ? { opacity: 0 } : { opacity: 0, x: direction * -42 }} transition={{ duration: .24, ease: "easeOut" }} className="absolute inset-0 can-shadow">
              <ProductImage src={product.image_url} alt={product.name} />
            </motion.div>
          </AnimatePresence>
        </div>
        <AnimatePresence mode="wait" initial={false}>
          <motion.div key={`${product.id}-copy`} initial={reduceMotion ? false : { opacity: 0, y: 7 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -5 }} transition={{ duration: .18 }} className="relative z-10 -mt-2 max-w-xl text-center">
            <h1 className="text-[clamp(1.8rem,7vw,2.75rem)] font-bold leading-tight tracking-[-.045em]">{product.name}</h1>
            <p className="mx-auto mt-2 max-w-lg text-sm font-medium leading-relaxed text-neutral-500 sm:text-base">{product.ingredients}</p>
            <p className="mt-3 text-2xl font-bold tracking-[-.03em]">{formatMoney(product.price)}</p>
            {!product.is_available ? <p className="mt-2 font-bold text-red-700">Trenutno je rasprodato</p> : null}
          </motion.div>
        </AnimatePresence>
        <div className="relative z-10 mt-5 flex items-center gap-3" aria-label={`Proizvod ${productIndex + 1} od ${products.length}`}>
          {products.map((item, index) => <button key={item.id} type="button" onClick={() => go(index)} aria-label={`Prikaži ${item.name}`} aria-current={index === productIndex} className={`touch-target relative grid place-items-center after:block after:size-2.5 after:rounded-full after:transition ${index === productIndex ? "after:bg-neutral-900" : "after:bg-neutral-300"}`} />)}
        </div>
      </section>
      <FloatingAddBar quantity={quantity} max={product.max_quantity_per_order} disabled={!catalog.orderingEnabled || !product.is_available} onChange={setQuantity} onAdd={addToCart} />
    </main>
  );
}
