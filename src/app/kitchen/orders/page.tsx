/**
 * 注文管理 — リアルタイムで注文状況を確認し、迅速に対応。
 * Backend logic: filter by status, update status via PATCH /api/orders/[id], display in Yen.
 */
"use client";

import { Suspense, useState, useCallback, useEffect, useMemo, useRef } from "react";
import { usePathname, useRouter, useSearchParams } from "next/navigation";
import { useOrders } from "@/hooks/use-orders";
import { displayMenuItemNameJa } from "@/lib/menu-display";
import { formatNoodlePortionLineJa } from "@/lib/tsukemen-portion-pricing";
import type { OrderRecord, OrderStatus, LineItemCustomization, OrderItemPayload } from "@/lib/types";
import { getLineFulfillmentStatus } from "@/lib/order-line-fulfillment";
import {
  ReceiptText,
  Clock,
  Loader2,
  XCircle,
  CheckCircle2,
  ChefHat,
  Truck,
  Wallet,
  Printer,
  Bell,
  Check,
  CalendarDays,
  ChevronLeft,
  ChevronRight,
  Sparkles,
} from "lucide-react";
import { CustomerPaymentReceipt } from "@/components/kitchen/CustomerPaymentReceipt";
import { KitchenDesktopAside, KitchenMobileNav } from "@/components/kitchen/KitchenNav";
import { CUSTOMER_HERO_GRADIENT, customerHeroShellClassName } from "@/lib/customer-hero-gradient";
import {
  clampKitchenDate,
  orderInKitchenScope,
  ORDERS_PAGE_SIZES,
  parseKitchenDateParam,
  parseOrdersPageSize,
  parsePositivePage,
  rollTokyoYmd,
  tokyoDateString,
  type OrdersPageSize,
} from "@/lib/kitchen-scope";
import { playKitchenAlertPing } from "@/lib/kitchen-alert-sound";
import { cn } from "@/lib/utils";

type ActiveOrdersModal =
  | { type: "new_order"; order: OrderRecord }
  | { type: "appended_order"; order: OrderRecord; previousItemCount: number }
  | { type: "customer_receipt"; order: OrderRecord };

type OrderItemsDigest = { updated_at: string; itemCount: number };

const toYen = (vnd: number) => Math.round(vnd / 200);

function formatTime(iso: string) {
  return new Date(iso).toLocaleTimeString("ja-JP", {
    hour: "2-digit",
    minute: "2-digit",
    second: "2-digit",
  });
}

function formatDateShort(iso: string) {
  return new Date(iso).toLocaleDateString("ja-JP", {
    month: "numeric",
    day: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  });
}

/** 経過時間を表示（〇分前・〇時間前）— 待ち時間の把握に便利 */
function formatElapsed(iso: string): string {
  const sec = Math.floor((Date.now() - new Date(iso).getTime()) / 1000);
  if (sec < 60) return "たった今";
  const min = Math.floor(sec / 60);
  if (min < 60) return `${min}分前`;
  const h = Math.floor(min / 60);
  return `${h}時間${min % 60}分前`;
}

const SPICE_LABEL_JA: Record<string, string> = {
  mild: "マイルド",
  medium: "ミディアム",
  hot: "辛口",
  extra_hot: "特辛",
};

const NOODLE_FIRM_LABEL_JA: Record<string, string> = {
  soft: "やわらかめ",
  medium: "普通",
  firm: "硬め",
};

function formatCustomization(c: LineItemCustomization | undefined): string | null {
  if (!c) return null;
  const parts: string[] = [];
  if (c.seatLabel?.trim()) parts.push(`お席: ${c.seatLabel.trim()}`);
  const noodleLine = formatNoodlePortionLineJa(c);
  if (noodleLine) parts.push(noodleLine);
  if (c.beerVariant) {
    parts.push(c.beerVariant === "lager" ? "ビール: ラガー" : "ビール: スーパードライ");
  }
  if (c.highballVariant) {
    parts.push(c.highballVariant === "plain" ? "ハイボール: プレーン" : "ハイボール: レモン");
  }
  if (c.beerBallVariant) {
    const ja =
      c.beerBallVariant === "lemon" ? "レモン" : c.beerBallVariant === "plum" ? "うめ" : "メロン";
    parts.push(`ビアボール: ${ja}`);
  }
  if (c.serviceMode) {
    parts.push(c.serviceMode === "takeaway" ? "お持ち帰り" : "店内");
  }
  if (c.note?.trim()) parts.push(c.note.trim());
  if (c.spiceLevel && c.spiceLevel !== "none") {
    const sj = SPICE_LABEL_JA[c.spiceLevel];
    parts.push(sj ? `辛さ: ${sj}` : `辛さ: ${c.spiceLevel}`);
  }
  if (c.noodleFirmness) {
    const fj = NOODLE_FIRM_LABEL_JA[c.noodleFirmness];
    parts.push(fj ? `麺の硬さ: ${fj}` : `麺の硬さ: ${c.noodleFirmness}`);
  }
  if (c.extraToppings?.length) parts.push(c.extraToppings.map((t) => t.name).join("、"));
  return parts.length > 0 ? parts.join(" · ") : null;
}

type FilterTab = "all" | "new" | "preparing" | "ready" | "served" | "paid" | "cancelled";

const STATUS_FLOW: OrderStatus[] = [
  "pending",
  "confirmed",
  "preparing",
  "ready",
  "served",
  "paid",
];

const STATUS_CONFIG: Record<
  OrderStatus,
  { label: string; labelJa: string; badgeClass: string; icon?: React.ComponentType<{ className?: string }> }
> = {
  pending: {
    label: "Pending",
    labelJa: "受付待ち",
    badgeClass: "bg-amber-100 text-amber-800 border border-amber-100/80",
    icon: Clock,
  },
  confirmed: {
    label: "Confirmed",
    labelJa: "確認済み",
    badgeClass: "bg-blue-100 text-blue-800 border border-blue-200/60",
    icon: CheckCircle2,
  },
  preparing: {
    label: "Preparing",
    labelJa: "準備中",
    badgeClass: "bg-orange-100 text-orange-800 border border-orange-200/60",
    icon: ChefHat,
  },
  ready: {
    label: "Ready",
    labelJa: "提供待ち",
    badgeClass: "bg-sky-100 text-sky-800 border border-sky-200/60",
    icon: Truck,
  },
  served: {
    label: "Served",
    labelJa: "提供済み（未会計）",
    badgeClass: "bg-amber-100 text-amber-800 border border-amber-100/80",
    icon: ReceiptText,
  },
  paid: {
    label: "Paid",
    labelJa: "会計済み",
    badgeClass: "bg-emerald-200/80 text-emerald-900 border border-emerald-200/50",
    icon: Wallet,
  },
  cancelled: {
    label: "Cancelled",
    labelJa: "キャンセル",
    badgeClass: "bg-gray-100 text-gray-600 border border-gray-200",
    icon: XCircle,
  },
};

function getNextStatus(current: OrderStatus): OrderStatus | null {
  const i = STATUS_FLOW.indexOf(current);
  if (i === -1 || i >= STATUS_FLOW.length - 1) return null;
  return STATUS_FLOW[i + 1];
}

/**
 * ページ番号 + 省略（…）— 1 … 4 5 6 … 最終ページ のようにキッチン向けに読みやすく。
 */
function buildPaginationItems(current: number, total: number): (number | "ellipsis")[] {
  if (total <= 1) return [1];
  if (total <= 7) {
    return Array.from({ length: total }, (_, i) => i + 1);
  }
  const pages = new Set<number>();
  pages.add(1);
  pages.add(total);
  const lo = Math.max(2, current - 1);
  const hi = Math.min(total - 1, current + 1);
  for (let p = lo; p <= hi; p++) pages.add(p);
  if (current <= 4) {
    for (let p = 2; p <= Math.min(5, total - 1); p++) pages.add(p);
  }
  if (current >= total - 3) {
    for (let p = Math.max(2, total - 4); p <= total - 1; p++) pages.add(p);
  }
  const sorted = Array.from(pages).sort((a, b) => a - b);
  const out: (number | "ellipsis")[] = [];
  for (let i = 0; i < sorted.length; i++) {
    const n = sorted[i]!;
    if (i > 0 && n - sorted[i - 1]! > 1) out.push("ellipsis");
    out.push(n);
  }
  return out;
}

function filterByTab(order: OrderRecord, tab: FilterTab): boolean {
  const s = order.status;
  if (tab === "all") return true;
  if (tab === "new") return s === "pending" || s === "confirmed";
  if (tab === "preparing") return s === "preparing";
  if (tab === "ready") return s === "ready";
  if (tab === "served") return s === "served"; // 提供済み・未会計
  if (tab === "paid") return s === "paid";     // 会計済み
  if (tab === "cancelled") return s === "cancelled";
  return true;
}

async function patchOrder(
  id: string,
  body: { status?: OrderStatus; payment_status?: string; items?: OrderItemPayload[] }
): Promise<OrderRecord | null> {
  const res = await fetch(`/api/orders/${id}`, {
    method: "PATCH",
    credentials: "include",
    cache: "no-store",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(body),
  });
  if (!res.ok) return null;
  const data = await res.json();
  return data as OrderRecord;
}

function OrdersPageInner() {
  const { orders, loading, refresh } = useOrders();
  const searchParams = useSearchParams();
  const router = useRouter();
  const pathname = usePathname();

  const todayTokyo = tokyoDateString();
  const selectedDate = clampKitchenDate(
    parseKitchenDateParam(searchParams.get("date"), todayTokyo),
    todayTokyo
  );

  const pageSize = parseOrdersPageSize(searchParams.get("per"));
  const pageRequested = parsePositivePage(searchParams.get("page"));

  const setOrdersQuery = useCallback(
    (patch: Partial<{ date: string; page: number; per: OrdersPageSize }>) => {
      const sp = new URLSearchParams(searchParams.toString());
      if (patch.date !== undefined) {
        sp.set("date", clampKitchenDate(patch.date, todayTokyo));
        sp.set("page", "1");
      }
      if (patch.per !== undefined) {
        sp.set("per", String(patch.per));
        sp.set("page", "1");
      }
      if (patch.page !== undefined) sp.set("page", String(patch.page));
      router.replace(`${pathname}?${sp.toString()}`, { scroll: false });
    },
    [todayTokyo, searchParams, router, pathname]
  );

  const aggregateDateInputRef = useRef<HTMLInputElement>(null);
  const openAggregateDatePicker = useCallback(() => {
    const el = aggregateDateInputRef.current;
    if (!el) return;
    try {
      if (typeof el.showPicker === "function") {
        el.showPicker();
        return;
      }
    } catch {
      /* ignore */
    }
    el.focus();
    el.click();
  }, []);
  const [activeTab, setActiveTab] = useState<FilterTab>("new");
  const [patchingId, setPatchingId] = useState<string | null>(null);
  const [linePatchKey, setLinePatchKey] = useState<string | null>(null);
  const [toast, setToast] = useState<string | null>(null);
  const [customerPrintOrder, setCustomerPrintOrder] = useState<OrderRecord | null>(null);
  const [activeModal, setActiveModal] = useState<ActiveOrdersModal | null>(null);
  const dismissedNewOrderIdsRef = useRef<Set<string>>(new Set());
  const orderItemsDigestRef = useRef<Map<string, OrderItemsDigest>>(new Map());
  const appendQueueRef = useRef<{ order: OrderRecord; previousItemCount: number }[]>([]);
  const appendNotifyKeysRef = useRef<Set<string>>(new Set());

  /** In hóa đơn thanh toán cho khách (browser print) */
  useEffect(() => {
    if (!customerPrintOrder) return;
    let cancelled = false;
    const raf = window.requestAnimationFrame(() => {
      window.requestAnimationFrame(() => {
        if (!cancelled) window.print();
      });
    });
    const onAfterPrint = () => setCustomerPrintOrder(null);
    window.addEventListener("afterprint", onAfterPrint);
    return () => {
      cancelled = true;
      window.cancelAnimationFrame(raf);
      window.removeEventListener("afterprint", onAfterPrint);
    };
  }, [customerPrintOrder]);

  /**
   * 新規 pending のみポップアップ。閉じるときは「確認して閉じる」で confirmed に PATCH するため、
   * ここでは主に「別の pending が後から来た」場合の表示用（dismissed は補助）。
   */
  useEffect(() => {
    const pending = orders
      .filter((o) => o.status === "pending")
      .sort(
        (a, b) =>
          new Date(a.created_at).getTime() - new Date(b.created_at).getTime()
      );
    const next = pending.find((o) => !dismissedNewOrderIdsRef.current.has(o.id));
    if (!next) return;
    setActiveModal((prev) => {
      if (prev?.type === "customer_receipt") return prev;
      if (prev?.type === "new_order") return prev;
      return { type: "new_order", order: next };
    });
  }, [orders]);

  /**
   * 同じ注文に客が品を追加（マージ）→ ステータスが pending 以外でも行数が増える。
   * pending のままマージされた場合は新規モーダルの注文内容を最新に差し替え。
   */
  useEffect(() => {
    const digests = orderItemsDigestRef.current;
    const currentIds = new Set<string>();

    for (const o of orders) {
      currentIds.add(o.id);
      const itemCount = o.items?.length ?? 0;
      const nextDigest: OrderItemsDigest = { updated_at: o.updated_at, itemCount };
      const old = digests.get(o.id);
      digests.set(o.id, nextDigest);

      if (!old) continue;
      const terminal = o.status === "paid" || o.status === "cancelled";
      if (terminal) continue;
      if (itemCount <= old.itemCount || nextDigest.updated_at === old.updated_at) continue;

      if (o.status === "pending") {
        setActiveModal((prev) =>
          prev?.type === "new_order" && prev.order.id === o.id
            ? { type: "new_order", order: o }
            : prev
        );
        continue;
      }

      const dedupeKey = `${o.id}:${nextDigest.updated_at}`;
      if (appendNotifyKeysRef.current.has(dedupeKey)) continue;
      appendNotifyKeysRef.current.add(dedupeKey);
      appendQueueRef.current.push({ order: o, previousItemCount: old.itemCount });
    }

    for (const id of Array.from(digests.keys())) {
      if (!currentIds.has(id)) digests.delete(id);
    }
  }, [orders]);

  useEffect(() => {
    if (activeModal?.type === "customer_receipt" || activeModal?.type === "new_order") {
      return;
    }
    if (appendQueueRef.current.length === 0) return;
    setActiveModal((prev) => {
      if (prev?.type === "customer_receipt" || prev?.type === "new_order") return prev;
      if (prev?.type === "appended_order") return prev;
      const next = appendQueueRef.current.shift();
      if (!next) return prev;
      return {
        type: "appended_order",
        order: next.order,
        previousItemCount: next.previousItemCount,
      };
    });
  }, [orders, activeModal]);

  /** 新規／追加モーダル表示時に短い通知音（同一画面内の重複は抑える） */
  const alertSoundLastRef = useRef<{
    modal: ActiveOrdersModal["type"] | null;
    newFingerprint: string | null;
    appendKey: string | null;
  }>({ modal: null, newFingerprint: null, appendKey: null });

  useEffect(() => {
    if (!activeModal) {
      alertSoundLastRef.current = { modal: null, newFingerprint: null, appendKey: null };
      return;
    }
    if (activeModal.type === "customer_receipt") return;

    if (activeModal.type === "new_order") {
      const fp = `${activeModal.order.id}:${activeModal.order.items.length}:${activeModal.order.updated_at}`;
      const prev = alertSoundLastRef.current;
      if (prev.modal !== "new_order" || prev.newFingerprint !== fp) {
        playKitchenAlertPing("new");
        alertSoundLastRef.current = { modal: "new_order", newFingerprint: fp, appendKey: null };
      }
      return;
    }

    if (activeModal.type === "appended_order") {
      const key = `${activeModal.order.id}:${activeModal.order.updated_at}:${activeModal.previousItemCount}`;
      if (alertSoundLastRef.current.appendKey !== key) {
        playKitchenAlertPing("append");
        alertSoundLastRef.current = {
          modal: "appended_order",
          newFingerprint: null,
          appendKey: key,
        };
      }
    }
  }, [activeModal]);

  const showToast = useCallback((message: string) => {
    setToast(message);
    const t = setTimeout(() => setToast(null), 2500);
    return () => clearTimeout(t);
  }, []);

  /** 受付（created_at）が早い順 → 先に注文した客を上に（FIFO） */
  const ordered = useMemo(
    () =>
      [...orders]
        .filter((o) => orderInKitchenScope(o.created_at, selectedDate, "all"))
        .sort(
          (a, b) =>
            new Date(a.created_at).getTime() - new Date(b.created_at).getTime()
        ),
    [orders, selectedDate]
  );

  const filtered = useMemo(
    () => ordered.filter((o) => filterByTab(o, activeTab)),
    [ordered, activeTab]
  );

  const totalPages = Math.max(1, Math.ceil(filtered.length / pageSize));
  const safePage = Math.min(pageRequested, totalPages);

  const paginated = useMemo(
    () => filtered.slice((safePage - 1) * pageSize, safePage * pageSize),
    [filtered, safePage, pageSize]
  );

  useEffect(() => {
    if (pageRequested > totalPages) {
      const sp = new URLSearchParams(searchParams.toString());
      sp.set("page", String(totalPages));
      router.replace(`${pathname}?${sp.toString()}`, { scroll: false });
    }
  }, [pageRequested, totalPages, pathname, router, searchParams]);

  const handleTabChange = useCallback(
    (key: FilterTab) => {
      setActiveTab(key);
      if (searchParams.get("page") && searchParams.get("page") !== "1") {
        const sp = new URLSearchParams(searchParams.toString());
        sp.set("page", "1");
        router.replace(`${pathname}?${sp.toString()}`, { scroll: false });
      }
    },
    [searchParams, router, pathname]
  );

  const counts: Record<FilterTab, number> = {
    all: ordered.length,
    new: ordered.filter((o) => filterByTab(o, "new")).length,
    preparing: ordered.filter((o) => filterByTab(o, "preparing")).length,
    ready: ordered.filter((o) => filterByTab(o, "ready")).length,
    served: ordered.filter((o) => filterByTab(o, "served")).length,
    paid: ordered.filter((o) => filterByTab(o, "paid")).length,
    cancelled: ordered.filter((o) => filterByTab(o, "cancelled")).length,
  };

  const handleStatusChange = useCallback(
    async (orderId: string, nextStatus: OrderStatus) => {
      setPatchingId(orderId);
      try {
        const updated = await patchOrder(orderId, {
          status: nextStatus,
          ...(nextStatus === "paid" ? { payment_status: "paid" } : {}),
        });
        if (updated) {
          refresh();
          showToast("注文を更新しました");
          if (nextStatus === "paid") {
            setActiveModal({ type: "customer_receipt", order: updated });
          }
        }
      } finally {
        setPatchingId(null);
      }
    },
    [refresh, showToast]
  );

  const handleLineFulfillmentToggle = useCallback(
    async (order: OrderRecord, idx: number) => {
      const list = order.items as OrderItemPayload[];
      if (!list[idx]) return;
      const canEditLines = order.status !== "cancelled" && order.status !== "paid";
      if (!canEditLines) return;

      const nextItems = list.map((it, i) => {
        if (i !== idx) return it;
        const next =
          getLineFulfillmentStatus(it) === "delivered"
            ? ("pending" as const)
            : ("delivered" as const);
        return { ...it, fulfillment_status: next };
      });

      const key = `${order.id}-${idx}`;
      setLinePatchKey(key);
      try {
        const updated = await patchOrder(order.id, { items: nextItems });
        if (updated) {
          refresh();
          showToast(
            getLineFulfillmentStatus(nextItems[idx]!) === "delivered"
              ? "お席へ提供済みにしました"
              : "未提供に戻しました"
          );
        } else {
          showToast("更新に失敗しました");
        }
      } finally {
        setLinePatchKey(null);
      }
    },
    [refresh, showToast]
  );

  const handleCancel = useCallback(
    async (orderId: string) => {
      if (!confirm("この注文をキャンセルしますか？")) return;
      setPatchingId(orderId);
      try {
        const updated = await patchOrder(orderId, { status: "cancelled" });
        if (updated) {
          refresh();
          showToast("注文をキャンセルしました");
        }
      } finally {
        setPatchingId(null);
      }
    },
    [refresh, showToast]
  );

  const attentionCount = ordered.filter(
    (o) => o.status !== "paid" && o.status !== "cancelled"
  ).length;

  return (
    <main className="app-shell flex min-h-screen bg-[#FAF8F0] text-gray-800">
      {customerPrintOrder && (
        <div className="customer-print-root" aria-hidden>
          <CustomerPaymentReceipt order={customerPrintOrder} />
        </div>
      )}
      <KitchenDesktopAside
        active="orders"
        dateParam={selectedDate}
        ordersAttentionCount={attentionCount}
      />

      {/* MAIN */}
      <section className="flex-1 overflow-y-auto px-4 py-5 sm:px-6 lg:px-8">
        <KitchenMobileNav
          active="orders"
          dateParam={selectedDate}
          ordersAttentionCount={attentionCount}
        />
        {/* Toast 更新完了 */}
        {toast && (
          <div className="fixed left-1/2 top-4 z-50 -translate-x-1/2 transition-opacity duration-200">
            <div className="flex items-center gap-2 rounded-xl border border-emerald-100/95 bg-white px-4 py-3 text-sm font-medium text-emerald-800 shadow-lg">
              <CheckCircle2 className="h-5 w-5 text-emerald-600" />
              {toast}
            </div>
          </div>
        )}
        <header className="mb-6 flex flex-wrap items-center justify-between gap-4">
          <div>
            <h1 className="text-2xl font-semibold text-gray-800">
              注文管理
            </h1>
            <p className="mt-0.5 text-xs text-gray-600">
              リアルタイムで注文状況を確認し、迅速に対応できます。
            </p>
          </div>
          <span className="rounded-full border border-amber-100/95 bg-amber-50/80 px-3 py-1 text-xs font-medium text-amber-800">
            自家製麺 多聞
          </span>
        </header>

        {/* 表示日（1日分）— URL ?date= と同期 */}
        <div className="mb-5 flex flex-wrap items-end gap-4 rounded-3xl border border-gray-100 bg-white p-4 shadow-sm">
          <div className="min-w-0">
            <p className="mb-1.5 text-[11px] font-semibold uppercase tracking-wide text-gray-500">
              表示日
            </p>
            <div className="flex max-w-[17rem] items-center gap-1">
              <button
                type="button"
                onClick={() => setOrdersQuery({ date: rollTokyoYmd(selectedDate, -1) })}
                aria-label="前日"
                className="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl border border-amber-100/90 bg-white text-gray-700 shadow-sm transition hover:border-amber-200/55 hover:bg-[#FAF8F0]/80"
              >
                <ChevronLeft className="h-4 w-4" />
              </button>
              <div className="min-w-0 flex-1">
                <input
                  ref={aggregateDateInputRef}
                  id="orders-aggregate-date"
                  type="date"
                  value={selectedDate}
                  max={todayTokyo}
                  onChange={(e) => setOrdersQuery({ date: e.target.value })}
                  tabIndex={-1}
                  className="sr-only"
                />
                <button
                  type="button"
                  onClick={openAggregateDatePicker}
                  aria-label={`表示日を変更。現在 ${selectedDate}`}
                  className="flex min-h-[44px] w-full touch-manipulation items-center justify-between gap-2 rounded-xl border border-amber-100/90 bg-white px-3 py-2 text-left text-sm text-gray-900 shadow-inner ring-1 ring-amber-50/90 transition hover:border-amber-200/55 hover:bg-[#FAF8F0]/60"
                >
                  <span className="tabular-nums tracking-tight">{selectedDate}</span>
                  <CalendarDays className="h-4 w-4 shrink-0 text-gray-700" aria-hidden />
                </button>
              </div>
              <button
                type="button"
                disabled={selectedDate >= todayTokyo}
                onClick={() => setOrdersQuery({ date: rollTokyoYmd(selectedDate, 1) })}
                aria-label="翌日"
                className="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl border border-amber-100/90 bg-white text-gray-700 shadow-sm transition hover:border-amber-200/55 hover:bg-[#FAF8F0]/80 disabled:cursor-not-allowed disabled:opacity-40"
              >
                <ChevronRight className="h-4 w-4" />
              </button>
            </div>
          </div>
        </div>

        <p className="mb-3 text-[11px] leading-relaxed text-gray-600">
          この日の一覧は<strong className="font-semibold text-gray-800">受付が早い順</strong>
          です（上の行ほど先に注文）。対応の優先はこの順が目安になります。
        </p>

        {/* FILTER TABS — 固定でスクロール時も表示 */}
        <div className="sticky top-0 z-10 -mx-4 mb-5 flex flex-wrap items-center gap-2 border-b border-amber-100/95 bg-white/95 px-4 py-3 shadow-[0_1px_0_rgba(15,23,42,0.04)] backdrop-blur-sm sm:-mx-6 sm:px-6 lg:-mx-8 lg:px-8">
          {(
            [
              ["all", "すべて"],
              ["new", "新規"],
              ["preparing", "準備中"],
              ["ready", "提供待ち"],
              ["served", "提供済み"],
              ["paid", "会計済み"],
              ["cancelled", "キャンセル"],
            ] as [FilterTab, string][]
          ).map(([key, label]) => (
            <button
              key={key}
              type="button"
              onClick={() => handleTabChange(key)}
              className={`rounded-full border px-3 py-1.5 text-[11px] transition ${
                activeTab === key
                  ? "border-amber-200/55 bg-[#FAF8F0] font-semibold text-gray-900 shadow-sm ring-1 ring-amber-50/90"
                  : "border-amber-100/90 bg-white font-medium text-gray-600 hover:border-amber-200/55 hover:bg-[#FAF8F0]/70"
              }`}
            >
              {label}
              <span className="ml-1.5 text-[10px] opacity-90">({counts[key]})</span>
            </button>
          ))}
        </div>

        {filtered.length > 0 && (
          <div className="mb-4 flex flex-wrap items-center justify-between gap-3 rounded-2xl border border-gray-200/45 bg-white/80 px-4 py-3 text-xs text-gray-600 shadow-sm">
            <p className="tabular-nums font-medium">
              <span className="text-gray-400">表示</span>{" "}
              <span className="text-gray-700">
                {(safePage - 1) * pageSize + 1}–{Math.min(safePage * pageSize, filtered.length)}
              </span>
              <span className="text-gray-300"> / </span>
              <span className="text-gray-600">{filtered.length}件</span>
            </p>
            <div className="flex flex-wrap items-center gap-2">
              <label htmlFor="orders-page-size" className="text-gray-400">
                表示件数
              </label>
              <select
                id="orders-page-size"
                value={pageSize}
                onChange={(e) =>
                  setOrdersQuery({ per: parseOrdersPageSize(e.target.value) })
                }
                className="rounded-lg border border-gray-200/60 bg-gray-50/50 px-2.5 py-1.5 text-xs font-medium text-gray-700 outline-none transition hover:border-gray-300 hover:bg-white focus:border-emerald-400/40 focus:ring-2 focus:ring-emerald-500/10"
              >
                {ORDERS_PAGE_SIZES.map((n) => (
                  <option key={n} value={n}>
                    {n}
                  </option>
                ))}
              </select>
            </div>
          </div>
        )}

        {/* ORDER CARDS */}
        {loading && orders.length === 0 ? (
          <div className="flex items-center gap-2 rounded-2xl border border-gray-100 bg-white px-4 py-8 text-sm text-gray-500">
            <Loader2 className="h-4 w-4 animate-spin" />
            注文を読み込み中…
          </div>
        ) : filtered.length === 0 ? (
          <div className="rounded-2xl border border-gray-100 bg-white px-4 py-10 text-center">
            <ReceiptText className="mx-auto h-10 w-10 text-gray-300" />
            <p className="mt-2 text-sm font-medium text-gray-600">
              {ordered.length === 0 ? "この日の注文はありません" : "この条件の注文はありません"}
            </p>
            <p className="mt-0.5 text-xs text-gray-500">
              {ordered.length === 0
                ? "日付を変えるか、お客様の注文をお待ちください。"
                : "タブを変えて確認してください。"}
            </p>
          </div>
        ) : (
          <>
            <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">
              {paginated.map((order, cardIdx) => {
              const config = STATUS_CONFIG[order.status];
              const nextStatus = getNextStatus(order.status);
              const isPatching = patchingId === order.id;
              const Icon = config.icon;
              const itemsPayload = order.items as OrderItemPayload[];
              const canEditLines = order.status !== "cancelled" && order.status !== "paid";
              const receiptOrderInTab = (safePage - 1) * pageSize + cardIdx + 1;

              return (
                <article
                  key={order.id}
                  className="flex flex-col rounded-2xl border border-gray-100 bg-white shadow-sm overflow-hidden"
                >
                  {/* Header: ID, time, elapsed, table, total, status */}
                  <div className="border-b border-gray-100 bg-gray-50/50 px-4 py-3">
                    <div className="flex items-start justify-between gap-2">
                      <div className="min-w-0">
                        <p className="text-[10px] font-semibold text-emerald-800/90">
                          受付順 {receiptOrderInTab}
                          {filtered.length > 1 ? ` / ${filtered.length}` : ""}
                        </p>
                        <p className="text-[11px] font-semibold uppercase tracking-wider text-gray-500">
                          #{String(order.id).slice(0, 8)}
                        </p>
                        <p className="mt-0.5 text-xs text-gray-600">
                          {formatDateShort(order.created_at)}
                        </p>
                        {order.status !== "paid" && order.status !== "cancelled" && (
                          <p className="mt-1 text-[10px] font-medium text-amber-700">
                            {formatElapsed(order.created_at)}
                          </p>
                        )}
                      </div>
                      <div className="text-right">
                        <p className="text-base font-bold text-emerald-700">
                          ¥{toYen(order.total_amount)}
                        </p>
                        <span
                          className={`mt-1 inline-flex items-center gap-1 rounded-full border px-2 py-0.5 text-[10px] font-semibold ${config.badgeClass}`}
                        >
                          {Icon && <Icon className="h-3 w-3" />}
                          {config.labelJa}
                        </span>
                      </div>
                    </div>
                    <p className="mt-2 text-sm font-semibold text-gray-800">
                      {order.table_label ?? "—"}
                    </p>
                  </div>

                  {/* 品目ごと — お席へ出したかどうかだけチェック */}
                  <div className="flex-1 px-3 py-2 sm:px-4">
                    <ul className="divide-y divide-gray-100">
                      {itemsPayload.map((item, idx) => {
                        const custom = formatCustomization(item.customization);
                        const lineSum = item.unit_price * item.quantity;
                        const isDelivered = getLineFulfillmentStatus(item) === "delivered";
                        const rowKey = `${order.id}-${idx}`;
                        const lineBusy = linePatchKey === rowKey;
                        const lineNameJa = displayMenuItemNameJa(item.menu_item_id, item.menu_item_name);
                        return (
                          <li
                            key={rowKey}
                            className="flex items-center gap-3 py-2 sm:gap-3.5"
                          >
                            <div className="min-w-0 flex-1">
                              <p className="text-sm font-medium text-gray-800">
                                {lineNameJa}
                                <span className="ml-1 font-normal text-gray-500">×{item.quantity}</span>
                              </p>
                              {custom && (
                                <p className="mt-0.5 text-[11px] text-gray-500">{custom}</p>
                              )}
                            </div>
                            <span className="shrink-0 text-sm tabular-nums text-gray-600">
                              ¥{toYen(lineSum)}
                            </span>
                            {canEditLines ? (
                              <button
                                type="button"
                                role="checkbox"
                                aria-checked={isDelivered}
                                aria-label={
                                  isDelivered
                                    ? `${lineNameJa}：お席へ未提供に戻す`
                                    : `${lineNameJa}：お席へ提供済み`
                                }
                                disabled={lineBusy || isPatching}
                                onClick={() => handleLineFulfillmentToggle(order, idx)}
                                className={`flex h-[1.125rem] w-[1.125rem] sm:h-5 sm:w-5 shrink-0 items-center justify-center rounded-full border-[1.5px] transition focus:outline-none focus-visible:ring-2 focus-visible:ring-stone-300/60 focus-visible:ring-offset-1 focus-visible:ring-offset-[#FAF8F0] disabled:opacity-40 ${
                                  isDelivered
                                    ? "border-[#e0d6ca] bg-[#FAF8F0]"
                                    : "border-[#e8e0d6] bg-white hover:border-[#ddd4c8] hover:bg-[#FAF8F0]/60"
                                }`}
                              >
                                {lineBusy ? (
                                  <Loader2 className="h-2.5 w-2.5 animate-spin text-[#c4b8aa] sm:h-3 sm:w-3" />
                                ) : isDelivered ? (
                                  <Check
                                    className="h-2.5 w-2.5 sm:h-3 sm:w-3 text-[#c4b8aa]"
                                    strokeWidth={2.4}
                                    aria-hidden
                                  />
                                ) : null}
                              </button>
                            ) : (
                              isDelivered && (
                                <span
                                  className="flex h-[1.125rem] w-[1.125rem] sm:h-5 sm:w-5 shrink-0 items-center justify-center rounded-full border-[1.5px] border-[#e0d6ca] bg-[#FAF8F0]"
                                  title="提供済"
                                >
                                  <Check className="h-2.5 w-2.5 sm:h-3 sm:w-3 text-[#c4b8aa]" strokeWidth={2.4} />
                                </span>
                              )
                            )}
                          </li>
                        );
                      })}
                    </ul>
                    {order.customer_note && (
                      <p className="mt-2 text-[11px] text-amber-800 bg-amber-50/60 rounded-lg px-2 py-1">
                        {order.customer_note}
                      </p>
                    )}
                  </div>

                  {/* Actions */}
                  <div className="border-t border-gray-100 px-4 py-3 bg-gray-50/30 space-y-2">
                    {/* 提供済み：未会計 → 会計済みにするを強調 */}
                    {order.status === "served" && (
                      <>
                        <div className="rounded-xl border border-amber-100/95 bg-amber-50/80 px-3 py-2 text-center">
                          <p className="text-[11px] font-semibold text-amber-900">未会計</p>
                          <p className="mt-0.5 text-[10px] text-amber-800/80">
                            お客様のお支払いを確認したら下のボタンを押してください
                          </p>
                        </div>
                        <button
                          type="button"
                          disabled={isPatching}
                          onClick={() => handleStatusChange(order.id, "paid")}
                          className="flex w-full items-center justify-center gap-2 rounded-xl bg-amber-500 px-3 py-3 text-sm font-bold text-white shadow-md hover:bg-amber-600 disabled:opacity-60"
                        >
                          {isPatching ? (
                            <Loader2 className="h-4 w-4 animate-spin" />
                          ) : (
                            <Wallet className="h-4 w-4" />
                          )}
                          会計済みにする
                        </button>
                        <button
                          type="button"
                          disabled={isPatching}
                          onClick={() => handleCancel(order.id)}
                          className="flex w-full items-center justify-center gap-1.5 rounded-xl border border-red-200 bg-white px-3 py-2 text-[11px] font-medium text-red-600 hover:bg-red-50"
                        >
                          <XCircle className="h-3.5 w-3.5" />
                          キャンセル
                        </button>
                      </>
                    )}

                    {/* その他（pending 〜 ready）：次のステップ + キャンセル */}
                    {order.status !== "cancelled" && order.status !== "paid" && order.status !== "served" && (
                      <>
                        {nextStatus && (
                          <button
                            type="button"
                            disabled={isPatching}
                            onClick={() => handleStatusChange(order.id, nextStatus)}
                            className="flex w-full items-center justify-center gap-2 rounded-xl border border-emerald-100/90 bg-emerald-50/90 px-3 py-2.5 text-xs font-semibold text-emerald-900 shadow-sm ring-1 ring-emerald-50/85 transition hover:bg-emerald-100/95 disabled:opacity-60"
                          >
                            {isPatching ? (
                              <Loader2 className="h-3.5 w-3.5 animate-spin" />
                            ) : (
                              <ChevronRight className="h-3.5 w-3.5" />
                            )}
                            {nextStatus === "confirmed" && "確認する"}
                            {nextStatus === "preparing" && "準備開始"}
                            {nextStatus === "ready" && "提供待ちにする"}
                            {nextStatus === "served" && "提供済みにする"}
                          </button>
                        )}
                        <button
                          type="button"
                          disabled={isPatching}
                          onClick={() => handleCancel(order.id)}
                          className="flex w-full items-center justify-center gap-1.5 rounded-xl border border-red-200 bg-white px-3 py-2 text-[11px] font-medium text-red-600 hover:bg-red-50"
                        >
                          <XCircle className="h-3.5 w-3.5" />
                          キャンセル
                        </button>
                      </>
                    )}

                    {/* 会計済み・キャンセル済み */}
                    {(order.status === "cancelled" || order.status === "paid") && (
                      <div className="space-y-2 py-1">
                        {order.status === "paid" ? (
                          <>
                            <div className="flex items-center justify-center gap-2">
                              <CheckCircle2 className="h-4 w-4 text-emerald-600" />
                              <p className="text-xs font-semibold text-emerald-700">会計済み</p>
                            </div>
                            <button
                              type="button"
                              onClick={() => setCustomerPrintOrder(order)}
                              className="flex w-full items-center justify-center gap-2 rounded-xl border border-emerald-100/90 bg-emerald-50 px-3 py-2.5 text-sm font-bold text-emerald-900 shadow-sm ring-1 ring-emerald-50/90 transition hover:bg-emerald-100"
                            >
                              <ReceiptText className="h-4 w-4 shrink-0" />
                              お客様用レシートを印刷
                            </button>
                          </>
                        ) : (
                          <p className="text-center text-[11px] text-gray-500">キャンセル済み</p>
                        )}
                      </div>
                    )}
                  </div>
                </article>
              );
              })}
            </div>

            {/* 一覧の下：ページ番号のみ（淡色） */}
            <div className="mt-8 overflow-hidden rounded-2xl border border-gray-200/45 bg-white/70 shadow-sm backdrop-blur-sm">
              <div className="bg-gradient-to-br from-gray-50/40 via-white to-emerald-50/12 px-3 py-3 sm:px-4">
                <nav
                  className="flex flex-wrap items-center justify-center gap-1"
                  aria-label="ページ送り"
                >
                  <button
                    type="button"
                    disabled={safePage <= 1}
                    onClick={() => setOrdersQuery({ page: safePage - 1 })}
                    className={cn(
                      "inline-flex h-9 min-w-[2.25rem] items-center justify-center rounded-lg border px-2 text-gray-500 transition",
                      "border-gray-200/70 bg-white/90 hover:border-gray-300 hover:bg-gray-50/80 hover:text-gray-700",
                      "disabled:pointer-events-none disabled:border-gray-100 disabled:bg-gray-50/50 disabled:text-gray-300"
                    )}
                    aria-label="前のページ"
                  >
                    <ChevronLeft className="h-4 w-4" aria-hidden />
                  </button>

                  {buildPaginationItems(safePage, totalPages).map((item, idx) =>
                    item === "ellipsis" ? (
                      <span
                        key={`ellipsis-${idx}`}
                        className="inline-flex min-w-[1.5rem] select-none items-center justify-center px-0.5 text-[13px] font-semibold tracking-wide text-gray-300"
                        aria-hidden
                      >
                        …
                      </span>
                    ) : (
                      <button
                        key={item}
                        type="button"
                        onClick={() => {
                          if (item !== safePage) setOrdersQuery({ page: item });
                        }}
                        className={cn(
                          "inline-flex h-9 min-w-[2.25rem] items-center justify-center rounded-lg border px-2.5 text-sm tabular-nums font-medium transition",
                          item === safePage
                            ? "cursor-default border-emerald-100/70 bg-emerald-100/55 text-emerald-900 shadow-sm ring-1 ring-emerald-100/35"
                            : "border-gray-200/70 bg-white/90 text-gray-700 hover:border-emerald-100/90 hover:bg-emerald-50/25 hover:text-emerald-900/90"
                        )}
                        aria-current={item === safePage ? "page" : undefined}
                        aria-label={`ページ ${item}`}
                      >
                        {item}
                      </button>
                    )
                  )}

                  <button
                    type="button"
                    disabled={safePage >= totalPages}
                    onClick={() => setOrdersQuery({ page: safePage + 1 })}
                    className={cn(
                      "inline-flex h-9 min-w-[2.25rem] items-center justify-center rounded-lg border px-2 text-gray-500 transition",
                      "border-gray-200/70 bg-white/90 hover:border-gray-300 hover:bg-gray-50/80 hover:text-gray-700",
                      "disabled:pointer-events-none disabled:border-gray-100 disabled:bg-gray-50/50 disabled:text-gray-300"
                    )}
                    aria-label="次のページ"
                  >
                    <ChevronRight className="h-4 w-4" aria-hidden />
                  </button>
                </nav>
                <p className="mt-2 text-center text-[10px] font-medium tracking-wide text-gray-400">
                  <span className="tabular-nums text-gray-500">{totalPages}</span> ページ中{" "}
                  <span className="tabular-nums text-emerald-700/70">{safePage}</span> ページ目
                </p>
              </div>
            </div>
          </>
        )}
      </section>

      {/* 新規注文：受付直後に表示 */}
      {activeModal?.type === "new_order" && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center bg-black/45 p-4 backdrop-blur-[1px]">
          <div
            className="max-h-[90vh] w-full max-w-lg overflow-y-auto rounded-2xl border border-gray-200 bg-white shadow-2xl"
            role="dialog"
            aria-labelledby="new-order-title"
          >
            <div className="border-b border-emerald-100 bg-gradient-to-r from-emerald-50 to-amber-50/80 px-5 py-4">
              <div className="flex items-center gap-3">
                <span className="flex h-11 w-11 items-center justify-center rounded-2xl bg-sky-100 text-sky-700 shadow-sm ring-1 ring-sky-200/70">
                  <Bell className="h-5 w-5" />
                </span>
                <div>
                  <p id="new-order-title" className="text-lg font-bold text-gray-900">
                    新規注文が届きました
                  </p>
                  <p className="text-xs text-gray-600">
                    この一覧で内容を確認し、ステータスを更新して準備・提供へ進めてください
                  </p>
                </div>
              </div>
            </div>
            <div className="space-y-4 px-5 py-4">
              <div className="rounded-xl border border-gray-100 bg-gray-50/80 px-4 py-3">
                <div className="flex flex-wrap items-end justify-between gap-2">
                  <div>
                    <p className="text-[10px] font-semibold uppercase tracking-wider text-gray-500">
                      注文番号
                    </p>
                    <p className="font-mono text-base font-bold text-gray-900">
                      #{String(activeModal.order.id).slice(0, 8).toUpperCase()}
                    </p>
                  </div>
                  <div className="text-right">
                    <p className="text-[10px] text-gray-500">合計</p>
                    <p className="text-xl font-bold text-emerald-700">
                      ¥{toYen(activeModal.order.total_amount)}
                    </p>
                  </div>
                </div>
                <p className="mt-3 text-sm font-bold text-gray-800">
                  {activeModal.order.table_label ?? "—"}
                </p>
                <p className="mt-0.5 text-xs text-gray-500">
                  受付 {formatDateShort(activeModal.order.created_at)}
                </p>
              </div>
              <div>
                <p className="mb-2 text-[10px] font-bold uppercase tracking-wider text-gray-500">
                  ご注文内容
                </p>
                <ul className="max-h-48 space-y-2 overflow-y-auto rounded-xl border border-gray-100 bg-white px-3 py-2">
                  {(activeModal.order.items as OrderItemPayload[]).map((item, idx) => {
                    const custom = formatCustomization(item.customization);
                    const lineTotal = item.unit_price * item.quantity;
                    const lineNameJa = displayMenuItemNameJa(item.menu_item_id, item.menu_item_name);
                    return (
                      <li key={idx} className="border-b border-gray-50 pb-2 text-sm last:border-0 last:pb-0">
                        <div className="flex justify-between gap-2 font-medium text-gray-800">
                          <span>
                            {lineNameJa}
                            <span className="ml-1 text-gray-500">×{item.quantity}</span>
                          </span>
                          <span className="shrink-0 text-emerald-700">¥{toYen(lineTotal)}</span>
                        </div>
                        {custom && (
                          <p className="mt-0.5 text-[11px] text-gray-500">{custom}</p>
                        )}
                      </li>
                    );
                  })}
                </ul>
              </div>
              <button
                type="button"
                disabled={patchingId === activeModal.order.id}
                className="flex w-full items-center justify-center gap-2 rounded-xl border border-emerald-100/90 bg-emerald-50/90 px-4 py-3 text-sm font-bold text-emerald-900 shadow-sm ring-1 ring-emerald-50/85 transition hover:bg-emerald-100/95 disabled:cursor-not-allowed disabled:opacity-60"
                onClick={async () => {
                  const id = activeModal.order.id;
                  setPatchingId(id);
                  try {
                    const updated = await patchOrder(id, { status: "confirmed" });
                    if (updated) {
                      dismissedNewOrderIdsRef.current.add(id);
                      setActiveModal(null);
                      refresh();
                      showToast("注文を確認しました");
                    } else {
                      showToast("更新に失敗しました");
                    }
                  } finally {
                    setPatchingId(null);
                  }
                }}
              >
                {patchingId === activeModal.order.id ? (
                  <Loader2 className="h-4 w-4 animate-spin" />
                ) : null}
                確認して閉じる
              </button>
            </div>
          </div>
        </div>
      )}

      {/* 追加注文（同一伝票へのマージ）— 新規 pending モーダルとは別枠 */}
      {activeModal?.type === "appended_order" && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center bg-black/50 p-4 backdrop-blur-[2px]">
          <div
            className="max-h-[90vh] w-full max-w-lg overflow-hidden rounded-[1.35rem] border border-violet-200/90 bg-white shadow-[0_28px_80px_-20px_rgba(91,33,182,0.35)]"
            role="dialog"
            aria-labelledby="append-order-title"
          >
            <div className="relative overflow-hidden border-b border-violet-100/90 bg-gradient-to-br from-violet-600 via-indigo-600 to-violet-700 px-5 py-5 text-white">
              <div
                className="pointer-events-none absolute -right-10 -top-10 h-32 w-32 rounded-full bg-white/10 blur-2xl"
                aria-hidden
              />
              <div className="pointer-events-none absolute bottom-0 left-1/4 h-px w-1/2 bg-gradient-to-r from-transparent via-white/25 to-transparent" />
              <div className="relative flex items-start gap-3">
                <span className="flex h-12 w-12 shrink-0 items-center justify-center rounded-2xl bg-white/15 shadow-inner ring-1 ring-white/25">
                  <Sparkles className="h-6 w-6 text-amber-200" strokeWidth={2.2} />
                </span>
                <div className="min-w-0 flex-1">
                  <p
                    id="append-order-title"
                    className="text-[11px] font-bold uppercase tracking-[0.2em] text-violet-100/95"
                  >
                    同一お席 · 追加注文
                  </p>
                  <p className="mt-1.5 text-xl font-bold leading-snug tracking-tight">
                    新しい品目が追加されました
                  </p>
                  <p className="mt-2 text-sm font-medium leading-relaxed text-violet-100/95">
                    お客様が同じ注文に手を加えました。下記の追加分を確認し、調理・提供フローに反映してください。
                  </p>
                </div>
              </div>
            </div>

            <div className="max-h-[min(60vh,28rem)] overflow-y-auto space-y-4 px-5 py-5">
              <div className="flex flex-wrap items-center justify-between gap-2 rounded-2xl border border-gray-100/95 bg-gradient-to-br from-slate-50/95 to-white px-4 py-3.5 shadow-sm">
                <div className="flex flex-wrap items-center gap-2">
                  <span className="rounded-full bg-violet-100 px-2.5 py-1 text-[11px] font-bold text-violet-900">
                    +{activeModal.order.items.length - activeModal.previousItemCount} 品追加
                  </span>
                  <span
                    className={cn(
                      "inline-flex items-center gap-1 rounded-full border px-2.5 py-1 text-[11px] font-semibold",
                      STATUS_CONFIG[activeModal.order.status]?.badgeClass ?? "bg-gray-100 text-gray-700"
                    )}
                  >
                    {STATUS_CONFIG[activeModal.order.status]?.labelJa ?? activeModal.order.status}
                  </span>
                </div>
                <p className="font-mono text-xs font-bold tabular-nums text-gray-500">
                  #{String(activeModal.order.id).slice(0, 8).toUpperCase()}
                </p>
              </div>

              <div>
                <p className="mb-1.5 text-[10px] font-bold uppercase tracking-wider text-gray-500">
                  お席
                </p>
                <p className="text-lg font-bold text-gray-900">
                  {activeModal.order.table_label?.trim() || "—"}
                </p>
                <p className="mt-1 text-xs text-gray-500">
                  更新 {formatDateShort(activeModal.order.updated_at)}
                </p>
              </div>

              <div>
                <p className="mb-2 flex items-center gap-2 text-[10px] font-bold uppercase tracking-wider text-gray-500">
                  <span className="h-px flex-1 bg-gradient-to-r from-violet-200/80 to-transparent" />
                  追加分の内容
                  <span className="h-px flex-1 bg-gradient-to-l from-violet-200/80 to-transparent" />
                </p>
                <ul className="space-y-2 rounded-2xl border border-violet-100/80 bg-violet-50/35 p-3">
                  {(
                    activeModal.order.items.slice(activeModal.previousItemCount) as OrderItemPayload[]
                  ).map((item, idx) => {
                    const custom = formatCustomization(item.customization);
                    const lineTotal = item.unit_price * item.quantity;
                    const lineNameJa = displayMenuItemNameJa(item.menu_item_id, item.menu_item_name);
                    return (
                      <li
                        key={`${item.menu_item_id}-${activeModal.previousItemCount + idx}`}
                        className="rounded-xl border border-white/90 bg-white/90 px-3 py-2.5 shadow-sm"
                      >
                        <div className="flex justify-between gap-2 font-semibold text-gray-900">
                          <span className="min-w-0">
                            <span className="mr-1.5 inline-flex h-5 w-5 items-center justify-center rounded-md bg-violet-100 text-[10px] font-bold text-violet-800">
                              +
                            </span>
                            {lineNameJa}
                            <span className="ml-1 font-normal text-gray-500">×{item.quantity}</span>
                          </span>
                          <span className="shrink-0 tabular-nums text-violet-700">¥{toYen(lineTotal)}</span>
                        </div>
                        {custom && (
                          <p className="mt-1 text-[11px] leading-relaxed text-gray-600">{custom}</p>
                        )}
                      </li>
                    );
                  })}
                </ul>
              </div>

              <div className="rounded-2xl border border-emerald-100/90 bg-emerald-50/50 px-4 py-3 text-center">
                <p className="text-xs font-semibold text-emerald-950">
                  伝票合計（参考）
                  <span className="ml-2 font-mono text-sm tabular-nums text-emerald-800">
                    ¥{toYen(activeModal.order.total_amount)}
                  </span>
                </p>
              </div>

              <button
                type="button"
                className="flex w-full items-center justify-center gap-2 rounded-2xl border border-violet-200/90 bg-gradient-to-r from-violet-600 to-indigo-600 px-4 py-3.5 text-sm font-bold text-white shadow-lg shadow-violet-500/25 transition hover:from-violet-500 hover:to-indigo-500 active:scale-[0.99]"
                onClick={() => setActiveModal(null)}
              >
                <Check className="h-4 w-4 opacity-95" strokeWidth={2.5} />
                確認しました · 閉じる
              </button>
            </div>
          </div>
        </div>
      )}

      {/* 会計完了：お客様用レシート（顧客「ご来店ありがとう」カードと同系グラデーション） */}
      {activeModal?.type === "customer_receipt" && (
        <div className="fixed inset-0 z-[110] flex items-center justify-center bg-black/45 p-4 backdrop-blur-[1px]">
          <div
            className={cn("relative w-full max-w-md overflow-hidden", customerHeroShellClassName)}
            style={{ background: CUSTOMER_HERO_GRADIENT }}
            role="dialog"
            aria-labelledby="receipt-title"
          >
            <div className="pointer-events-none absolute -right-16 -top-16 h-36 w-36 rounded-full bg-emerald-300/[0.08] blur-2xl" />
            <div className="pointer-events-none absolute -bottom-14 -left-10 h-32 w-32 rounded-full bg-teal-300/[0.11] blur-2xl" />

            <div className="relative">
              <div className="border-b border-emerald-100/70 bg-white/55 px-5 py-4 backdrop-blur-sm">
                <p id="receipt-title" className="text-lg font-bold tracking-tight text-emerald-950">
                  会計完了
                </p>
                <p className="mt-0.5 text-xs leading-relaxed text-emerald-900/75">
                  お客様にお渡しするレシートを印刷できます
                </p>
              </div>
              <div className="space-y-4 px-5 py-4">
                <p className="text-center text-sm text-gray-700">
                  伝票{" "}
                  <span className="font-mono font-semibold text-emerald-950">
                    #{String(activeModal.order.id).slice(0, 8).toUpperCase()}
                  </span>
                  <br />
                  <span className="text-xs text-gray-600">
                    {activeModal.order.table_label
                      ? `お席 ${activeModal.order.table_label}`
                      : "お席 —"}
                  </span>
                </p>
                <button
                  type="button"
                  className="flex w-full items-center justify-center gap-2 rounded-2xl border border-emerald-100/90 bg-gradient-to-br from-emerald-50 via-white to-emerald-50/80 px-4 py-3.5 text-sm font-bold text-emerald-950 shadow-[0_10px_28px_-18px_rgba(16,185,129,0.14)] transition hover:border-emerald-200/60 hover:shadow-[0_14px_32px_-16px_rgba(16,185,129,0.12)] active:scale-[0.99]"
                  onClick={() => setCustomerPrintOrder(activeModal.order)}
                >
                  <Printer className="h-4 w-4 text-emerald-800" strokeWidth={2.2} />
                  お客様用レシートを印刷
                </button>
                <button
                  type="button"
                  className="w-full rounded-2xl border border-white/70 bg-white/75 py-2.5 text-sm font-semibold text-gray-700 shadow-sm backdrop-blur-sm transition hover:bg-white/95"
                  onClick={() => setActiveModal(null)}
                >
                  閉じる
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </main>
  );
}

export default function OrdersPage() {
  return (
    <Suspense
      fallback={
        <div className="flex min-h-screen items-center justify-center bg-[#FAF8F0] text-sm text-gray-500">
          読み込み中…
        </div>
      }
    >
      <OrdersPageInner />
    </Suspense>
  );
}
