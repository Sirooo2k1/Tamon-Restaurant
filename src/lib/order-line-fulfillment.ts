import type { OrderItemPayload, LineFulfillmentStatus, OrderStatus } from "@/lib/types";
import { isNoodleOrderLine } from "@/lib/order-line-noodle";

export function getLineFulfillmentStatus(item: OrderItemPayload): LineFulfillmentStatus {
  return item.fulfillment_status === "delivered" ? "delivered" : "pending";
}

/** 厨房・同一 data 用 */
export function countFulfillment(items: OrderItemPayload[]): { delivered: number; total: number } {
  const total = items.length;
  const delivered = items.filter((i) => getLineFulfillmentStatus(i) === "delivered").length;
  return { delivered, total };
}

/**
 * お客様追跡画面の「お届け済み」表示
 * - `paid` … 会計済みは全行まとめて完了扱い
 * - `served` … **行ごとの** `fulfillment_status` を優先（追加注文で後から入った行は `pending` のまま）
 * - 行に状態が無い旧データ … `served` のときだけ全行届け済みとみなす（後方互換）
 */
export function isLineDeliveredForCustomerView(item: OrderItemPayload, orderStatus: OrderStatus): boolean {
  if (orderStatus === "paid") return true;

  if (item.fulfillment_status === "delivered") return true;
  if (item.fulfillment_status === "pending") return false;

  // 旧データ: fulfillment_status 未設定 — served では麺類のみ配膳済みとみなす（餃子等は別）
  if (orderStatus === "served") return isNoodleOrderLine(item);

  return getLineFulfillmentStatus(item) === "delivered";
}

export function countFulfillmentForCustomerView(
  items: OrderItemPayload[],
  orderStatus: OrderStatus
): { delivered: number; total: number } {
  const total = items.length;
  const delivered = items.filter((i) => isLineDeliveredForCustomerView(i, orderStatus)).length;
  return { delivered, total };
}
