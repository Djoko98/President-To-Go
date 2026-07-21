"use client";

import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { AnimatePresence, motion, useReducedMotion } from "framer-motion";
import { Clock3 } from "lucide-react";
import { useRouter } from "next/navigation";
import { CategorySelector } from "@/components/public/category-selector";
import { FloatingAddBar } from "@/components/public/floating-add-bar";
import { ProductImage } from "@/components/shared/product-image";
import { useCartStore } from "@/features/cart/store";
import { PRODUCT_FALLBACK_IMAGE } from "@/lib/catalog-fallback";
import { formatMoney } from "@/lib/money";
import type { CatalogData } from "@/types/domain";

type CartFlight = { id: number; src: string; x: number; y: number; w: number; h: number; dx: number; dy: number; scale: number };

const canVariants = {
  enter: (direction: number) => ({ opacity: 0, x: direction * 92, scale: 0.82, rotate: direction * 8 }),
  center: { opacity: 1, x: 0, scale: 1, rotate: 0 },
  exit: (direction: number) => ({ opacity: 0, x: direction * -92, scale: 0.85, rotate: direction * -6 }),
};

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
  const imageRef = useRef<HTMLDivElement>(null);
  const [flights, setFlights] = useState<CartFlight[]>([]);

  const products = useMemo(() => catalog.products.filter((item) => item.category_id === activeCategoryId), [catalog.products, activeCategoryId]);
  const product = products[productIndex] ?? products[0];
  const prevProduct = products.length > 1 ? products[(productIndex - 1 + products.length) % products.length] : undefined;
  const nextProduct = products.length > 1 ? products[(productIndex + 1) % products.length] : undefined;
  const ingredients = useMemo(() => (product?.ingredients ?? "").split(",").map((item) => item.trim()).filter(Boolean), [product?.ingredients]);

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

  if (!category) {
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
    if (!product || !product.is_available) return;
    add(product, quantity);
    const source = imageRef.current?.getBoundingClientRect();
    const target = document.getElementById("cart-fly-target")?.getBoundingClientRect();
    if (!source || !target || reduceMotion) { window.dispatchEvent(new CustomEvent("cart:bump")); return; }
    setFlights((prev) => [...prev, {
      id: Date.now() + Math.random(),
      src: product.image_url || PRODUCT_FALLBACK_IMAGE,
      x: source.left, y: source.top, w: source.width, h: source.height,
      dx: (target.left + target.width / 2) - (source.left + source.width / 2),
      dy: (target.top + target.height / 2) - (source.top + source.height / 2),
      scale: Math.max(0.12, Math.min(1, 46 / source.width)),
    }]);
  };

  return (
    <main className="home-catalog relative overflow-hidden">
      <CategorySelector categories={catalog.categories} activeId={activeCategoryId} onChange={changeCategory} />
      {!product ? (
        <section className="catalog-product-stage relative mx-auto grid w-full max-w-[820px] place-items-center px-5">
          <div className="text-center">
            <h1 className="text-xl font-bold sm:text-2xl">Nema proizvoda u ovoj kategoriji</h1>
            <p className="mt-2 text-sm text-neutral-500">Izaberi drugu kategoriju iznad.</p>
          </div>
        </section>
      ) : (
        <section aria-label={`${activeCategory.name}: ${product.name}`} className="catalog-product-stage relative mx-auto flex w-full max-w-[820px] flex-col items-center justify-start px-5">
          <div aria-hidden className="pointer-events-none absolute left-1/2 top-[5%] z-0 -translate-x-1/2">
            <div className="catalog-product-glow rounded-full transition-all duration-700" style={{ background: `radial-gradient(circle at center, ${product.accent_color} 0%, ${product.accent_color} 22%, transparent 70%)`, opacity: 0.68 }} />
            <motion.div className="catalog-ring rounded-full border border-dashed" style={{ borderColor: product.accent_color }} animate={reduceMotion ? undefined : { rotate: 360 }} transition={{ repeat: Infinity, duration: 70, ease: "linear" }} />
          </div>
          <div aria-hidden className="catalog-ghost-name pointer-events-none absolute inset-x-0 z-0 flex justify-center">
            <AnimatePresence initial={false} custom={direction} mode="popLayout">
              <motion.span key={product.id} custom={direction} initial={reduceMotion ? false : { opacity: 0, x: direction * 130 }} animate={{ opacity: 0.17, x: 0 }} exit={reduceMotion ? { opacity: 0 } : { opacity: 0, x: direction * -130 }} transition={{ duration: 0.5, ease: "easeOut" }} style={{ color: product.accent_color }}>
                {product.name}
              </motion.span>
            </AnimatePresence>
          </div>
          {prevProduct ? (
            <button type="button" onClick={() => go(productIndex - 1)} aria-label={`Prethodni proizvod: ${prevProduct.name}`} className="catalog-peek catalog-peek-left">
              <motion.div key={prevProduct.id} initial={reduceMotion ? false : { opacity: 0, scale: 0.88 }} animate={{ opacity: 1, scale: 1 }} transition={{ duration: 0.3 }} className="relative h-full w-full">
                <ProductImage src={prevProduct.image_url} alt="" />
              </motion.div>
            </button>
          ) : null}
          {nextProduct ? (
            <button type="button" onClick={() => go(productIndex + 1)} aria-label={`Sledeći proizvod: ${nextProduct.name}`} className="catalog-peek catalog-peek-right">
              <motion.div key={nextProduct.id} initial={reduceMotion ? false : { opacity: 0, scale: 0.88 }} animate={{ opacity: 1, scale: 1 }} transition={{ duration: 0.3 }} className="relative h-full w-full">
                <ProductImage src={nextProduct.image_url} alt="" />
              </motion.div>
            </button>
          ) : null}
          <div ref={imageRef} className="catalog-product-image relative z-10 cursor-grab touch-none select-none active:cursor-grabbing" onPointerDown={(event) => { pointerStart.current = { x: event.clientX, y: event.clientY }; event.currentTarget.setPointerCapture(event.pointerId); }} onPointerUp={onPointerUp} onPointerCancel={() => { pointerStart.current = null; }}>
            <AnimatePresence initial={false} custom={direction}>
              <motion.div key={product.id} custom={direction} variants={canVariants} initial={reduceMotion ? false : "enter"} animate="center" exit={reduceMotion ? { opacity: 0 } : "exit"} transition={reduceMotion ? { duration: 0.15 } : { type: "spring", stiffness: 320, damping: 30, mass: 0.92 }} className="absolute inset-0">
                <div aria-hidden className="catalog-can-shadow" />
                <motion.div animate={reduceMotion || !product.is_available ? undefined : { y: [0, -7, 0] }} transition={{ repeat: Infinity, duration: 4.6, ease: "easeInOut" }} className={`absolute inset-0 ${product.is_available ? "" : "opacity-45 grayscale"}`}>
                  <ProductImage src={product.image_url} alt={product.name} />
                </motion.div>
                {!product.is_available ? <span className="absolute left-1/2 top-1/2 z-20 w-max -translate-x-1/2 -translate-y-1/2 -rotate-6 rounded-full bg-neutral-950/90 px-4 py-1.5 text-sm font-extrabold uppercase tracking-wide text-white shadow-lg">Rasprodato</span> : null}
              </motion.div>
            </AnimatePresence>
          </div>
          <div className="relative z-10 mt-auto flex w-full flex-col items-center">
          <AnimatePresence mode="wait" initial={false}>
            <motion.div key={`${product.id}-copy`} initial={reduceMotion ? false : { opacity: 0, y: 9 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -6 }} transition={{ duration: 0.2, ease: "easeOut" }} className="w-full max-w-xl text-center">
              <h1 className="text-[clamp(1.55rem,6vw,2.5rem)] font-bold leading-tight tracking-[-.045em]">{product.name}</h1>
              {ingredients.length ? (
                <div className="catalog-chips mx-auto mt-1.5 flex max-w-full items-center gap-1.5 overflow-x-auto whitespace-nowrap px-2">
                  {ingredients.map((item) => <span key={item} className="shrink-0 rounded-full border border-neutral-200/90 bg-white/80 px-2.5 py-1 text-[11px] font-semibold leading-none text-neutral-600 shadow-sm shadow-neutral-900/5 sm:text-xs">{item}</span>)}
                </div>
              ) : null}
              <div className="mt-2 flex items-center justify-center gap-2.5">
                <p className="text-xl font-bold tracking-[-.03em] sm:text-2xl">{formatMoney(product.price)}</p>
                <span aria-hidden className="size-1 rounded-full bg-neutral-300" />
                <p className="flex items-center gap-1 text-xs font-semibold text-neutral-500 sm:text-sm"><Clock3 aria-hidden size={14} />~{product.preparation_minutes} min</p>
                {product.contains_alcohol ? <span className="rounded-full bg-neutral-950 px-2 py-0.5 text-[10px] font-extrabold leading-none text-white">18+</span> : null}
              </div>
            </motion.div>
          </AnimatePresence>
          <div className="mt-1 flex items-center" aria-label={`Proizvod ${productIndex + 1} od ${products.length}`}>
            {products.map((item, index) => {
              const active = index === productIndex;
              return (
                <button key={item.id} type="button" onClick={() => go(index)} aria-label={`Prikaži ${item.name}`} aria-current={active} className="touch-target group grid place-items-center">
                  <span className={`block h-2 rounded-full transition-all duration-300 ${active ? "w-6 bg-neutral-900" : "w-2 bg-neutral-300 group-hover:bg-neutral-400"}`} />
                </button>
              );
            })}
          </div>
          </div>
        </section>
      )}
      {product ? <FloatingAddBar quantity={quantity} max={product.max_quantity_per_order} disabled={!catalog.orderingEnabled || !product.is_available} paused={!catalog.orderingEnabled} onChange={setQuantity} onAdd={addToCart} /> : null}
      {flights.map((flight) => (
        <motion.img key={flight.id} src={flight.src} alt="" aria-hidden
          initial={{ x: 0, y: 0, scale: 1, rotate: 0, opacity: 1 }}
          animate={{ x: flight.dx, y: flight.dy, scale: flight.scale, rotate: 26, opacity: 0.85 }}
          transition={{ duration: 0.72, ease: [0.4, 0, 0.2, 1] }}
          onAnimationComplete={() => { window.dispatchEvent(new CustomEvent("cart:bump")); setFlights((prev) => prev.filter((item) => item.id !== flight.id)); }}
          style={{ position: "fixed", left: flight.x, top: flight.y, width: flight.w, height: flight.h, transformOrigin: "center", pointerEvents: "none", zIndex: 60, objectFit: "contain" }}
        />
      ))}
    </main>
  );
}
