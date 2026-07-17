import { formatInTimeZone } from "date-fns-tz";
import { addDays, addMinutes } from "date-fns";
import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { BELGRADE_TIMEZONE } from "@/lib/dates";

export async function GET() {
  const supabase = await createClient();
  const now = new Date();
  const { data: settings, error: settingsError } = await supabase.from("app_settings").select("max_advance_minutes").limit(1).single();
  const days = Array.from({ length: 2 }, (_, index) => formatInTimeZone(addDays(now, index), BELGRADE_TIMEZONE, "yyyy-MM-dd"));
  const results = await Promise.all(days.map((day) => supabase.rpc("get_available_slots", { p_day: day })));
  const slotsError = results.find((result) => result.error)?.error;
  if (settingsError || slotsError || !settings) {
    return NextResponse.json({ error: "Termini trenutno nisu dostupni." }, { status: 503, headers: { "Cache-Control": "no-store" } });
  }
  const latest = addMinutes(now, Math.min(settings.max_advance_minutes, 120));
  const slots = results
    .flatMap((result) => result.data ?? [])
    .filter((slot) => slot.is_available && new Date(slot.starts_at) > now && new Date(slot.starts_at) <= latest)
    .sort((a, b) => new Date(a.starts_at).getTime() - new Date(b.starts_at).getTime());
  return NextResponse.json({ slots }, { headers: { "Cache-Control": "no-store" } });
}
