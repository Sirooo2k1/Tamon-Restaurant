// In-memory orders when Supabase is not configured (development)
import type { OrderPayload } from "./types";

export interface DevOrderRecord extends OrderPayload {
  id: string;
  created_at: string;
  updated_at: string;
}

const store: DevOrderRecord[] = [];

export function getDevOrders(): DevOrderRecord[] {
  return [...store];
}

export function addDevOrder(order: DevOrderRecord): void {
  store.push(order);
}

export function updateDevOrder(
  id: string,
  patch: { status?: string; payment_status?: string }
): DevOrderRecord | null {
  const index = store.findIndex((o) => o.id === id);
  if (index === -1) return null;
  const current = store[index];
  if (patch.status != null) current.status = patch.status as DevOrderRecord["status"];
  if (patch.payment_status != null) current.payment_status = patch.payment_status as DevOrderRecord["payment_status"];
  current.updated_at = new Date().toISOString();
  return current;
}
