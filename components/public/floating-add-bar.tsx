"use client";
import { ArrowRight, Minus, Plus } from "lucide-react";

export function FloatingAddBar({ quantity, max, disabled, onChange, onAdd }: { quantity: number; max: number; disabled?: boolean; onChange: (value: number) => void; onAdd: () => void }) {
  return (
    <div className="fixed inset-x-0 bottom-0 z-40 px-3 pb-[max(12px,env(safe-area-inset-bottom))] sm:px-6">
      <div className="mx-auto flex w-full max-w-[760px] items-stretch gap-2 rounded-[32px] bg-[#171817] p-2.5 shadow-[0_18px_60px_rgba(0,0,0,.3)] sm:rounded-[36px] sm:p-3">
        <div className="grid min-w-[145px] grid-cols-3 items-center rounded-[25px] bg-[#292a29] text-white sm:min-w-[190px]">
          <button type="button" className="touch-target grid place-items-center disabled:opacity-35" disabled={quantity <= 1} onClick={() => onChange(quantity - 1)} aria-label="Smanji količinu"><Minus size={19} /></button>
          <span className="grid h-8 place-items-center border-x border-white/15 text-lg font-semibold" aria-live="polite">{quantity}</span>
          <button type="button" className="touch-target grid place-items-center disabled:opacity-35" disabled={quantity >= max} onClick={() => onChange(quantity + 1)} aria-label="Povećaj količinu"><Plus size={20} /></button>
        </div>
        <button type="button" disabled={disabled} onClick={onAdd} className="touch-target flex min-w-0 flex-1 items-center justify-between rounded-[25px] bg-white px-5 font-bold text-black transition hover:bg-neutral-100 disabled:cursor-not-allowed disabled:bg-neutral-400 sm:px-8 sm:text-lg">
          <span className="truncate">{disabled ? "Trenutno nedostupno" : "Dodaj u korpu"}</span><ArrowRight className="shrink-0" size={23} />
        </button>
      </div>
    </div>
  );
}
