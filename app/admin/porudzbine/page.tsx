import { OrdersBoard } from "@/components/admin/orders-board";
import { requireAdmin } from "@/lib/security/admin";
import type { AdminOrder } from "@/types/domain";
export const dynamic="force-dynamic";
export default async function Page(){const{ supabase }=await requireAdmin();const{data}=await supabase.from("orders").select("*,order_items(id,product_name_snapshot,quantity,line_total)").order("created_at",{ascending:false}).limit(100);return <OrdersBoard initialOrders={(data??[]) as unknown as AdminOrder[]}/>;}
