import { createClient, type SupabaseClient } from "@supabase/supabase-js";
import { getSupabase } from "@/lib/supabase";

/**
 * Client Supabase cho Route Handlers (server-only).
 * Production: bắt buộc **Service Role** (bypass RLS an toàn khi RLS chặn anon).
 * Dev: có service key → service; không → anon; nếu không cấu hình URL → null (chỉ dev-orders memory).
 */
export function getSupabaseForOrdersOrNull(): SupabaseClient | null {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const serviceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

  if (!url?.trim()) {
    return null;
  }

  if (serviceKey) {
    return createClient(url, serviceKey, {
      auth: { persistSession: false, autoRefreshToken: false },
    });
  }

  if (process.env.NODE_ENV === "production") {
    throw new Error(
      "Production yêu cầu SUPABASE_SERVICE_ROLE_KEY (env server, không NEXT_PUBLIC_*). " +
        "Xem docs/supabase-production-security.md"
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
