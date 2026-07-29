import type { LineItemCustomization, MenuItem } from "@/lib/types";

/** お持ち帰り容器代（1行あたり・数量に関わらず） */
export const GYOZA_CONTAINER_FEE_YEN = 20;
/** レジ袋（1行あたり・任意） */
export const GYOZA_BAG_FEE_YEN = 3;

const Y = (yen: number) => yen * 200;

export const GYOZA_CONTAINER_FEE_VND = Y(GYOZA_CONTAINER_FEE_YEN);
export const GYOZA_BAG_FEE_VND = Y(GYOZA_BAG_FEE_YEN);

function isGyozaTakeaway(
  menuItem: Pick<MenuItem, "category">,
  c: LineItemCustomization
): boolean {
  return menuItem.category === "gyoza" && c.serviceMode === "takeaway";
}

/** 容器代 — 行ごとに1回（数量では掛けない） */
export function gyozaContainerSurchargeVnd(
  menuItem: Pick<MenuItem, "category">,
  c: LineItemCustomization
): number {
  return isGyozaTakeaway(menuItem, c) ? GYOZA_CONTAINER_FEE_VND : 0;
}

/** レジ袋 — 行ごとに1回（数量では掛けない） */
export function gyozaBagSurchargeVnd(
  menuItem: Pick<MenuItem, "category">,
  c: LineItemCustomization
): number {
  if (!isGyozaTakeaway(menuItem, c) || c.needsPlasticBag !== true) return 0;
  return GYOZA_BAG_FEE_VND;
}

/** 容器 + レジ袋（いずれも行ごと） */
export function gyozaTakeawayLineSurchargeVnd(
  menuItem: Pick<MenuItem, "category">,
  c: LineItemCustomization
): number {
  return gyozaContainerSurchargeVnd(menuItem, c) + gyozaBagSurchargeVnd(menuItem, c);
}

/** @deprecated unitPrice には含めない — 互換のため 0 */
export function gyozaTakeawayUnitSurchargeVnd(
  _menuItem: Pick<MenuItem, "category">,
  _c: LineItemCustomization
): number {
  return 0;
}

/** Dòng tiền cuối: unit×qty + 容器/レジ袋（各1回） */
export function lineTotalWithGyozaFeesVnd(
  menuItem: Pick<MenuItem, "category">,
  unitPrice: number,
  quantity: number,
  c: LineItemCustomization | undefined
): number {
  return unitPrice * quantity + gyozaTakeawayLineSurchargeVnd(menuItem, c ?? {});
}

/** キッチン・会計・カート表示用 */
export function formatGyozaServiceModePartsJa(c: LineItemCustomization | undefined): string[] {
  if (!c?.serviceMode) return [];
  if (c.serviceMode === "dine_in") return ["店内"];
  const parts = [`お持ち帰り・容器(+¥${GYOZA_CONTAINER_FEE_YEN})`];
  if (c.needsPlasticBag === true) {
    parts.push(`レジ袋(+¥${GYOZA_BAG_FEE_YEN})`);
  }
  return parts;
}
