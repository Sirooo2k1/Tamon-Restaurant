// In-memory orders when Supabase is not configured (development)
import {
  markAllOrderLinesDelivered,
  markNoodleOrderLinesDeliveredOnly,
  shouldAutoMarkAllLinesDelivered,
} from "./order-auto-fulfillment";
import { normalizeAppendedOrderLines, orderStatusAfterMergeAppend } from "./order-merge";
import type { OrderItemPayload, OrderPayload } from "./types";

export interface DevOrderRecord extends OrderPayload {
  id: string;
  created_at: string;
  updated_at: string;
  /** Bắt buộc với đơn mới — thiếu thì GET /api/orders/[id] chỉ lỏng ở dev */
  guest_view_token?: string;
}

const store: DevOrderRecord[] = [];

export function getDevOrders(): DevOrderRecord[] {
  return [...store];
}

export function getDevOrderById(id: string): DevOrderRecord | null {
  const row = store.find((o) => o.id === id);
  return row ? { ...row } : null;
}

export function addDevOrder(order: DevOrderRecord): void {
  store.push(order);
}

export function updateDevOrder(
  id: string,
  patch: { status?: string; payment_status?: string; items?: OrderItemPayload[] }
): DevOrderRecord | null {
  const index = store.findIndex((o) => o.id === id);
  if (index === -1) return null;
  const current = store[index];
  if (patch.status != null) current.status = patch.status as DevOrderRecord["status"];
  if (patch.payment_status != null) current.payment_status = patch.payment_status as DevOrderRecord["payment_status"];

  if (patch.status != null && shouldAutoMarkAllLinesDelivered(patch.status)) {
    const base = patch.items ?? (current.items as OrderItemPayload[]);
    const arr = Array.isArray(base) ? base : [];
    current.items = (
      patch.status === "paid"
        ? markAllOrderLinesDelivered(arr)
        : markNoodleOrderLinesDeliveredOnly(arr)
    ) as DevOrderRecord["items"];
  } else if (patch.items != null) {
    current.items = patch.items as DevOrderRecord["items"];
  }

  current.updated_at = new Date().toISOString();
  return current;
}

export function appendDevOrderLines(
  id: string,
  newLines: OrderItemPayload[],
  addTotal: number
): DevOrderRecord | null {
  const index = store.findIndex((o) => o.id === id);
  if (index === -1) return null;
  const current = store[index];
  const prev = Array.isArray(current.items) ? [...current.items] : [];
  const appended = normalizeAppendedOrderLines(newLines);
  current.items = [...prev, ...appended] as DevOrderRecord["items"];
  current.total_amount = Number(current.total_amount) + addTotal;
  const bumped = orderStatusAfterMergeAppend(String(current.status ?? ""), newLines);
  if (bumped) current.status = bumped as DevOrderRecord["status"];
  current.updated_at = new Date().toISOString();
  return current;
}
