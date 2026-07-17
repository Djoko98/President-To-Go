import type { CatalogData, Category, Product } from "@/types/domain";

const image = "/images/products/lubenito.png";
export const fallbackCategories: Category[] = [
  { id: "cat-kokteli", name: "Kokteli", slug: "kokteli", image_url: image, position: 0, is_active: true },
  { id: "cat-kafe", name: "Kafe", slug: "kafe", image_url: image, position: 1, is_active: true },
  { id: "cat-vocni", name: "Voćni napici", slug: "vocni-napici", image_url: image, position: 2, is_active: true },
];

const product = (id: string, category_id: string, name: string, slug: string, ingredients: string, price: number, position: number, accent_color: string, contains_alcohol = false): Product => ({
  id, category_id, name, slug, description: ingredients, ingredients, price, image_url: image, accent_color, contains_alcohol, preparation_minutes: 15, max_quantity_per_order: 10, position, is_available: true, is_active: true,
});

export const fallbackProducts: Product[] = [
  product("prod-lubenito","cat-kokteli","Lubenito","lubenito","lubenica, nana, limeta, sprite, grenadin",59000,0,"#fde9e7",true),
  product("prod-aperol","cat-kokteli","Aperol Spritz","aperol-spritz","aperol, prosecco, soda, pomorandža",65000,1,"#fff0e3",true),
  product("prod-lagoon","cat-kokteli","Blue Lagoon","blue-lagoon","vodka, blue curaçao, limun, sprite",62000,2,"#e6f6fb",true),
  product("prod-mojito","cat-kokteli","Mojito","mojito","beli rum, nana, limeta, soda",62000,3,"#edf7e9",true),
  product("prod-iced","cat-kafe","Iced Coffee","iced-coffee","espresso, mleko, led, sirup od vanile",39000,0,"#f2ece7"),
  product("prod-frappe","cat-kafe","Frappe","frappe","instant kafa, mleko, led, smeđi šećer",42000,1,"#f3eee8"),
  product("prod-latte","cat-kafe","Iced Latte","iced-latte","dupli espresso, mleko, led",43000,2,"#f6f0e8"),
  product("prod-limunada","cat-vocni","Limunada","limunada","limun, voda, nana, šećerni sirup",32000,0,"#fffbe2"),
  product("prod-malina","cat-vocni","Malina","malina","malina, limun, voda, led",38000,1,"#fde9ef"),
  product("prod-tropik","cat-vocni","Tropski miks","tropski-miks","mango, ananas, marakuja, pomorandža",42000,2,"#fff2dc"),
];

export const fallbackCatalog: CatalogData = { categories: fallbackCategories, products: fallbackProducts, orderingEnabled: true };
export const PRODUCT_FALLBACK_IMAGE = image;
