"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { z } from "zod";
import { requireAdmin } from "@/lib/security/admin";
import { productSchema } from "@/lib/validation/product";

export async function signOut() {
  const { supabase } = await requireAdmin(); await supabase.auth.signOut(); redirect("/admin/prijava");
}

export async function setOrderingEnabled(formData: FormData) {
  const { supabase } = await requireAdmin(["owner", "manager"]);
  const enabled = formData.get("enabled") === "true";
  const { error } = await supabase.from("app_settings").update({ ordering_enabled: enabled }).not("id", "is", null);
  if (error) throw new Error(error.message); revalidatePath("/admin"); revalidatePath("/");
}

export async function setProductAvailability(formData: FormData) {
  const { supabase } = await requireAdmin(["owner", "manager"]);
  const id = z.string().uuid().parse(formData.get("id")); const isAvailable = formData.get("available") === "true";
  const { error } = await supabase.from("products").update({ is_available: isAvailable }).eq("id", id);
  if (error) throw new Error(error.message); revalidatePath("/admin/proizvodi"); revalidatePath("/");
}

export async function saveProduct(formData: FormData) {
  const { supabase } = await requireAdmin(["owner", "manager"]);
  const id = formData.get("id") ? z.string().uuid().parse(formData.get("id")) : null;
  const parsed = productSchema.parse({
    name: formData.get("name"), slug: formData.get("slug"), description: formData.get("description"), ingredients: formData.get("ingredients"), priceRsd: formData.get("priceRsd"), categoryId: formData.get("categoryId"), accentColor: formData.get("accentColor"), containsAlcohol: formData.get("containsAlcohol") === "on", preparationMinutes: formData.get("preparationMinutes"), maxQuantity: formData.get("maxQuantity"), isAvailable: formData.get("isAvailable") === "on", isActive: formData.get("isActive") === "on",
  });
  const values = { name: parsed.name, slug: parsed.slug, description: parsed.description, ingredients: parsed.ingredients, price: parsed.priceRsd * 100, category_id: parsed.categoryId, accent_color: parsed.accentColor, contains_alcohol: parsed.containsAlcohol, preparation_minutes: parsed.preparationMinutes, max_quantity_per_order: parsed.maxQuantity, is_available: parsed.isAvailable, is_active: parsed.isActive };
  const result = id ? await supabase.from("products").update(values).eq("id", id) : await supabase.from("products").insert(values);
  if (result.error) throw new Error(result.error.message); revalidatePath("/admin/proizvodi"); revalidatePath("/"); redirect("/admin/proizvodi");
}

export async function saveCategory(formData: FormData) {
  const { supabase } = await requireAdmin(["owner", "manager"]);
  const id = z.string().uuid().parse(formData.get("id"));
  const name = z.string().trim().min(2).max(80).parse(formData.get("name"));
  const slug = z.string().regex(/^[a-z0-9]+(?:-[a-z0-9]+)*$/).parse(formData.get("slug"));
  const { error } = await supabase.from("categories").update({ name, slug, is_active: formData.get("isActive") === "on" }).eq("id", id);
  if (error) throw new Error(error.message); revalidatePath("/admin/kategorije"); revalidatePath("/");
}

export async function addBlockedSlot(formData: FormData) {
  const { supabase } = await requireAdmin(["owner", "manager"]);
  const startsAt = z.string().datetime({ local: true }).parse(formData.get("startsAt"));
  const minutes = z.coerce.number().int().min(15).max(1440).parse(formData.get("minutes"));
  const reason = z.string().trim().min(2).max(200).parse(formData.get("reason"));
  const start = new Date(startsAt); const end = new Date(start.getTime() + minutes * 60_000);
  const { error } = await supabase.from("blocked_slots").insert({ starts_at: start.toISOString(), ends_at: end.toISOString(), reason });
  if (error) throw new Error(error.message); revalidatePath("/admin/termini");
}

export async function removeBlockedSlot(formData: FormData) {
  const { supabase } = await requireAdmin(["owner", "manager"]); const id = z.string().uuid().parse(formData.get("id"));
  const { error } = await supabase.from("blocked_slots").delete().eq("id", id); if (error) throw new Error(error.message); revalidatePath("/admin/termini");
}

export async function saveSettings(formData: FormData) {
  const { supabase } = await requireAdmin(["owner"]);
  const schema = z.object({ defaultPreparation: z.coerce.number().int().min(1).max(180), interval: z.coerce.number().int().refine((value) => [5,10,15,20,30,60].includes(value)), maxOrders: z.coerce.number().int().min(1).max(100), maxAdvance: z.coerce.number().int().min(0).max(60), phone: z.string().regex(/^\+381[0-9]{8,9}$/), address: z.string().trim().min(3).max(200) });
  const values = schema.parse({ defaultPreparation: formData.get("defaultPreparation"), interval: formData.get("interval"), maxOrders: formData.get("maxOrders"), maxAdvance: formData.get("maxAdvance"), phone: formData.get("phone"), address: formData.get("address") });
  const { error } = await supabase.from("app_settings").update({ default_preparation_minutes: values.defaultPreparation, slot_interval_minutes: values.interval, max_orders_per_slot: values.maxOrders, max_advance_days: values.maxAdvance, restaurant_phone: values.phone, restaurant_address: values.address }).not("id", "is", null);
  if (error) throw new Error(error.message); revalidatePath("/admin/podesavanja");
}
