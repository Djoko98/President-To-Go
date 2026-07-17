import { formatInTimeZone } from "date-fns-tz";
import { addDays } from "date-fns";
import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { BELGRADE_TIMEZONE } from "@/lib/dates";

export async function GET() {
  const supabase = await createClient();
  const days = Array.from({ length: 4 }, (_, index) => formatInTimeZone(addDays(new Date(), index), BELGRADE_TIMEZONE, "yyyy-MM-dd"));
  const results = await Promise.all(days.map((day) => supabase.rpc("get_available_slots", { p_day: day })));
  const slots = results.flatMap((result) => result.data ?? []).filter((slot) => slot.is_available && new Date(slot.starts_at) > new Date());
  return NextResponse.json({ slots }, { headers: { "Cache-Control": "no-store" } });
}
