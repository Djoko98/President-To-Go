import Link from "next/link";
import { ArrowRight, Power } from "lucide-react";
import { StatCard } from "@/components/admin/stat-card";
import { setOrderingEnabled } from "@/features/admin/actions";
import { requireAdmin } from "@/lib/security/admin";
import { formatMoney } from "@/lib/money";

export const dynamic = "force-dynamic";
export default async function AdminDashboard() {
  const { supabase, profile } = await requireAdmin();
  const today = new Date(); today.setHours(0,0,0,0);
  const [{ data: orders }, { data: items }, { data: settings }] = await Promise.all([
    supabase.from("orders").select("id,status,total,created_at,accepted_at,ready_at").gte("created_at", today.toISOString()),
    supabase.from("order_items").select("product_name_snapshot,quantity,line_total,created_at").gte("created_at", today.toISOString()),
    supabase.from("app_settings").select("ordering_enabled").limit(1).single(),
  ]);
  const rows = orders ?? []; const itemRows = items ?? [];
  const active = rows.filter((order) => ["accepted","preparing"].includes(order.status)).length;
  const revenue = rows.filter((order) => order.status !== "rejected" && order.status !== "cancelled").reduce((sum, order) => sum + order.total, 0);
  const sold = itemRows.reduce((sum, item) => sum + item.quantity, 0);
  const counts = itemRows.reduce<Record<string,number>>((map,item) => ({ ...map, [item.product_name_snapshot]: (map[item.product_name_snapshot] ?? 0) + item.quantity }), {});
  const bestseller = Object.entries(counts).sort((a,b) => b[1]-a[1])[0]?.[0] ?? "—";
  const prepTimes = rows.flatMap((order) => order.accepted_at && order.ready_at ? [(new Date(order.ready_at).getTime()-new Date(order.accepted_at).getTime())/60000] : []);
  const averagePrep = prepTimes.length ? `${Math.round(prepTimes.reduce((a,b)=>a+b,0)/prepTimes.length)} min` : "—";
  const hours = Array.from({ length: 14 }, (_, index) => index + 10);
  const hourly = hours.map((hour) => rows.filter((order) => new Intl.DateTimeFormat("en", { timeZone: "Europe/Belgrade", hour: "2-digit", hour12: false }).format(new Date(order.created_at)) === String(hour).padStart(2,"0")).length);
  const maxHourly = Math.max(1, ...hourly);
  const rejected = rows.filter((order) => order.status === "rejected").length;
  const accepted = rows.filter((order) => !["pending","rejected","cancelled","expired"].includes(order.status)).length;
  return <main className="p-5 sm:p-8"><div className="flex flex-wrap items-end justify-between gap-4"><div><p className="text-sm font-semibold text-neutral-500">Zdravo, {profile.full_name || "tim Presidenta"}</p><h1 className="mt-1 text-3xl font-bold tracking-[-.05em] sm:text-4xl">Današnji pregled</h1></div><Link href="/admin/porudzbine" className="flex min-h-12 w-full items-center justify-center gap-2 rounded-full bg-black px-5 font-bold text-white sm:w-auto">Otvori porudžbine<ArrowRight size={18} /></Link></div><section className="mt-6 grid grid-cols-2 gap-3 sm:mt-7 sm:gap-4 xl:grid-cols-4"><StatCard label="Nove porudžbine" value={rows.filter((o)=>o.status==="pending").length} /><StatCard label="Aktivne" value={active} /><StatCard label="Spremne" value={rows.filter((o)=>o.status==="ready").length} /><StatCard label="Današnji prihod" value={formatMoney(revenue)} /></section><section className="mt-3 grid gap-3 min-[520px]:grid-cols-3 sm:mt-4 sm:gap-4"><StatCard label="Prodato napitaka" value={sold} /><StatCard label="Najprodavaniji proizvod" value={bestseller} /><StatCard label="Prosečno vreme pripreme" value={averagePrep} /></section><section className="mt-5 grid gap-4 sm:mt-6 xl:grid-cols-[2fr_1fr]"><div className="min-w-0 rounded-3xl bg-white p-4 sm:rounded-[30px] sm:p-5"><h2 className="text-xl font-bold">Porudžbine po satu</h2><div className="mt-5 overflow-x-auto pb-2"><div className="flex h-44 min-w-[560px] items-end gap-2" aria-label="Grafikon porudžbina po satu">{hourly.map((count,index)=><div key={hours[index]} className="flex min-w-0 flex-1 flex-col items-center justify-end gap-2"><span className="text-xs font-bold">{count||""}</span><div className="w-full rounded-t-lg bg-neutral-900" style={{height:`${Math.max(4,(count/maxHourly)*120)}px`}}/><span className="text-[10px] text-neutral-400">{hours[index]}</span></div>)}</div></div></div><div className="rounded-3xl bg-white p-4 sm:rounded-[30px] sm:p-5"><h2 className="text-xl font-bold">Ishod</h2><div className="mt-6 space-y-5 sm:mt-8"><div><div className="flex justify-between text-sm"><span>Prihvaćene</span><strong>{accepted}</strong></div><div className="mt-2 h-3 rounded-full bg-neutral-100"><div className="h-full rounded-full bg-emerald-500" style={{width:`${accepted+rejected?accepted/(accepted+rejected)*100:0}%`}}/></div></div><div><div className="flex justify-between text-sm"><span>Odbijene</span><strong>{rejected}</strong></div><div className="mt-2 h-3 rounded-full bg-neutral-100"><div className="h-full rounded-full bg-red-500" style={{width:`${accepted+rejected?rejected/(accepted+rejected)*100:0}%`}}/></div></div></div></div></section><section className="mt-5 flex flex-col gap-5 rounded-3xl bg-neutral-900 p-5 text-white sm:mt-6 sm:flex-row sm:items-center sm:justify-between sm:rounded-[32px] sm:p-6"><div><p className="text-sm font-semibold text-white/55">Status javnog poručivanja</p><h2 className="mt-2 text-xl font-bold sm:text-2xl">{settings?.ordering_enabled ? "Online poručivanje je uključeno" : "Online poručivanje je pauzirano"}</h2></div><form action={setOrderingEnabled} className="w-full sm:w-auto"><input type="hidden" name="enabled" value={settings?.ordering_enabled ? "false" : "true"} /><button className={`flex min-h-14 w-full items-center justify-center gap-3 rounded-full px-6 font-bold sm:w-auto ${settings?.ordering_enabled ? "bg-white text-black" : "bg-emerald-400 text-emerald-950"}`}><Power size={20} />{settings?.ordering_enabled ? "Pauziraj" : "Uključi"}</button></form></section></main>;
}
