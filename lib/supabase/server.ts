import { createServerClient } from "@supabase/ssr";
import { cookies } from "next/headers";
import type { Database } from "@/types/database";
import { getSupabaseConfig } from "@/lib/supabase/config";

export async function createClient() {
  const cookieStore = await cookies();
  const { url, key } = getSupabaseConfig();
  return createServerClient<Database>(url, key, {
    cookies: {
      getAll: () => cookieStore.getAll(),
      setAll: (cookiesToSet) => {
        try {
          cookiesToSet.forEach(({ name, value, options }) => cookieStore.set(name, value, options));
        } catch {
          // Server Components cannot mutate cookies; proxy.ts refreshes sessions.
        }
      },
    },
  });
}
