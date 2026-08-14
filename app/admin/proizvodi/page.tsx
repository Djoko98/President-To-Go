import Link from "next/link";
import { Plus } from "lucide-react";
import { ProductsBrowser } from "@/components/admin/products-browser";
import { requireAdmin } from "@/lib/security/admin";
import { normalizeCategoryGroup } from "@/lib/categories";

export const dynamic = "force-dynamic";

export default async function Page() {
  const { supabase, profile } = await requireAdmin();
  const canManage = profile.role !== "staff";
  const [{ data: productData }, { data: categoryData }] = await Promise.all([
    supabase.from("products").select("id,name,ingredients,price,is_available,is_active,category_id,categories(name)").order("position").order("created_at"),
    supabase.from("categories").select("id,name,position,group_key").order("position"),
  ]);
  const products = (productData ?? []) as unknown as Array<{ id: string; name: string; ingredients: string; price: number; is_available: boolean; is_active: boolean; category_id: string; categories: { name: string } | null }>;
  const categories = (categoryData ?? []).map((category) => ({ id: category.id, name: category.name, group_key: normalizeCategoryGroup(category.group_key) }));

  return <main className="p-5 sm:p-8">
    <div className="flex flex-wrap items-end justify-between gap-4">
      <div><p className="text-sm font-semibold text-neutral-500">Katalog</p><h1 className="text-3xl font-bold tracking-[-.05em] sm:text-4xl">Proizvodi</h1>{canManage ? null : <p className="mt-1 text-sm text-neutral-500">Označi šta je rasprodato — ostalo menjaju vlasnik i menadžer.</p>}</div>
      {canManage ? <Link href="/admin/proizvodi/novi" className="flex min-h-12 w-full items-center justify-center gap-2 rounded-full bg-black px-5 font-bold text-white transition active:scale-[.98] sm:w-auto"><Plus size={18} />Dodaj proizvod</Link> : null}
    </div>
    <ProductsBrowser products={products} categories={categories} canManage={canManage} />
  </main>;
}
