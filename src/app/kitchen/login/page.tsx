"use client";

import { useState, Suspense, useId, useEffect } from "react";
import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import { Eye, EyeOff, Loader2, Lock, Shield } from "lucide-react";
import { kitchenSafeRelativeUrl } from "@/lib/kitchen-safe-redirect";

function KitchenLoginForm() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const next = kitchenSafeRelativeUrl(searchParams.get("next"));
  const formId = useId();

  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [isHttps, setIsHttps] = useState(false);

  useEffect(() => {
    setIsHttps(window.location.protocol === "https:");
  }, []);

  async function onSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError(null);
    setLoading(true);
    try {
      const res = await fetch("/api/kitchen/auth/login", {
        method: "POST",
        credentials: "include",
        cache: "no-store",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ password }),
      });
      const data = (await res.json()) as {
        error?: string;
        auth?: string;
        ok?: boolean;
        retryAfterSec?: number;
      };

      if (data.auth === "disabled") {
        router.replace(next);
        router.refresh();
        return;
      }

      if (res.status === 429) {
        const sec = data.retryAfterSec ?? 60;
        const min = Math.ceil(sec / 60);
        setError(
          data.error ??
            `試行が多すぎます。約 ${min} 分後に再度お試しください。`
        );
        return;
      }

      if (!res.ok) {
        setError(data.error ?? "ログインに失敗しました");
        return;
      }

      router.replace(next);
      router.refresh();
    } catch {
      setError("通信エラーが発生しました");
    } finally {
      setLoading(false);
    }
  }

  return (
    <main className="relative flex min-h-screen flex-col items-center justify-center overflow-hidden px-4 py-12">
      {/* 背景 */}
      <div
        className="pointer-events-none absolute inset-0 bg-[#0c0a09]"
        aria-hidden
      />
      <div
        className="pointer-events-none absolute -left-1/4 top-0 h-[520px] w-[520px] rounded-full bg-emerald-600/20 blur-[120px]"
        aria-hidden
      />
      <div
        className="pointer-events-none absolute -right-1/4 bottom-0 h-[480px] w-[480px] rounded-full bg-teal-600/15 blur-[100px]"
        aria-hidden
      />
      <div
        className="pointer-events-none absolute inset-0 bg-[linear-gradient(180deg,rgba(12,10,9,0)_0%,#0c0a09_55%)]"
        aria-hidden
      />

      <div className="relative z-10 w-full max-w-[400px]">
        <div className="rounded-[1.75rem] border border-stone-700/50 bg-stone-900/75 p-8 shadow-[0_25px_60px_-15px_rgba(0,0,0,0.65)] ring-1 ring-white/[0.04] backdrop-blur-xl sm:p-9">
          <div className="mb-4 flex justify-center">
            <span className="relative flex h-16 w-16 items-center justify-center rounded-2xl bg-gradient-to-br from-emerald-500/25 to-emerald-800/20 text-emerald-300 ring-1 ring-emerald-400/25">
              <Lock className="h-8 w-8" strokeWidth={1.8} aria-hidden />
              <span className="absolute -right-1 -top-1 flex h-6 w-6 items-center justify-center rounded-lg bg-stone-800 ring-1 ring-emerald-500/30">
                <Shield className="h-3.5 w-3.5 text-emerald-400" aria-hidden />
              </span>
            </span>
          </div>

          <h1 className="text-center text-[1.35rem] font-bold tracking-tight text-stone-50 [font-feature-settings:'palt']">
            キッチンダッシュボード
          </h1>
          <p className="mt-2 text-center text-[13px] leading-relaxed text-stone-500">
            スタッフ用パスワードを入力してください。
          </p>
          <p className="mt-3 flex items-start justify-center gap-2 rounded-xl border border-emerald-500/15 bg-emerald-950/40 px-3 py-2 text-[11px] leading-snug text-emerald-200/90">
            <Shield className="mt-0.5 h-3.5 w-3.5 shrink-0 text-emerald-400/90" aria-hidden />
            <span>
              セッションは <strong className="text-emerald-100">HttpOnly Cookie</strong>
              で保持され、JavaScript から読み取れません。
              {isHttps ? (
                <>
                  <br />
                  <span className="text-emerald-100/70">この接続は HTTPS で保護されています。</span>
                </>
              ) : null}
            </span>
          </p>

          <form
            onSubmit={(e) => void onSubmit(e)}
            className="mt-8 space-y-4"
            autoComplete="on"
          >
            <label htmlFor={`${formId}-pw`} className="block text-xs font-semibold uppercase tracking-wider text-stone-500">
              パスワード
            </label>
            <div className="relative">
              <input
                id={`${formId}-pw`}
                name="password"
                type={showPassword ? "text" : "password"}
                autoComplete="current-password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                className="w-full rounded-xl border border-stone-600/90 bg-stone-950/90 py-3.5 pl-4 pr-12 text-sm text-stone-100 outline-none ring-emerald-500/20 placeholder:text-stone-600 focus:border-emerald-500/50 focus:ring-2"
                placeholder="••••••••"
                required
                disabled={loading}
                minLength={1}
              />
              <button
                type="button"
                tabIndex={-1}
                onClick={() => setShowPassword((v) => !v)}
                className="absolute right-2 top-1/2 -translate-y-1/2 rounded-lg p-2 text-stone-500 transition hover:bg-stone-800 hover:text-stone-300"
                aria-label={showPassword ? "パスワードを隠す" : "パスワードを表示"}
              >
                {showPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
              </button>
            </div>

            {error && (
              <p
                role="alert"
                className="rounded-xl border border-red-500/35 bg-red-950/50 px-3 py-2.5 text-xs leading-relaxed text-red-100"
              >
                {error}
              </p>
            )}

            <button
              type="submit"
              disabled={loading}
              className="flex w-full items-center justify-center gap-2 rounded-xl bg-gradient-to-r from-emerald-600 to-emerald-500 py-3.5 text-sm font-bold text-white shadow-lg shadow-emerald-950/40 transition hover:from-emerald-500 hover:to-emerald-400 disabled:opacity-60"
            >
              {loading ? <Loader2 className="h-4 w-4 animate-spin" /> : null}
              ログイン
            </button>
          </form>

          <Link
            href="/"
            className="mt-8 block text-center text-xs font-medium text-stone-500 transition hover:text-emerald-400/90"
          >
            ← ホームへ戻る
          </Link>
        </div>

        <p className="mt-8 text-center text-[10px] leading-relaxed text-stone-600">
          不正なアクセスを防ぐため、一定回数の失敗後は一時的にログインが制限されます。
        </p>
      </div>
    </main>
  );
}

export default function KitchenLoginPage() {
  return (
    <Suspense
      fallback={
        <div className="flex min-h-screen flex-col items-center justify-center bg-stone-950 text-stone-400">
          <Loader2 className="h-9 w-9 animate-spin text-emerald-500/80" aria-label="読み込み中" />
        </div>
      }
    >
      <KitchenLoginForm />
    </Suspense>
  );
}
