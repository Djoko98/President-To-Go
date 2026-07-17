"use client";

import { Citrus, Coffee, GlassWater, Martini, type LucideIcon } from "lucide-react";
import type { Category } from "@/types/domain";

const CATEGORY_ICONS: Record<string, LucideIcon> = {
  kokteli: Martini,
  kafe: Coffee,
  "vocni-napici": Citrus,
};

export function CategorySelector({ categories, activeId, onChange }: { categories: Category[]; activeId: string; onChange: (category: Category) => void }) {
  return (
    <nav aria-label="Kategorije napitaka" className="catalog-categories relative mx-auto w-full max-w-[560px] overflow-hidden px-3">
      <svg aria-hidden className="catalog-category-arc absolute inset-x-3 bottom-0 h-full w-auto" viewBox="0 0 100 100" preserveAspectRatio="none">
        <path d="M 4 90 Q 50 8 96 90" fill="none" vectorEffect="non-scaling-stroke" />
      </svg>
      <div className="relative z-10 grid h-full grid-cols-3 items-start">
        {categories.map((category, index) => {
          const active = category.id === activeId;
          const position = index === 1 ? "catalog-category-center" : "catalog-category-side";
          const Icon = CATEGORY_ICONS[category.slug] ?? GlassWater;
          return (
            <button key={category.id} type="button" aria-pressed={active} onClick={() => onChange(category)} className={`touch-target group flex flex-col items-center gap-1 rounded-3xl transition-transform duration-300 ${position} ${active ? "scale-[1.04]" : "scale-100"}`}>
              <span className={`catalog-category-image grid place-items-center rounded-full border shadow-sm transition-all duration-300 ${active ? "border-neutral-950 bg-neutral-950 text-white shadow-neutral-950/15" : "border-white/90 bg-white/90 text-neutral-600 shadow-neutral-900/5"}`}>
                <Icon aria-hidden strokeWidth={active ? 2.25 : 1.9} className="catalog-category-icon transition-transform duration-300 group-hover:scale-105" />
              </span>
              <span className={`whitespace-nowrap transition-all duration-300 ${active ? "text-sm font-extrabold text-neutral-950" : "text-xs font-semibold text-neutral-500 sm:text-[13px]"}`}>{category.name}</span>
              <span className={`h-1 rounded-full bg-black transition-all duration-300 ${active ? "w-7 opacity-100" : "w-0 opacity-0"}`} />
            </button>
          );
        })}
      </div>
    </nav>
  );
}
