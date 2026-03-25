import { getSupabaseForOrdersOrNull } from "@/lib/supabase-api";
import { getDevOrderById } from "@/lib/dev-orders";

/**
 * Dùng trước khi set cookie theo dõi (POST /api/orders/tracked).
 * Cùng nguồn dữ liệu như GET /api/orders/[id].
 */
export async function orderExistsById(id: string): Promise<boolean> {
  if (!id?.trim()) return false;
  const trimmed = id.trim();
  const db = getSupabaseForOrdersOrNull();
  if (db) {
    const { data, error } = await db.from("orders").select("id").eq("id", trimmed).maybeSingle();
    if (!error && data) return true;
    return getDevOrderById(trimmed) != null;
  }
  return getDevOrderById(trimmed) != null;
}

/** Đặt lại cookie theo dõi — chỉ khi biết token bí mật (vd. link có ?k= gửi qua kênh riêng) */
export async function verifyGuestOrderToken(orderId: string, secret: string): Promise<boolean> {
  if (!orderId?.trim() || !secret?.trim()) return false;
  const oid = orderId.trim();
  const sec = secret.trim();
  const db = getSupabaseForOrdersOrNull();
  if (db) {
    const { data, error } = await db
      .from("orders")
      .select("guest_view_token")
      .eq("id", oid)
      .maybeSingle();
    if (error) {
      const r = getDevOrderById(oid);
      return r?.guest_view_token === sec;
    }
    if (!data) return getDevOrderById(oid)?.guest_view_token === sec;
    return data.guest_view_token === sec;
  }
  return getDevOrderById(oid)?.guest_view_token === sec;
}
