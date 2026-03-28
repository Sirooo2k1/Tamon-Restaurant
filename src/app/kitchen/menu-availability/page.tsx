"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import {
  Leaf,
  Loader2,
  Moon,
  Sparkles,
  SunMedium,
  UtensilsCrossed,
  Wand2,
} from "lucide-react";
import {
  NOODLE_STOCK_SECTIONS,
  menuItemsInNoodleStockCategory,
  type NoodleStockCategoryId,
} from "@/lib/menu-main-noodle";
import type { MenuItem } from "@/lib/types";
import { KitchenDesktopAside, KitchenMobileNav } from "@/components/kitchen/KitchenNav";
import { cn } from "@/lib/utils";

const toYen = (vnd: number) => Math.round(vnd / 200);

const SECTION_SHELL: Record<
  NoodleStockCategoryId,
  { ring: string; badge: string; glow: string; Icon: typeof Leaf }
> = {
  tsukemen: {
    ring: "ring-teal-200/80",
    badge: "from-teal-600/90 to-emerald-700/95",
    glow: "shadow-[0_20px_50px_-28px_rgba(13,148,136,0.35)]",
    Icon: Leaf,
  },
  tamon_tsukemen: {
    ring: "ring-emerald-300/70",
    badge: "from-emerald-600/95 to-teal-800/90",
    glow: "shadow-[0_22px_55px_-26px_rgba(5,150,105,0.38)]",
    Icon: Sparkles,
  },
  ramen: {
    ring: "ring-slate-300/80",
    badge: "from-slate-700 to-slate-900",
    glow: "shadow-[0_20px_48px_-28px_rgba(15,23,42,0.3)]",
    Icon: SunMedium,
  },
  kaedama: {
    ring: "ring-amber-300/75",
    badge: "from-amber-600 to-orange-700",
    glow: "shadow-[0_20px_50px_-28px_rgba(217,119,6,0.35)]",
    Icon: Moon,
  },
};

function StockDishCard({
  item,
  sold,
  busy,
  onToggle,
}: {
  item: MenuItem;
  sold: boolean;
  busy: boolean;
  onToggle: () => void;
}) {
  const yen = toYen(item.price);
  return (
    <div
      className={cn(
        "group relative overflow-hidden rounded-2xl border bg-white/95 transition duration-300",
        sold
          ? "border-amber-200/90 bg-gradient-to-br from-amber-50/95 via-white to-orange-50/40"
          : "border-emerald-100/80 bg-gradient-to-br from-white via-emerald-50/20 to-white shadow-sm hover:border-emerald-200/90 hover:shadow-md"
      )}
    >
      <div
        className={cn(
          "pointer-events-none absolute -right-8 -top-10 h-28 w-28 rounded-full opacity-[0.14] blur-2xl transition group-hover:opacity-[0.22]",
          sold ? "bg-amber-400" : "bg-emerald-400"
        )}
        aria-hidden
      />
      <div className="relative flex flex-col gap-3 p-4 sm:flex-row sm:items-center sm:justify-between sm:gap-4">
        <div className="min-w-0 flex-1">
          <p className="text-[15px] font-bold leading-snug tracking-tight text-gray-900 sm:text-base">
            {item.name}
          </p>
          {item.description ? (
            <p className="mt-1 line-clamp-2 text-[11px] leading-relaxed text-gray-500 sm:text-xs">
              {item.description}
            </p>
          ) : null}
          <p className="mt-2 font-mono text-sm font-semibold tabular-nums text-amber-700">¥{yen}</p>
        </div>
        <button
          type="button"
          disabled={busy}
          onClick={onToggle}
          className={cn(
            "relative flex h-11 w-full shrink-0 items-center justify-center gap-2 rounded-xl border-2 px-4 text-xs font-bold tracking-wide opacity-100 transition active:scale-[0.98] sm:h-12 sm:w-[9.5rem]",
            sold
              ? "border-amber-400/90 bg-gradient-to-b from-amber-100 to-amber-50 text-amber-950 shadow-[inset_0_1px_0_rgba(255,255,255,0.85)]"
              : "border-emerald-300/80 bg-gradient-to-b from-emerald-50 to-white text-emerald-900 shadow-[inset_0_1px_0_rgba(255,255,255,0.9)] hover:border-emerald-400",
            busy && "pointer-events-none opacity-55"
          )}
        >
          {busy ? (
            <Loader2 className="h-4 w-4 animate-spin" aria-hidden />
          ) : sold ? (
            <>
              <span className="absolute inset-x-3 top-1 h-px bg-gradient-to-r from-transparent via-amber-300/50 to-transparent sm:hidden" />
              販売再開（提供中に戻す）
            </>
          ) : (
            <>
              <UtensilsCrossed className="h-4 w-4 opacity-80" aria-hidden />
              売り切れにする
            </>
          )}
        </button>
      </div>
      {!busy && sold && (
        <div className="pointer-events-none absolute left-0 top-0 flex h-full w-1.5 bg-gradient-to-b from-amber-400 to-orange-500" />
      )}
    </div>
  );
}

export default function KitchenMenuAvailabilityPage() {
  const [soldOutIds, setSoldOutIds] = useState<string[] | null>(null);
  const [loadingId, setLoadingId] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  const load = useCallback(async () => {
    setError(null);
    const res = await fetch("/api/kitchen/menu-availability", {
      credentials: "include",
      cache: "no-store",
    });
    if (!res.ok) {
      setError(await res.text().catch(() => "読み込みに失敗しました"));
      return;
    }
    const j = (await res.json()) as { soldOutIds?: string[] };
    setSoldOutIds(Array.isArray(j.soldOutIds) ? j.soldOutIds : []);
  }, []);

  useEffect(() => {
    void load();
  }, [load]);

  const soldSet = useMemo(() => new Set(soldOutIds ?? []), [soldOutIds]);

  const toggle = useCallback(
    async (menuItemId: string, next: boolean) => {
      setLoadingId(menuItemId);
      setError(null);
      try {
        const res = await fetch("/api/kitchen/menu-availability", {
          method: "PATCH",
          credentials: "include",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ menu_item_id: menuItemId, sold_out: next }),
        });
        if (!res.ok) {
          const j = (await res.json().catch(() => null)) as { error?: string } | null;
          setError(j?.error ?? "更新に失敗しました");
          return;
        }
        await load();
      } finally {
        setLoadingId(null);
      }
    },
    [load]
  );

  const totalManaged = NOODLE_STOCK_SECTIONS.reduce(
    (n, s) => n + menuItemsInNoodleStockCategory(s.category).length,
    0
  );
  const soldCount = soldOutIds?.length ?? 0;

  return (
    <main className="app-shell flex min-h-screen bg-[#f6f4ef] text-gray-800">
      <KitchenDesktopAside active="stock" />

      <section className="flex-1 overflow-y-auto">
        <div className="relative isolate px-4 py-5 sm:px-6 lg:px-10 lg:py-8">
          <div
            className="pointer-events-none absolute inset-0 -z-10 opacity-[0.55]"
            style={{
              background:
                "radial-gradient(900px 420px at 12% -8%, rgba(16,185,129,0.11), transparent 55%), radial-gradient(700px 380px at 88% 0%, rgba(251,191,36,0.08), transparent 50%)",
            }}
            aria-hidden
          />

          <KitchenMobileNav active="stock" />

          <header className="mb-8 max-w-3xl">
            <div className="relative overflow-hidden rounded-[1.75rem] border border-white/70 bg-gradient-to-br from-white via-emerald-50/40 to-amber-50/50 p-6 shadow-[0_24px_60px_-34px_rgba(6,95,70,0.35)] sm:p-8">
              <div className="pointer-events-none absolute -right-16 -top-20 h-52 w-52 rounded-full bg-emerald-200/25 blur-3xl" />
              <div className="pointer-events-none absolute -bottom-24 left-1/3 h-44 w-44 rounded-full bg-amber-200/20 blur-3xl" />

              <div className="relative flex flex-wrap items-start gap-4">
                <span className="flex h-14 w-14 shrink-0 items-center justify-center rounded-2xl bg-gradient-to-br from-emerald-600 to-teal-800 text-white shadow-lg shadow-emerald-900/25">
                  <Wand2 className="h-7 w-7" strokeWidth={1.75} aria-hidden />
                </span>
                <div className="min-w-0 flex-1">
                  <p className="text-[11px] font-bold uppercase tracking-[0.24em] text-emerald-800/80">
                    noodle stock
                  </p>
                  <h1 className="mt-1.5 text-2xl font-bold tracking-tight text-gray-900 sm:text-3xl">
                    麺メニュー · 売り切れ設定
                  </h1>
                  <p className="mt-2 max-w-xl text-sm leading-relaxed text-gray-600">
                    品目ごとに切り替えます。お客様の注文画面にもすぐ反映されます。
                  </p>
                  <div className="mt-4 flex flex-wrap gap-2">
                    <span className="inline-flex items-center gap-1.5 rounded-full border border-emerald-200/80 bg-white/90 px-3 py-1.5 text-xs font-semibold text-emerald-900 shadow-sm">
                      <UtensilsCrossed className="h-3.5 w-3.5 text-emerald-600" aria-hidden />
                      管理対象 {totalManaged} 品目
                    </span>
                    <span
                      className={cn(
                        "inline-flex items-center rounded-full border px-3 py-1.5 text-xs font-semibold shadow-sm",
                        soldCount > 0
                          ? "border-amber-200 bg-amber-50/95 text-amber-950"
                          : "border-gray-200/90 bg-white/90 text-gray-700"
                      )}
                    >
                      売り切れ中 {soldCount}
                    </span>
                  </div>
                </div>
              </div>
            </div>
          </header>

          {error && (
            <div className="mb-6 rounded-2xl border border-red-200/90 bg-red-50/95 px-4 py-3 text-sm text-red-900 shadow-sm">
              {error}
            </div>
          )}

          {!soldOutIds ? (
            <div className="flex min-h-[40vh] flex-col items-center justify-center gap-3 rounded-3xl border border-dashed border-emerald-200/60 bg-white/50 text-gray-600">
              <Loader2 className="h-8 w-8 animate-spin text-emerald-600" aria-hidden />
              <span className="text-sm font-medium">読み込み中…</span>
            </div>
          ) : (
            <div className="space-y-12 pb-24">
              {NOODLE_STOCK_SECTIONS.map(({ category, labelJa }) => {
                const items = menuItemsInNoodleStockCategory(category);
                if (items.length === 0) return null;
                const shell = SECTION_SHELL[category];
                const Icon = shell.Icon;
                return (
                  <section key={category} className="max-w-3xl">
                    <div
                      className={cn(
                        "mb-4 flex flex-wrap items-center gap-3 rounded-2xl border border-white/80 bg-white/70 px-4 py-3 shadow-md ring-1 ring-black/[0.04] backdrop-blur-md sm:px-5",
                        shell.ring
                      )}
                    >
                      <span
                        className={cn(
                          "flex h-11 w-11 shrink-0 items-center justify-center rounded-xl bg-gradient-to-br text-white shadow-md",
                          shell.badge
                        )}
                      >
                        <Icon className="h-5 w-5" strokeWidth={2} aria-hidden />
                      </span>
                      <div>
                        <h2 className="text-lg font-bold tracking-tight text-gray-900">{labelJa}</h2>
                        <p className="text-[11px] font-medium text-gray-500">
                          {items.length} 品目 · タップで提供中 / 売り切れを切替
                        </p>
                      </div>
                    </div>
                    <ul className={cn("space-y-3", shell.glow)}>
                      {items.map((item) => {
                        const sold = soldSet.has(item.id);
                        const busy = loadingId === item.id;
                        return (
                          <li key={item.id}>
                            <StockDishCard
                              item={item}
                              sold={sold}
                              busy={busy}
                              onToggle={() => void toggle(item.id, !sold)}
                            />
                          </li>
                        );
                      })}
                    </ul>
                  </section>
                );
              })}
            </div>
          )}
        </div>
      </section>
    </main>
  );
}
