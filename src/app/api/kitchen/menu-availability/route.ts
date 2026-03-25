import { NextRequest, NextResponse } from "next/server";
import { assertKitchenStaff } from "@/lib/kitchen-session";

export const dynamic = "force-dynamic";
import {
  getGroupSoldOutMap,
  upsertGroupSoldOut,
} from "@/lib/menu-availability-server";
import { isMainNoodleGroupId, type MainNoodleGroupId } from "@/lib/menu-main-noodle";

/** Bếp: map tsukemen | tamon_tsukemen | ramen → 売り切れ */
export async function GET(request: NextRequest) {
  const denied = assertKitchenStaff(request);
  if (denied) return denied;
  try {
    const groupSoldOut = await getGroupSoldOutMap();
    return NextResponse.json({ groupSoldOut });
  } catch (e) {
    const msg = e instanceof Error ? e.message : "Error";
    return NextResponse.json({ error: msg }, { status: 500 });
  }
}

/** Body: { group_id: MainNoodleGroupId, sold_out: boolean } */
export async function PATCH(request: NextRequest) {
  const denied = assertKitchenStaff(request);
  if (denied) return denied;
  try {
    const body = (await request.json()) as { group_id?: string; sold_out?: unknown };
    const group_id = String(body.group_id ?? "").trim() as MainNoodleGroupId;
    if (!group_id || !isMainNoodleGroupId(group_id)) {
      return NextResponse.json({ error: "Invalid group_id" }, { status: 400 });
    }
    const sold_out = Boolean(body.sold_out);
    await upsertGroupSoldOut(group_id, sold_out);
    const groupSoldOut = await getGroupSoldOutMap();
    return NextResponse.json({ ok: true, groupSoldOut });
  } catch (e) {
    const msg = e instanceof Error ? e.message : "Error";
    return NextResponse.json({ error: msg }, { status: 500 });
  }
}
