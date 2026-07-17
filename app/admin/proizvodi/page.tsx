import Link from "next/link";
import { Edit3, Plus } from "lucide-react";
import { setProductAvailability } from "@/features/admin/actions";
import { requireAdmin } from "@/lib/security/admin";
import { formatMoney } from "@/lib/money";

export const dynamic = "force-dynamic";

export default async function Page() {
  const { supabase } = await requireAdmin(["owner", "manager"]);
  const { data } = await supabase.from("products").select("id,name,ingredients,price,is_available,is_active,category_id,categories(name)").order("position");
  const products = (data ?? []) as unknown as Array<{ id: string; name: string; ingredients: string; price: number; is_available: boolean; is_active: boolean; categories: { name: string } | null }>;

  return <main className="p-5 sm:p-8">
    <div className="flex flex-wrap items-end justify-between gap-4">
      <div><p className="text-sm font-semibold text-neutral-500">Katalog</p><h1 className="text-3xl font-bold tracking-[-.05em] sm:text-4xl">Proizvodi</h1></div>
      <Link href="/admin/proizvodi/novi" className="flex min-h-12 w-full items-center justify-center gap-2 rounded-full bg-black px-5 font-bold text-white sm:w-auto"><Plus size={18} />Dodaj proizvod</Link>
    </div>
    <div className="mt-6 grid gap-3 sm:mt-7 sm:gap-4 xl:grid-cols-2">
      {products.map((product) => <article key={product.id} className="rounded-3xl bg-white p-4 sm:p-5">
        <span className="text-xs font-bold uppercase tracking-[.12em] text-neutral-400">{product.categories?.name}</span>
        <h2 className="mt-1 text-lg font-bold">{product.name}</h2>
        <p className="mt-1 line-clamp-2 text-sm text-neutral-500">{product.ingredients}</p>
        <p className="mt-2 font-bold">{formatMoney(product.price)}</p>
        <div className="mt-4 grid grid-cols-[1fr_48px] gap-2">
          <form action={setProductAvailability}><input type="hidden" name="id" value={product.id} /><input type="hidden" name="available" value={product.is_available ? "false" : "true"} /><button className={`min-h-12 w-full rounded-full px-4 text-sm font-bold ${product.is_available ? "bg-emerald-50 text-emerald-800" : "bg-red-50 text-red-800"}`}>{product.is_available ? "Dostupan" : "Rasprodat"}</button></form>
          <Link href={`/admin/proizvodi/${product.id}`} className="touch-target grid place-items-center rounded-full bg-neutral-100" aria-label={`Izmeni ${product.name}`}><Edit3 size={18} /></Link>
        </div>
      </article>)}
    </div>
  </main>;
}
