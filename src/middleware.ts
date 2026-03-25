import type { NextRequest } from "next/server";
import { NextResponse } from "next/server";

const BASE_HEADERS: Record<string, string> = {
  "X-Frame-Options": "DENY",
  "X-Content-Type-Options": "nosniff",
  "Referrer-Policy": "strict-origin-when-cross-origin",
  "Permissions-Policy": "camera=(), microphone=(), geolocation=(), payment=()",
  "Cross-Origin-Resource-Policy": "same-site",
};

/** CSP chặt trong production; dev bỏ qua để không phá HMR / inline eval */
function contentSecurityPolicy(): string | null {
  if (process.env.NODE_ENV !== "production") return null;
  return [
    "default-src 'self'",
    "base-uri 'self'",
    "frame-ancestors 'none'",
    "form-action 'self'",
    "object-src 'none'",
    "script-src 'self' 'unsafe-inline'",
    "style-src 'self' 'unsafe-inline'",
    "img-src 'self' data: blob:",
    "font-src 'self'",
    "connect-src 'self'",
    "upgrade-insecure-requests",
  ].join("; ");
}

export function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl;
  if (!pathname.startsWith("/kitchen") && !pathname.startsWith("/api/kitchen")) {
    return NextResponse.next();
  }

  const res = NextResponse.next();
  for (const [key, value] of Object.entries(BASE_HEADERS)) {
    res.headers.set(key, value);
  }
  const csp = contentSecurityPolicy();
  if (csp) {
    res.headers.set("Content-Security-Policy", csp);
  }
  return res;
}

export const config = {
  matcher: ["/kitchen/:path*", "/api/kitchen/:path*"],
};
