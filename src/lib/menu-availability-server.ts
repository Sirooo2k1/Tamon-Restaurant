import { menuItems } from "@/lib/menu-data";
import type { OrderItemPayload } from "@/lib/types";
import { isNoodleStockMenuItemId, menuItemsForNoodleStock } from "@/lib/menu-main-noodle";
import { getDevSoldOutMenuItemIds, setDevMenuItemSoldOut } from "@/lib/dev-menu-availability";
import { getSupabaseForOrdersOrNull } from "@/lib/supabase-api";

const ALLOWED_STOCK_MENU_IDS = new Set(menuItemsForNoodleStock().map((m) => m.id));

/** `false` のとき 売り切れは Supabase を読まず dev のメモリのみ */
export function isMenuSoldOutBackedBySupabase(): boolean {
  return getSupabaseForOrdersOrNull() !== null;
}

async function getSoldOutMenuItemIdSet(): Promise<Set<string>> {
  const db = getSupabaseForOrdersOrNull();
  if (!db) {
    if (process.env.NODE_ENV === "development") {
      console.warn(
        "[menu_availability] No Supabase server client — sold-out is in-memory only. " +
          "Set NEXT_PUBLIC_SUPABASE_URL and keys with DB migration 003 (menu_availability)."
      );
    }
    return new Set(getDevSoldOutMenuItemIds());
  }

  const { data, error } = await db
    .from("menu_availability")
    .select("menu_item_id")
    .eq("sold_out", true);

  if (error) {
    console.error(
      "[menu_availability] select failed:",
      error.message,
      error.code ? `(code ${error.code})` : "",
      "| Kiểm tra RLS policy SELECT trên bảng (migration 003 / 007)."
    );
    return new Set();
  }

  const ids = new Set<string>();
  const unknownFromDb: string[] = [];
  for (const row of data ?? []) {
    const id = String((row as { menu_item_id: string }).menu_item_id ?? "").trim();
    if (!id) continue;
    if (ALLOWED_STOCK_MENU_IDS.has(id)) ids.add(id);
    else unknownFromDb.push(id);
  }
  if (unknownFromDb.length > 0) {
    console.warn(
      "[menu_availability] sold_out=true nhưng menu_item_id không thuộc danh mục mì trong code — API sẽ bỏ qua. Kiểm tra khớp với menu-data:",
      unknownFromDb.slice(0, 15)
    );
  }
  return ids;
}

/** 麺・替玉の売り切れ menu_item_id のみ（確定リスト） */
export async function getSoldOutMenuItemIds(): Promise<string[]> {
  return Array.from(await getSoldOutMenuItemIdSet());
}

export async function getSoldOutSet(): Promise<Set<string>> {
  return getSoldOutMenuItemIdSet();
}

export async function upsertMenuItemSoldOut(menuItemId: string, soldOut: boolean): Promise<void> {
  const id = menuItemId.trim();
  if (!id || !ALLOWED_STOCK_MENU_IDS.has(id)) {
    throw new Error("Invalid menu_item_id for noodle stock");
  }
  const db = getSupabaseForOrdersOrNull();
  if (db) {
    const { error } = await db.from("menu_availability").upsert(
      {
        menu_item_id: id,
        sold_out: soldOut,
        updated_at: new Date().toISOString(),
      },
      { onConflict: "menu_item_id" }
    );
    if (error) throw new Error(error.message);
    return;
  }
  setDevMenuItemSoldOut(id, soldOut);
}

export async function findSoldOutInPayload(items: OrderItemPayload[]): Promise<string[]> {
  const sold = await getSoldOutSet();
  const bad = new Set<string>();
  for (const line of items) {
    const lid = String(line.menu_item_id ?? "").trim();
    if (!lid || !isNoodleStockMenuItemId(lid) || !sold.has(lid)) continue;
    bad.add(lid);
  }
  return Array.from(bad);
}

export function soldOutLabelJa(ids: string[]): string {
  const names = ids.map((iid) => menuItems.find((m) => m.id === iid)?.name ?? iid);
  return names.join("、");
}
