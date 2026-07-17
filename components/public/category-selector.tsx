"use client";

import type { Category } from "@/types/domain";

const CATEGORY_EMOJIS: Record<string, string> = {
  kokteli: "🍸",
  kafe: "☕️",
  "vocni-napici": "🍓",
};

const FALLBACK_EMOJIS = ["🍸", "☕️", "🍓"];

export function CategorySelector({ categories, activeId, onChange }: { categories: Category[]; activeId: string; onChange: (category: Category) => void }) {
  return (
    <nav aria-label="Kategorije napitaka" className="catalog-categories relative mx-auto w-full max-w-[620px] overflow-hidden">
      <div aria-hidden className="absolute left-1/2 top-[66%] h-[240px] w-[130%] -translate-x-1/2 rounded-[50%] border-t border-white/90" />
      <div className="relative z-10 grid grid-cols-3 items-start px-2">
        {categories.map((category, index) => {
          const active = category.id === activeId;
          const lift = index === 1 ? "-translate-y-1" : "translate-y-2";
          const emoji = CATEGORY_EMOJIS[category.slug] ?? FALLBACK_EMOJIS[index % FALLBACK_EMOJIS.length];
          return (
            <button key={category.id} type="button" aria-pressed={active} onClick={() => onChange(category)} className={`touch-target group flex flex-col items-center gap-1 rounded-3xl py-2 transition-transform duration-300 ${lift} ${active ? "scale-110" : "scale-100"}`}>
              <span className={`catalog-category-image grid place-items-center rounded-full border bg-white transition-all duration-300 ${active ? "border-black" : "border-neutral-200"}`}>
                <span aria-hidden className={`catalog-category-emoji transition-transform duration-300 ${active ? "scale-110" : "scale-100"}`}>{emoji}</span>
              </span>
              <span className={`whitespace-nowrap transition-all duration-300 ${active ? "text-base font-extrabold text-neutral-950" : "text-[13px] font-semibold text-neutral-500 sm:text-sm"}`}>{category.name}</span>
              <span className={`h-1 rounded-full bg-black transition-all duration-300 ${active ? "w-9 opacity-100" : "w-0 opacity-0"}`} />
            </button>
          );
        })}
      </div>
    </nav>
  );
}
