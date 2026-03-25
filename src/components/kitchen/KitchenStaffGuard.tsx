"use client";

import { usePathname, useRouter, useSearchParams } from "next/navigation";
import { useEffect, useState } from "react";
import Link from "next/link";
import { Loader2 } from "lucide-react";
import { kitchenSafeRelativeUrl } from "@/lib/kitchen-safe-redirect";

type GuardState = "loading" | "ok" | "redirect_login" | "misconfigured";

export function KitchenStaffGuard({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();
  const searchParams = useSearchParams();
  const router = useRouter();
  const [state, setState] = useState<GuardState>("loading");

  const isLoginPath = pathname === "/kitchen/login";

  useEffect(() => {
    if (isLoginPath) {
      setState("ok");
      return;
    }

    let cancelled = false;

    (async () => {
      const res = await fetch("/api/kitchen/auth/session", {
        credentials: "include",
        cache: "no-store",
      });

      if (cancelled) return;

      if (res.status === 503) {
        setState("misconfigured");
        return;
      }

      if (!res.ok) {
        setState("redirect_login");
        const base = pathname && pathname !== "/kitchen/login" ? pathname : "/kitchen";
        const q = searchParams?.toString();
        const href = kitchenSafeRelativeUrl(q ? `${base}?${q}` : base);
        router.replace(`/kitchen/login?next=${encodeURIComponent(href)}`);
        return;
      }

      const data = (await res.json()) as { ok?: boolean; auth?: string };
      if (data.auth === "disabled" || data.ok) {
        setState("ok");
        return;
      }

      setState("redirect_login");
      router.replace(
        `/kitchen/login?next=${encodeURIComponent(kitchenSafeRelativeUrl(pathname || "/kitchen"))}`
      );
    })();

    return () => {
      cancelled = true;
    };
  }, [isLoginPath, pathname, router, searchParams]);

  if (isLoginPath) {
    return <>{children}</>;
  }

  if (state === "misconfigured") {
    return (
      <div className="flex min-h-screen flex-col items-center justify-center bg-stone-950 px-6 py-12 text-center">
        <div className="max-w-md rounded-2xl border border-amber-500/25 bg-amber-950/30 px-6 py-8 text-stone-200 shadow-xl ring-1 ring-amber-500/10">
          <p className="text-sm font-medium leading-relaxed">
            キッチン画面を本番で使うには、サーバーに{" "}
            <code className="rounded bg-stone-900 px-1.5 py-0.5 font-mono text-xs text-amber-200">
              KITCHEN_SESSION_SECRET
            </code>{" "}
            と{" "}
            <code className="rounded bg-stone-900 px-1.5 py-0.5 font-mono text-xs text-amber-200">
              KITCHEN_DASHBOARD_PASSWORD
            </code>{" "}
            を設定してください（詳細は <code className="font-mono text-xs">docs/kitchen-auth.md</code>）。
          </p>
        </div>
        <Link
          href="/"
          className="mt-8 text-sm font-semibold text-emerald-400 underline-offset-4 hover:underline"
        >
          ホームへ戻る
        </Link>
      </div>
    );
  }

  if (state === "loading" || state === "redirect_login") {
    return (
      <div className="flex min-h-screen flex-col items-center justify-center gap-4 bg-gradient-to-b from-stone-950 to-stone-900 text-stone-400">
        <Loader2 className="h-10 w-10 animate-spin text-emerald-500/80" aria-hidden />
        <p className="text-sm font-medium text-stone-500">認証を確認しています…</p>
      </div>
    );
  }

  return <>{children}</>;
}
