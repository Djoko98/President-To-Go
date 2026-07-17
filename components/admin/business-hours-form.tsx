"use client";

import { useActionState, useEffect, useState } from "react";
import { AlertCircle, CheckCircle2, LoaderCircle } from "lucide-react";
import { toast } from "sonner";
import { saveBusinessHours, type AdminActionState } from "@/features/admin/actions";

const initialState: AdminActionState = { status: "idle", message: "" };
const days = ["Nedelja", "Ponedeljak", "Utorak", "Sreda", "Četvrtak", "Petak", "Subota"];

interface BusinessHour {
  day_of_week: number;
  opens_at: string | null;
  closes_at: string | null;
  is_closed: boolean;
}

export function BusinessHoursForm({ hours }: { hours: BusinessHour[] }) {
  const [state, action, pending] = useActionState(saveBusinessHours, initialState);
  const [closed, setClosed] = useState(() => Object.fromEntries(hours.map((day) => [day.day_of_week, day.is_closed])) as Record<number, boolean>);
  const byDay = new Map(hours.map((day) => [day.day_of_week, day]));

  useEffect(() => {
    if (state.status === "success") toast.success(state.message);
    if (state.status === "error") toast.error(state.message);
  }, [state]);

  return (
    <form action={action} className="mt-6 rounded-3xl bg-white p-4 sm:mt-7 sm:rounded-[30px] sm:p-7">
      <div><h2 className="text-2xl font-bold">Radno vreme</h2><p className="mt-1 text-sm text-neutral-500">Izmeni vreme otvaranja i zatvaranja za svaki dan.</p></div>
      <div className="mt-5 grid gap-3 lg:grid-cols-2">
        {days.map((name, dayOfWeek) => {
          const day = byDay.get(dayOfWeek);
          const isClosed = closed[dayOfWeek] ?? false;
          return <fieldset key={dayOfWeek} className="rounded-2xl border border-neutral-200 p-3 sm:p-4"><div className="flex items-center justify-between gap-3"><legend className="font-bold">{name}</legend><label className="flex cursor-pointer items-center gap-2 text-sm font-semibold"><input name={`closed-${dayOfWeek}`} type="checkbox" checked={isClosed} onChange={(event) => setClosed((current) => ({ ...current, [dayOfWeek]: event.target.checked }))} className="size-5 accent-black" />Zatvoreno</label></div><div className="mt-4 grid gap-3 min-[380px]:grid-cols-2"><label className="text-sm font-semibold text-neutral-600">Otvaranje<input aria-label={`${name} otvaranje`} name={`opens-${dayOfWeek}`} type="time" required={!isClosed} disabled={isClosed} defaultValue={day?.opens_at?.slice(0,5) ?? "10:00"} className="mt-1 min-h-11 w-full rounded-xl border border-neutral-200 px-3 disabled:bg-neutral-100 disabled:text-neutral-400" /></label><label className="text-sm font-semibold text-neutral-600">Zatvaranje<input aria-label={`${name} zatvaranje`} name={`closes-${dayOfWeek}`} type="time" required={!isClosed} disabled={isClosed} defaultValue={day?.closes_at?.slice(0,5) ?? "23:00"} className="mt-1 min-h-11 w-full rounded-xl border border-neutral-200 px-3 disabled:bg-neutral-100 disabled:text-neutral-400" /></label></div></fieldset>;
        })}
      </div>
      {state.status !== "idle" ? <div role={state.status === "error" ? "alert" : "status"} className={`mt-5 flex items-center gap-3 rounded-2xl p-4 font-semibold ${state.status === "success" ? "bg-emerald-50 text-emerald-900" : "bg-red-50 text-red-900"}`}>{state.status === "success" ? <CheckCircle2 size={20} /> : <AlertCircle size={20} />}<span>{state.message}</span></div> : null}
      <button disabled={pending} className="mt-5 flex min-h-12 w-full items-center justify-center gap-2 rounded-full bg-black px-6 font-bold text-white disabled:opacity-60">{pending ? <LoaderCircle className="animate-spin" size={20} /> : null}{pending ? "Čuvamo…" : "Sačuvaj radno vreme"}</button>
    </form>
  );
}
