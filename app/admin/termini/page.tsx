import { BusinessHoursForm } from "@/components/admin/business-hours-form";
import { SubmitButton } from "@/components/admin/submit-button";
import { addBlockedSlot, removeBlockedSlot } from "@/features/admin/actions";
import { requireAdmin } from "@/lib/security/admin";
import { formatBelgradeTime } from "@/lib/dates";

export const dynamic = "force-dynamic";

export default async function Page() {
  const { supabase } = await requireAdmin(["owner", "manager"]);
  const [{ data: blocked }, { data: hours }] = await Promise.all([
    supabase.from("blocked_slots").select("id,starts_at,ends_at,reason").gte("ends_at", new Date().toISOString()).order("starts_at"),
    supabase.from("business_hours").select("day_of_week,opens_at,closes_at,is_closed").order("day_of_week"),
  ]);
  const input = "mt-2 min-h-12 w-full rounded-2xl border border-neutral-200 px-4";

  return (
    <main className="p-5 sm:p-8">
      <h1 className="text-4xl font-bold tracking-[-.05em]">Termini i radno vreme</h1>
      <BusinessHoursForm hours={hours ?? []} />
      <section className="mt-6 rounded-3xl bg-white p-4 sm:mt-7 sm:rounded-[30px] sm:p-5">
        <h2 className="text-2xl font-bold">Blokiraj termin</h2>
        <p className="mt-1 text-sm text-neutral-500">Privremeno onemogući poručivanje tokom gužve ili pauze.</p>
        <form action={addBlockedSlot} className="mt-4 grid gap-4 sm:grid-cols-2">
          <div><label htmlFor="startsAt" className="font-bold">Početak</label><input id="startsAt" name="startsAt" type="datetime-local" required className={input} /></div>
          <div><label htmlFor="minutes" className="font-bold">Trajanje (min)</label><input id="minutes" name="minutes" type="number" min="15" max="1440" defaultValue="60" className={input} /></div>
          <div className="sm:col-span-2"><label htmlFor="reason" className="font-bold">Razlog</label><input id="reason" name="reason" required placeholder="Privremena gužva" className={input} /></div>
          <SubmitButton pendingText="Blokiramo…" className="min-h-12 rounded-full bg-black px-6 font-bold text-white sm:col-span-2">Blokiraj termin</SubmitButton>
        </form>
      </section>
      <section className="mt-7">
        <h2 className="text-2xl font-bold">Aktivne blokade</h2>
        <div className="mt-4 grid gap-3">
          {(blocked ?? []).map((slot) => <div key={slot.id} className="flex flex-col gap-3 rounded-2xl bg-white p-4 sm:flex-row sm:items-center sm:justify-between"><div><p className="font-bold">{new Intl.DateTimeFormat("sr-Latn-RS", { timeZone: "Europe/Belgrade", day: "numeric", month: "long" }).format(new Date(slot.starts_at))} · {formatBelgradeTime(slot.starts_at)}–{formatBelgradeTime(slot.ends_at)}</p><p className="text-sm text-neutral-500">{slot.reason}</p></div><form action={removeBlockedSlot} className="w-full sm:w-auto"><input type="hidden" name="id" value={slot.id} /><SubmitButton spinnerSize={16} pendingText="Uklanjamo…" className="min-h-11 w-full rounded-full border border-red-200 px-4 font-bold text-red-700 sm:w-auto">Ukloni blokadu</SubmitButton></form></div>)}
          {!blocked?.length ? <p className="rounded-2xl bg-white p-5 text-neutral-500">Nema aktivnih blokada.</p> : null}
        </div>
      </section>
    </main>
  );
}
