/**
 * Server-driven “guest order tracking” session via HttpOnly cookie.
 * Prefer this over localStorage for tracking IDs (mitigates XSS reading the value).
 */
import type { NextResponse } from "next/server";

export const TRACKED_ORDER_COOKIE = "remenshop_track_oid";
/** Ghép cặp với ORDER_COOKIE — không gửi token xem đơn trong response JSON */
export const TRACKED_ORDER_SECRET_COOKIE = "remenshop_track_sec";

/**
 * Cookie の最長保持（未会計のまま放置した場合）。
 * 会計済みになった注文はクライアント側で追跡 cookie を直ちに削除する（`recent-order-tracking`）。
 */
export const TRACKED_ORDER_MAX_AGE_SEC = 60 * 90;

export type TrackedOrderCookieAttributes = {
  httpOnly: boolean;
  secure: boolean;
  sameSite: "lax";
  path: string;
  maxAge: number;
};

export function getTrackedOrderCookieAttributes(): TrackedOrderCookieAttributes {
  return {
    httpOnly: true,
    secure: process.env.NODE_ENV === "production",
    sameSite: "lax",
    path: "/",
    maxAge: TRACKED_ORDER_MAX_AGE_SEC,
  };
}

export function setGuestOrderCookies(
  res: NextResponse,
  orderId: string,
  guestViewToken: string
): void {
  const opts = getTrackedOrderCookieAttributes();
  res.cookies.set(TRACKED_ORDER_COOKIE, orderId, opts);
  res.cookies.set(TRACKED_ORDER_SECRET_COOKIE, guestViewToken, opts);
}

export function clearGuestOrderCookies(res: NextResponse): void {
  res.cookies.delete(TRACKED_ORDER_COOKIE);
  res.cookies.delete(TRACKED_ORDER_SECRET_COOKIE);
}
