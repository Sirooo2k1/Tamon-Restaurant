import { NextResponse } from "next/server";
import {
  getSoldOutMenuItemIds,
  isMenuSoldOutBackedBySupabase,
} from "@/lib/menu-availability-server";

export const dynamic = "force-dynamic";
export const revalidate = 0;

const noStore = {
  "Cache-Control": "private, no-store, max-age=0, must-revalidate",
} as const;

/** Công khai — khách / menu đọc danh sách món 売り切れ */
export async function GET() {
  try {
    const soldOutIds = await getSoldOutMenuItemIds();
    const fromDb = isMenuSoldOutBackedBySupabase();
    return NextResponse.json(
      {
        soldOutIds,
        ...(process.env.NODE_ENV === "development"
          ? {
              _debug: {
                soldOutSource: fromDb ? "supabase" : "dev-memory",
                hint:
                  fromDb
                    ? "Menu đọc bảng menu_availability (menu_item_id + sold_out) trên project trùng NEXT_PUBLIC_SUPABASE_URL."
                    : "Server không tạo được Supabase client — 売り切れ chỉ nằm trong RAM. Cần migration 003 (menu_availability) và .env (URL + ANON hoặc SERVICE_ROLE).",
              },
            }
          : {}),
      },
      { headers: noStore }
    );
  } catch (e) {
    console.error("[api/menu/availability] GET failed:", e);
    const message = e instanceof Error ? e.message : String(e);
    return NextResponse.json(
      {
        soldOutIds: [] as string[],
        ...(process.env.NODE_ENV === "development" ? { _debugError: message } : {}),
      },
      { headers: noStore },
    );
  }
}
