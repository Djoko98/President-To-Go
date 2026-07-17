"use client";
import Link from "next/link";
import { ArrowLeft, ArrowRight, Trash2 } from "lucide-react";
import { QuantityControl } from "@/components/public/quantity-control";
import { ProductImage } from "@/components/shared/product-image";
import { useCartStore } from "@/features/cart/store";
import { useCartHydration } from "@/features/cart/use-cart-hydration";
import { calculateCartTotal, formatMoney } from "@/lib/money";

export function CartPage() {
  const hydrated = useCartHydration();
  const items = useCartStore((state) => state.items);
  const setQuantity = useCartStore((state) => state.setQuantity);
  const remove = useCartStore((state) => state.remove);
  const total = calculateCartTotal(items.map((item) => ({ price: item.product.price, quantity: item.quantity })));
  if (!hydrated) return <div className="mx-auto mt-16 max-w-2xl animate-pulse px-5"><div className="h-32 rounded-3xl bg-neutral-200" /><div className="mt-4 h-32 rounded-3xl bg-neutral-200" /></div>;
  if (!items.length) return <main className="mx-auto grid min-h-[65dvh] max-w-lg place-items-center px-6 text-center"><div><div className="mx-auto grid size-20 place-items-center rounded-full bg-white text-3xl shadow-sm">🥤</div><h1 className="mt-5 text-3xl font-bold">Korpa je prazna</h1><p className="mt-2 text-neutral-500">Izaberi napitak koji ćemo pripremiti za tebe.</p><Link href="/" className="mt-7 inline-flex items-center gap-2 rounded-full bg-black px-6 py-3 font-bold text-white"><ArrowLeft size={18} />Nazad na ponudu</Link></div></main>;
  return (
    <main className="mx-auto max-w-3xl px-5 pb-44 pt-8 sm:px-8">
      <Link href="/" className="inline-flex min-h-11 items-center gap-2 font-semibold text-neutral-600"><ArrowLeft size={19} />Nastavi kupovinu</Link>
      <h1 className="mt-5 text-4xl font-bold tracking-[-.05em]">Tvoja korpa</h1>
      <div className="mt-8 divide-y divide-neutral-200">
        {items.map(({ product, quantity }) => <article key={product.id} className="grid grid-cols-[88px_minmax(0,1fr)] gap-4 py-5 sm:grid-cols-[110px_minmax(0,1fr)_auto] sm:items-center">
          <div className="relative h-28 w-20"><ProductImage src={product.image_url} alt={product.name} /></div>
          <div className="min-w-0"><h2 className="text-lg font-bold">{product.name}</h2><p className="mt-1 line-clamp-2 text-sm text-neutral-500">{product.ingredients}</p><p className="mt-2 font-bold">{formatMoney(product.price)}</p><div className="mt-3 flex items-center gap-2 sm:hidden"><QuantityControl value={quantity} max={product.max_quantity_per_order} onChange={(value) => setQuantity(product.id, value)} /><button type="button" aria-label={`Ukloni ${product.name}`} onClick={() => remove(product.id)} className="touch-target grid place-items-center rounded-full text-neutral-500 hover:bg-red-50 hover:text-red-700"><Trash2 size={19} /></button></div></div>
          <div className="hidden items-center gap-2 sm:flex"><QuantityControl value={quantity} max={product.max_quantity_per_order} onChange={(value) => setQuantity(product.id, value)} /><button type="button" aria-label={`Ukloni ${product.name}`} onClick={() => remove(product.id)} className="touch-target grid place-items-center rounded-full text-neutral-500 hover:bg-red-50 hover:text-red-700"><Trash2 size={19} /></button></div>
        </article>)}
      </div>
      <div className="fixed inset-x-0 bottom-0 z-30 px-3 pb-[max(12px,env(safe-area-inset-bottom))]"><div className="mx-auto max-w-3xl rounded-[30px] bg-[#171817] p-4 text-white shadow-2xl sm:flex sm:items-center sm:justify-between sm:px-6"><div><div className="flex justify-between gap-12 text-sm text-neutral-400"><span>Međuzbir</span><span>{formatMoney(total)}</span></div><div className="mt-1 flex justify-between gap-12 text-xl font-bold"><span>Ukupno</span><span>{formatMoney(total)}</span></div></div><Link href="/porucivanje" className="mt-4 flex min-h-14 items-center justify-between rounded-full bg-white px-6 font-bold text-black sm:mt-0 sm:min-w-64">Nastavi na podatke<ArrowRight /></Link></div></div>
    </main>
  );
}
