import { NextRequest, NextResponse } from "next/server";
import {
  checkKitchenLoginAllowed,
  clearKitchenLoginAttempts,
  getClientIpFromRequest,
  kitchenLoginFailureDelay,
  recordKitchenLoginFailure,
} from "@/lib/kitchen-login-rate-limit";
import {
  createKitchenSessionToken,
  isKitchenAuthEnforced,
  KITCHEN_AUTH_JSON_HEADERS,
  kitchenAuthConfigured,
  kitchenLoginSuccessJitter,
  kitchenMisconfiguredResponse,
  kitchenPasswordMatches,
  setKitchenSessionCookie,
} from "@/lib/kitchen-session";

const MAX_BODY_BYTES = 8192;
const MAX_PASSWORD_CHARS = 512;

function jsonContentTypeOk(request: NextRequest): boolean {
  const ct = request.headers.get("content-type") ?? "";
  return ct.toLowerCase().includes("application/json");
}

function bodySizeOk(request: NextRequest): boolean {
  const cl = request.headers.get("content-length");
  if (!cl) return true;
  const n = Number.parseInt(cl, 10);
  if (!Number.isFinite(n) || n < 0) return false;
  return n <= MAX_BODY_BYTES;
}

export async function POST(request: NextRequest) {
  const ip = getClientIpFromRequest(request);

  if (!isKitchenAuthEnforced()) {
    return NextResponse.json({ ok: true, auth: "disabled" }, { headers: KITCHEN_AUTH_JSON_HEADERS });
  }
  if (!kitchenAuthConfigured()) {
    return kitchenMisconfiguredResponse();
  }

  const limit = checkKitchenLoginAllowed(ip);
  if (!limit.ok) {
    return NextResponse.json(
      {
        error: "試行回数が上限に達しました。しばらく待ってからお試しください。",
        retryAfterSec: limit.retryAfterSec,
      },
      {
        status: 429,
        headers: {
          ...KITCHEN_AUTH_JSON_HEADERS,
          "Retry-After": String(limit.retryAfterSec),
        },
      }
    );
  }

  if (!jsonContentTypeOk(request)) {
    return NextResponse.json(
      { error: "Content-Type: application/json が必要です" },
      { status: 415, headers: KITCHEN_AUTH_JSON_HEADERS }
    );
  }

  if (!bodySizeOk(request)) {
    return NextResponse.json({ error: "リクエストが大きすぎます" }, { status: 413, headers: KITCHEN_AUTH_JSON_HEADERS });
  }

  let body: { password?: string };
  try {
    body = (await request.json()) as { password?: string };
  } catch {
    return NextResponse.json({ error: "JSON が必要です" }, { status: 400, headers: KITCHEN_AUTH_JSON_HEADERS });
  }

  const expected = process.env.KITCHEN_DASHBOARD_PASSWORD ?? "";
  const given = typeof body.password === "string" ? body.password : "";

  if (given.length > MAX_PASSWORD_CHARS) {
    recordKitchenLoginFailure(ip);
    await kitchenLoginFailureDelay();
    return NextResponse.json(
      { error: "パスワードが正しくありません" },
      { status: 401, headers: KITCHEN_AUTH_JSON_HEADERS }
    );
  }

  if (!kitchenPasswordMatches(expected, given)) {
    recordKitchenLoginFailure(ip);
    await kitchenLoginFailureDelay();
    return NextResponse.json(
      { error: "パスワードが正しくありません" },
      { status: 401, headers: KITCHEN_AUTH_JSON_HEADERS }
    );
  }

  try {
    clearKitchenLoginAttempts(ip);
    await kitchenLoginSuccessJitter();
    const token = createKitchenSessionToken();
    const res = NextResponse.json({ ok: true }, { headers: KITCHEN_AUTH_JSON_HEADERS });
    setKitchenSessionCookie(res, token);
    return res;
  } catch {
    return kitchenMisconfiguredResponse();
  }
}
