import { createBrowserClient } from "@supabase/ssr";
import type { SupabaseClient } from "@supabase/supabase-js";
import type { Database } from "@/types/database";
import { getSupabaseConfig } from "@/lib/supabase/config";

let client: SupabaseClient<Database> | undefined;

export function createClient(): SupabaseClient<Database> {
  if (client) return client;
  const { url, key } = getSupabaseConfig();
  client = createBrowserClient<Database>(url, key);
  return client;
}
