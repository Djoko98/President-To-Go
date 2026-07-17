import { NextResponse } from "next/server";
import { z } from "zod";
import { createClient } from "@/lib/supabase/server";

export async function GET(_: Request, { params }: { params: Promise<{ token: string }> }) {
  const { token } = await params;
  if (!z.string().uuid().safeParse(token).success) return NextResponse.json({ error: "Porudžbina ne postoji." }, { status: 404 });
  const supabase = await createClient();
  const { data, error } = await supabase.rpc("get_public_order", { p_token: token });
  if (error || !data) return NextResponse.json({ error: "Porudžbina ne postoji." }, { status: 404 });
  return NextResponse.json(data, { headers: { "Cache-Control": "private, no-store" } });
}
