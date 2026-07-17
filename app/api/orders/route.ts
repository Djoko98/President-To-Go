import { NextResponse } from "next/server";
import { checkoutSchema } from "@/lib/validation/checkout";
import { hashClientAddress } from "@/lib/security/rate-limit";
import { createClient } from "@/lib/supabase/server";
import type { Json } from "@/types/database";

export async function POST(request: Request) {
  let body: unknown;
  try { body = await request.json(); } catch { return NextResponse.json({ error: "Zahtev nije ispravan." }, { status: 400 }); }
  const parsed = checkoutSchema.safeParse(body);
  if (!parsed.success) return NextResponse.json({ error: parsed.error.issues[0]?.message ?? "Proveri podatke.", fields: parsed.error.flatten().fieldErrors }, { status: 422 });
  const forwarded = request.headers.get("x-forwarded-for")?.split(",")[0]?.trim();
  const ipHash = hashClientAddress(forwarded || "local");
  const supabase = await createClient();
  const payload = {
    customer_name: parsed.data.customerName,
    customer_phone: parsed.data.customerPhone,
    customer_note: parsed.data.customerNote ?? "",
    requested_pickup_at: parsed.data.requestedPickupAt,
    adult_confirmed: parsed.data.adultConfirmed,
    items: parsed.data.items.map((item) => ({ product_id: item.productId, quantity: item.quantity })),
  };
  const { data, error } = await supabase.rpc("create_order", { p_payload: payload as Json, p_idempotency_key: parsed.data.idempotencyKey, p_ip_hash: ipHash });
  if (error) return NextResponse.json({ error: error.message.replace(/^.*?: /, "") }, { status: 400 });
  return NextResponse.json(data, { status: 201, headers: { "Cache-Control": "no-store" } });
}
