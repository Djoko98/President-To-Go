"use client";

import { useCallback, useEffect, useMemo, useRef, useState, useSyncExternalStore } from "react";
import Link from "next/link";
import { ArrowDown, ArrowUp, Edit3, Trash2 } from "lucide-react";
import { reorderProducts, setProductAvailability } from "@/features/admin/actions";
import { DeleteProductButton } from "@/components/admin/delete-product-button";
import { SubmitButton } from "@/components/admin/submit-button";
import { CATEGORY_GROUPS } from "@/lib/categories";
import { formatMoney } from "@/lib/money";
import type { CategoryGroup } from "@/types/domain";

interface ProductRow { id: string; name: string; ingredients: string; price: number; is_available: boolean; is_active: boolean; category_id: string; categories: { name: string } | null }
interface CategoryRow { id: string; name: string; group_key: CategoryGroup }
type MoveHandler = (product: ProductRow, direction: "up" | "down") => void;

const iconButton = "touch-target grid place-items-center rounded-full bg-neutral-100 disabled:opacity-35";
const ACTIVE_CATEGORY_STORAGE_KEY = "president-to-go-admin-products-category";
/** Klikovi se skupljaju pa se redosled snima jednom — dovoljno da se stigne nekoliko mesta bez čekanja. */
const SAVE_DELAY_MS = 600;

function readStoredCategory(): string | null {
  try { return window.sessionStorage.getItem(ACTIVE_CATEGORY_STORAGE_KEY); } catch { return null; }
}

function subscribeToStoredCategory(onChange: () => void) {
  window.addEventListener("storage", onChange);
  return () => window.removeEventListener("storage", onChange);
}

function storeCategory(id: string): void {
  if (typeof window === "undefined") return;
  try { window.sessionStorage.setItem(ACTIVE_CATEGORY_STORAGE_KEY, id); } catch { /* privatni režim bez storage-a */ }
}

function MoveButton({ product, direction, disabled, onMove }: { product: ProductRow; direction: "up" | "down"; disabled: boolean; onMove: MoveHandler }) {
  return (
    <button type="button" onClick={() => onMove(product, direction)} disabled={disabled} className={`${iconButton} transition active:scale-90`} aria-label={`Pomeri ${product.name} ${direction === "up" ? "gore" : "dole"}`}>
      {direction === "up" ? <ArrowUp size={18} /> : <ArrowDown size={18} />}
    </button>
  );
}

function ProductCard({ product, first, last, canManage, onMove }: { product: ProductRow; first: boolean; last: boolean; canManage: boolean; onMove: MoveHandler }) {
  return (
    <article className="rounded-3xl bg-white p-4 sm:p-5">
      <span className="text-xs font-bold uppercase tracking-[.12em] text-neutral-400">{product.categories?.name}</span>
      <h2 className="mt-1 text-lg font-bold">{product.name}</h2>
      <p className="mt-1 line-clamp-2 text-sm text-neutral-500">{product.ingredients}</p>
      <p className="mt-2 font-bold">{formatMoney(product.price)}</p>
      <form action={setProductAvailability} className="mt-4"><input type="hidden" name="id" value={product.id} /><input type="hidden" name="available" value={product.is_available ? "false" : "true"} /><SubmitButton spinnerSize={16} className={`min-h-12 w-full rounded-full px-4 text-sm font-bold ${product.is_available ? "bg-emerald-50 text-emerald-800" : "bg-red-50 text-red-800"}`}>{product.is_available ? "Dostupan" : "Rasprodat"}</SubmitButton></form>
      {canManage ? (
        <div className="mt-2 flex items-center gap-2">
          <MoveButton product={product} direction="up" disabled={first} onMove={onMove} />
          <MoveButton product={product} direction="down" disabled={last} onMove={onMove} />
          <span className="flex-1" />
          <Link href={`/admin/proizvodi/${product.id}`} className={`${iconButton} transition active:scale-90`} aria-label={`Izmeni ${product.name}`}><Edit3 size={18} /></Link>
          <DeleteProductButton id={product.id} name={product.name} spinnerSize={16} label={`Obriši ${product.name}`} className={`${iconButton} bg-red-50 text-red-700`}><Trash2 size={18} /></DeleteProductButton>
        </div>
      ) : null}
    </article>
  );
}

export function ProductsBrowser({ products, categories, canManage }: { products: ProductRow[]; categories: CategoryRow[]; canManage: boolean }) {
  // Filter preživljava odlazak na izmenu proizvoda i povratak na listu, pa ostajemo u istoj kategoriji.
  // Server ne zna za sessionStorage i renderuje „Sve"; posle hidratacije se preuzima zapamćena kategorija.
  const [chosen, setChosen] = useState<string | null>(null);
  const stored = useSyncExternalStore(subscribeToStoredCategory, readStoredCategory, () => null);
  const remembered = chosen ?? stored ?? "all";
  const active = remembered === "all" || categories.some((category) => category.id === remembered) ? remembered : "all";
  const selectCategory = (id: string) => { setChosen(id); storeCategory(id); };

  // Strelice pomeraju listu odmah u pregledaču; server saznaje tek kad klikovi stanu, pa se ne čeka učitavanje po pomeraju.
  const [order, setOrder] = useState<Record<string, string[]>>({});
  const [saving, setSaving] = useState(0);
  const [error, setError] = useState<string | null>(null);
  const orderRef = useRef<Record<string, string[]>>({});
  const timersRef = useRef<Record<string, number>>({});
  const dirtyRef = useRef<Set<string>>(new Set());

  const byCategory = useMemo(() => {
    const grouped = products.reduce<Record<string, ProductRow[]>>((map, product) => {
      (map[product.category_id] ??= []).push(product);
      return map;
    }, {});
    // Proizvodi stižu poređani po position; lokalni redosled ih pretiče, a nepoznate (novododate) ostavlja na kraju.
    for (const [categoryId, list] of Object.entries(grouped)) {
      const override = order[categoryId];
      if (!override) continue;
      const rank = new Map(override.map((id, index) => [id, index]));
      grouped[categoryId] = [...list].sort((a, b) => (rank.get(a.id) ?? Number.MAX_SAFE_INTEGER) - (rank.get(b.id) ?? Number.MAX_SAFE_INTEGER));
    }
    return grouped;
  }, [products, order]);

  const edgesOf = (product: ProductRow) => {
    const list = byCategory[product.category_id] ?? [];
    const index = list.findIndex((item) => item.id === product.id);
    return { first: index <= 0, last: index === -1 || index === list.length - 1 };
  };

  const save = useCallback(async (categoryId: string) => {
    const ids = orderRef.current[categoryId];
    if (!ids) return;
    dirtyRef.current.delete(categoryId);
    setSaving((count) => count + 1);
    try {
      await reorderProducts({ categoryId, ids });
      setError(null);
    } catch (cause) {
      // Neuspeh vraća prikaz na ono što server zaista ima, da admin ne gleda redosled koji nije sačuvan.
      setOrder((previous) => { const next = { ...previous }; delete next[categoryId]; return next; });
      delete orderRef.current[categoryId];
      setError(cause instanceof Error ? cause.message : "Redosled nije sačuvan.");
    } finally {
      setSaving((count) => count - 1);
    }
  }, []);

  const move = useCallback<MoveHandler>((product, direction) => {
    const categoryId = product.category_id;
    const current = orderRef.current[categoryId] ?? (byCategory[categoryId] ?? []).map((item) => item.id);
    const index = current.indexOf(product.id);
    const target = direction === "up" ? index - 1 : index + 1;
    if (index < 0 || target < 0 || target >= current.length) return;
    const next = [...current];
    const [moved] = next.splice(index, 1);
    if (!moved) return;
    next.splice(target, 0, moved);
    orderRef.current = { ...orderRef.current, [categoryId]: next };
    dirtyRef.current.add(categoryId);
    setOrder(orderRef.current);
    setError(null);
    window.clearTimeout(timersRef.current[categoryId]);
    timersRef.current[categoryId] = window.setTimeout(() => void save(categoryId), SAVE_DELAY_MS);
  }, [byCategory, save]);

  useEffect(() => {
    const timers = timersRef.current;
    const dirty = dirtyRef.current;
    // Odlazak sa stranice u toku pauze ne sme da pojede poslednje klikove.
    return () => {
      Object.values(timers).forEach((timer) => window.clearTimeout(timer));
      [...dirty].forEach((categoryId) => void save(categoryId));
    };
  }, [save]);

  const countByCategory = useMemo(() => Object.fromEntries(Object.entries(byCategory).map(([categoryId, list]) => [categoryId, list.length])), [byCategory]);
  const chips: Array<{ id: string; label: string; count: number }> = [{ id: "all", label: "Sve", count: products.length }, ...categories.map((category) => ({ id: category.id, label: category.name, count: countByCategory[category.id] ?? 0 }))];
  const status = saving > 0 ? "Čuvam redosled…" : error;

  return (
    <>
      <div className="-mx-4 mt-4 flex gap-2 overflow-x-auto px-4 pb-1 sm:mx-0 sm:mt-5 sm:px-0" role="tablist" aria-label="Filter kategorija">
        {chips.map((chip) => {
          const isActive = active === chip.id;
          return <button key={chip.id} type="button" role="tab" aria-selected={isActive} onClick={() => selectCategory(chip.id)} className={`min-h-10 shrink-0 rounded-full px-4 text-sm font-bold transition active:scale-95 ${isActive ? "bg-black text-white" : "bg-white text-neutral-600"}`}>{chip.label}<span className={`ml-1.5 ${isActive ? "text-white/60" : "text-neutral-400"}`}>{chip.count}</span></button>;
        })}
      </div>

      {canManage && status ? <p role="status" aria-live="polite" className={`mt-3 text-sm font-semibold ${saving > 0 ? "text-neutral-500" : "text-red-700"}`}>{status}</p> : null}

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
                      <div className="mt-3 grid gap-3 sm:gap-4 xl:grid-cols-2">{(byCategory[category.id] ?? []).map((product) => <ProductCard key={product.id} product={product} canManage={canManage} onMove={move} {...edgesOf(product)} />)}</div>
                    </section>
                  ))}
                </div>
              </section>
            );
          })}
        </div>
      ) : (
        <div className="mt-6 grid gap-3 sm:mt-7 sm:gap-4 xl:grid-cols-2">{(byCategory[active] ?? []).map((product) => <ProductCard key={product.id} product={product} canManage={canManage} onMove={move} {...edgesOf(product)} />)}</div>
      )}

      {!products.length ? <p className="mt-10 rounded-2xl bg-white p-6 text-center font-semibold text-neutral-500">Još nema proizvoda. Dodaj prvi.</p> : null}
    </>
  );
}
