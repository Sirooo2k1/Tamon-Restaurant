"use client";

import Link from "next/link";
import { Suspense, useCallback, useEffect, useMemo, useRef, useState } from "react";
import { usePathname, useRouter, useSearchParams } from "next/navigation";
import { useOrders } from "@/hooks/use-orders";
import { menuItems } from "@/lib/menu-data";
import type { OrderRecord } from "@/lib/types";
import {
  KITCHEN_SHIFTS,
  type KitchenShiftId,
  clampKitchenDate,
  orderInKitchenScope,
  parseKitchenDateParam,
  rollTokyoYmd,
  tokyoDateString,
} from "@/lib/kitchen-scope";
import { tableLabelKitchenUnpaidBadge } from "@/lib/kitchen-table-display";
import {
  CircleDollarSign,
  ShoppingBag,
  ListChecks,
  Users,
  Clock,
  Wallet,
  CheckCircle2,
  ChevronLeft,
  ChevronRight,
  AlertTriangle,
  Flame,
  BarChart3,
  CalendarDays,
} from "lucide-react";
import { KitchenDesktopAside, KitchenMobileNav } from "@/components/kitchen/KitchenNav";
import { cn } from "@/lib/utils";

/** 例: 2026年3月23日（月）— その YYYY-MM-DD を東京の暦日として解釈 */
function formatHeaderDateJa(ymd: string): string {
  const [y, m, d] = ymd.split("-").map(Number);
  if (!y || !m || !d) return ymd;
  const date = new Date(`${ymd}T12:00:00+09:00`);
  if (Number.isNaN(date.getTime())) return ymd;
  const w = date.toLocaleDateString("ja-JP", {
    weekday: "narrow",
    timeZone: "Asia/Tokyo",
  });
  return `${y}年${m}月${d}日（${w}）`;
}

/** 日本時間・現在時刻（リアルタイム表示用） */
function formatTokyoTimeNow(d: Date): string {
  return d.toLocaleTimeString("ja-JP", {
    timeZone: "Asia/Tokyo",
    hour: "2-digit",
    minute: "2-digit",
    second: "2-digit",
    hour12: false,
  });
}

function KitchenDashboardInner() {
  const { orders, loading } = useOrders();
  const searchParams = useSearchParams();
  const router = useRouter();
  const pathname = usePathname();

  const todayTokyo = tokyoDateString();
  const selectedDate = clampKitchenDate(
    parseKitchenDateParam(searchParams.get("date"), todayTokyo),
    todayTokyo
  );

  const setKitchenDate = useCallback(
    (ymd: string) => {
      const d = clampKitchenDate(ymd, todayTokyo);
      const sp = new URLSearchParams(searchParams.toString());
      sp.set("date", d);
      router.replace(`${pathname}?${sp.toString()}`, { scroll: false });
    },
    [todayTokyo, searchParams, router, pathname]
  );
  const [shiftId, setShiftId] = useState<KitchenShiftId>("all");
  const [now, setNow] = useState(() => new Date());
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
      /* 未対応 */
    }
    el.focus();
    el.click();
  }, []);

  useEffect(() => {
    const id = window.setInterval(() => setNow(new Date()), 1000);
    return () => window.clearInterval(id);
  }, []);

  const scopedOrders = useMemo(
    () => orders.filter((o) => orderInKitchenScope(o.created_at, selectedDate, shiftId)),
    [orders, selectedDate, shiftId]
  );

  const shiftDef = KITCHEN_SHIFTS.find((s) => s.id === shiftId)!;

  /** 受付が早い順（上が先）— キッチンは FIFO で優先 */
  const sortedOrders = [...scopedOrders].sort(
    (a, b) => new Date(a.created_at).getTime() - new Date(b.created_at).getTime()
  );

  const unpaidOrders = sortedOrders.filter(
    (o) => o.status !== "paid" && o.status !== "cancelled"
  );
  const paidInScope = sortedOrders.filter((o) => o.status === "paid");
  const cancelledInScope = sortedOrders.filter((o) => o.status === "cancelled").length;
  const revenuePaidInScope = paidInScope.reduce((sum, o) => sum + (o.total_amount ?? 0), 0);
  /** 範囲内の注文総額（会計前・後の合計） */
  const revenueScoped = scopedOrders.reduce((sum, o) => sum + (o.total_amount ?? 0), 0);
  const unpaidRevenueVnd = unpaidOrders.reduce((sum, o) => sum + (o.total_amount ?? 0), 0);

  const activeOrdersWithTable = scopedOrders.filter(
    (o) => !["paid", "cancelled"].includes(o.status) && o.table_label
  );
  const uniqueActiveTableCount = new Set(
    activeOrdersWithTable.map((o) => o.table_label!.trim())
  ).size;

  const menuCount = menuItems.length;
  const menuCategoryCount = new Set(menuItems.map((m) => m.category)).size;

  /** 前日・同一シフト（比較用） */
  const yesterdayScoped = useMemo(() => {
    const prev = rollTokyoYmd(selectedDate, -1);
    return orders.filter((o) => orderInKitchenScope(o.created_at, prev, shiftId));
  }, [orders, selectedDate, shiftId]);

  const paidYesterday = yesterdayScoped.filter((o) => o.status === "paid");
  const revenuePaidYesterdayYen = Math.round(
    paidYesterday.reduce((s, o) => s + (o.total_amount ?? 0), 0) / 200
  );

  const avgTicketYen = paidInScope.length
    ? Math.round(revenuePaidInScope / paidInScope.length / 200)
    : 0;

  const paidYen = Math.round(revenuePaidInScope / 200);
  const pipelineYen = Math.round(revenueScoped / 200);
  const unpaidYen = Math.round(unpaidRevenueVnd / 200);
  const revenueVsYesterday = paidYen - revenuePaidYesterdayYen;
  /** 表示範囲の総件数：前日・同一シフトとの差（メイン数値と整合） */
  const ordersTotalVsYesterday = scopedOrders.length - yesterdayScoped.length;

  const stats = useMemo(
    () => [
      {
        key: "sales",
        label: "売上（会計済）",
        value: `¥${paidYen.toLocaleString()}`,
        sub:
          unpaidOrders.length > 0
            ? `会計 ${paidInScope.length}件 · 平均 ¥${avgTicketYen.toLocaleString()} · 未会計 ¥${unpaidYen.toLocaleString()} · 範囲計 ¥${pipelineYen.toLocaleString()}`
            : `会計 ${paidInScope.length}件 · 平均 ¥${avgTicketYen.toLocaleString()} · 範囲計 ¥${pipelineYen.toLocaleString()}`,
        delta:
          paidYen !== 0 || revenuePaidYesterdayYen !== 0
            ? {
                label: "前日比",
                text: `${revenueVsYesterday >= 0 ? "+" : "−"}¥${Math.abs(revenueVsYesterday).toLocaleString()}`,
                positive: revenueVsYesterday >= 0,
              }
            : undefined,
      },
      {
        key: "orders",
        label: "注文件数（表示中）",
        value: String(scopedOrders.length),
        sub: `会計 ${paidInScope.length} · 進行 ${unpaidOrders.length} · 取消 ${cancelledInScope} · 登録 ${orders.length}`,
        delta:
          scopedOrders.length !== 0 || yesterdayScoped.length !== 0
            ? {
                label: "前日比",
                text: `${ordersTotalVsYesterday >= 0 ? "+" : "−"}${Math.abs(ordersTotalVsYesterday)}件`,
                positive: ordersTotalVsYesterday >= 0,
              }
            : undefined,
      },
      {
        key: "menu",
        label: "メニュー品数",
        value: String(menuCount),
        sub: `${menuCategoryCount}カテゴリ`,
      },
      {
        key: "tables",
        label: "対応中テーブル",
        value: String(uniqueActiveTableCount),
        sub: `対応中 ${activeOrdersWithTable.length}件`,
      },
    ],
    [
      paidYen,
      paidInScope.length,
      avgTicketYen,
      unpaidOrders.length,
      unpaidYen,
      pipelineYen,
      revenuePaidYesterdayYen,
      revenueVsYesterday,
      scopedOrders.length,
      cancelledInScope,
      orders.length,
      ordersTotalVsYesterday,
      yesterdayScoped.length,
      menuCount,
      menuCategoryCount,
      uniqueActiveTableCount,
      activeOrdersWithTable.length,
    ]
  );

  const toYen = (vnd: number) => Math.round(vnd / 200);
  const formatTime = (iso: string) =>
    new Date(iso).toLocaleTimeString("ja-JP", { hour: "2-digit", minute: "2-digit", second: "2-digit" });
  const elapsedMinutes = (iso: string) => Math.max(0, Math.floor((Date.now() - new Date(iso).getTime()) / 60000));

  const statusCounts = {
    pending: sortedOrders.filter((o) => o.status === "pending").length,
    confirmed: sortedOrders.filter((o) => o.status === "confirmed").length,
    preparing: sortedOrders.filter((o) => o.status === "preparing").length,
    ready: sortedOrders.filter((o) => o.status === "ready").length,
    served: sortedOrders.filter((o) => o.status === "served").length,
    paid: sortedOrders.filter((o) => o.status === "paid").length,
    cancelled: sortedOrders.filter((o) => o.status === "cancelled").length,
  };

  const urgentOrders = [...unpaidOrders]
    .sort((a, b) => elapsedMinutes(b.created_at) - elapsedMinutes(a.created_at))
    .filter((o) => ["ready", "served", "preparing"].includes(o.status))
    .slice(0, 5);

  const scopeDenom = scopedOrders.length;
  const unpaidRatePct = scopeDenom ? Math.round((unpaidOrders.length / scopeDenom) * 100) : 0;
  const paidRatePct = scopeDenom ? Math.round((paidInScope.length / scopeDenom) * 100) : 0;

  return (
    <main className="app-shell flex min-h-screen bg-[#FAF8F0] text-gray-800">
      <KitchenDesktopAside active="overview" dateParam={selectedDate} />

      {/* MAIN CONTENT */}
      <section className="flex-1 overflow-y-auto px-4 py-5 sm:px-6 lg:px-8">
        <KitchenMobileNav active="overview" dateParam={selectedDate} />
        {/* HEADER ROW */}
        <header className="mb-6">
          <div>
            <h1 className="text-2xl font-semibold text-gray-800">キッチンダッシュボード</h1>
            <p className="mt-1 flex flex-wrap items-center gap-x-2 gap-y-1 text-xs text-gray-600">
              <span>
                自家製麺 多聞 ｜ {formatHeaderDateJa(selectedDate)}
              </span>
              <span className="inline-flex items-center gap-1.5 rounded-md bg-gray-100/90 px-2 py-0.5 font-mono text-[11px] font-medium tabular-nums text-gray-800">
                <Clock className="h-3.5 w-3.5 text-emerald-600" aria-hidden />
                <span className="text-gray-500">現在</span>
                {formatTokyoTimeNow(now)}
              </span>
            </p>
          </div>
        </header>

        <div className="grid gap-5 lg:grid-cols-[minmax(0,2fr)_minmax(0,1fr)]">
          {/* LEFT: overview + timeline */}
          <div className="min-w-0 space-y-5">
            {/* 日付・シフト（表示ロジックのみ Asia/Tokyo） */}
            <div className="rounded-3xl border border-gray-100 bg-white p-4 shadow-sm md:flex md:flex-wrap md:items-end md:gap-6">
              <div className="flex min-w-0 flex-col gap-1.5 md:w-auto">
                <label className="flex items-center gap-1.5 text-[11px] font-semibold uppercase tracking-wide text-gray-500">
                  <CalendarDays className="h-3.5 w-3.5" />
                  集計日
                </label>
                {/* 見た目は従来の1行。タップで showPicker（label+sr-only は Safari で開かないことがある） */}
                <div className="mt-1 flex w-full max-w-[17rem] items-center gap-1">
                  <button
                    type="button"
                    onClick={() => setKitchenDate(rollTokyoYmd(selectedDate, -1))}
                    aria-label="前日"
                    className="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl border border-amber-100 bg-white text-gray-700 shadow-sm transition hover:border-amber-200/80 hover:bg-[#FAF8F0]/80"
                  >
                    <ChevronLeft className="h-4 w-4" />
                  </button>
                  <div className="min-w-0 flex-1">
                    <input
                      ref={aggregateDateInputRef}
                      id="kitchen-aggregate-date"
                      type="date"
                      value={selectedDate}
                      max={todayTokyo}
                      onChange={(e) => setKitchenDate(e.target.value)}
                      tabIndex={-1}
                      className="sr-only"
                    />
                    <button
                      type="button"
                      onClick={openAggregateDatePicker}
                      aria-label={`集計日を変更。現在 ${selectedDate}`}
                      className="flex min-h-[44px] w-full touch-manipulation items-center justify-between gap-2 rounded-xl border border-amber-100 bg-white px-3 py-2 text-left text-sm text-gray-900 shadow-inner ring-1 ring-amber-100 transition hover:border-amber-200/80 hover:bg-[#FAF8F0]/60 active:scale-[0.99] focus-visible:border-amber-200 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-amber-100"
                    >
                      <span className="tabular-nums tracking-tight">{selectedDate}</span>
                      <CalendarDays className="h-4 w-4 shrink-0 text-gray-700" aria-hidden />
                    </button>
                  </div>
                  <button
                    type="button"
                    disabled={selectedDate >= todayTokyo}
                    onClick={() => setKitchenDate(rollTokyoYmd(selectedDate, 1))}
                    aria-label="翌日"
                    className="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl border border-amber-100 bg-white text-gray-700 shadow-sm transition hover:border-amber-200/80 hover:bg-[#FAF8F0]/80 disabled:cursor-not-allowed disabled:opacity-40"
                  >
                    <ChevronRight className="h-4 w-4" />
                  </button>
                </div>
              </div>
              <div className="mt-3 min-w-0 flex-1 md:mt-0">
                <p className="mb-1.5 text-[11px] font-semibold uppercase tracking-wide text-gray-500">時間帯</p>
                <div className="flex flex-wrap gap-1.5">
                  {KITCHEN_SHIFTS.map((s) => (
                    <button
                      key={s.id}
                      type="button"
                      title={s.hint}
                      onClick={() => setShiftId(s.id)}
                      className={`rounded-xl border px-3 py-1.5 text-xs font-semibold transition ${
                        shiftId === s.id
                          ? "border-amber-200 bg-[#FAF8F0] text-gray-900 shadow-sm ring-1 ring-amber-100"
                          : "border-amber-100 bg-white text-gray-700 hover:border-amber-200/80 hover:bg-[#FAF8F0]/55"
                      }`}
                    >
                      {s.label}
                    </button>
                  ))}
                </div>
                <p className="mt-1.5 text-[10px] text-gray-500">{shiftDef.hint}</p>
              </div>
            </div>

            {/* TOP STAT CARDS */}
            <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
              {stats.map((s) => (
                <div
                  key={s.key}
                  className="rounded-3xl border border-gray-100 bg-white px-4 py-3 shadow-sm"
                >
                  <div className="mb-2 flex items-start justify-between gap-2">
                    <div className="min-w-0 flex-1">
                      <p className="text-[11px] font-semibold uppercase tracking-[0.16em] text-gray-600">
                        {s.label}
                      </p>
                      {s.delta && (
                        <p className="mt-1.5 text-[10px] leading-snug text-gray-500">
                          <span className="mr-1">{s.delta.label}</span>
                          <span
                            className={cn(
                              "font-semibold tabular-nums",
                              s.delta.positive ? "text-emerald-700" : "text-rose-600"
                            )}
                          >
                            {s.delta.text}
                          </span>
                        </p>
                      )}
                    </div>
                    <div className="flex h-7 w-7 shrink-0 items-center justify-center rounded-full bg-emerald-100 text-emerald-700">
                      {s.key === "sales" && <CircleDollarSign className="h-3.5 w-3.5" />}
                      {s.key === "orders" && <ShoppingBag className="h-3.5 w-3.5" />}
                      {s.key === "menu" && <ListChecks className="h-3.5 w-3.5" />}
                      {s.key === "tables" && <Users className="h-3.5 w-3.5" />}
                    </div>
                  </div>
                  <p className="text-lg font-semibold tabular-nums text-gray-800">{s.value}</p>
                  <p className="mt-1 text-[11px] leading-snug text-gray-600">{s.sub}</p>
                </div>
              ))}
            </div>

            {/* ORDER FLOW SNAPSHOT */}
            <div className="rounded-3xl border border-gray-100 bg-white p-4 shadow-sm">
              <div className="mb-3 flex flex-wrap items-center justify-between gap-2">
                <h2 className="text-sm font-semibold text-gray-800">注文フロー（表示中）</h2>
                <Link
                  href={`/kitchen/orders?date=${encodeURIComponent(selectedDate)}`}
                  className="text-[11px] text-emerald-700 hover:underline"
                >
                  詳細を見る
                </Link>
              </div>
              <div className="grid gap-2 sm:grid-cols-2 md:grid-cols-4 lg:grid-cols-7">
                {[
                  { key: "pending", label: "受付待ち", cls: "bg-amber-50 text-amber-800 border-amber-100" },
                  { key: "confirmed", label: "確認済み", cls: "bg-blue-50 text-blue-800 border-blue-100" },
                  { key: "preparing", label: "準備中", cls: "bg-orange-50 text-orange-800 border-orange-100" },
                  { key: "ready", label: "提供待ち", cls: "bg-sky-50 text-sky-800 border-sky-100" },
                  { key: "served", label: "提供済み", cls: "bg-amber-50 text-amber-900 border-amber-100" },
                  { key: "paid", label: "会計済み", cls: "bg-emerald-50 text-emerald-800 border-emerald-100" },
                  { key: "cancelled", label: "キャンセル", cls: "bg-gray-100 text-gray-700 border-gray-200" },
                ].map((st) => (
                  <div key={st.key} className={`rounded-2xl border px-3 py-2 ${st.cls}`}>
                    <p className="text-[10px] font-medium">{st.label}</p>
                    <p className="mt-1 text-lg font-bold tabular-nums">{statusCounts[st.key as keyof typeof statusCounts]}</p>
                  </div>
                ))}
              </div>
            </div>

            {/* 未会計の注文 — Đơn chưa thanh toán */}
            <div className="overflow-hidden rounded-3xl border border-amber-200/80 bg-gradient-to-br from-amber-50/80 to-white shadow-sm">
              <div className="border-b border-amber-100 bg-amber-50/60 px-4 py-3">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <span className="flex h-9 w-9 items-center justify-center rounded-xl bg-amber-200/80 text-amber-700">
                      <Clock className="h-4 w-4" />
                    </span>
                    <div>
                      <h2 className="text-sm font-bold text-gray-800">未会計の注文</h2>
                      <p className="text-[11px] text-amber-800/90">
                        受付が早い順（上が先）· 日付·時間帯は上記
                      </p>
                    </div>
                  </div>
                  <div className="text-right">
                    <p className="text-xl font-bold text-amber-700">{unpaidOrders.length}</p>
                    <p className="text-[10px] font-medium text-amber-800/80">件</p>
                  </div>
                </div>
              </div>
              <div className="p-4">
                {loading ? (
                  <p className="py-6 text-center text-xs text-gray-500">読み込み中…</p>
                ) : unpaidOrders.length === 0 ? (
                  <div className="py-8 text-center">
                    <div className="mx-auto flex h-12 w-12 items-center justify-center rounded-2xl bg-amber-100/80 text-amber-600">
                      <CheckCircle2 className="h-6 w-6" />
                    </div>
                    <p className="mt-2 text-sm font-medium text-gray-600">未会計の注文はありません</p>
                    <p className="mt-0.5 text-[11px] text-gray-500">この範囲に注文がないか、別の日·シフトを選んでください</p>
                  </div>
                ) : (
                  <ul className="space-y-2">
                    {unpaidOrders.slice(0, 6).map((o: OrderRecord, i: number) => (
                      <li key={o.id}>
                        <Link
                          href={`/kitchen/orders?date=${encodeURIComponent(selectedDate)}`}
                          className="flex items-center justify-between gap-3 rounded-2xl border border-amber-100 bg-white px-3 py-2.5 transition hover:border-amber-200 hover:bg-amber-50/40"
                        >
                          <div className="flex min-w-0 flex-1 items-center gap-3">
                            <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-xl bg-amber-100 text-xs font-bold text-amber-800">
                              {tableLabelKitchenUnpaidBadge(o.table_label)}
                            </div>
                            <div className="min-w-0">
                              <p className="text-[10px] font-semibold text-emerald-800/90">
                                受付順 {i + 1}
                                {unpaidOrders.length > 1 ? ` / ${unpaidOrders.length}` : ""}
                              </p>
                              <p className="truncate text-xs font-semibold text-gray-800">
                                #{String(o.id).slice(0, 8)}
                              </p>
                              <p className="text-[10px] text-gray-500">
                                {formatTime(o.created_at)} · {o.items.length}品
                              </p>
                            </div>
                          </div>
                          <div className="flex shrink-0 items-center gap-2">
                            <span className="text-sm font-bold text-amber-700">
                              ¥{toYen(o.total_amount ?? 0)}
                            </span>
                            <span className="rounded-full bg-amber-100 px-2 py-0.5 text-[10px] font-medium text-amber-800">
                              {o.status === "pending" && "受付"}
                              {o.status === "confirmed" && "確認済"}
                              {o.status === "preparing" && "準備中"}
                              {o.status === "ready" && "提供待ち"}
                              {o.status === "served" && "提供済"}
                            </span>
                            <ChevronRight className="h-4 w-4 text-amber-600" />
                          </div>
                        </Link>
                      </li>
                    ))}
                  </ul>
                )}
                {unpaidOrders.length > 0 && (
                  <Link
                    href={`/kitchen/orders?date=${encodeURIComponent(selectedDate)}`}
                    className="mt-3 flex items-center justify-center gap-1 rounded-xl border border-amber-200 bg-amber-50/80 py-2.5 text-xs font-semibold text-amber-800 transition hover:bg-amber-100/80"
                  >
                    注文管理で処理する
                    <ChevronRight className="h-3.5 w-3.5" />
                  </Link>
                )}
              </div>
            </div>

            {/* 会計済みの注文 — Đơn đã thanh toán */}
            <div className="overflow-hidden rounded-3xl border border-emerald-200/80 bg-gradient-to-br from-emerald-50/60 to-white shadow-sm">
              <div className="border-b border-emerald-100 bg-emerald-50/60 px-4 py-3">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <span className="flex h-9 w-9 items-center justify-center rounded-xl bg-emerald-200/80 text-emerald-700">
                      <Wallet className="h-4 w-4" />
                    </span>
                    <div>
                      <h2 className="text-sm font-bold text-gray-800">会計済みの注文</h2>
                      <p className="text-[11px] text-emerald-800/90">表示範囲内·会計済み</p>
                    </div>
                  </div>
                  <div className="text-right">
                    <p className="text-xl font-bold text-emerald-700">{paidInScope.length}</p>
                    <p className="text-[10px] font-medium text-emerald-800/80">
                      件 · ¥{toYen(revenuePaidInScope).toLocaleString()}
                    </p>
                  </div>
                </div>
              </div>
              <div className="p-4">
                {loading ? (
                  <p className="py-6 text-center text-xs text-gray-500">読み込み中…</p>
                ) : paidInScope.length === 0 ? (
                  <div className="py-8 text-center">
                    <div className="mx-auto flex h-12 w-12 items-center justify-center rounded-2xl bg-emerald-100/80 text-emerald-600">
                      <Wallet className="h-6 w-6" />
                    </div>
                    <p className="mt-2 text-sm font-medium text-gray-600">この範囲に会計済みはありません</p>
                    <p className="mt-0.5 text-[11px] text-gray-500">日付·シフトを変えて確認してください</p>
                  </div>
                ) : (
                  <ul className="space-y-2">
                    {paidInScope.slice(0, 6).map((o: OrderRecord) => (
                      <li key={o.id}>
                        <Link
                          href={`/kitchen/orders?date=${encodeURIComponent(selectedDate)}`}
                          className="flex items-center justify-between gap-3 rounded-2xl border border-emerald-100 bg-white px-3 py-2.5 transition hover:border-emerald-200 hover:bg-emerald-50/40"
                        >
                          <div className="flex min-w-0 flex-1 items-center gap-3">
                            <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-xl bg-emerald-100 text-xs font-bold text-emerald-800">
                              {o.table_label ?? "—"}
                            </div>
                            <div className="min-w-0">
                              <p className="truncate text-xs font-semibold text-gray-800">
                                #{String(o.id).slice(0, 8)}
                              </p>
                              <p className="text-[10px] text-gray-500">
                                {formatTime(o.created_at)} · {o.items.length}品
                              </p>
                            </div>
                          </div>
                          <div className="flex shrink-0 items-center gap-2">
                            <span className="text-sm font-bold text-emerald-700">
                              ¥{toYen(o.total_amount ?? 0)}
                            </span>
                            <CheckCircle2 className="h-4 w-4 text-emerald-500" />
                          </div>
                        </Link>
                      </li>
                    ))}
                  </ul>
                )}
                {paidInScope.length > 0 && (
                  <Link
                    href={`/kitchen/orders?date=${encodeURIComponent(selectedDate)}`}
                    className="mt-3 flex items-center justify-center gap-1 rounded-xl border border-emerald-200 bg-emerald-50/80 py-2.5 text-xs font-semibold text-emerald-800 transition hover:bg-emerald-100/80"
                  >
                    注文一覧を見る
                    <ChevronRight className="h-3.5 w-3.5" />
                  </Link>
                )}
              </div>
            </div>
          </div>

          {/* RIGHT: Priority + Insights */}
          <aside className="space-y-4">
            <div className="rounded-3xl border border-amber-200/70 bg-gradient-to-br from-amber-50/70 to-white p-4 shadow-sm">
              <p className="mb-3 flex items-center gap-2 text-[11px] font-semibold uppercase tracking-[0.16em] text-amber-900">
                <Flame className="h-3.5 w-3.5" />
                優先対応
              </p>
              {urgentOrders.length === 0 ? (
                <p className="text-xs text-gray-500">優先対応の注文はありません。</p>
              ) : (
                <ul className="space-y-2">
                  {urgentOrders.map((o) => (
                    <li key={o.id}>
                      <Link
                        href={`/kitchen/orders?date=${encodeURIComponent(selectedDate)}`}
                        className="flex items-center justify-between rounded-xl border border-amber-100 bg-white px-3 py-2 text-xs hover:bg-amber-50/40"
                      >
                        <div>
                          <p className="font-semibold text-gray-800">
                            {o.table_label ?? "—"} · #{String(o.id).slice(0, 6)}
                          </p>
                          <p className="text-[10px] text-gray-500">
                            {elapsedMinutes(o.created_at)}分経過 · {o.status === "ready" ? "提供待ち" : o.status === "served" ? "提供済み" : "準備中"}
                          </p>
                        </div>
                        <AlertTriangle className="h-4 w-4 text-amber-600" />
                      </Link>
                    </li>
                  ))}
                </ul>
              )}
            </div>

            <div className="rounded-3xl border border-gray-100 bg-white p-4 text-xs text-gray-600 shadow-sm">
              <p className="mb-3 flex items-center gap-2 text-[11px] font-semibold uppercase tracking-[0.16em] text-gray-700">
                <BarChart3 className="h-3.5 w-3.5" />
                運用インサイト
              </p>
              <div className="space-y-2">
                <div className="flex items-center justify-between rounded-xl border border-gray-100 bg-gray-50/60 px-3 py-2">
                  <span>平均客単価</span>
                  <span className="font-semibold tabular-nums text-gray-800">¥{avgTicketYen.toLocaleString()}</span>
                </div>
                <div className="flex items-center justify-between rounded-xl border border-gray-100 bg-gray-50/60 px-3 py-2">
                  <span>未会計</span>
                  <span className="font-semibold tabular-nums text-gray-800">{unpaidRatePct}%</span>
                </div>
                <div className="flex items-center justify-between rounded-xl border border-gray-100 bg-gray-50/60 px-3 py-2">
                  <span>会計済</span>
                  <span className="font-semibold tabular-nums text-emerald-700">{paidRatePct}%</span>
                </div>
              </div>
              <Link
                href={`/kitchen/orders?date=${encodeURIComponent(selectedDate)}`}
                className="mt-3 flex items-center justify-center gap-1 rounded-xl border border-emerald-200 bg-emerald-50 py-2 text-[11px] font-semibold text-emerald-800 hover:bg-emerald-100"
              >
                注文管理を開く
                <ChevronRight className="h-3.5 w-3.5" />
              </Link>
            </div>
          </aside>
        </div>
      </section>
    </main>
  );
}

export default function KitchenPage() {
  return (
    <Suspense
      fallback={
        <div className="flex min-h-screen items-center justify-center bg-[#FAF8F0] text-sm text-gray-500">
          読み込み中…
        </div>
      }
    >
      <KitchenDashboardInner />
    </Suspense>
  );
}
