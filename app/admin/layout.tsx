import type { Metadata } from "next";
import { AdminShell } from "@/components/admin/admin-shell";
import { createClient } from "@/lib/supabase/server";
import { readAdminProfile } from "@/lib/security/admin";
export const metadata: Metadata = { title: { default: "Administracija", template: "%s · Admin" }, robots: { index: false, follow: false } };
export default async function Layout({ children }: { children: React.ReactNode }) {
  const supabase = await createClient();
  // Layout pokriva i stranicu za prijavu, pa se profil čita bez preusmeravanja.
  const [{ data: settings }, profile] = await Promise.all([
    supabase.from("app_settings").select("ordering_enabled").limit(1).single(),
    readAdminProfile(),
  ]);
  return <AdminShell orderingEnabled={settings?.ordering_enabled ?? true} role={profile?.role ?? null}>{children}</AdminShell>;
}
