import { menuItems } from "@/lib/menu-data";

/** Tên món tiếng Nhật (`name` trong menu-data); fallback chuỗi đã lưu đơn / id. */
export function displayMenuItemNameJa(menuItemId: string, storedName?: string): string {
  const m = menuItems.find((x) => x.id === menuItemId);
  const ja = m?.name?.trim();
  if (ja) return ja;
  const fallback = storedName?.trim();
  if (fallback) return fallback;
  return menuItemId;
}
