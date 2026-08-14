import { createClient as createSupabaseClient } from "@supabase/supabase-js";
import type { Database } from "@/types/database";

/**
 * Klijent sa service role ključem — jedini način da se napravi auth nalog za radnika.
 * Sme da se zove isključivo iz server akcija; ključ nikada ne ide u browser.
 */
export function createAdminClient() {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const key = process.env.SUPABASE_SERVICE_ROLE_KEY;
  if (!url || !key) throw new Error("Nedostaje SUPABASE_SERVICE_ROLE_KEY — nalozi osoblja se ne mogu menjati.");
  return createSupabaseClient<Database>(url, key, { auth: { autoRefreshToken: false, persistSession: false } });
}
