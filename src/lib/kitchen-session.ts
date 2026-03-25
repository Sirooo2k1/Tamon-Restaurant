import { createHash, createHmac, randomBytes, randomInt, timingSafeEqual } from "crypto";
import { type NextRequest, NextResponse } from "next/server";

/** Tên cookie cũ — vẫn đọc khi migrate sang __Host- trên HTTPS */
export const LEGACY_KITCHEN_SESSION_COOKIE = "remenshop_kitchen_sess";

const HOST_KITCHEN_SESSION_COOKIE = "__Host-remenshop_kitchen_sess";

function isKitchenCookieSecure(): boolean {
  return (
    process.env.NODE_ENV === "production" || process.env.KITCHEN_COOKIE_SECURE === "true"
  );
}

/** HttpOnly cookie — tên __Host- trên HTTPS production (chặn override Domain, bắt Secure + Path=/) */
export function getKitchenSessionCookieName(): string {
  return isKitchenCookieSecure() ? HOST_KITCHEN_SESSION_COOKIE : LEGACY_KITCHEN_SESSION_COOKIE;
}

function allKitchenSessionCookieNamesForClear(): string[] {
  if (isKitchenCookieSecure()) {
    return [HOST_KITCHEN_SESSION_COOKIE, LEGACY_KITCHEN_SESSION_COOKIE];
  }
  return [LEGACY_KITCHEN_SESSION_COOKIE];
}

const DEFAULT_MAX_AGE = 60 * 60 * 12;

/** Đọc token: ưu tiên cookie chính, rồi legacy (phiên cũ trước khi bật __Host-) */
export function getKitchenSessionTokenFromRequest(request: NextRequest): string | undefined {
  const primary = request.cookies.get(getKitchenSessionCookieName())?.value?.trim();
  if (primary) return primary;
  if (isKitchenCookieSecure()) {
    const legacy = request.cookies.get(LEGACY_KITCHEN_SESSION_COOKIE)?.value?.trim();
    if (legacy) return legacy;
  }
  return undefined;
}

function parseSessionMaxAgeSec(): number {
  const raw = process.env.KITCHEN_SESSION_MAX_AGE_SEC?.trim();
  if (!raw) return DEFAULT_MAX_AGE;
  const n = Number.parseInt(raw, 10);
  if (!Number.isFinite(n)) return DEFAULT_MAX_AGE;
  return Math.min(Math.max(n, 300), 60 * 60 * 24);
}

/** Phiên nhân viên (mỗi ca); đổi KITCHEN_SESSION_SECRET sẽ đăng xuất hết */
export const KITCHEN_SESSION_MAX_AGE_SEC = parseSessionMaxAgeSec();

const NO_STORE = { "Cache-Control": "private, no-store, max-age=0" } as const;

/** Header chung cho API auth kitchen — giảm rủi ro sniffing / MIME confusion */
export const KITCHEN_AUTH_JSON_HEADERS = {
  ...NO_STORE,
  "X-Content-Type-Options": "nosniff",
  "Referrer-Policy": "strict-origin-when-cross-origin",
} as const;

export function kitchenAuthConfigured(): boolean {
  const pw = process.env.KITCHEN_DASHBOARD_PASSWORD?.trim();
  const sec = process.env.KITCHEN_SESSION_SECRET?.trim();
  return Boolean(pw && sec && sec.length >= 16);
}

/**
 * Production: luôn bắt buộc auth cho thao tác bếp (list + patch đơn).
 * Dev: bắt buộc nếu đặt đủ biến, hoặc KITCHEN_REQUIRE_AUTH=true.
 */
export function isKitchenAuthEnforced(): boolean {
  if (process.env.NODE_ENV === "production") return true;
  if (process.env.KITCHEN_REQUIRE_AUTH === "true") return true;
  return kitchenAuthConfigured();
}

function getSessionSecret(): string | null {
  const s = process.env.KITCHEN_SESSION_SECRET?.trim();
  return s && s.length >= 16 ? s : null;
}

/** So khớp mật khẩu — so sánh digest cố định 32 byte (giảm lộ qua timing) */
export function kitchenPasswordMatches(expected: string, given: string): boolean {
  const he = createHash("sha256").update(expected, "utf8").digest();
  const hg = createHash("sha256").update(given, "utf8").digest();
  return timingSafeEqual(he, hg);
}

export function createKitchenSessionToken(): string {
  const secret = getSessionSecret();
  if (!secret) throw new Error("KITCHEN_SESSION_SECRET not configured");
  const exp = Math.floor(Date.now() / 1000) + KITCHEN_SESSION_MAX_AGE_SEC;
  const nonce = randomBytes(16).toString("base64url");
  const payload = `${exp}.${nonce}`;
  const sig = createHmac("sha256", secret).update(payload).digest("base64url");
  return `${payload}.${sig}`;
}

export function verifyKitchenSessionToken(token: string | undefined | null): boolean {
  if (!token?.trim()) return false;
  const secret = getSessionSecret();
  if (!secret) return false;
  const parts = token.trim().split(".");
  if (parts.length !== 3) return false;
  const [expStr, nonce, sig] = parts;
  const exp = Number.parseInt(expStr ?? "", 10);
  if (!Number.isFinite(exp) || exp < Math.floor(Date.now() / 1000)) return false;
  if (!nonce || !sig) return false;
  const payload = `${expStr}.${nonce}`;
  const expected = createHmac("sha256", secret).update(payload).digest("base64url");
  try {
    return timingSafeEqual(Buffer.from(sig), Buffer.from(expected));
  } catch {
    return false;
  }
}

export function getKitchenSessionFromRequest(request: NextRequest): boolean {
  return verifyKitchenSessionToken(getKitchenSessionTokenFromRequest(request));
}

function sameSiteFromEnv(): "lax" | "strict" {
  return process.env.KITCHEN_SESSION_SAME_SITE === "strict" ? "strict" : "lax";
}

export function getKitchenCookieOptions() {
  const secure = isKitchenCookieSecure();
  return {
    httpOnly: true,
    secure,
    sameSite: sameSiteFromEnv(),
    path: "/",
    maxAge: KITCHEN_SESSION_MAX_AGE_SEC,
  };
}

export function setKitchenSessionCookie(res: NextResponse, token: string): void {
  res.cookies.set(getKitchenSessionCookieName(), token, getKitchenCookieOptions());
}

export function clearKitchenSessionCookie(res: NextResponse): void {
  const opts = getKitchenCookieOptions();
  for (const name of allKitchenSessionCookieNamesForClear()) {
    res.cookies.set(name, "", {
      ...opts,
      maxAge: 0,
    });
  }
}

/** Trễ ngắn khi đăng nhập đúng — giảm phân biệt timing với nhánh sai (đã có delay ở nhánh sai) */
export async function kitchenLoginSuccessJitter(): Promise<void> {
  const ms = 80 + randomInt(120);
  await new Promise((r) => setTimeout(r, ms));
}

export function staffAuthFailureResponse(): NextResponse {
  return NextResponse.json(
    { error: "キッチン用のログインが必要です。" },
    { status: 401, headers: KITCHEN_AUTH_JSON_HEADERS }
  );
}

export function kitchenMisconfiguredResponse(): NextResponse {
  return NextResponse.json(
    {
      error:
        "環境変数 KITCHEN_SESSION_SECRET（32文字以上推奨）と KITCHEN_DASHBOARD_PASSWORD を設定してください。",
    },
    { status: 503, headers: KITCHEN_AUTH_JSON_HEADERS }
  );
}

/**
 * null = được phép tiếp tục.
 * NextResponse = nên trả trực tiếp cho client.
 */
export function assertKitchenStaff(request: NextRequest): NextResponse | null {
  if (!isKitchenAuthEnforced()) {
    return null;
  }
  if (!kitchenAuthConfigured()) {
    return kitchenMisconfiguredResponse();
  }
  if (!getKitchenSessionFromRequest(request)) {
    return staffAuthFailureResponse();
  }
  return null;
}
