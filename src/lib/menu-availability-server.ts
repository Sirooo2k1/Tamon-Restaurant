import { menuItems } from "@/lib/menu-data";
import type { OrderItemPayload } from "@/lib/types";
import {
  expandSoldOutGroupsToMenuItemIds,
  isMainNoodleGroupId,
  isMainNoodleMenuItemId,
  MAIN_NOODLE_GROUP_DEF,
  type MainNoodleGroupId,
} from "@/lib/menu-main-noodle";
import { getDevSoldOutGroupIds, setDevGroupSoldOut } from "@/lib/dev-menu-availability";
import { getSupabaseForOrdersOrNull } from "@/lib/supabase-api";

async function getSoldOutGroupSet(): Promise<Set<MainNoodleGroupId>> {
  const db = getSupabaseForOrdersOrNull();
  if (!db) {
    if (process.env.NODE_ENV === "development") {
      console.warn(
        "[menu_group_sold_out] No Supabase server client — sold-out state is in-memory only (not your DB). " +
          "Set NEXT_PUBLIC_SUPABASE_URL and NEXT_PUBLIC_SUPABASE_ANON_KEY and/or SUPABASE_SERVICE_ROLE_KEY."
      );
    }
    return new Set(getDevSoldOutGroupIds());
  }

  const { data, error } = await db
    .from("menu_group_sold_out")
    .select("group_id")
    .eq("sold_out", true);

  if (error) {
    console.error(
      "[menu_group_sold_out] select failed:",
      error.message,
      error.code ? `(code ${error.code})` : ""
    );
    return new Set();
  }

  const groups = new Set<MainNoodleGroupId>();
  for (const row of data ?? []) {
    const id = String((row as { group_id: string }).group_id ?? "");
    if (isMainNoodleGroupId(id)) groups.add(id);
  }
  return groups;
}

/** Mọi menu_item_id đang không bán được (mở rộng từ nhóm) */
export async function getSoldOutMenuItemIds(): Promise<string[]> {
  const groups = await getSoldOutGroupSet();
  return Array.from(expandSoldOutGroupsToMenuItemIds(groups));
}

export async function getSoldOutSet(): Promise<Set<string>> {
  return new Set(await getSoldOutMenuItemIds());
}

export async function getGroupSoldOutMap(): Promise<Record<MainNoodleGroupId, boolean>> {
  const sold = await getSoldOutGroupSet();
  return Object.fromEntries(
    MAIN_NOODLE_GROUP_DEF.map((g) => [g.id, sold.has(g.id)])
  ) as Record<MainNoodleGroupId, boolean>;
}

export async function upsertGroupSoldOut(
  groupId: MainNoodleGroupId,
  soldOut: boolean
): Promise<void> {
  const db = getSupabaseForOrdersOrNull();
  if (db) {
    /** Luôn upsert (kể cả false): tránh DELETE bị chặn / lệch với PostgREST + RLS ở một số cấu hình. */
    const { error } = await db.from("menu_group_sold_out").upsert(
      {
        group_id: groupId,
        sold_out: soldOut,
        updated_at: new Date().toISOString(),
      },
      { onConflict: "group_id" }
    );
    if (error) throw new Error(error.message);
    return;
  }
  setDevGroupSoldOut(groupId, soldOut);
}

export async function findSoldOutInPayload(items: OrderItemPayload[]): Promise<string[]> {
  const sold = await getSoldOutSet();
  const bad = new Set<string>();
  for (const line of items) {
    const id = String(line.menu_item_id ?? "").trim();
    if (!id || !isMainNoodleMenuItemId(id) || !sold.has(id)) continue;
    bad.add(id);
  }
  return Array.from(bad);
}

export function soldOutLabelJa(ids: string[]): string {
  const names = ids.map((id) => menuItems.find((m) => m.id === id)?.name ?? id);
  return names.join("、");
}
