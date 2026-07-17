import { SettingsForm } from "@/components/admin/settings-form";
import { requireAdmin } from "@/lib/security/admin";

export const dynamic = "force-dynamic";

export default async function Page() {
  const { supabase } = await requireAdmin(["owner"]);
  const { data: settings } = await supabase.from("app_settings").select("*").limit(1).single();
  if (!settings) return null;

  return (
    <main className="p-5 sm:p-8">
      <p className="text-sm font-semibold text-neutral-500">Owner pristup</p>
      <h1 className="text-4xl font-bold tracking-[-.05em]">Podešavanja</h1>
      <SettingsForm settings={{
        defaultPreparationMinutes: settings.default_preparation_minutes,
        slotIntervalMinutes: settings.slot_interval_minutes,
        maxOrdersPerSlot: settings.max_orders_per_slot,
        maxAdvanceMinutes: settings.max_advance_minutes,
        restaurantPhone: settings.restaurant_phone,
        restaurantAddress: settings.restaurant_address,
        timezone: settings.timezone,
      }} />
    </main>
  );
}
