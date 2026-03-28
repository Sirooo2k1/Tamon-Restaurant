"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import {
  Ban,
  Boxes,
  ClipboardList,
  Droplets,
  Loader2,
  RotateCcw,
  Soup,
  Wheat,
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

const SECTION_META: Record<
  NoodleStockCategoryId,
  { accent: string; Icon: typeof Droplets }
> = {
  tsukemen: {
    accent: "text-teal-800",
    Icon: Droplets,
  },
  tamon_tsukemen: {
    accent: "text-emerald-800",
    Icon: Wheat,
  },
  ramen: {
    accent: "text-slate-800",
    Icon: Soup,
  },
};

function StockMenuRow({
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
    <li className="flex flex-col gap-3 py-3 sm:flex-row sm:items-center sm:gap-4 sm:py-2.5">
      <div className="min-w-0 flex-1">
        <p className="text-sm font-medium text-gray-800">{item.name}</p>
      </div>
      <div className="flex flex-wrap items-center gap-3 sm:justify-end">
        <span className="shrink-0 text-sm font-semibold tabular-nums text-emerald-700 sm:text-base">
          ¥{yen}
        </span>
        {sold ? (
          <span className="inline-flex items-center gap-1 rounded-full border border-amber-200/90 bg-amber-50/95 px-2 py-0.5 text-[10px] font-semibold text-amber-900">
            <Ban className="h-3 w-3" aria-hidden />
            売切
          </span>
        ) : (
          <span className="inline-flex items-center gap-1 rounded-full border border-emerald-200/90 bg-emerald-50/90 px-2 py-0.5 text-[10px] font-semibold text-emerald-900">
            <Boxes className="h-3 w-3" aria-hidden />
            提供中
          </span>
        )}
        <button
          type="button"
          disabled={busy}
          onClick={onToggle}
          className={cn(
            "inline-flex h-9 min-w-[9rem] shrink-0 items-center justify-center gap-1.5 rounded-xl border px-3 text-[11px] font-semibold transition disabled:opacity-50",
            sold
              ? "border-amber-200/90 bg-amber-50/90 text-amber-950 hover:bg-amber-100/90"
              : "border-emerald-100/95 bg-emerald-50/90 text-emerald-900 shadow-sm ring-1 ring-emerald-50/85 hover:bg-emerald-100/95"
          )}
        >
          {busy ? (
            <Loader2 className="h-3.5 w-3.5 animate-spin" aria-hidden />
          ) : sold ? (
            <>
              <RotateCcw className="h-3.5 w-3.5" aria-hidden />
              販売再開
            </>
          ) : (
            <>
              <Ban className="h-3.5 w-3.5" aria-hidden />
              売り切れにする
            </>
          )}
        </button>
      </div>
    </li>
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
    <main className="app-shell flex min-h-screen bg-[#FAF8F0] text-gray-800">
      <KitchenDesktopAside active="stock" />

      <section className="flex-1 overflow-y-auto px-4 py-5 sm:px-6 lg:px-8">
        <KitchenMobileNav active="stock" />

        <header className="mb-6 flex flex-wrap items-center justify-between gap-4">
          <div>
            <h1 className="text-2xl font-semibold text-gray-800">麺メニュー · 売り切れ</h1>
            <p className="mt-0.5 text-xs text-gray-600">
              品目ごとに切り替え。お客様メニューにすぐ反映されます（注文管理と同じ要領で一覧表示）。
            </p>
          </div>
          <span className="rounded-full border border-amber-100/95 bg-amber-50/80 px-3 py-1 text-xs font-medium text-amber-800">
            管理 {totalManaged} / 売切 {soldCount}
          </span>
        </header>

        {error && (
          <div className="mb-5 rounded-2xl border border-red-200/90 bg-red-50/95 px-4 py-3 text-sm text-red-900">
            {error}
          </div>
        )}

        {!soldOutIds ? (
          <div className="flex items-center gap-2 rounded-2xl border border-gray-100 bg-white px-4 py-8 text-sm text-gray-500">
            <Loader2 className="h-4 w-4 animate-spin" aria-hidden />
            読み込み中…
          </div>
        ) : (
          <div className="grid gap-4 pb-16 md:grid-cols-2 md:items-stretch xl:grid-cols-3">
            {NOODLE_STOCK_SECTIONS.map(({ category, labelJa }) => {
              const items = menuItemsInNoodleStockCategory(category);
              if (items.length === 0) return null;
              const meta = SECTION_META[category];
              const Icon = meta.Icon;
              return (
                <article
                  key={category}
                  className="flex h-full min-h-0 flex-col overflow-hidden rounded-2xl border border-gray-100 bg-white shadow-sm"
                >
                  <div className="shrink-0 border-b border-gray-100 bg-gray-50/50 px-4 py-3">
                    <div className="flex items-start justify-between gap-2">
                      <div className="flex min-w-0 items-center gap-2">
                        <span
                          className={cn(
                            "flex h-9 w-9 shrink-0 items-center justify-center rounded-xl bg-white text-gray-700 shadow-sm ring-1 ring-gray-100",
                            meta.accent
                          )}
                        >
                          <Icon className="h-4 w-4" strokeWidth={2} aria-hidden />
                        </span>
                        <div className="min-w-0">
                          <p className="text-sm font-semibold text-gray-800">{labelJa}</p>
                          <p className="text-[10px] font-medium text-gray-500">
                            {items.length} 品目
                          </p>
                        </div>
                      </div>
                      <span className="inline-flex shrink-0 items-center gap-1 rounded-full border border-gray-200/80 bg-white px-2 py-0.5 text-[10px] font-medium text-gray-600">
                        <ClipboardList className="h-3 w-3 opacity-70" aria-hidden />
                        在庫
                      </span>
                    </div>
                  </div>
                  <ul className="flex min-h-0 flex-1 flex-col divide-y divide-gray-100 px-3 sm:px-4">
                    {items.map((item) => {
                      const sold = soldSet.has(item.id);
                      const busy = loadingId === item.id;
                      return (
                        <StockMenuRow
                          key={item.id}
                          item={item}
                          sold={sold}
                          busy={busy}
                          onToggle={() => void toggle(item.id, !sold)}
                        />
                      );
                    })}
                  </ul>
                </article>
              );
            })}
          </div>
        )}
      </section>
    </main>
  );
}
