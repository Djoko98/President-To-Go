"use client";

import { useEffect, useState } from "react";
import { BellRing, BellOff, LoaderCircle } from "lucide-react";
import { toast } from "sonner";
import { createClient } from "@/lib/supabase/browser";

function urlBase64ToBuffer(base64String: string): ArrayBuffer {
  const padding = "=".repeat((4 - (base64String.length % 4)) % 4);
  const base64 = (base64String + padding).replace(/-/g, "+").replace(/_/g, "/");
  const raw = atob(base64);
  const buffer = new ArrayBuffer(raw.length);
  const output = new Uint8Array(buffer);
  for (let i = 0; i < raw.length; i += 1) output[i] = raw.charCodeAt(i);
  return buffer;
}

type State = "idle" | "working" | "enabled";

export function NotificationsToggle() {
  const [state, setState] = useState<State>("idle");

  useEffect(() => {
    let cancelled = false;
    void (async () => {
      if (typeof window === "undefined" || !("serviceWorker" in navigator) || !("PushManager" in window)) return;
      try {
        const reg = await navigator.serviceWorker.getRegistration();
        const sub = reg ? await reg.pushManager.getSubscription() : null;
        if (!cancelled && sub && Notification.permission === "granted") setState("enabled");
      } catch { /* ignore */ }
    })();
    return () => { cancelled = true; };
  }, []);

  async function enable() {
    if (!("serviceWorker" in navigator) || !("PushManager" in window)) { toast.error("Ovaj uređaj ne podržava push obaveštenja."); return; }
    const key = process.env.NEXT_PUBLIC_VAPID_PUBLIC_KEY;
    if (!key) { toast.error("Push obaveštenja još nisu podešena na serveru."); return; }
    setState("working");
    try {
      const permission = await Notification.requestPermission();
      if (permission !== "granted") { toast.error("Obaveštenja nisu dozvoljena u podešavanjima uređaja."); setState("idle"); return; }
      if (!(await navigator.serviceWorker.getRegistration())) await navigator.serviceWorker.register("/sw.js");
      const reg = await navigator.serviceWorker.ready;
      const existing = await reg.pushManager.getSubscription();
      const sub = existing ?? await reg.pushManager.subscribe({ userVisibleOnly: true, applicationServerKey: urlBase64ToBuffer(key) });
      const json = sub.toJSON() as { endpoint?: string; keys?: { p256dh?: string; auth?: string } };
      if (!json.endpoint || !json.keys?.p256dh || !json.keys.auth) throw new Error("Pretplata nije potpuna.");
      const supabase = createClient();
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) { toast.error("Prijava je istekla."); setState("idle"); return; }
      const { error } = await supabase.from("push_subscriptions").upsert({ user_id: user.id, endpoint: json.endpoint, p256dh: json.keys.p256dh, auth: json.keys.auth, user_agent: navigator.userAgent }, { onConflict: "endpoint" });
      if (error) throw new Error(error.message);
      setState("enabled");
      toast.success("Obaveštenja su uključena na ovom uređaju.");
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "Obaveštenja nisu uključena.");
      setState("idle");
    }
  }

  async function disable() {
    setState("working");
    try {
      const reg = await navigator.serviceWorker.getRegistration();
      const sub = reg ? await reg.pushManager.getSubscription() : null;
      if (sub) {
        const endpoint = sub.endpoint;
        await sub.unsubscribe();
        await createClient().from("push_subscriptions").delete().eq("endpoint", endpoint);
      }
      setState("idle");
      toast.success("Obaveštenja su isključena na ovom uređaju.");
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "Greška pri isključivanju.");
      setState("enabled");
    }
  }

  const enabled = state === "enabled";
  return (
    <button type="button" onClick={enabled ? disable : enable} disabled={state === "working"} className={`flex min-h-12 w-full items-center justify-center gap-2 rounded-full border px-4 font-bold transition active:scale-[.98] disabled:cursor-wait disabled:opacity-60 sm:w-auto ${enabled ? "border-emerald-300 bg-emerald-50 text-emerald-800" : "border-neutral-300"}`}>
      {state === "working" ? <LoaderCircle size={18} className="animate-spin" /> : enabled ? <BellRing size={18} /> : <BellOff size={18} />}
      {enabled ? "Obaveštenja uključena" : "Uključi obaveštenja"}
    </button>
  );
}
