"use client";

import { useMemo, useState } from "react";
import Link from "next/link";
import { Edit3 } from "lucide-react";
import { setProductAvailability } from "@/features/admin/actions";
import { SubmitButton } from "@/components/admin/submit-button";
import { formatMoney } from "@/lib/money";

interface ProductRow { id: string; name: string; ingredients: string; price: number; is_available: boolean; is_active: boolean; category_id: string; categories: { name: string } | null }
interface CategoryRow { id: string; name: string }

function ProductCard({ product }: { product: ProductRow }) {
  return (
    <article className="rounded-3xl bg-white p-4 sm:p-5">
      <span className="text-xs font-bold uppercase tracking-[.12em] text-neutral-400">{product.categories?.name}</span>
      <h2 className="mt-1 text-lg font-bold">{product.name}</h2>
      <p className="mt-1 line-clamp-2 text-sm text-neutral-500">{product.ingredients}</p>
      <p className="mt-2 font-bold">{formatMoney(product.price)}</p>
      <div className="mt-4 grid grid-cols-[1fr_48px] gap-2">
        <form action={setProductAvailability}><input type="hidden" name="id" value={product.id} /><input type="hidden" name="available" value={product.is_available ? "false" : "true"} /><SubmitButton spinnerSize={16} className={`min-h-12 w-full rounded-full px-4 text-sm font-bold ${product.is_available ? "bg-emerald-50 text-emerald-800" : "bg-red-50 text-red-800"}`}>{product.is_available ? "Dostupan" : "Rasprodat"}</SubmitButton></form>
        <Link href={`/admin/proizvodi/${product.id}`} className="touch-target grid place-items-center rounded-full bg-neutral-100 transition active:scale-90" aria-label={`Izmeni ${product.name}`}><Edit3 size={18} /></Link>
      </div>
    </article>
  );
}

export function ProductsBrowser({ products, categories }: { products: ProductRow[]; categories: CategoryRow[] }) {
  const [active, setActive] = useState<string>("all");
  const countByCategory = useMemo(() => products.reduce<Record<string, number>>((map, product) => ({ ...map, [product.category_id]: (map[product.category_id] ?? 0) + 1 }), {}), [products]);
  const chips: Array<{ id: string; label: string; count: number }> = [{ id: "all", label: "Sve", count: products.length }, ...categories.map((category) => ({ id: category.id, label: category.name, count: countByCategory[category.id] ?? 0 }))];

  return (
    <>
      <div className="-mx-4 mt-4 flex gap-2 overflow-x-auto px-4 pb-1 sm:mx-0 sm:mt-5 sm:px-0" role="tablist" aria-label="Filter kategorija">
        {chips.map((chip) => {
          const isActive = active === chip.id;
          return <button key={chip.id} type="button" role="tab" aria-selected={isActive} onClick={() => setActive(chip.id)} className={`min-h-10 shrink-0 rounded-full px-4 text-sm font-bold transition active:scale-95 ${isActive ? "bg-black text-white" : "bg-white text-neutral-600"}`}>{chip.label}<span className={`ml-1.5 ${isActive ? "text-white/60" : "text-neutral-400"}`}>{chip.count}</span></button>;
        })}
      </div>

      {active === "all" ? (
        <div className="mt-6 space-y-8 sm:mt-7">
          {categories.filter((category) => (countByCategory[category.id] ?? 0) > 0).map((category) => (
            <section key={category.id}>
              <h2 className="text-sm font-bold uppercase tracking-[.12em] text-neutral-400">{category.name}</h2>
              <div className="mt-3 grid gap-3 sm:gap-4 xl:grid-cols-2">{products.filter((product) => product.category_id === category.id).map((product) => <ProductCard key={product.id} product={product} />)}</div>
            </section>
          ))}
        </div>
      ) : (
        <div className="mt-6 grid gap-3 sm:mt-7 sm:gap-4 xl:grid-cols-2">{products.filter((product) => product.category_id === active).map((product) => <ProductCard key={product.id} product={product} />)}</div>
      )}

      {!products.length ? <p className="mt-10 rounded-2xl bg-white p-6 text-center font-semibold text-neutral-500">Još nema proizvoda. Dodaj prvi napitak.</p> : null}
    </>
  );
}
