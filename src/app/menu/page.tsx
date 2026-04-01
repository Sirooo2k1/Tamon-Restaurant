"use client";

import { useState, useMemo, useEffect, Suspense } from "react";
import { CheckCircle2, Images, Sparkles } from "lucide-react";
import { useSearchParams, useRouter } from "next/navigation";
import { menuItems, categories } from "@/lib/menu-data";
import type { MenuItem } from "@/lib/types";
import { AddToCartModal } from "@/components/AddToCartModal";
import { CartDrawer } from "@/components/CartDrawer";
import { useCartStore } from "@/store/cart-store";
import { tableDisplayLabelFromQrCode } from "@/lib/table-display-label";
import {
  clearNavFromPopState,
  clearPostPaidBlockTableFromHistory,
  clearRememberedMenuTableCode,
  isPostPaidBlockTableFromHistory,
  loadRememberedMenuTableCode,
  markPostPaidBlockTableFromHistory,
  peekNavFromPopState,
  rememberMenuTableCodeFromQrParam,
  syncRememberedMenuTableFromDisplayLabel,
} from "@/lib/menu-table-session";
import { cn } from "@/lib/utils";

const TABS = [
  { id: "ramen" as const, label: "つけ麺・ラーメン" },
  { id: "gyoza_drink" as const, label: "ぎょうざ・ドリンク" },
];

const RAMEN_CATEGORY_IDS = [
  "tsukemen",
  "tamon_tsukemen",
  "extra",
  "ramen",
  "kaedama",
  "topping",
  "rice",
];

// 1 yen ≈ 200 VND (menu-data), hiển thị giá yen như ảnh menu
const toYen = (vnd: number) => Math.round(vnd / 200);

function MenuItemRow({
  item,
  soldOut,
  onAdd,
}: {
  item: MenuItem;
  soldOut: boolean;
  onAdd: () => void;
}) {
  return (
    <div
      className={cn(
        "relative flex gap-4 py-4 transition duration-300",
        soldOut
          ? "my-2 overflow-hidden rounded-2xl border border-rose-100/90 bg-gradient-to-br from-rose-50/50 via-white to-amber-50/30 px-3 shadow-[0_16px_44px_-26px_rgba(190,18,60,0.2)] ring-1 ring-rose-100/40 sm:px-4"
          : "border-b border-gray-100/80 last:border-b-0"
      )}
    >
      {soldOut && (
        <div
          className="pointer-events-none absolute right-3 top-3 z-20 flex items-center gap-1 rounded-full border border-rose-200/80 bg-white/95 px-2.5 py-1 text-[10px] font-bold uppercase tracking-wider text-rose-700 shadow-md backdrop-blur-sm sm:right-4 sm:top-4"
          aria-label="売り切れ"
        >
          <Sparkles className="h-3 w-3 text-rose-500" aria-hidden />
          本日売切
        </div>
      )}
      <div className="min-w-0 flex-1">
        <div className="flex flex-wrap items-baseline justify-between gap-x-2 gap-y-1">
          <div className="flex flex-wrap items-center gap-2">
            <h3
              className={cn(
                "font-semibold tracking-tight",
                soldOut ? "text-gray-500 line-through decoration-rose-300/80 decoration-2" : "text-gray-800"
              )}
            >
              {item.name}
            </h3>
            {soldOut && (
              <span className="hidden rounded-lg bg-rose-600 px-2 py-0.5 text-[10px] font-bold text-white shadow sm:inline">
                売り切れ
              </span>
            )}
            {item.highlight === "signature" && (
              <span
                className="inline-flex items-center gap-1 rounded-full bg-emerald-100 px-2.5 py-0.5 text-xs font-medium text-emerald-800"
                title="全粒粉の多聞麺が一番人気です"
              >
                <Sparkles className="h-3 w-3 shrink-0 text-emerald-700" aria-hidden />
                当店一番人気 · 多聞
              </span>
            )}
          </div>
          <span
            className={cn(
              "shrink-0 font-semibold sm:text-base",
              soldOut ? "text-gray-400 line-through" : "text-amber-600"
            )}
          >
            ¥{toYen(item.price)}
          </span>
        </div>
        {soldOut ? (
          <p className="mt-3 inline-flex items-center gap-2 rounded-xl border border-rose-100 bg-rose-50/80 px-3 py-2 text-[12px] font-medium text-rose-900/90">
            申し訳ございません、ただ今はご注文いただけません。
          </p>
        ) : (
          <button
            type="button"
            onClick={onAdd}
            className="mt-3 flex items-center gap-1.5 rounded-xl border border-emerald-200 bg-emerald-50 px-3 py-2 text-sm font-medium text-emerald-700 transition hover:bg-emerald-100"
          >
            <span className="text-base leading-none">+</span>
            Add to Cart
          </button>
        )}
      </div>
      <div
        className={cn(
          "relative h-20 w-20 shrink-0 overflow-hidden rounded-xl border sm:h-24 sm:w-24",
          soldOut
            ? "border-rose-200/60 bg-slate-100"
            : "border-amber-200/80 bg-amber-100"
        )}
      >
        {item.imageUrl ? (
          <img
            src={item.imageUrl}
            alt=""
            className={cn("h-full w-full object-cover", soldOut && "scale-105 blur-[2px] brightness-90")}
          />
        ) : (
          <div
            className={cn(
              "flex h-full w-full items-center justify-center text-xs",
              soldOut ? "text-rose-300/80" : "text-amber-600/60"
            )}
          >
            写真
          </div>
        )}
        {soldOut && (
          <div className="pointer-events-none absolute inset-0 flex items-center justify-center bg-gradient-to-t from-rose-950/25 to-transparent" />
        )}
      </div>
    </div>
  );
}

function MenuContent() {
  const [activeTab, setActiveTab] = useState<"ramen" | "gyoza_drink">("ramen");
  const [selectedItem, setSelectedItem] = useState<MenuItem | null>(null);
  const [toast, setToast] = useState<{ id: number; message: string } | null>(null);
  const [soldOutIds, setSoldOutIds] = useState<string[]>([]);
  const searchParams = useSearchParams();
  const router = useRouter();
  const setTableLabel = useCartStore((s) => s.setTableLabel);
  const clearCart = useCartStore((s) => s.clearCart);
  const tableLabel = useCartStore((s) => s.tableLabel);

  /**
   * BFCache でメニューが古い React 状態（卓・カート）のまま戻るケースを防ぐ。
   * 会計済みフラグがあるときだけ全消し（通常の戻るは popstate+TTL で別途処理）。
   */
  useEffect(() => {
    const onPageShow = (e: PageTransitionEvent) => {
      if (!e.persisted) return;
      if (typeof window === "undefined" || window.location.pathname !== "/menu") return;
      if (!isPostPaidBlockTableFromHistory()) return;
      const { clearCart: clearC, setTableLabel: setT } = useCartStore.getState();
      clearC();
      setT(null);
      clearRememberedMenuTableCode();
      clearNavFromPopState();
      clearPostPaidBlockTableFromHistory();
      const table = new URLSearchParams(window.location.search).get("table");
      if (table) {
        router.replace("/menu");
      }
    };
    window.addEventListener("pageshow", onPageShow);
    return () => window.removeEventListener("pageshow", onPageShow);
  }, [router]);

  useEffect(() => {
    const table = searchParams.get("table");
    if (!table && peekNavFromPopState()) {
      clearNavFromPopState();
    }
    if (table) {
      /**
       * 会計直後ブロック中は `?table=` を履歴の「戻る」でも client 遷移でも常に無効化する。
       * （peekNav だけに頼るとチェックアウトで clear されたり TTL で外れ、卓が URL から蘇る）
       */
      if (isPostPaidBlockTableFromHistory()) {
        clearPostPaidBlockTableFromHistory();
        clearNavFromPopState();
        clearRememberedMenuTableCode();
        clearCart();
        setTableLabel(null);
        router.replace("/menu");
        return;
      }
      if (peekNavFromPopState()) {
        clearNavFromPopState();
      }
      rememberMenuTableCodeFromQrParam(table);
      setTableLabel(tableDisplayLabelFromQrCode(table));
      return;
    }

    /**
     * `?table=` なし（チェックアウトの「メニューに戻る」等）→ cookie 未設定だと卓が消えていた。
     * 追跡 API → sessionStorage（同一タブで前にスキャンした QR）の順で復元。
     */
    let cancelled = false;
    (async () => {
      const applyRemembered = () => {
        const code = loadRememberedMenuTableCode();
        if (code) {
          setTableLabel(tableDisplayLabelFromQrCode(code));
        } else {
          setTableLabel(null);
        }
      };
      try {
        const tr = await fetch("/api/orders/tracked", {
          credentials: "include",
          cache: "no-store",
        }).then((r) => r.json());
        if (cancelled) return;
        if (tr?.trackingReady && tr?.orderId) {
          const ordRes = await fetch(`/api/orders/${tr.orderId}`, {
            credentials: "include",
            cache: "no-store",
          });
          if (cancelled) return;
          if (ordRes.ok) {
            const order = (await ordRes.json()) as {
              table_label?: string | null;
              status?: string;
              payment_status?: string | null;
            };
            const isPaidOrder =
              order?.status === "paid" ||
              String(order?.payment_status ?? "").toLowerCase() === "paid";
            if (isPaidOrder) {
              setTableLabel(null);
              clearRememberedMenuTableCode();
              markPostPaidBlockTableFromHistory();
              clearCart();
              return;
            }
            const label = order?.table_label;
            if (typeof label === "string" && label.trim()) {
              const t = label.trim();
              setTableLabel(t);
              syncRememberedMenuTableFromDisplayLabel(t);
              return;
            }
          }
        }
        applyRemembered();
      } catch {
        if (!cancelled) applyRemembered();
      }
    })();

    return () => {
      cancelled = true;
    };
  }, [searchParams, router, setTableLabel, clearCart]);

  useEffect(() => {
    if (!toast) return;
    const timer = setTimeout(() => {
      setToast(null);
    }, 2200);
    return () => clearTimeout(timer);
  }, [toast]);

  const soldOutSet = useMemo(() => new Set(soldOutIds), [soldOutIds]);

  useEffect(() => {
    let cancelled = false;
    async function pull() {
      try {
        const res = await fetch(`/api/menu/availability?t=${Date.now()}`, {
          cache: "no-store",
          headers: {
            "Cache-Control": "no-cache",
            Pragma: "no-cache",
          },
        });
        if (cancelled) return;
        if (!res.ok) {
          if (process.env.NODE_ENV === "development") {
            console.warn("[menu] /api/menu/availability HTTP", res.status, await res.text().catch(() => ""));
          }
          /** API 失敗時に前回の soldOutIds を残すと、DBで提供中に戻しても画面が売り切れのまま固まる */
          setSoldOutIds([]);
          return;
        }
        const j = (await res.json()) as { soldOutIds?: string[]; _debugError?: string };
        if (j._debugError && process.env.NODE_ENV === "development") {
          console.warn("[menu] sold-out API:", j._debugError);
        }
        setSoldOutIds(Array.isArray(j.soldOutIds) ? j.soldOutIds : []);
      } catch {
        if (!cancelled) setSoldOutIds([]);
      }
    }
    void pull();
    const t = setInterval(pull, 5000);
    const onVis = () => {
      if (document.visibilityState === "visible") void pull();
    };
    const onPageShow = () => void pull();
    document.addEventListener("visibilitychange", onVis);
    window.addEventListener("pageshow", onPageShow);
    return () => {
      cancelled = true;
      clearInterval(t);
      document.removeEventListener("visibilitychange", onVis);
      window.removeEventListener("pageshow", onPageShow);
    };
  }, []);

  useEffect(() => {
    if (selectedItem && soldOutSet.has(selectedItem.id)) {
      setSelectedItem(null);
    }
  }, [selectedItem, soldOutSet]);

  const ramenSections = useMemo(() => {
    return RAMEN_CATEGORY_IDS.map((catId) => {
      const cat = categories.find((c) => c.id === catId);
      return {
        id: catId,
        label: cat?.label ?? catId,
        items: menuItems.filter((i) => i.category === catId),
      };
    });
  }, []);

  const gyozaSection = useMemo(() => {
    const cat = categories.find((c) => c.id === "gyoza");
    return {
      id: "gyoza" as const,
      label: cat?.label ?? "ぎょうざ",
      items: menuItems.filter((i) => i.category === "gyoza"),
    };
  }, []);

  const drinkSection = useMemo(() => {
    const cat = categories.find((c) => c.id === "drink");
    return {
      id: "drink" as const,
      label: cat?.label ?? "ドリンク",
      items: menuItems.filter((i) => i.category === "drink"),
    };
  }, []);

  return (
    <main
      className="min-h-screen pb-32"
      style={{
        background:
          "linear-gradient(180deg, #fef8f3 0%, #fef3e8 50%, #fef8f3 100%)",
      }}
    >
      {/* Toast thêm vào giỏ hàng */}
      {toast && (
        <div className="pointer-events-none fixed top-4 left-1/2 z-50 w-full max-w-sm -translate-x-1/2 px-4 sm:top-6">
          <div className="pointer-events-auto flex items-center gap-3 rounded-2xl bg-white px-4 py-3 text-sm shadow-lg shadow-emerald-100">
            <span className="flex h-6 w-6 items-center justify-center rounded-full bg-emerald-400 text-white">
              <CheckCircle2 className="h-4 w-4" />
            </span>
            <p className="flex-1 text-[13px] font-medium text-gray-800">
              {toast.message}
            </p>
          </div>
        </div>
      )}

      <div className="mx-auto max-w-2xl px-4 py-6 sm:px-6 sm:py-8">
        <div className="overflow-hidden rounded-3xl border border-gray-100 bg-white/95 shadow-lg sm:rounded-[2rem]">
          {/* Header */}
          <header
          className="rounded-t-2xl px-4 py-5 sm:rounded-t-[1.25rem] sm:px-6 sm:py-6"
          style={{
            background: "linear-gradient(90deg, #ecfdf5 0%, #fffbeb 100%)",
          }}
        >
          <p className="text-sm font-semibold uppercase tracking-wider text-emerald-700">
            Menu
          </p>
          <h1 className="mt-1 text-xl font-bold text-gray-800 sm:text-2xl">
            自家製麺 多聞
          </h1>
          <p className="mt-1 text-xs text-gray-600 sm:text-sm">
            つけ麺・らーめん、餃子お持ち帰り
          </p>
          {tableLabel && (
            <p className="mt-3 inline-flex items-center gap-2 rounded-xl border border-emerald-200/80 bg-emerald-50/90 px-3 py-2 text-sm font-semibold text-emerald-900 shadow-sm">
              <span className="text-[10px] font-bold uppercase tracking-wider text-emerald-700">
                ご利用席
              </span>
              <span className="font-mono text-emerald-900">{tableLabel}</span>
            </p>
          )}
          </header>

          {/* Tabs – pill bo tròn */}
          <div className="flex gap-2 rounded-b-2xl bg-white/80 px-3 pt-2 pb-2 sm:rounded-b-[1.25rem]">
          {TABS.map((tab) => {
            const active = activeTab === tab.id;
            return (
              <button
                key={tab.id}
                type="button"
                onClick={() => setActiveTab(tab.id)}
                className={`flex-1 rounded-2xl px-4 py-2.5 text-center text-sm font-medium transition sm:py-3 sm:text-base ${
                  active
                    ? "bg-emerald-50 text-gray-800 shadow-[inset_0_-2px_0_rgba(16,185,129,0.28)]"
                    : "text-gray-600 hover:bg-amber-50 hover:text-amber-900"
                }`}
              >
                {tab.label}
              </button>
            );
          })}
          </div>

          {/* Content – nền màu nhẹ */}
          <div className="rounded-t-2xl rounded-b-2xl bg-amber-50/60 px-4 py-4 sm:rounded-t-[1.25rem] sm:rounded-b-[1.25rem] sm:px-6 sm:py-5">
          {activeTab === "ramen" && (
            <div className="space-y-6">
              {ramenSections.map((section) => {
                if (section.items.length === 0) return null;
                const isExtraSoup = section.id === "extra";
                return (
                  <div key={section.id}>
                    {isExtraSoup && (
                      <div className="mt-0 mb-10 rounded-2xl border border-emerald-100 bg-emerald-50/70 p-4 shadow-sm">
                        <p className="text-xs font-semibold text-emerald-800 sm:text-sm">
                          ★ つけ麺と多聞つけ麺 違いは麺のみです
                        </p>
                        <p className="mt-1 text-xs leading-relaxed text-gray-600">
                          つけ麺はつるつる、なめらかなのどごし。多聞はもっちり、噛みごたえのある風味豊かな全粒粉麺です。
                        </p>
                      </div>
                    )}
                    <section>
                      <div className="mb-3 inline-flex w-fit items-center gap-2 rounded-2xl border border-emerald-200 border-l-4 border-r-4 border-l-emerald-200 border-r-emerald-200 bg-emerald-50/80 py-2 pl-3 pr-4 sm:mb-4">
                        <h2 className="text-base font-bold tracking-tight text-emerald-900 sm:text-lg">
                          {section.label}
                        </h2>
                      </div>
                      {section.id === "topping" && (
                        <p className="mb-2 text-xs text-gray-600">
                          ラーメンをご注文の際にトッピングをどうぞ！単品での注文は出来ません。
                        </p>
                      )}
                      <div className="space-y-0">
                        {section.items.map((item) => (
                          <MenuItemRow
                            key={item.id}
                            item={item}
                            soldOut={soldOutSet.has(item.id)}
                            onAdd={() => setSelectedItem(item)}
                          />
                        ))}
                      </div>
                    </section>
                  </div>
                );
              })}
            </div>
          )}

          {activeTab === "gyoza_drink" && (
            <div className="space-y-6">
              {gyozaSection.items.length > 0 && (
                <section>
                  <div className="mb-3 inline-flex w-fit items-center gap-2 rounded-2xl border border-emerald-200 border-l-4 border-r-4 border-l-emerald-200 border-r-emerald-200 bg-emerald-50/80 py-2 pl-3 pr-4 sm:mb-4">
                    <h2 className="text-base font-bold tracking-tight text-emerald-900 sm:text-lg">
                      {gyozaSection.label}
                    </h2>
                  </div>
                  <div className="space-y-0">
                    {gyozaSection.items.map((item) => (
                      <MenuItemRow
                        key={item.id}
                        item={item}
                        soldOut={soldOutSet.has(item.id)}
                        onAdd={() => setSelectedItem(item)}
                      />
                    ))}
                  </div>
                </section>
              )}
              {drinkSection.items.length > 0 && (
                <section>
                  <div className="mb-3 inline-flex w-fit items-center gap-2 rounded-2xl border border-emerald-200 border-l-4 border-r-4 border-l-emerald-200 border-r-emerald-200 bg-emerald-50/80 py-2 pl-3 pr-4 sm:mb-4">
                    <h2 className="text-base font-bold tracking-tight text-emerald-900 sm:text-lg">
                      {drinkSection.label}
                    </h2>
                  </div>
                  <div className="space-y-0">
                    {drinkSection.items.map((item) => (
                      <MenuItemRow
                        key={item.id}
                        item={item}
                        soldOut={soldOutSet.has(item.id)}
                        onAdd={() => setSelectedItem(item)}
                      />
                    ))}
                  </div>
                </section>
              )}
            </div>
          )}

          {/* 掲載写真について（イメージ表記） */}
          <aside
            className="mt-8 rounded-2xl border border-emerald-100/90 bg-gradient-to-br from-white via-emerald-50/40 to-amber-50/50 px-4 py-4 shadow-[0_8px_32px_-12px_rgba(16,185,129,0.18)] sm:px-5 sm:py-5"
            role="note"
            aria-label="メニュー写真に関するご案内"
          >
            <div className="flex gap-3.5 sm:gap-4">
              <div
                className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl border border-emerald-200/60 bg-emerald-50/90 shadow-inner sm:h-11 sm:w-11"
                aria-hidden
              >
                <Images className="h-5 w-5 text-emerald-700/85 sm:h-[1.35rem] sm:w-[1.35rem]" strokeWidth={1.75} />
              </div>
              <div className="min-w-0 space-y-2">
                <p className="text-[11px] font-bold uppercase tracking-[0.14em] text-emerald-800/95">
                  写真について
                </p>
                <p className="text-[12px] leading-relaxed text-gray-700 sm:text-[13px] sm:leading-relaxed">
                  メニュー掲載の写真の一部は、お料理の盛り付けイメージとして掲載しております。
                  <span className="mt-2 block">
                    お客様にはご理解賜りますよう、何卒よろしくお願い申し上げます。
                  </span>
                </p>
                <p className="border-t border-emerald-100/80 pt-2.5 text-[11px] leading-relaxed text-gray-500 sm:text-xs sm:leading-relaxed">
                  <span className="font-medium text-gray-600">English:</span> Some photos on this menu are
                  included to illustrate how dishes may be plated. We appreciate your understanding.
                </p>
              </div>
            </div>
          </aside>
          </div>
        </div>
      </div>

      {/* Footer giỏ hàng cố định – luôn hiển thị trên màn hình */}
      <CartDrawer />

      {selectedItem && (
        <AddToCartModal
          item={selectedItem}
          onClose={() => setSelectedItem(null)}
          onAdded={(name) =>
            setToast({
              id: Date.now(),
              message: `${name} をカートに追加しました`,
            })
          }
        />
      )}
    </main>
  );
}

export default function MenuPage() {
  return (
    <Suspense
      fallback={
        <main
          className="min-h-screen pb-32"
          style={{
            background:
              "linear-gradient(180deg, #fef8f3 0%, #fef3e8 50%, #fef8f3 100%)",
          }}
        >
          <div className="flex min-h-[60vh] items-center justify-center">
            <p className="text-gray-500">メニューを読み込み中...</p>
          </div>
        </main>
      }
    >
      <MenuContent />
    </Suspense>
  );
}
