import Link from "next/link";
import { Plus } from "lucide-react";
import { ProductsBrowser } from "@/components/admin/products-browser";
import { requireAdmin } from "@/lib/security/admin";

export const dynamic = "force-dynamic";

export default async function Page() {
  const { supabase } = await requireAdmin(["owner", "manager"]);
  const [{ data: productData }, { data: categoryData }] = await Promise.all([
    supabase.from("products").select("id,name,ingredients,price,is_available,is_active,category_id,categories(name)").order("position"),
    supabase.from("categories").select("id,name,position").order("position"),
  ]);
  const products = (productData ?? []) as unknown as Array<{ id: string; name: string; ingredients: string; price: number; is_available: boolean; is_active: boolean; category_id: string; categories: { name: string } | null }>;
  const categories = (categoryData ?? []) as Array<{ id: string; name: string }>;

  return <main className="p-5 sm:p-8">
    <div className="flex flex-wrap items-end justify-between gap-4">
      <div><p className="text-sm font-semibold text-neutral-500">Katalog</p><h1 className="text-3xl font-bold tracking-[-.05em] sm:text-4xl">Proizvodi</h1></div>
      <Link href="/admin/proizvodi/novi" className="flex min-h-12 w-full items-center justify-center gap-2 rounded-full bg-black px-5 font-bold text-white transition active:scale-[.98] sm:w-auto"><Plus size={18} />Dodaj proizvod</Link>
    </div>
    <ProductsBrowser products={products} categories={categories} />
  </main>;
}
