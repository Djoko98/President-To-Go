"use client";

import { useEffect, useMemo, useState } from "react";
import { zodResolver } from "@hookform/resolvers/zod";
import { Controller, useForm } from "react-hook-form";
import { ArrowLeft, ArrowRight, LoaderCircle } from "lucide-react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import { useCartStore } from "@/features/cart/store";
import { useCartHydration } from "@/features/cart/use-cart-hydration";
import { formatBelgradeTime } from "@/lib/dates";
import { calculateCartTotal, formatMoney } from "@/lib/money";
import { checkoutFormSchema, type CheckoutFormInput } from "@/lib/validation/checkout";

interface Slot { starts_at: string; is_available: boolean }

export function CheckoutForm() {
  const router = useRouter();
  const hydrated = useCartHydration();
  const items = useCartStore((state) => state.items);
  const clear = useCartStore((state) => state.clear);
  const [slots, setSlots] = useState<Slot[]>([]);
  const [slotsLoading, setSlotsLoading] = useState(true);
  const containsAlcohol = items.some((item) => item.product.contains_alcohol);
  const total = calculateCartTotal(items.map((item) => ({ price: item.product.price, quantity: item.quantity })));
  const { register, control, handleSubmit, formState: { errors, isSubmitting }, setError } = useForm<CheckoutFormInput>({
    resolver: zodResolver(checkoutFormSchema),
    defaultValues: { customerName: "", customerPhone: "+381 ", requestedPickupAt: "", customerNote: "", adultConfirmed: false, idempotencyKey: crypto.randomUUID() },
  });

  useEffect(() => {
    void fetch("/api/slots").then(async (response) => {
      if (!response.ok) throw new Error();
      const payload = await response.json() as { slots: Slot[] };
      setSlots(payload.slots);
    }).catch(() => toast.error("Termini nisu učitani. Pokušaj ponovo.")).finally(() => setSlotsLoading(false));
  }, []);

  const grouped = useMemo(() => slots.reduce<Record<string, Slot[]>>((groups, slot) => {
    const label = new Intl.DateTimeFormat("sr-Latn-RS", { timeZone: "Europe/Belgrade", weekday: "long", day: "numeric", month: "short" }).format(new Date(slot.starts_at));
    (groups[label] ??= []).push(slot); return groups;
  }, {}), [slots]);

  if (!hydrated) return <div className="mx-auto mt-16 h-96 max-w-2xl animate-pulse rounded-3xl bg-neutral-200" />;
  if (!items.length) return <main className="mx-auto grid min-h-[55dvh] max-w-lg place-items-center px-6 text-center"><div><h1 className="text-3xl font-bold">Korpa je prazna</h1><Link href="/" className="mt-6 inline-flex rounded-full bg-black px-6 py-3 font-bold text-white">Izaberi napitak</Link></div></main>;

  const submit = handleSubmit(async (values) => {
    try {
      const response = await fetch("/api/orders", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ ...values, items: items.map((item) => ({ productId: item.product.id, quantity: item.quantity })) }) });
      const payload = await response.json().catch(() => ({})) as { public_token?: string; error?: string; fields?: Record<string, string[]> };
      if (!response.ok || !payload.public_token) {
        const message = payload.error ?? "Porudžbina nije poslata. Pokušaj ponovo.";
        setError("root", { message });
        toast.error(message);
        return;
      }
      clear();
      router.replace(`/porudzbina/${payload.public_token}`);
    } catch {
      const message = "Nema veze sa serverom. Proveri internet i pokušaj ponovo.";
      setError("root", { message });
      toast.error(message);
    }
  }, () => { document.querySelector<HTMLElement>("[aria-invalid='true']")?.focus(); });

  const fieldClass = "mt-2 min-h-12 w-full rounded-2xl border border-neutral-200 bg-white px-4 text-base outline-none transition focus:border-neutral-800";
  return (
    <main className="mx-auto max-w-3xl px-5 pb-16 pt-6 sm:px-8">
      <Link href="/korpa" className="inline-flex min-h-11 items-center gap-2 font-semibold text-neutral-600"><ArrowLeft size={19} />Nazad u korpu</Link>
      <h1 className="mt-4 text-4xl font-bold tracking-[-.05em]">Podaci za preuzimanje</h1>
      <p className="mt-2 text-neutral-500">Plaćanje se vrši prilikom preuzimanja.</p>
      <form onSubmit={submit} className="mt-8 space-y-6" noValidate>
        <div><label htmlFor="customerName" className="font-bold">Ime i prezime</label><input id="customerName" autoComplete="name" aria-invalid={!!errors.customerName} className={fieldClass} {...register("customerName")} />{errors.customerName ? <p className="mt-1 text-sm font-semibold text-red-700">{errors.customerName.message}</p> : null}</div>
        <div><label htmlFor="customerPhone" className="font-bold">Broj telefona</label><input id="customerPhone" inputMode="tel" autoComplete="tel" aria-invalid={!!errors.customerPhone} className={fieldClass} {...register("customerPhone")} />{errors.customerPhone ? <p className="mt-1 text-sm font-semibold text-red-700">{errors.customerPhone.message}</p> : null}</div>
        <div><label htmlFor="requestedPickupAt" className="font-bold">Vreme preuzimanja</label><Controller name="requestedPickupAt" control={control} render={({ field }) => <select {...field} id="requestedPickupAt" aria-invalid={!!errors.requestedPickupAt} disabled={slotsLoading} className={fieldClass}><option value="">{slotsLoading ? "Učitavamo termine…" : "Izaberi termin"}</option>{Object.entries(grouped).map(([day, daySlots]) => <optgroup key={day} label={day}>{daySlots.map((slot, index) => <option key={slot.starts_at} value={slot.starts_at}>{index === 0 ? `Što pre · ${formatBelgradeTime(slot.starts_at)}` : formatBelgradeTime(slot.starts_at)}</option>)}</optgroup>)}</select>} />{errors.requestedPickupAt ? <p className="mt-1 text-sm font-semibold text-red-700">{errors.requestedPickupAt.message}</p> : !slotsLoading && !slots.length ? <p className="mt-2 rounded-xl bg-amber-50 p-3 text-sm font-semibold text-amber-900">Trenutno nema slobodnih termina.</p> : null}</div>
        <div><label htmlFor="customerNote" className="font-bold">Napomena <span className="font-normal text-neutral-400">(opciono)</span></label><textarea id="customerNote" rows={4} aria-invalid={!!errors.customerNote} className={`${fieldClass} py-3`} placeholder="Na primer: bez šećera" {...register("customerNote")} />{errors.customerNote ? <p className="mt-1 text-sm font-semibold text-red-700">{errors.customerNote.message}</p> : null}</div>
        {containsAlcohol ? <label className="flex cursor-pointer items-start gap-3 rounded-2xl bg-white p-4 shadow-sm"><input type="checkbox" className="mt-1 size-5 accent-black" {...register("adultConfirmed")} /><span><strong>Potvrđujem da sam punoletan/na.</strong><span className="mt-1 block text-sm text-neutral-500">Porudžbina sadrži alkohol. Pri preuzimanju može biti zatražen dokument.</span></span></label> : null}
        {errors.root ? <p role="alert" className="rounded-2xl bg-red-50 p-4 font-semibold text-red-800">{errors.root.message}</p> : null}
        <div className="rounded-[28px] bg-neutral-900 p-5 text-white"><div className="flex items-center justify-between"><span className="text-neutral-400">Ukupno za plaćanje</span><strong className="text-2xl">{formatMoney(total)}</strong></div><button type="submit" disabled={isSubmitting || !slots.length} className="mt-5 flex min-h-14 w-full items-center justify-center gap-3 rounded-full bg-white px-6 font-bold text-black disabled:cursor-not-allowed disabled:opacity-50">{isSubmitting ? <><LoaderCircle className="animate-spin" />Šaljemo…</> : <>Pošalji porudžbinu<ArrowRight /></>}</button></div>
      </form>
    </main>
  );
}
