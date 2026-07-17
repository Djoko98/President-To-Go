import { createServerClient } from "@supabase/ssr";
import { NextResponse, type NextRequest } from "next/server";
import type { Database } from "@/types/database";

export async function proxy(request: NextRequest) {
  let response = NextResponse.next({ request });
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const key = process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY;
  if (!url || !key) return response;
  const supabase = createServerClient<Database>(url, key, {
    cookies: {
      getAll: () => request.cookies.getAll(),
      setAll: (cookiesToSet) => {
        cookiesToSet.forEach(({ name, value }) => request.cookies.set(name, value));
        response = NextResponse.next({ request });
        cookiesToSet.forEach(({ name, value, options }) => response.cookies.set(name, value, options));
      },
    },
  });
  const { data } = await supabase.auth.getClaims();
  if (request.nextUrl.pathname.startsWith("/admin") && request.nextUrl.pathname !== "/admin/prijava" && !data?.claims) {
    const login = request.nextUrl.clone();
    login.pathname = "/admin/prijava";
    login.searchParams.set("next", request.nextUrl.pathname);
    return NextResponse.redirect(login);
  }
  response.headers.set("Cache-Control", "private, no-store");
  return response;
}

export const config = { matcher: ["/admin/:path*"] };
