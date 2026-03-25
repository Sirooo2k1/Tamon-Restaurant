import { NextRequest, NextResponse } from "next/server";
import { cookies } from "next/headers";
import {
  TRACKED_ORDER_COOKIE,
  TRACKED_ORDER_SECRET_COOKIE,
  clearGuestOrderCookies,
  setGuestOrderCookies,
} from "@/lib/tracked-order-session";
import { orderExistsById, verifyGuestOrderToken } from "@/lib/order-exists-server";

const NO_STORE = { "Cache-Control": "private, no-store, max-age=0" } as const;

/**
 * Trả về orderId chỉ khi cả hai cookie HttpOnly đều có (khớp phiên khách).
 * Tránh banner hiển thị khi chỉ còn cookie id cũ.
 */
export async function GET() {
  const c = cookies();
  const oid = c.get(TRACKED_ORDER_COOKIE)?.value?.trim();
  const sec = c.get(TRACKED_ORDER_SECRET_COOKIE)?.value?.trim();
  const trackingReady = Boolean(oid && sec);
  return NextResponse.json(
    {
      orderId: trackingReady ? oid! : null,
      trackingReady,
    },
    { headers: NO_STORE }
  );
}

/**
 * Đặt lại cookie theo dõi (vd. bookmark / thiết bị khác) — bắt buộc biết guest_view_token bí mật.
 */
export async function POST(request: NextRequest) {
  const body = (await request.json()) as { orderId?: string; guestViewToken?: string };
  const orderId = typeof body.orderId === "string" ? body.orderId.trim() : "";
  const guestViewToken = typeof body.guestViewToken === "string" ? body.guestViewToken.trim() : "";
  if (!orderId || !guestViewToken) {
    return NextResponse.json(
      { error: "orderId と guestViewToken が必要です" },
      { status: 400 }
    );
  }
  const exists = await orderExistsById(orderId);
  if (!exists) {
    return NextResponse.json({ error: "注文が見つかりません" }, { status: 404 });
  }
  const tokenOk = await verifyGuestOrderToken(orderId, guestViewToken);
  if (!tokenOk) {
    return NextResponse.json({ error: "トークンが一致しません" }, { status: 403 });
  }
  const res = NextResponse.json({ ok: true, orderId }, { headers: NO_STORE });
  setGuestOrderCookies(res, orderId, guestViewToken);
  return res;
}

/** Xóa phiên theo dõi (trên banner) */
export async function DELETE() {
  const res = NextResponse.json({ ok: true }, { headers: NO_STORE });
  clearGuestOrderCookies(res);
  return res;
}
