import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { z } from "zod";
import { PublicHeader } from "@/components/public/public-header";
import { OrderTracker } from "@/components/public/order-tracker";
import { createClient } from "@/lib/supabase/server";
import type { PublicOrder } from "@/types/domain";
export const metadata: Metadata = { title: "Status porudžbine" };
export const dynamic = "force-dynamic";
export default async function Page({ params }: { params: Promise<{ publicToken: string }> }) {
  const { publicToken } = await params; if (!z.string().uuid().safeParse(publicToken).success) notFound();
  const supabase = await createClient();
  const [{ data }, { data: settings }] = await Promise.all([supabase.rpc("get_public_order", { p_token: publicToken }), supabase.from("app_settings").select("restaurant_phone").limit(1).maybeSingle()]);
  if (!data) notFound();
  return <><PublicHeader /><OrderTracker token={publicToken} initialOrder={data as unknown as PublicOrder} phone={settings?.restaurant_phone ?? "+381000000000"} /></>;
}
