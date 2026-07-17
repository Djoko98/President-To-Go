"use client";

import { useActionState, useEffect } from "react";
import { AlertCircle, CheckCircle2, LoaderCircle } from "lucide-react";
import { toast } from "sonner";
import { saveSettings, type AdminActionState } from "@/features/admin/actions";

const initialState: AdminActionState = { status: "idle", message: "" };
const input = "mt-2 min-h-12 w-full rounded-2xl border border-neutral-200 bg-white px-4";

interface Settings {
  defaultPreparationMinutes: number;
  slotIntervalMinutes: number;
  maxOrdersPerSlot: number;
  maxAdvanceMinutes: number;
  restaurantPhone: string;
  restaurantAddress: string;
  timezone: string;
}

export function SettingsForm({ settings }: { settings: Settings }) {
  const [state, action, pending] = useActionState(saveSettings, initialState);

  useEffect(() => {
    if (state.status === "success") toast.success(state.message);
    if (state.status === "error") toast.error(state.message);
  }, [state]);

  return (
    <form action={action} className="mt-6 grid gap-4 rounded-3xl bg-white p-4 sm:mt-7 sm:grid-cols-2 sm:gap-5 sm:rounded-[30px] sm:p-7">
      <div><label htmlFor="defaultPreparation" className="font-bold">Podrazumevana priprema (min)</label><input id="defaultPreparation" name="defaultPreparation" type="number" min="1" max="120" required defaultValue={settings.defaultPreparationMinutes} className={input} /></div>
      <div><label htmlFor="interval" className="font-bold">Interval termina (min)</label><select id="interval" name="interval" defaultValue={settings.slotIntervalMinutes} className={input}>{[5,10,15,20,30,60].map((value) => <option key={value}>{value}</option>)}</select></div>
      <div><label htmlFor="maxOrders" className="font-bold">Maks. porudžbina po terminu</label><input id="maxOrders" name="maxOrders" type="number" min="1" max="100" required defaultValue={settings.maxOrdersPerSlot} className={input} /></div>
      <div><label htmlFor="maxAdvanceMinutes" className="font-bold">Poručivanje unapred</label><select id="maxAdvanceMinutes" name="maxAdvanceMinutes" defaultValue={settings.maxAdvanceMinutes} className={input}>{[30,60,90,120].map((value) => <option key={value} value={value}>{value === 120 ? "2 sata (maksimum)" : `${value} minuta`}</option>)}</select><p className="mt-2 text-xs text-neutral-500">Gost može izabrati termin najviše 2 sata unapred.</p></div>
      <div><label htmlFor="phone" className="font-bold">Telefon restorana</label><input id="phone" name="phone" required defaultValue={settings.restaurantPhone} className={input} /></div>
      <div><label htmlFor="address" className="font-bold">Adresa</label><input id="address" name="address" required defaultValue={settings.restaurantAddress} className={input} /></div>
      <div className="sm:col-span-2 rounded-2xl bg-neutral-50 p-4"><span className="text-sm text-neutral-500">Vremenska zona</span><strong className="mt-1 block">{settings.timezone}</strong></div>
      {state.status !== "idle" ? <div role={state.status === "error" ? "alert" : "status"} className={`flex items-center gap-3 rounded-2xl p-4 font-semibold sm:col-span-2 ${state.status === "success" ? "bg-emerald-50 text-emerald-900" : "bg-red-50 text-red-900"}`}>{state.status === "success" ? <CheckCircle2 size={20} /> : <AlertCircle size={20} />}<span>{state.message}</span></div> : null}
      <button disabled={pending} className="flex min-h-13 items-center justify-center gap-2 rounded-full bg-black font-bold text-white disabled:opacity-60 sm:col-span-2">{pending ? <LoaderCircle className="animate-spin" size={20} /> : null}{pending ? "Čuvamo…" : "Sačuvaj podešavanja"}</button>
    </form>
  );
}
