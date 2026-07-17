import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import type { AdminRole } from "@/types/domain";

export async function requireAdmin(allowed: AdminRole[] = ["owner", "manager", "staff"]) {
  const supabase = await createClient();
  const { data: claimsData } = await supabase.auth.getClaims();
  const userId = claimsData?.claims?.sub;
  if (!userId) redirect("/admin/prijava");
  const { data: profile } = await supabase.from("profiles").select("id,full_name,role").eq("id", userId).single();
  if (!profile || !allowed.includes(profile.role)) redirect("/admin/prijava?error=dozvola");
  return { supabase, profile };
}
