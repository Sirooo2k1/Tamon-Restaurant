import { NextResponse } from "next/server";
import { clearKitchenSessionCookie, KITCHEN_AUTH_JSON_HEADERS } from "@/lib/kitchen-session";

export async function POST() {
  const res = NextResponse.json({ ok: true }, { headers: KITCHEN_AUTH_JSON_HEADERS });
  clearKitchenSessionCookie(res);
  return res;
}

export async function GET() {
  return NextResponse.json(
    { error: "Method Not Allowed" },
    { status: 405, headers: { ...KITCHEN_AUTH_JSON_HEADERS, Allow: "POST" } }
  );
}
