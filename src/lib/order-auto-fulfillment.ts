import type { OrderItemPayload } from "@/lib/types";
import { isNoodleOrderLine } from "@/lib/order-line-noodle";

/**
 * 注文ステータス更新時に行の fulfillment を客向けと揃える。
 * - `served` … **麺類のみ** `delivered`（餃子・ドリンク等は手動チェックのまま）
 * - `paid` … 会計済みのため**全行** `delivered`（一覧を完了表示）
 */
export function shouldAutoMarkAllLinesDelivered(status: string | undefined | null): boolean {
  return status === "served" || status === "paid";
}

export function markNoodleOrderLinesDeliveredOnly(items: OrderItemPayload[]): OrderItemPayload[] {
  return items.map((it) =>
    isNoodleOrderLine(it) ? { ...it, fulfillment_status: "delivered" as const } : it
  );
}

export function markAllOrderLinesDelivered(items: OrderItemPayload[]): OrderItemPayload[] {
  return items.map((it) => ({ ...it, fulfillment_status: "delivered" as const }));
}
