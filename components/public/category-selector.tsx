"use client";
import Image from "next/image";
import type { Category } from "@/types/domain";
import { PRODUCT_FALLBACK_IMAGE } from "@/lib/catalog-fallback";

export function CategorySelector({ categories, activeId, onChange }: { categories: Category[]; activeId: string; onChange: (category: Category) => void }) {
  return (
    <nav aria-label="Kategorije napitaka" className="relative mx-auto mt-2 h-[152px] w-full max-w-[620px] overflow-hidden sm:h-[176px]">
      <div aria-hidden className="absolute left-1/2 top-[88px] h-[240px] w-[130%] -translate-x-1/2 rounded-[50%] border-t border-white/90 shadow-[0_-1px_0_rgba(0,0,0,.035)]" />
      <div className="relative z-10 grid grid-cols-3 items-start px-2">
        {categories.map((category, index) => {
          const active = category.id === activeId;
          const lift = index === 1 ? "-translate-y-2" : "translate-y-5";
          return (
            <button key={category.id} type="button" aria-pressed={active} onClick={() => onChange(category)} className={`touch-target group flex flex-col items-center gap-1 rounded-3xl py-2 transition ${lift}`}>
              <span className={`relative block h-20 w-20 rounded-full transition sm:h-24 sm:w-24 ${active ? "bg-white/80 shadow-[0_10px_35px_rgba(0,0,0,.06)]" : ""}`}>
                <Image src={category.image_url || PRODUCT_FALLBACK_IMAGE} alt="" fill sizes="96px" className={`object-contain p-1 transition duration-300 ${active ? "scale-100 opacity-100" : "scale-90 opacity-58 grayscale-[.18]"}`} />
              </span>
              <span className={`whitespace-nowrap text-sm font-semibold transition sm:text-base ${active ? "text-neutral-950" : "text-neutral-500"}`}>{category.name}</span>
              <span className={`h-1 rounded-full bg-black transition-all ${active ? "w-10 opacity-100" : "w-0 opacity-0"}`} />
            </button>
          );
        })}
      </div>
    </nav>
  );
}
