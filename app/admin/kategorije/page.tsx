import { saveCategory } from "@/features/admin/actions";
import { requireAdmin } from "@/lib/security/admin";

export const dynamic = "force-dynamic";

export default async function Page() {
  const { supabase } = await requireAdmin(["owner", "manager"]);
  const { data } = await supabase.from("categories").select("id,name,slug,is_active,position").order("position");
  const input = "min-h-11 w-full rounded-xl border border-neutral-200 px-3";

  return <main className="p-5 sm:p-8">
    <p className="text-sm font-semibold text-neutral-500">Redosled i vidljivost</p>
    <h1 className="text-3xl font-bold tracking-[-.05em] sm:text-4xl">Kategorije</h1>
    <div className="mt-6 grid gap-3 sm:mt-7 sm:gap-4">
      {(data ?? []).map((category) => <form key={category.id} action={saveCategory} className="grid gap-4 rounded-3xl bg-white p-4 sm:grid-cols-[50px_1fr_1fr_auto] sm:items-end sm:p-5">
        <input type="hidden" name="id" value={category.id} />
        <div className="flex items-center gap-3 sm:block"><label className="text-xs font-bold text-neutral-400">Red</label><div className="grid size-11 place-items-center rounded-xl bg-neutral-100 font-bold sm:mt-2">{category.position + 1}</div></div>
        <div><label className="text-sm font-bold">Naziv</label><input name="name" required defaultValue={category.name} className={`mt-2 ${input}`} /></div>
        <div><label className="text-sm font-bold">Slug</label><input name="slug" required defaultValue={category.slug} className={`mt-2 ${input}`} /></div>
        <div className="grid grid-cols-2 items-center gap-3 sm:flex"><label className="flex min-h-11 items-center gap-2 font-bold"><input name="isActive" type="checkbox" defaultChecked={category.is_active} className="size-5 accent-black" />Aktivna</label><button className="min-h-11 rounded-full bg-black px-5 font-bold text-white">Sačuvaj</button></div>
      </form>)}
    </div>
  </main>;
}
