import { createClient, type SupabaseClient } from "@supabase/supabase-js";
import { getSupabase } from "@/lib/supabase";

let loggedAnonFallback = false;

/**
 * Client Supabase cho Route Handlers (server-only).
 * Ưu tiên **Service Role** (RLS bypass, ghi đơn an toàn). Không có → dùng **anon** (đủ cho policy mở như `menu_group_sold_out`).
 *
 * Lưu ý: menu 売り切れ đọc bảng menu_availability (policy public read); ghi qua service role từ API bếp.
 */
export function getSupabaseForOrdersOrNull(): SupabaseClient | null {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const serviceKey = process.env.SUPABASE_SERVICE_ROLE_KEY?.trim();

  if (!url?.trim()) {
    return null;
  }

  if (serviceKey) {
    return createClient(url.trim(), serviceKey, {
      auth: { persistSession: false, autoRefreshToken: false },
    });
  }

  if (process.env.NODE_ENV === "production" && !loggedAnonFallback) {
    loggedAnonFallback = true;
    console.warn(
      "[supabase-api] SUPABASE_SERVICE_ROLE_KEY not set — using anon for server routes. " +
        "Menu/orders need NEXT_PUBLIC_SUPABASE_ANON_KEY; add service role for stricter server writes."
    );
  }

  try {
    return getSupabase();
  } catch {
    return null;
  }
}

/** Khi chắc chắn đã có DB (vd. sau khi đã check null) */
export function getSupabaseForApi(): SupabaseClient {
  const c = getSupabaseForOrdersOrNull();
  if (!c) {
    throw new Error("Supabase chưa cấu hình");
  }
  return c;
}
