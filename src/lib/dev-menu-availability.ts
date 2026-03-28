/** In-memory 売り切れ（menu_item_id）用 — Supabase 未設定時 */

const soldOutMenuItemIds = new Set<string>();

export function getDevSoldOutMenuItemIds(): string[] {
  return Array.from(soldOutMenuItemIds);
}

export function setDevMenuItemSoldOut(menuItemId: string, soldOut: boolean): void {
  if (soldOut) soldOutMenuItemIds.add(menuItemId);
  else soldOutMenuItemIds.delete(menuItemId);
}
