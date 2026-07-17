import { cache } from "react";
import { createClient } from "@/lib/supabase/server";
import { fallbackCatalog } from "@/lib/catalog-fallback";
import type { CatalogData, Category, Product } from "@/types/domain";

export const getCatalog = cache(async (): Promise<CatalogData> => {
  try {
    const supabase = await createClient();
    const [{ data: categories, error: categoriesError }, { data: products, error: productsError }, { data: settings }] = await Promise.all([
      supabase.from("categories").select("id,name,slug,image_url,position,is_active").eq("is_active", true).order("position"),
      supabase.from("products").select("id,category_id,name,slug,description,ingredients,price,image_url,accent_color,contains_alcohol,preparation_minutes,max_quantity_per_order,position,is_available,is_active").eq("is_active", true).order("position"),
      supabase.from("app_settings").select("ordering_enabled").limit(1).maybeSingle(),
    ]);
    if (categoriesError || productsError || !categories?.length) throw categoriesError ?? productsError ?? new Error("Katalog je prazan");
    return { categories: categories as Category[], products: products as Product[], orderingEnabled: settings?.ordering_enabled ?? true };
  } catch (error) {
    console.error("Katalog nije preuzet iz Supabase-a:", error);
    return fallbackCatalog;
  }
});
