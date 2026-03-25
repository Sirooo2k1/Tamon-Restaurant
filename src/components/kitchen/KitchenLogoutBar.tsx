"use client";

import { useCallback, useEffect, useState } from "react";
import { usePathname, useRouter } from "next/navigation";
import { ChefHat, Loader2, LogOut, ShieldCheck, X } from "lucide-react";
import { cn } from "@/lib/utils";

/** Thanh trên cùng: đăng xuất phiên bếp (khi auth bật) */
export function KitchenLogoutBar() {
  const router = useRouter();
  const pathname = usePathname();
  const [show, setShow] = useState(false);
  const [confirmOpen, setConfirmOpen] = useState(false);
  const [loggingOut, setLoggingOut] = useState(false);

  useEffect(() => {
    if (pathname === "/kitchen/login") {
      setShow(false);
      return;
    }
    let cancelled = false;
    (async () => {
      const res = await fetch("/api/kitchen/auth/session", {
        credentials: "include",
        cache: "no-store",
      });
      if (cancelled || !res.ok) return;
      const j = (await res.json()) as { auth?: string };
      setShow(j.auth === "staff");
    })();
    return () => {
      cancelled = true;
    };
  }, [pathname]);

  const onLogout = useCallback(async () => {
    setLoggingOut(true);
    try {
      await fetch("/api/kitchen/auth/logout", {
        method: "POST",
        credentials: "include",
        cache: "no-store",
      });
      router.replace("/kitchen/login");
      router.refresh();
    } finally {
      setLoggingOut(false);
      setConfirmOpen(false);
    }
  }, [router]);

  if (!show) return null;

  return (
    <>
      <header
        className={cn(
          "sticky top-0 z-[100] border-b border-emerald-950/40",
          "bg-gradient-to-r from-stone-950 via-emerald-950/95 to-stone-950",
          "shadow-lg shadow-black/25 backdrop-blur-md"
        )}
      >
        <div className="mx-auto flex max-w-[1600px] flex-col gap-3 px-4 py-3 sm:flex-row sm:items-center sm:justify-between sm:gap-4 sm:px-6 sm:py-2.5">
          <div className="flex min-w-0 items-start gap-3 sm:items-center">
            <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-xl bg-emerald-500/15 text-emerald-400 ring-1 ring-emerald-400/25">
              <ChefHat className="h-4 w-4" strokeWidth={2.2} aria-hidden />
            </span>
            <div className="min-w-0 flex-1 pr-0 sm:pr-2">
              <p className="text-[10px] font-semibold uppercase tracking-[0.12em] text-emerald-500/90 sm:text-[11px] sm:tracking-[0.2em]">
                Kitchen
              </p>
              <p className="mt-1 flex items-start gap-1.5 text-[11px] font-medium leading-snug text-stone-300 sm:mt-0.5 sm:text-xs sm:leading-normal">
                <ShieldCheck
                  className="mt-0.5 h-3.5 w-3.5 shrink-0 text-emerald-400/90 sm:mt-px"
                  aria-hidden
                />
                <span className="min-w-0 whitespace-normal break-words">
                  スタッフセッション（保護済み）
                </span>
              </p>
            </div>
          </div>
          <button
            type="button"
            onClick={() => setConfirmOpen(true)}
            className={cn(
              "inline-flex w-full shrink-0 items-center justify-center gap-2 rounded-xl border border-stone-600/80 bg-stone-900/60 px-4 py-2.5 sm:w-auto sm:justify-center sm:py-2",
              "text-xs font-bold text-stone-200 shadow-inner transition",
              "hover:border-red-500/40 hover:bg-red-950/50 hover:text-red-100",
              "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-emerald-500/50"
            )}
          >
            <LogOut className="h-3.5 w-3.5 opacity-90" strokeWidth={2.5} />
            ログアウト
          </button>
        </div>
      </header>

      {confirmOpen ? (
        <div
          className="fixed inset-0 z-[200] flex items-center justify-center bg-black/60 p-4 backdrop-blur-[2px]"
          role="dialog"
          aria-modal="true"
          aria-labelledby="kitchen-logout-title"
        >
          <div className="w-full max-w-sm overflow-hidden rounded-2xl border border-stone-700/80 bg-stone-900 shadow-2xl ring-1 ring-white/5">
            <div className="border-b border-stone-800 px-5 py-4">
              <h2 id="kitchen-logout-title" className="text-base font-bold text-stone-100">
                ログアウトしますか？
              </h2>
              <p className="mt-1.5 text-xs leading-relaxed text-stone-500">
                キッチン画面へのアクセスには、再度パスワードが必要です。
              </p>
            </div>
            <div className="flex gap-2 px-5 py-4">
              <button
                type="button"
                onClick={() => setConfirmOpen(false)}
                disabled={loggingOut}
                className="flex flex-1 items-center justify-center gap-2 rounded-xl border border-stone-600 bg-stone-800/80 py-2.5 text-xs font-bold text-stone-300 transition hover:bg-stone-800 disabled:opacity-50"
              >
                <X className="h-3.5 w-3.5" />
                キャンセル
              </button>
              <button
                type="button"
                onClick={() => void onLogout()}
                disabled={loggingOut}
                className="flex flex-1 items-center justify-center gap-2 rounded-xl bg-red-600 py-2.5 text-xs font-bold text-white shadow-lg shadow-red-950/40 transition hover:bg-red-500 disabled:opacity-60"
              >
                {loggingOut ? (
                  <Loader2 className="h-3.5 w-3.5 animate-spin" aria-hidden />
                ) : (
                  <LogOut className="h-3.5 w-3.5" />
                )}
                ログアウト
              </button>
            </div>
          </div>
        </div>
      ) : null}
    </>
  );
}
