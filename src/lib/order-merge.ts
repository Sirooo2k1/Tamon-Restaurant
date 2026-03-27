import type { OrderItemPayload, OrderStatus } from "@/lib/types";
import { isNoodleOrderLine } from "@/lib/order-line-noodle";
import { canonicalTableCodeFromLabel } from "@/lib/restaurant-qr-tables";

/**
 * Gộp thêm món vào **cùng một đơn** đang theo dõi (cookie) để:
 * - Khách thấy một danh sách + một tiến trình theo dõi
 * - Bếp thấy một đơn / một bàn cho tới khi会計
 *
 * Cho phép gộp khi đơn **chưa会計・未キャンセル** — kể cả đã confirmed / preparing / …
 * Chỉ chặn khi `paid` / `cancelled` hoặc `payment_status === paid`.
 */
const NON_MERGEABLE_ORDER_STATUSES: readonly OrderStatus[] = ["paid", "cancelled"];

export function canMergeOrderStatus(status: string): boolean {
  const s = String(status ?? "").trim().toLowerCase() as OrderStatus;
  return !NON_MERGEABLE_ORDER_STATUSES.includes(s);
}

/** Gộp được khi đơn chưa kết thúc (chưa thanh toán / chưa hủy) */
export function canMergeOrderForCustomer(order: {
  status: string;
  payment_status?: string | null;
}): boolean {
  if (!canMergeOrderStatus(String(order.status ?? ""))) return false;
  const ps = String(order.payment_status ?? "")
    .trim()
    .toLowerCase();
  if (ps === "paid" || ps === "refunded") return false;
  return true;
}

export function tableLabelsMatch(
  a: string | null | undefined,
  b: string | null | undefined
): boolean {
  const sa = (a ?? "").trim();
  const sb = (b ?? "").trim();
  if (sa === sb) return true;
  const ca = canonicalTableCodeFromLabel(sa);
  const cb = canonicalTableCodeFromLabel(sb);
  return ca !== null && cb !== null && ca === cb;
}

export function mergeOrderItems(
  existing: OrderItemPayload[],
  append: OrderItemPayload[]
): OrderItemPayload[] {
  return [...existing, ...append];
}

/** 追加カート分は必ず「未提供」として扱う（提供済み注文にマージしても全行が届け済みにならないようにする） */
export function normalizeAppendedOrderLines(append: OrderItemPayload[]): OrderItemPayload[] {
  return append.map((line) => ({
    ...line,
    fulfillment_status: "pending" as const,
  }));
}

/**
 * 追加注文をマージしたあと、まだ麺など厨房が追う必要があるなら `confirmed` に戻す。
 * 餃子・ドリンクのみの追加なら **`served` / `ready` を維持** — 客の追跡バー（進捗）が先頭に戻らない。
 */
export function orderStatusAfterMergeAppend(
  currentStatus: string,
  appendItems?: OrderItemPayload[]
): string | null {
  if (appendItems?.length && !appendItems.some(isNoodleOrderLine)) {
    return null;
  }
  const s = String(currentStatus ?? "").trim().toLowerCase();
  if (s === "served" || s === "ready") return "confirmed";
  return null;
}
