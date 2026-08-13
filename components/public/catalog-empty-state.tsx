"use client";

import { motion, useReducedMotion } from "framer-motion";
import { ArrowRight, Sparkles } from "lucide-react";
import { CategoryIcon } from "@/lib/categories";
import type { Category } from "@/types/domain";

export function CatalogEmptyState({ category, suggestion, onSuggestion }: { category: Category; suggestion?: Category; onSuggestion: (category: Category) => void }) {
  const reduceMotion = useReducedMotion();

  return (
    <div className="catalog-empty">
      <span aria-hidden className="catalog-empty-glow" />
      <motion.div initial={reduceMotion ? false : { opacity: 0, scale: 0.9 }} animate={{ opacity: 1, scale: 1 }} transition={{ duration: 0.35, ease: "easeOut" }} className="catalog-empty-art">
        <motion.span aria-hidden className="catalog-empty-ring" animate={reduceMotion ? undefined : { rotate: 360 }} transition={{ repeat: Infinity, duration: 48, ease: "linear" }} />
        <span className="catalog-empty-core"><CategoryIcon category={category} strokeWidth={1.7} className="catalog-empty-icon" /></span>
      </motion.div>
      <div>
        <span className="inline-flex items-center gap-1.5 rounded-full border border-neutral-200/90 bg-white/80 px-3 py-1 text-[11px] font-extrabold uppercase tracking-[.12em] text-neutral-500 shadow-sm shadow-neutral-900/5"><Sparkles aria-hidden size={12} />U pripremi</span>
        <h1 className="mt-2.5 text-[clamp(1.35rem,5.4vw,2.05rem)] font-bold leading-tight tracking-[-.045em]">{category.name}</h1>
        <p className="mx-auto mt-1.5 max-w-[19rem] text-sm text-neutral-500">Ova kategorija još uvek nema proizvode. Ponuda stiže vrlo brzo.</p>
      </div>
      {suggestion ? (
        <button type="button" onClick={() => onSuggestion(suggestion)} className="touch-target inline-flex items-center gap-2 rounded-full bg-neutral-950 px-5 text-sm font-extrabold text-white shadow-lg shadow-neutral-950/20 transition active:scale-95">
          Prikaži: {suggestion.name}
          <ArrowRight aria-hidden size={16} />
        </button>
      ) : null}
    </div>
  );
}
