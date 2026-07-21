"use client";
import { useCallback, useEffect, useState } from "react";
import { Check, Clock3, Phone, RefreshCw } from "lucide-react";
import { createClient } from "@/lib/supabase/browser";
import { clearActiveOrder, saveActiveOrder } from "@/lib/active-order";
import { formatBelgradeTime } from "@/lib/dates";
import { formatMoney } from "@/lib/money";
import { isActiveOrderStatus, ORDER_STATUS_LABELS } from "@/lib/order-status";
import type { PublicOrder } from "@/types/domain";

const progress = ["pending", "accepted", "preparing", "ready", "completed"] as const;

export function OrderTracker({ token, initialOrder, phone }: { token: string; initialOrder: PublicOrder; phone: string }) {
  const [order, setOrder] = useState(initialOrder);
  const [refreshing, setRefreshing] = useState(false);
  const refresh = useCallback(async () => {
    setRefreshing(true);
    try { const response = await fetch(`/api/orders/${token}`, { cache: "no-store" }); if (response.ok) setOrder(await response.json() as PublicOrder); } finally { setRefreshing(false); }
  }, [token]);
  useEffect(() => {
    const supabase = createClient();
    const channel = supabase.channel(`order:${token}:status`, { config: { private: true } }).on("broadcast", { event: "status_changed" }, () => void refresh()).subscribe();
    const poll = window.setInterval(() => void refresh(), 15_000);
    return () => { window.clearInterval(poll); void supabase.removeChannel(channel); };
  }, [refresh, token]);
  useEffect(() => {
    if (isActiveOrderStatus(order.status)) {
      saveActiveOrder({ token, orderNumber: order.order_number });
    } else {
      clearActiveOrder(token);
    }
  }, [order.order_number, order.status, token]);
  const current = progress.indexOf(order.status as (typeof progress)[number]);
  const terminal = ["rejected", "cancelled", "expired"].includes(order.status);
  return (
    <main className="mx-auto max-w-2xl px-5 pb-16 pt-8 sm:px-8">
      <div className="flex items-center justify-between"><span className="rounded-full bg-white px-4 py-2 text-sm font-bold shadow-sm">#{order.order_number}</span><button onClick={() => void refresh()} disabled={refreshing} aria-label="Osveži status" className="touch-target grid place-items-center rounded-full bg-white shadow-sm"><RefreshCw size={18} className={refreshing ? "animate-spin" : ""} /></button></div>
      <div className={`mt-8 rounded-[32px] p-7 ${order.status === "ready" ? "bg-emerald-950 text-white" : terminal ? "bg-red-950 text-white" : "bg-neutral-900 text-white"}`}><Clock3 size={30} /><p className="mt-7 text-sm font-semibold uppercase tracking-[.14em] text-white/60">Status porudžbine</p><h1 className="mt-2 text-3xl font-bold tracking-[-.04em]">{ORDER_STATUS_LABELS[order.status]}</h1><p className="mt-3 text-white/70">{order.status === "pending" ? "Porudžbina je poslata. Sačekaj potvrdu restorana." : order.status === "ready" ? "Tvoj napitak te čeka u restoranu President." : "Status se ažurira automatski."}</p>{order.confirmed_pickup_at ? <div className="mt-6 rounded-2xl bg-white/10 p-4"><span className="text-sm text-white/60">Potvrđeno vreme</span><strong className="mt-1 block text-3xl">{formatBelgradeTime(order.confirmed_pickup_at)}</strong></div> : null}{order.status === "rejected" && order.rejection_reason ? <div className="mt-6 rounded-2xl bg-white/10 p-4"><span className="text-sm text-white/60">Razlog odbijanja</span><p className="mt-1 font-semibold">{order.rejection_reason}</p></div> : null}</div>
      <section className="mt-8"><h2 className="text-xl font-bold">Tok porudžbine</h2><ol className="mt-4 space-y-1">{progress.map((status, index) => <li key={status} className="flex min-h-12 items-center gap-3"><span className={`grid size-7 shrink-0 place-items-center rounded-full border ${index <= current ? "border-black bg-black text-white" : "border-neutral-300 bg-transparent text-transparent"}`}>{index <= current ? <Check size={15} /> : null}</span><span className={index <= current ? "font-bold" : "text-neutral-400"}>{ORDER_STATUS_LABELS[status]}</span></li>)}</ol></section>
      <section className="mt-8 rounded-3xl bg-white p-5 shadow-sm"><div className="flex justify-between"><div><p className="text-sm text-neutral-500">Preuzimanje</p><p className="font-bold">{formatBelgradeTime(order.requested_pickup_at)}</p></div><div className="text-right"><p className="text-sm text-neutral-500">Ukupno</p><p className="font-bold">{formatMoney(order.total)}</p></div></div><div className="mt-5 border-t border-neutral-100 pt-4">{order.items.map((item) => <div key={`${item.name}-${item.quantity}`} className="flex justify-between py-1"><span>{item.quantity} × {item.name}</span><span>{formatMoney(item.line_total)}</span></div>)}</div><p className="mt-4 text-sm text-neutral-500">Za: {order.customer_name} · telefon završava na {order.phone_last_four}</p></section>
      <a href={`tel:${phone}`} className="mt-6 flex min-h-14 items-center justify-center gap-2 rounded-full border border-neutral-300 font-bold"><Phone size={19} />Pozovi restoran</a>
    </main>
  );
}
