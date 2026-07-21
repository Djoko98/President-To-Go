export type AdminRole = "owner" | "manager" | "staff";
export type OrderStatus =
  | "pending"
  | "accepted"
  | "preparing"
  | "ready"
  | "completed"
  | "rejected"
  | "cancelled"
  | "expired";

export interface Category {
  id: string;
  name: string;
  slug: string;
  image_url: string | null;
  position: number;
  is_active: boolean;
}

export interface Product {
  id: string;
  category_id: string;
  name: string;
  slug: string;
  description: string;
  ingredients: string;
  price: number;
  image_url: string | null;
  accent_color: string;
  contains_alcohol: boolean;
  preparation_minutes: number;
  max_quantity_per_order: number;
  position: number;
  is_available: boolean;
  is_active: boolean;
}

export interface CatalogData {
  categories: Category[];
  products: Product[];
  orderingEnabled: boolean;
}

export interface CartItem {
  product: Product;
  quantity: number;
}

export interface PublicOrder {
  order_number: string;
  customer_name: string;
  phone_last_four: string;
  requested_pickup_at: string;
  confirmed_pickup_at: string | null;
  status: OrderStatus;
  rejection_reason: string | null;
  total: number;
  created_at: string;
  items: Array<{ name: string; quantity: number; unit_price: number; line_total: number }>;
  events: Array<{ status: OrderStatus; created_at: string }>;
}

export interface AdminOrder {
  id: string;
  order_number: string;
  customer_name: string;
  customer_phone: string;
  customer_note: string | null;
  requested_pickup_at: string;
  confirmed_pickup_at: string | null;
  status: OrderStatus;
  total: number;
  contains_alcohol: boolean;
  created_at: string;
  order_items?: Array<{ id: string; product_name_snapshot: string; quantity: number; line_total: number }>;
}
