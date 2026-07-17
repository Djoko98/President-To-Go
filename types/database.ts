import type { AdminRole, OrderStatus } from "@/types/domain";

type GenericTable<Row, Insert = Partial<Row>, Update = Partial<Row>> = {
  Row: Row;
  Insert: Insert;
  Update: Update;
  Relationships: [];
};

export type Json = string | number | boolean | null | { [key: string]: Json | undefined } | Json[];

export interface Database {
  public: {
    Tables: {
      categories: GenericTable<{
        id: string; name: string; slug: string; image_url: string | null; position: number; is_active: boolean; created_at: string; updated_at: string;
      }>;
      products: GenericTable<{
        id: string; category_id: string; name: string; slug: string; description: string; ingredients: string; price: number; image_url: string | null; accent_color: string; contains_alcohol: boolean; preparation_minutes: number; max_quantity_per_order: number; position: number; is_available: boolean; is_active: boolean; created_at: string; updated_at: string;
      }>;
      app_settings: GenericTable<{
        id: string; ordering_enabled: boolean; default_preparation_minutes: number; slot_interval_minutes: number; max_orders_per_slot: number; max_advance_minutes: number; restaurant_phone: string; restaurant_address: string; timezone: string; updated_at: string;
      }>;
      profiles: GenericTable<{ id: string; full_name: string; role: AdminRole; created_at: string; updated_at: string }>;
      orders: GenericTable<{
        id: string; public_token: string; order_number: string; customer_name: string; customer_phone: string; customer_note: string | null; requested_pickup_at: string; confirmed_pickup_at: string | null; status: OrderStatus; subtotal: number; total: number; contains_alcohol: boolean; rejection_reason: string | null; created_at: string; accepted_at: string | null; ready_at: string | null; completed_at: string | null; updated_at: string;
      }>;
      order_items: GenericTable<{ id: string; order_id: string; product_id: string | null; product_name_snapshot: string; unit_price_snapshot: number; quantity: number; line_total: number; created_at: string }>;
      business_hours: GenericTable<{ id: string; day_of_week: number; opens_at: string | null; closes_at: string | null; break_starts_at: string | null; break_ends_at: string | null; is_closed: boolean }>;
      blocked_slots: GenericTable<{ id: string; starts_at: string; ends_at: string; reason: string; created_at: string }>;
      order_status_events: GenericTable<{ id: string; order_id: string; previous_status: OrderStatus | null; new_status: OrderStatus; changed_by: string | null; note: string | null; created_at: string }>;
      notifications: GenericTable<{ id: string; order_id: string; channel: "in_app" | "browser" | "sms"; event_type: string; recipient: string; status: "queued" | "sent" | "failed" | "skipped"; provider_message_id: string | null; error_message: string | null; created_at: string; sent_at: string | null }>;
    };
    Views: Record<string, never>;
    Functions: {
      create_order: { Args: { p_payload: Json; p_idempotency_key: string; p_ip_hash: string }; Returns: Json };
      get_public_order: { Args: { p_token: string }; Returns: Json };
      get_available_slots: { Args: { p_day: string }; Returns: Array<{ starts_at: string; is_available: boolean }> };
      change_order_status: { Args: { p_order_id: string; p_status: OrderStatus; p_confirmed_pickup_at?: string | null; p_note?: string | null }; Returns: Database["public"]["Tables"]["orders"]["Row"] };
      is_admin: { Args: { required_roles?: AdminRole[] }; Returns: boolean };
    };
    Enums: { admin_role: AdminRole; order_status: OrderStatus };
    CompositeTypes: Record<string, never>;
  };
}
