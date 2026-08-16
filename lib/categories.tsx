import type { ComponentType, ReactNode } from "react";
import { CakeSlice, Citrus, Coffee, CupSoda, EggFried, Fish, Flame, GlassWater, Martini, Pizza, Salad, Soup, Utensils, UtensilsCrossed } from "lucide-react";
import type { Category, CategoryGroup } from "@/types/domain";

type IconProps = { className?: string; strokeWidth?: number; "aria-hidden"?: boolean };
type CategoryIconComponent = ComponentType<IconProps>;

export const CATEGORY_GROUPS: Array<{ key: CategoryGroup; label: string; icon: CategoryIconComponent }> = [
  { key: "drinks", label: "Piće", icon: CupSoda },
  { key: "food", label: "Hrana", icon: UtensilsCrossed },
];

const GROUP_ORDER: Record<CategoryGroup, number> = { drinks: 0, food: 1 };
const GROUP_FALLBACK_ICON: Record<CategoryGroup, CategoryIconComponent> = { drinks: GlassWater, food: UtensilsCrossed };

/** Lucide nema ikonicu za pastu, suši i hleb, pa su nacrtane u istom stilu (24×24, currentColor). */
function StrokeIcon({ children, className, strokeWidth = 2 }: IconProps & { children: ReactNode }) {
  return <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={strokeWidth} strokeLinecap="round" strokeLinejoin="round" aria-hidden className={className}>{children}</svg>;
}

function PastaIcon(props: IconProps) {
  return (
    <StrokeIcon {...props}>
      <path d="M2.5 15.5h19" />
      <path d="M4.5 15.5c1 3 4 5 7.5 5s6.5-2 7.5-5" />
      <path d="M6 12.9c.9-1.5 2.1-1.5 3 0s2.1 1.5 3 0 2.1-1.5 3 0 2.1 1.5 3 0" />
      <path d="M7.5 9.9c.9-1.5 2.1-1.5 3 0s2.1 1.5 3 0 2.1-1.5 3 0" />
    </StrokeIcon>
  );
}

function SushiIcon(props: IconProps) {
  return (
    <StrokeIcon {...props}>
      <path d="M3.5 13.2h17v1.6a3 3 0 0 1-3 3h-11a3 3 0 0 1-3-3Z" />
      <path d="M6 13.2c0-3.3 2.7-6 6-6s6 2.7 6 6" />
    </StrokeIcon>
  );
}

function BreadIcon(props: IconProps) {
  return (
    <StrokeIcon {...props}>
      <path d="M3.8 13.6c0-4 3.7-7.3 8.2-7.3s8.2 3.3 8.2 7.3v1.8a2.4 2.4 0 0 1-2.4 2.4H6.2a2.4 2.4 0 0 1-2.4-2.4Z" />
      <path d="M9.2 9.5 7.7 12.1" />
      <path d="M12.6 9 11.1 11.6" />
      <path d="M16 9.7l-1.5 2.6" />
    </StrokeIcon>
  );
}

const CATEGORY_ICONS: Record<string, CategoryIconComponent> = {
  kokteli: Martini,
  kafe: Coffee,
  "vocni-napici": Citrus,
  dorucak: EggFried,
  "morski-plodovi": Fish,
  paste: PastaIcon,
  rizoto: SushiIcon,
  pice: Pizza,
  "sa-rostilja": Flame,
  "glavna-jela": Utensils,
  "corbe-i-potazi": Soup,
  "obrok-salate": Salad,
  dezerti: CakeSlice,
  dodaci: BreadIcon,
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
