import { NextResponse } from "next/server";
import { z } from "zod";
import { requireAdmin } from "@/lib/security/admin";
import { canTransitionOrder } from "@/lib/order-status";
import type { OrderStatus } from "@/types/domain";

const schema = z.object({ status: z.enum(["accepted","preparing","ready","completed","rejected","cancelled"]), pickupMinutes: z.number().int().min(5).max(180).nullish(), confirmedPickupAt: z.string().datetime({ offset: true }).nullish(), note: z.string().trim().max(300).nullish() });
export async function POST(request: Request, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params; if (!z.string().uuid().safeParse(id).success) return NextResponse.json({ error: "Porudžbina nije ispravna." }, { status: 400 });
  const parsed = schema.safeParse(await request.json()); if (!parsed.success) return NextResponse.json({ error: parsed.error.issues[0]?.message }, { status: 422 });
  const { supabase } = await requireAdmin(); const { data: current } = await supabase.from("orders").select("status").eq("id", id).single();
  if (!current || !canTransitionOrder(current.status, parsed.data.status as OrderStatus)) return NextResponse.json({ error: "Nedozvoljen prelaz statusa." }, { status: 409 });
  const confirmedPickupAt = parsed.data.pickupMinutes ? new Date(Date.now() + parsed.data.pickupMinutes * 60_000).toISOString() : parsed.data.confirmedPickupAt ?? null;
  const { data, error } = await supabase.rpc("change_order_status", { p_order_id: id, p_status: parsed.data.status, p_confirmed_pickup_at: confirmedPickupAt, p_note: parsed.data.note ?? null });
  if (error) return NextResponse.json({ error: error.message }, { status: 400 });
  return NextResponse.json(data);
}
