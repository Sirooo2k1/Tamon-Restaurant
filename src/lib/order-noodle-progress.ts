import type { OrderItemPayload, OrderStatus } from "@/lib/types";
import { countFulfillmentForCustomerView } from "@/lib/order-line-fulfillment";
import {
  isNoodleOrderLine,
  getOrderLineMenuCategory,
  NOODLE_MENU_CATEGORIES,
} from "@/lib/order-line-noodle";

export { isNoodleOrderLine, getOrderLineMenuCategory, NOODLE_MENU_CATEGORIES };

export function filterNoodleOrderLines(items: OrderItemPayload[]): OrderItemPayload[] {
  return items.filter(isNoodleOrderLine);
}

/** 麺類だけの「お届け済 / 合計」— 進捗バー周りの表示用（他カテゴリは一覧のみ） */
export function countNoodleFulfillmentForCustomerView(
  items: OrderItemPayload[],
  orderStatus: OrderStatus
): { delivered: number; total: number } {
  return countFulfillmentForCustomerView(filterNoodleOrderLines(items), orderStatus);
}

export function hasPartialNoodleDeliveryForCustomerView(
  items: OrderItemPayload[],
  orderStatus: OrderStatus
): boolean {
  const { delivered, total } = countNoodleFulfillmentForCustomerView(items, orderStatus);
  return total > 0 && delivered > 0 && delivered < total;
}

export function hasPendingNoodleLinesForCustomerView(
  items: OrderItemPayload[],
  orderStatus: OrderStatus
): boolean {
  const { delivered, total } = countNoodleFulfillmentForCustomerView(items, orderStatus);
  return total > 0 && delivered < total;
}
