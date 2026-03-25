import type { MenuItem } from "@/lib/types";
import { menuItems } from "@/lib/menu-data";

/** 売り切れはこの3ライン単位（全グラム共通） */
export const MAIN_NOODLE_GROUP_DEF = [
  { id: "tsukemen" as const, labelJa: "つけ麺" },
  { id: "tamon_tsukemen" as const, labelJa: "多聞つけ麺" },
  { id: "ramen" as const, labelJa: "ラーメン" },
] as const;

export type MainNoodleGroupId = (typeof MAIN_NOODLE_GROUP_DEF)[number]["id"];

const MAIN_NOODLE_CATEGORY_IDS = new Set<string>(
  MAIN_NOODLE_GROUP_DEF.map((g) => g.id)
);

export function isMainNoodleGroupId(id: string): id is MainNoodleGroupId {
  return MAIN_NOODLE_CATEGORY_IDS.has(id);
}

export function isMainNoodleMenuItem(item: Pick<MenuItem, "category">): boolean {
  return MAIN_NOODLE_CATEGORY_IDS.has(item.category);
}

export function isMainNoodleMenuItemId(menuItemId: string): boolean {
  const m = menuItems.find((x) => x.id === menuItemId);
  return m ? isMainNoodleMenuItem(m) : false;
}

export function menuItemIdsInGroup(groupId: MainNoodleGroupId): string[] {
  return menuItems.filter((m) => m.category === groupId).map((m) => m.id);
}

/** Các nhóm đang 売り切れ → tập mọi menu_item_id khách không được đặt */
export function expandSoldOutGroupsToMenuItemIds(groups: Set<MainNoodleGroupId>): Set<string> {
  const ids = new Set<string>();
  groups.forEach((g) => {
    for (const id of menuItemIdsInGroup(g)) ids.add(id);
  });
  return ids;
}
