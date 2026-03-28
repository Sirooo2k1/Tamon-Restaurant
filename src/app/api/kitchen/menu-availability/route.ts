import { NextRequest, NextResponse } from "next/server";
import { assertKitchenStaff } from "@/lib/kitchen-session";
import { getSoldOutMenuItemIds, upsertMenuItemSoldOut } from "@/lib/menu-availability-server";
import { isNoodleStockMenuItemId } from "@/lib/menu-main-noodle";

export const dynamic = "force-dynamic";

/** キッチン：麺・替玉ごとの sold_out 一覧 */
export async function GET(request: NextRequest) {
  const denied = assertKitchenStaff(request);
  if (denied) return denied;
  try {
    const soldOutIds = await getSoldOutMenuItemIds();
    return NextResponse.json({ soldOutIds });
  } catch (e) {
    const msg = e instanceof Error ? e.message : "Error";
    return NextResponse.json({ error: msg }, { status: 500 });
  }
}

/** Body: { menu_item_id: string, sold_out: boolean } */
export async function PATCH(request: NextRequest) {
  const denied = assertKitchenStaff(request);
  if (denied) return denied;
  try {
    const body = (await request.json()) as { menu_item_id?: string; sold_out?: unknown };
    const menu_item_id = String(body.menu_item_id ?? "").trim();
    if (!menu_item_id || !isNoodleStockMenuItemId(menu_item_id)) {
      return NextResponse.json({ error: "Invalid menu_item_id" }, { status: 400 });
    }
    const sold_out = Boolean(body.sold_out);
    await upsertMenuItemSoldOut(menu_item_id, sold_out);
    const soldOutIds = await getSoldOutMenuItemIds();
    return NextResponse.json({ ok: true, soldOutIds });
  } catch (e) {
    const msg = e instanceof Error ? e.message : "Error";
    return NextResponse.json({ error: msg }, { status: 500 });
  }
}
