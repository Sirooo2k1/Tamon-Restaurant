import { NextRequest, NextResponse } from "next/server";
import {
  getKitchenSessionTokenFromRequest,
  isKitchenAuthEnforced,
  KITCHEN_AUTH_JSON_HEADERS,
  kitchenAuthConfigured,
  kitchenMisconfiguredResponse,
  verifyKitchenSessionToken,
} from "@/lib/kitchen-session";

export async function GET(request: NextRequest) {
  if (!isKitchenAuthEnforced()) {
    return NextResponse.json({ ok: true, auth: "disabled" as const }, { headers: KITCHEN_AUTH_JSON_HEADERS });
  }
  if (!kitchenAuthConfigured()) {
    return kitchenMisconfiguredResponse();
  }

  const token = getKitchenSessionTokenFromRequest(request);
  if (!verifyKitchenSessionToken(token)) {
    return NextResponse.json({ ok: false }, { status: 401, headers: KITCHEN_AUTH_JSON_HEADERS });
  }
  return NextResponse.json({ ok: true, auth: "staff" as const }, { headers: KITCHEN_AUTH_JSON_HEADERS });
}
