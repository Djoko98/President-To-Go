import webpush from "npm:web-push@3.6.7";
import { createClient } from "npm:@supabase/supabase-js@2";

interface PushRow { endpoint: string; p256dh: string; auth: string }

Deno.serve(async (req: Request) => {
  const expected = Deno.env.get("WEBHOOK_SECRET");
  if (!expected || req.headers.get("x-webhook-secret") !== expected) {
    return new Response("Unauthorized", { status: 401 });
  }

  const publicKey = Deno.env.get("VAPID_PUBLIC_KEY");
  const privateKey = Deno.env.get("VAPID_PRIVATE_KEY");
  const subject = Deno.env.get("VAPID_SUBJECT") ?? "mailto:admin@presidenttogo.rs";
  if (!publicKey || !privateKey) return new Response("Missing VAPID keys", { status: 500 });
  webpush.setVapidDetails(subject, publicKey, privateKey);

  const supabase = createClient(Deno.env.get("SUPABASE_URL")!, Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!);
  const { data: subs } = await supabase.from("push_subscriptions").select("endpoint,p256dh,auth");

  let payload: Record<string, unknown> = {};
  try { payload = await req.json(); } catch { payload = {}; }
  const message = JSON.stringify({
    title: "Nova porudžbina",
    body: `#${payload.order_number ?? ""} · ${payload.customer_name ?? ""}`.trim(),
    url: "/admin/porudzbine",
  });

  const rows = (subs ?? []) as PushRow[];
  const results = await Promise.allSettled(rows.map(async (s) => {
    try {
      await webpush.sendNotification({ endpoint: s.endpoint, keys: { p256dh: s.p256dh, auth: s.auth } }, message);
    } catch (err) {
      const code = (err as { statusCode?: number }).statusCode;
      if (code === 404 || code === 410) await supabase.from("push_subscriptions").delete().eq("endpoint", s.endpoint);
      throw err;
    }
  }));

  const sent = results.filter((r) => r.status === "fulfilled").length;
  return new Response(JSON.stringify({ sent, total: rows.length }), { headers: { "Content-Type": "application/json" } });
});
