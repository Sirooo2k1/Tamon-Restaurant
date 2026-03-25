"use client";

import { useCallback, useEffect, useState } from "react";
import { Ban, Loader2 } from "lucide-react";
import {
  MAIN_NOODLE_GROUP_DEF,
  menuItemIdsInGroup,
  type MainNoodleGroupId,
} from "@/lib/menu-main-noodle";
import { KitchenDesktopAside, KitchenMobileNav } from "@/components/kitchen/KitchenNav";
import { cn } from "@/lib/utils";

export default function KitchenMenuAvailabilityPage() {
  const [groupSoldOut, setGroupSoldOut] = useState<Record<MainNoodleGroupId, boolean> | null>(
    null
  );
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
    const j = (await res.json()) as { groupSoldOut?: Record<MainNoodleGroupId, boolean> };
    setGroupSoldOut(j.groupSoldOut ?? null);
  }, []);

  useEffect(() => {
    void load();
  }, [load]);

  const toggle = useCallback(async (groupId: MainNoodleGroupId, next: boolean) => {
    setLoadingId(groupId);
    setError(null);
    try {
      const res = await fetch("/api/kitchen/menu-availability", {
        method: "PATCH",
        credentials: "include",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ group_id: groupId, sold_out: next }),
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
  }, []);

  return (
    <main className="app-shell flex min-h-screen bg-[#FAF8F0] text-gray-800">
      <KitchenDesktopAside active="stock" />

      <section className="flex-1 overflow-y-auto px-4 py-5 sm:px-6 lg:px-8">
        <KitchenMobileNav active="stock" />

        <header className="mb-6">
          <div className="flex flex-wrap items-center gap-2">
            <Ban className="h-6 w-6 text-amber-700" aria-hidden />
            <h1 className="text-xl font-semibold text-gray-800 sm:text-2xl">メニュー売り切れ</h1>
          </div>
        </header>

        {error && (
          <div className="mb-4 rounded-xl border border-red-200 bg-red-50 px-3 py-2 text-xs text-red-800">
            {error}
          </div>
        )}

        {!groupSoldOut ? (
          <div className="flex min-h-[30vh] items-center justify-center gap-2 text-gray-500">
            <Loader2 className="h-6 w-6 animate-spin text-emerald-600" aria-hidden />
            <span>読み込み中…</span>
          </div>
        ) : (
          <ul className="max-w-xl space-y-3 pb-12">
            {MAIN_NOODLE_GROUP_DEF.map(({ id, labelJa }) => {
              const sold = Boolean(groupSoldOut[id]);
              const busy = loadingId === id;
              const count = menuItemIdsInGroup(id).length;
              return (
                <li
                  key={id}
                  className={cn(
                    "flex items-center justify-between gap-3 rounded-2xl border bg-white px-3 py-3 shadow-sm sm:px-4",
                    sold ? "border-amber-200/90 bg-amber-50/50" : "border-gray-100"
                  )}
                >
                  <div className="min-w-0 flex-1">
                    <p className="text-sm font-semibold text-gray-900">{labelJa}</p>
                    <p className="text-[11px] text-gray-500">
                      全 {count} 品目（各グラム・区分共通）
                    </p>
                  </div>
                  <button
                    type="button"
                    disabled={busy}
                    onClick={() => void toggle(id, !sold)}
                    className={cn(
                      "relative inline-flex h-9 min-w-[5.5rem] shrink-0 items-center justify-center rounded-xl border px-3 text-xs font-bold transition",
                      sold
                        ? "border-amber-400 bg-amber-100 text-amber-950"
                        : "border-emerald-200 bg-emerald-50 text-emerald-800",
                      busy && "opacity-60"
                    )}
                  >
                    {busy ? (
                      <Loader2 className="h-4 w-4 animate-spin" aria-hidden />
                    ) : sold ? (
                      "売り切れ"
                    ) : (
                      "提供中"
                    )}
                  </button>
                </li>
              );
            })}
          </ul>
        )}
      </section>
    </main>
  );
}
