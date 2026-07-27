import { createClient, type SupabaseClient } from "@supabase/supabase-js";
import { getSupabase } from "@/lib/supabase";

let loggedAnonFallback = false;

const supabaseServerFetch: typeof fetch = (input, init) =>
  fetch(input, { ...init, cache: "no-store" });

/**
 * Client Supabase cho Route Handlers (server-only).
 * Production: **bắt buộc Service Role** (orders RLS đã khóa anon).
 * Dev: không có service role → fallback anon (chỉ khi DB còn policy mở / local).
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
      global: { fetch: supabaseServerFetch },
    });
  }

  if (process.env.NODE_ENV === "production") {
    if (!loggedAnonFallback) {
      loggedAnonFallback = true;
      console.error(
        "[supabase-api] SUPABASE_SERVICE_ROLE_KEY is required in production (orders RLS denies anon)."
      );
    }
    return null;
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
