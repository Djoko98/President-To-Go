"use client";

import { motion, useReducedMotion } from "framer-motion";
import { Citrus, Coffee, GlassWater, Martini, type LucideIcon } from "lucide-react";
import type { Category } from "@/types/domain";

const CATEGORY_ICONS: Record<string, LucideIcon> = {
  kokteli: Martini,
  kafe: Coffee,
  "vocni-napici": Citrus,
};

export function CategorySelector({ categories, activeId, onChange }: { categories: Category[]; activeId: string; onChange: (category: Category) => void }) {
  const reduceMotion = useReducedMotion();
  const spring = reduceMotion ? { duration: 0 } : { type: "spring" as const, stiffness: 420, damping: 34 };
  return (
    <nav aria-label="Kategorije napitaka" className="catalog-categories relative z-20 mx-auto w-full max-w-[560px] px-4">
      <div className="grid h-full grid-cols-3 items-stretch rounded-[30px] border border-white/90 bg-white/55 px-1.5 py-1.5 shadow-[0_18px_44px_rgba(21,21,21,.08)] backdrop-blur-xl">
        {categories.map((category) => {
          const active = category.id === activeId;
          const Icon = CATEGORY_ICONS[category.slug] ?? GlassWater;
          return (
            <motion.button key={category.id} type="button" aria-pressed={active} onClick={() => onChange(category)} whileTap={reduceMotion ? undefined : { scale: 0.93 }} className="touch-target group relative flex flex-col items-center justify-center gap-1 rounded-3xl">
              <span className={`catalog-category-image relative grid place-items-center rounded-full border transition-colors duration-300 ${active ? "border-transparent text-white" : "border-neutral-200/70 bg-white text-neutral-600 shadow-sm shadow-neutral-900/5"}`}>
                {active ? <motion.span layoutId="category-active-pill" transition={spring} className="absolute inset-0 rounded-full bg-neutral-950 shadow-lg shadow-neutral-950/25" /> : null}
                <Icon aria-hidden strokeWidth={active ? 2.25 : 1.9} className="catalog-category-icon relative z-10 transition-transform duration-300 group-hover:-rotate-6 group-hover:scale-110" />
              </span>
              <span className={`whitespace-nowrap transition-all duration-300 ${active ? "text-[13px] font-extrabold text-neutral-950 sm:text-sm" : "text-xs font-semibold text-neutral-500 sm:text-[13px]"}`}>{category.name}</span>
              <span className="grid h-1 place-items-center">
                {active ? <motion.span layoutId="category-underline" transition={spring} className="block h-1 w-7 rounded-full bg-neutral-950" /> : null}
              </span>
            </motion.button>
          );
        })}
      </div>
    </nav>
  );
}
