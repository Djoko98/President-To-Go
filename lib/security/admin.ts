import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import type { AdminRole } from "@/types/domain";

export const ALL_ADMIN_ROLES: AdminRole[] = ["owner", "manager", "staff"];

export async function requireAdmin(allowed: AdminRole[] = ALL_ADMIN_ROLES) {
  const supabase = await createClient();
  const { data: claimsData } = await supabase.auth.getClaims();
  const userId = claimsData?.claims?.sub;
  if (!userId) redirect("/admin/prijava");
  const { data: profile } = await supabase.from("profiles").select("id,full_name,role,is_active").eq("id", userId).single();
  // Nalog bez profila je registracija koju vlasnik nikad nije odobrio; deaktiviran je bivši radnik.
  if (!profile || !profile.is_active) redirect("/admin/prijava?error=dozvola");
  if (!allowed.includes(profile.role)) redirect(profile.role === "staff" ? "/admin/porudzbine" : "/admin");
  return { supabase, profile };
}

/** Ista provera bez preusmeravanja — za layout, koji se renderuje i na stranici za prijavu. */
export async function readAdminProfile() {
  const supabase = await createClient();
  const { data: claimsData } = await supabase.auth.getClaims();
  const userId = claimsData?.claims?.sub;
  if (!userId) return null;
  const { data: profile } = await supabase.from("profiles").select("id,full_name,role,is_active").eq("id", userId).single();
  return profile && profile.is_active ? profile : null;
}
