"use client";

import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { AnimatePresence, motion, useReducedMotion } from "framer-motion";
import { Clock3 } from "lucide-react";
import { useRouter } from "next/navigation";
import { CatalogEmptyState } from "@/components/public/catalog-empty-state";
import { CategorySelector } from "@/components/public/category-selector";
import { FloatingAddBar } from "@/components/public/floating-add-bar";
import { ProductImage } from "@/components/shared/product-image";
import { useCartStore } from "@/features/cart/store";
import { formatMoney } from "@/lib/money";
import type { CatalogData, Category, Product } from "@/types/domain";

type CartFlight = { id: number; src: string; x: number; y: number; w: number; h: number; dx: number; dy: number; scale: number };

const DOT_SLOT = 44;
const DOT_WINDOW = 5;

/** Prikazuje najviše pet tačkica; lista duža od toga klizi horizontalno oko aktivne. */
function ProductDots({ products, index, onSelect }: { products: Product[]; index: number; onSelect: (index: number) => void }) {
  const visible = Math.min(DOT_WINDOW, products.length);
  const offset = Math.max(0, Math.min(index - Math.floor(DOT_WINDOW / 2), products.length - visible));
  return (
    <div className="catalog-dots" style={{ width: visible * DOT_SLOT }} aria-label={`Proizvod ${index + 1} od ${products.length}`}>
      <div className="catalog-dots-track" style={{ transform: `translateX(${-offset * DOT_SLOT}px)` }}>
        {products.map((item, dot) => {
          const active = dot === index;
          const inside = dot >= offset && dot < offset + visible;
          const edge = inside && ((dot === offset && offset > 0) || (dot === offset + visible - 1 && offset + visible < products.length));
          return (
            <button key={item.id} type="button" tabIndex={inside ? undefined : -1} aria-hidden={inside ? undefined : true} onClick={() => onSelect(dot)} aria-label={`Prikaži ${item.name}`} aria-current={active} className="catalog-dot touch-target group grid place-items-center">
              <span className={`block h-2 rounded-full transition-all duration-300 ${active ? "w-6 bg-neutral-900" : "w-2 bg-neutral-300 group-hover:bg-neutral-400"} ${edge ? "scale-50" : ""}`} />
            </button>
          );
        })}
      </div>
    </div>
  );
}

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
  const pointerLast = useRef<{ x: number; y: number } | null>(null);
  const swipedRef = useRef(false);
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
  const suggestion = catalog.categories.find((item) => item.id !== activeCategory.id && catalog.products.some((entry) => entry.category_id === item.id));
  const changeCategory = (next: Category) => {
    setActiveCategoryId(next.id); setProductIndex(0); setQuantity(1);
    router.replace(`/?category=${next.slug}`, { scroll: false });
  };
  // Gest se prati na celoj sceni (slika, nazivi, bočne sličice) i završava se preko prozora,
  // pa swipe radi i kad prst krene sa elementa koji ima svoj klik.
  const finishSwipe = () => {
    const start = pointerStart.current; const last = pointerLast.current;
    pointerStart.current = null; pointerLast.current = null;
    if (!start || !last) return;
    const dx = last.x - start.x; const dy = last.y - start.y;
    if (Math.abs(dx) < 44 || Math.abs(dx) < Math.abs(dy) * 1.4) return;
    swipedRef.current = true;
    go(productIndex + (dx < 0 ? 1 : -1));
  };
  const swipeHandlers = {
    onPointerDown: (event: React.PointerEvent) => {
      pointerStart.current = { x: event.clientX, y: event.clientY };
      pointerLast.current = { x: event.clientX, y: event.clientY };
      swipedRef.current = false;
      const end = () => { window.removeEventListener("pointerup", end); window.removeEventListener("pointercancel", end); finishSwipe(); };
      window.addEventListener("pointerup", end);
      window.addEventListener("pointercancel", end);
    },
    onPointerMove: (event: React.PointerEvent) => { if (pointerStart.current) pointerLast.current = { x: event.clientX, y: event.clientY }; },
  };
  /** Posle swipe-a preskačemo klik koji browser pošalje na dugme ispod prsta. */
  const afterSwipe = (action: () => void) => () => {
    if (swipedRef.current) { swipedRef.current = false; return; }
    action();
  };
  const addToCart = () => {
    if (!product || !product.is_available) return;
    add(product, quantity);
    const source = imageRef.current?.getBoundingClientRect();
    const target = document.getElementById("cart-fly-target")?.getBoundingClientRect();
    const src = product.image_url;
    if (!source || !target || reduceMotion || !src) { window.dispatchEvent(new CustomEvent("cart:bump")); return; }
    setFlights((prev) => [...prev, {
      id: Date.now() + Math.random(),
      src,
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
        <section aria-label={`${activeCategory.name}: nema proizvoda`} className="catalog-product-stage relative mx-auto grid w-full max-w-[820px] place-items-center px-5">
          <CatalogEmptyState category={activeCategory} suggestion={suggestion} onSuggestion={changeCategory} />
        </section>
      ) : (
        <section {...swipeHandlers} aria-label={`${activeCategory.name}: ${product.name}`} className="catalog-product-stage relative mx-auto flex w-full max-w-[820px] touch-none flex-col items-center justify-start px-5">
          <div aria-hidden className="pointer-events-none absolute left-1/2 top-[5%] z-0 -translate-x-1/2">
            <div className="catalog-product-glow rounded-full transition-all duration-700" style={{ background: `radial-gradient(circle at center, ${product.accent_color} 0%, ${product.accent_color} 22%, transparent 70%)`, opacity: 0.68 }} />
            <motion.div className="catalog-ring rounded-full border border-dashed" style={{ borderColor: `color-mix(in srgb, ${product.accent_color} 45%, #6f6f66)` }} animate={reduceMotion ? undefined : { rotate: 360 }} transition={{ repeat: Infinity, duration: 70, ease: "linear" }} />
          </div>
          {prevProduct ? (
            <button type="button" onClick={afterSwipe(() => go(productIndex - 1))} aria-label={`Prethodni proizvod: ${prevProduct.name}`} className="catalog-peek catalog-peek-left">
              <motion.div key={prevProduct.id} initial={reduceMotion ? false : { opacity: 0, scale: 0.88 }} animate={{ opacity: 1, scale: 1 }} transition={{ duration: 0.3 }} className="relative h-full w-full">
                <ProductImage src={prevProduct.image_url} alt="" />
              </motion.div>
            </button>
          ) : null}
          {nextProduct ? (
            <button type="button" onClick={afterSwipe(() => go(productIndex + 1))} aria-label={`Sledeći proizvod: ${nextProduct.name}`} className="catalog-peek catalog-peek-right">
              <motion.div key={nextProduct.id} initial={reduceMotion ? false : { opacity: 0, scale: 0.88 }} animate={{ opacity: 1, scale: 1 }} transition={{ duration: 0.3 }} className="relative h-full w-full">
                <ProductImage src={nextProduct.image_url} alt="" />
              </motion.div>
            </button>
          ) : null}
          <div ref={imageRef} className="catalog-product-image relative z-10 cursor-grab select-none active:cursor-grabbing">
            <AnimatePresence initial={false} custom={direction}>
              <motion.div key={product.id} custom={direction} variants={canVariants} initial={reduceMotion ? false : "enter"} animate="center" exit={reduceMotion ? { opacity: 0 } : "exit"} transition={reduceMotion ? { duration: 0.15 } : { type: "spring", stiffness: 320, damping: 30, mass: 0.92 }} className="absolute inset-0">
                <div aria-hidden className="catalog-can-shadow" />
                <motion.div animate={reduceMotion || !product.is_available ? undefined : { y: [0, -7, 0] }} transition={{ repeat: Infinity, duration: 4.6, ease: "easeInOut" }} className={`absolute inset-0 ${product.is_available ? "" : "opacity-45 grayscale"}`}>
                  <ProductImage src={product.image_url} alt={product.name} accent={product.accent_color} />
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
          <ProductDots products={products} index={productIndex} onSelect={(dot) => afterSwipe(() => go(dot))()} />
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
