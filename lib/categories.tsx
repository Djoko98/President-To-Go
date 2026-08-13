import { CakeSlice, Citrus, Coffee, CookingPot, CupSoda, EggFried, Flame, GlassWater, Leaf, Martini, Pizza, Salad, Utensils, UtensilsCrossed, Wheat, type LucideIcon } from "lucide-react";
import type { Category, CategoryGroup } from "@/types/domain";

export const CATEGORY_GROUPS: Array<{ key: CategoryGroup; label: string; icon: LucideIcon }> = [
  { key: "drinks", label: "Piće", icon: CupSoda },
  { key: "food", label: "Hrana", icon: UtensilsCrossed },
];

const GROUP_ORDER: Record<CategoryGroup, number> = { drinks: 0, food: 1 };
const GROUP_FALLBACK_ICON: Record<CategoryGroup, LucideIcon> = { drinks: GlassWater, food: UtensilsCrossed };

const CATEGORY_ICONS: Record<string, LucideIcon> = {
  kokteli: Martini,
  kafe: Coffee,
  "vocni-napici": Citrus,
  dorucak: EggFried,
  posno: Leaf,
  paste: Wheat,
  rizoto: CookingPot,
  pice: Pizza,
  "sa-rostilja": Flame,
  "glavna-jela": Utensils,
  "obrok-salate": Salad,
  dezerti: CakeSlice,
};

export function normalizeCategoryGroup(value: unknown): CategoryGroup {
  return value === "food" ? "food" : "drinks";
}

export function CategoryIcon({ category, className, strokeWidth = 2 }: { category: Pick<Category, "slug" | "group_key">; className?: string; strokeWidth?: number }) {
  const Icon = CATEGORY_ICONS[category.slug] ?? GROUP_FALLBACK_ICON[category.group_key] ?? GlassWater;
  return <Icon aria-hidden strokeWidth={strokeWidth} className={className} />;
}

export function CategoryGroupIcon({ group, className }: { group: CategoryGroup; className?: string }) {
  const Icon = CATEGORY_GROUPS.find((item) => item.key === group)?.icon ?? GlassWater;
  return <Icon aria-hidden strokeWidth={2.2} className={className} />;
}

export function categoryGroupLabel(group: CategoryGroup): string {
  return CATEGORY_GROUPS.find((item) => item.key === group)?.label ?? "Ponuda";
}

/** Piće prvo, pa hrana — unutar grupe redosled koji je admin podesio. */
export function sortCategories(categories: Category[]): Category[] {
  return [...categories].sort((a, b) => GROUP_ORDER[a.group_key] - GROUP_ORDER[b.group_key] || a.position - b.position || a.name.localeCompare(b.name, "sr"));
}
