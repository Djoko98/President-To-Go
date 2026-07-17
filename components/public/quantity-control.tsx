"use client";
import { Minus, Plus } from "lucide-react";

export function QuantityControl({ value, max, onChange }: { value: number; max: number; onChange: (value: number) => void }) {
  return <div className="inline-grid grid-cols-3 items-center rounded-full border border-neutral-200/90 bg-white p-1 shadow-sm shadow-neutral-900/5"><button type="button" aria-label="Smanji" disabled={value <= 1} onClick={() => onChange(value - 1)} className="touch-target grid place-items-center disabled:opacity-30"><Minus size={17} /></button><span className="min-w-9 text-center font-bold">{value}</span><button type="button" aria-label="Povećaj" disabled={value >= max} onClick={() => onChange(value + 1)} className="touch-target grid place-items-center disabled:opacity-30"><Plus size={17} /></button></div>;
}
