import type { Metadata } from "next";
import { AdminShell } from "@/components/admin/admin-shell";
import { createClient } from "@/lib/supabase/server";
export const metadata: Metadata = { title: { default: "Administracija", template: "%s · Admin" }, robots: { index: false, follow: false } };
export default async function Layout({ children }: { children: React.ReactNode }) {
  const supabase = await createClient();
  const { data: settings } = await supabase.from("app_settings").select("ordering_enabled").limit(1).single();
  return <AdminShell orderingEnabled={settings?.ordering_enabled ?? true}>{children}</AdminShell>;
}
