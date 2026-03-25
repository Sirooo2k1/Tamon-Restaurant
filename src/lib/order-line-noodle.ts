import type { MenuItem, OrderItemPayload } from "@/lib/types";
import { menuItems } from "@/lib/menu-data";

/** 客向け・厨房の「麺類」— 進捗・提供済み自動反映の対象 */
export const NOODLE_MENU_CATEGORIES: ReadonlySet<MenuItem["category"]> = new Set<
  MenuItem["category"]
>(["ramen", "tsukemen", "tamon_tsukemen", "kaedama"]);

const menuIdToCategory = new Map<string, MenuItem["category"]>(
  menuItems.map((m) => [m.id, m.category])
);

export function getOrderLineMenuCategory(line: OrderItemPayload): string | undefined {
  const raw = line.menu_category;
  if (typeof raw === "string" && raw.trim()) return raw.trim();
  return menuIdToCategory.get(line.menu_item_id);
}

export function isNoodleOrderLine(line: OrderItemPayload): boolean {
  const c = getOrderLineMenuCategory(line);
  if (!c) return false;
  return NOODLE_MENU_CATEGORIES.has(c as MenuItem["category"]);
}
