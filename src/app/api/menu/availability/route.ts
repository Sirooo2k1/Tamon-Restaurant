import { NextResponse } from "next/server";
import { getSoldOutMenuItemIds } from "@/lib/menu-availability-server";

export const dynamic = "force-dynamic";

const noStore = {
  "Cache-Control": "private, no-store, max-age=0, must-revalidate",
} as const;

/** Công khai — khách / menu đọc danh sách món 売り切れ */
export async function GET() {
  try {
    const soldOutIds = await getSoldOutMenuItemIds();
    return NextResponse.json({ soldOutIds }, { headers: noStore });
  } catch {
    return NextResponse.json({ soldOutIds: [] as string[] }, { headers: noStore });
  }
}
