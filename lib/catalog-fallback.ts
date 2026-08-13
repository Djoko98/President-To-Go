import type { CatalogData, Category, Product } from "@/types/domain";

const image = "/images/products/lubenito.png";
const category = (id: string, name: string, slug: string, group_key: Category["group_key"], position: number): Category => ({ id, name, slug, group_key, image_url: null, position, is_active: true });

export const fallbackCategories: Category[] = [
  category("cat-kokteli", "Kokteli", "kokteli", "drinks", 0),
  category("cat-kafe", "Kafe", "kafe", "drinks", 1),
  category("cat-vocni", "Voćni napici", "vocni-napici", "drinks", 2),
  category("cat-dorucak", "Doručak", "dorucak", "food", 3),
  category("cat-posno", "Posno", "posno", "food", 4),
  category("cat-paste", "Paste", "paste", "food", 5),
  category("cat-rizoto", "Rižoto", "rizoto", "food", 6),
  category("cat-pice", "Pice", "pice", "food", 7),
  category("cat-rostilj", "Sa roštilja", "sa-rostilja", "food", 8),
  category("cat-glavna-jela", "Glavna jela", "glavna-jela", "food", 9),
  category("cat-obrok-salate", "Obrok salate", "obrok-salate", "food", 10),
  category("cat-dezerti", "Dezerti", "dezerti", "food", 11),
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
