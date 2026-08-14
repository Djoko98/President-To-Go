"use client";

import { useEffect, useMemo, useState } from "react";
import Link from "next/link";
import { ArrowDown, ArrowUp, Edit3, Trash2 } from "lucide-react";
import { moveProduct, setProductAvailability } from "@/features/admin/actions";
import { DeleteProductButton } from "@/components/admin/delete-product-button";
import { SubmitButton } from "@/components/admin/submit-button";
import { CATEGORY_GROUPS } from "@/lib/categories";
import { formatMoney } from "@/lib/money";
import type { CategoryGroup } from "@/types/domain";

interface ProductRow { id: string; name: string; ingredients: string; price: number; is_available: boolean; is_active: boolean; category_id: string; categories: { name: string } | null }
interface CategoryRow { id: string; name: string; group_key: CategoryGroup }

const iconButton = "touch-target grid place-items-center rounded-full bg-neutral-100 disabled:opacity-35";
const ACTIVE_CATEGORY_STORAGE_KEY = "president-to-go-admin-products-category";

function readStoredCategory(): string | null {
  if (typeof window === "undefined") return null;
  try { return window.sessionStorage.getItem(ACTIVE_CATEGORY_STORAGE_KEY); } catch { return null; }
}

function storeCategory(id: string): void {
  if (typeof window === "undefined") return;
  try { window.sessionStorage.setItem(ACTIVE_CATEGORY_STORAGE_KEY, id); } catch { /* privatni režim bez storage-a */ }
}

function MoveButton({ product, direction, disabled }: { product: ProductRow; direction: "up" | "down"; disabled: boolean }) {
  return (
    <form action={moveProduct}>
      <input type="hidden" name="id" value={product.id} />
      <input type="hidden" name="direction" value={direction} />
      <SubmitButton spinnerSize={16} disabled={disabled} className={iconButton} aria-label={`Pomeri ${product.name} ${direction === "up" ? "gore" : "dole"}`}>
        {direction === "up" ? <ArrowUp size={18} /> : <ArrowDown size={18} />}
      </SubmitButton>
    </form>
  );
}

function ProductCard({ product, first, last }: { product: ProductRow; first: boolean; last: boolean }) {
  return (
    <article className="rounded-3xl bg-white p-4 sm:p-5">
      <span className="text-xs font-bold uppercase tracking-[.12em] text-neutral-400">{product.categories?.name}</span>
      <h2 className="mt-1 text-lg font-bold">{product.name}</h2>
      <p className="mt-1 line-clamp-2 text-sm text-neutral-500">{product.ingredients}</p>
      <p className="mt-2 font-bold">{formatMoney(product.price)}</p>
      <form action={setProductAvailability} className="mt-4"><input type="hidden" name="id" value={product.id} /><input type="hidden" name="available" value={product.is_available ? "false" : "true"} /><SubmitButton spinnerSize={16} className={`min-h-12 w-full rounded-full px-4 text-sm font-bold ${product.is_available ? "bg-emerald-50 text-emerald-800" : "bg-red-50 text-red-800"}`}>{product.is_available ? "Dostupan" : "Rasprodat"}</SubmitButton></form>
      <div className="mt-2 flex items-center gap-2">
        <MoveButton product={product} direction="up" disabled={first} />
        <MoveButton product={product} direction="down" disabled={last} />
        <span className="flex-1" />
        <Link href={`/admin/proizvodi/${product.id}`} className={`${iconButton} transition active:scale-90`} aria-label={`Izmeni ${product.name}`}><Edit3 size={18} /></Link>
        <DeleteProductButton id={product.id} name={product.name} spinnerSize={16} label={`Obriši ${product.name}`} className={`${iconButton} bg-red-50 text-red-700`}><Trash2 size={18} /></DeleteProductButton>
      </div>
    </article>
  );
}

export function ProductsBrowser({ products, categories }: { products: ProductRow[]; categories: CategoryRow[] }) {
  const [active, setActive] = useState<string>("all");
  // Filter preživljava odlazak na izmenu proizvoda i povratak na listu, pa ostajemo u istoj kategoriji.
  const categoryIds = categories.map((category) => category.id).join(",");
  useEffect(() => {
    const stored = readStoredCategory();
    if (stored && (stored === "all" || categoryIds.split(",").includes(stored))) setActive(stored);
  }, [categoryIds]);
  const selectCategory = (id: string) => { setActive(id); storeCategory(id); };
  const countByCategory = useMemo(() => products.reduce<Record<string, number>>((map, product) => ({ ...map, [product.category_id]: (map[product.category_id] ?? 0) + 1 }), {}), [products]);
  // Strelice se gase na krajevima kategorije — proizvodi stižu već poređani po position.
  const edges = useMemo(() => {
    const seen: Record<string, number> = {};
    return products.reduce<Record<string, { first: boolean; last: boolean }>>((map, product) => {
      const index = seen[product.category_id] ?? 0;
      seen[product.category_id] = index + 1;
      return { ...map, [product.id]: { first: index === 0, last: index === (countByCategory[product.category_id] ?? 1) - 1 } };
    }, {});
  }, [products, countByCategory]);
  const edgesOf = (id: string) => edges[id] ?? { first: true, last: true };
  const chips: Array<{ id: string; label: string; count: number }> = [{ id: "all", label: "Sve", count: products.length }, ...categories.map((category) => ({ id: category.id, label: category.name, count: countByCategory[category.id] ?? 0 }))];

  return (
    <>
      <div className="-mx-4 mt-4 flex gap-2 overflow-x-auto px-4 pb-1 sm:mx-0 sm:mt-5 sm:px-0" role="tablist" aria-label="Filter kategorija">
        {chips.map((chip) => {
          const isActive = active === chip.id;
          return <button key={chip.id} type="button" role="tab" aria-selected={isActive} onClick={() => selectCategory(chip.id)} className={`min-h-10 shrink-0 rounded-full px-4 text-sm font-bold transition active:scale-95 ${isActive ? "bg-black text-white" : "bg-white text-neutral-600"}`}>{chip.label}<span className={`ml-1.5 ${isActive ? "text-white/60" : "text-neutral-400"}`}>{chip.count}</span></button>;
        })}
      </div>

      {active === "all" ? (
        <div className="mt-6 space-y-10 sm:mt-7">
          {CATEGORY_GROUPS.map((group) => {
            const groupCategories = categories.filter((category) => category.group_key === group.key && (countByCategory[category.id] ?? 0) > 0);
            if (!groupCategories.length) return null;
            return (
              <section key={group.key}>
                <h2 className="text-xl font-bold">{group.label}</h2>
                <div className="mt-4 space-y-8">
                  {groupCategories.map((category) => (
                    <section key={category.id}>
                      <h3 className="text-sm font-bold uppercase tracking-[.12em] text-neutral-400">{category.name}</h3>
                      <div className="mt-3 grid gap-3 sm:gap-4 xl:grid-cols-2">{products.filter((product) => product.category_id === category.id).map((product) => <ProductCard key={product.id} product={product} {...edgesOf(product.id)} />)}</div>
                    </section>
                  ))}
                </div>
              </section>
            );
          })}
        </div>
      ) : (
        <div className="mt-6 grid gap-3 sm:mt-7 sm:gap-4 xl:grid-cols-2">{products.filter((product) => product.category_id === active).map((product) => <ProductCard key={product.id} product={product} {...edgesOf(product.id)} />)}</div>
      )}

      {!products.length ? <p className="mt-10 rounded-2xl bg-white p-6 text-center font-semibold text-neutral-500">Još nema proizvoda. Dodaj prvi.</p> : null}
    </>
  );
}
