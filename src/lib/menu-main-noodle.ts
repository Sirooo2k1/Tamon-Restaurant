import type { MenuItem } from "@/lib/types";
import { menuItems } from "@/lib/menu-data";

/** 在庫スイッチ対象：麺ライン＋替玉（1 品目単位） */
export const NOODLE_STOCK_CATEGORIES = [
  "tsukemen",
  "tamon_tsukemen",
  "ramen",
  "kaedama",
] as const;

export type NoodleStockCategoryId = (typeof NOODLE_STOCK_CATEGORIES)[number];

const NOODLE_STOCK_CATEGORY_SET = new Set<string>(NOODLE_STOCK_CATEGORIES);

export function isNoodleStockCategoryId(id: string): id is NoodleStockCategoryId {
  return NOODLE_STOCK_CATEGORY_SET.has(id);
}

export function isNoodleStockMenuItem(item: Pick<MenuItem, "category">): boolean {
  return NOODLE_STOCK_CATEGORY_SET.has(item.category);
}

export function isNoodleStockMenuItemId(menuItemId: string): boolean {
  const m = menuItems.find((x) => x.id === menuItemId);
  return m ? isNoodleStockMenuItem(m) : false;
}

export function menuItemsForNoodleStock(): MenuItem[] {
  return menuItems.filter(isNoodleStockMenuItem);
}

/** キッチン画面・見出し順 */
export const NOODLE_STOCK_SECTIONS: { category: NoodleStockCategoryId; labelJa: string }[] = [
  { category: "tsukemen", labelJa: "つけ麺" },
  { category: "tamon_tsukemen", labelJa: "多聞つけ麺" },
  { category: "ramen", labelJa: "ラーメン" },
  { category: "kaedama", labelJa: "替玉" },
];

export function menuItemsInNoodleStockCategory(category: NoodleStockCategoryId): MenuItem[] {
  return menuItems.filter((m) => m.category === category);
}
