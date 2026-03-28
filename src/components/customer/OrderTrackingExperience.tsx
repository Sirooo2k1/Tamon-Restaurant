"use client";

import { useEffect, useState, useMemo, useRef } from "react";
import Link from "next/link";
import type { OrderRecord, OrderStatus, OrderItemPayload } from "@/lib/types";
import { isLineDeliveredForCustomerView } from "@/lib/order-line-fulfillment";
import {
  countNoodleFulfillmentForCustomerView,
  hasPartialNoodleDeliveryForCustomerView,
  hasPendingNoodleLinesForCustomerView,
  isNoodleOrderLine,
} from "@/lib/order-noodle-progress";
import {
  Inbox,
  ChefHat,
  Bell,
  Truck,
  CheckCircle2,
  Loader2,
  RefreshCw,
  Sparkles,
  ChevronDown,
  ChevronUp,
} from "lucide-react";
import { cn } from "@/lib/utils";
import { CUSTOMER_HERO_GRADIENT, customerHeroShellClassName } from "@/lib/customer-hero-gradient";
import { clearTrackedOrderOnServer } from "@/lib/recent-order-tracking";
import { formatNoodlePortionLineJa } from "@/lib/tsukemen-portion-pricing";
import { displayMenuItemNameJa } from "@/lib/menu-display";
import { menuHrefForCustomerNavigation } from "@/lib/menu-table-session";
import { GuestAccessReceiptPreview } from "@/components/customer/GuestAccessReceiptPreview";
import { CustomerPaymentReceipt } from "@/components/kitchen/CustomerPaymentReceipt";

function stripGuestKeyFromUrl(): void {
  if (typeof window === "undefined") return;
  const path = window.location.pathname;
  if (window.location.search.includes("k=")) {
    window.history.replaceState(null, "", path);
  }
}

const toYen = (vnd: number) => Math.round(vnd / 200);

function formatTime(iso: string) {
  return new Date(iso).toLocaleTimeString("ja-JP", {
    hour: "2-digit",
    minute: "2-digit",
  });
}

/** Customer-facing phase index 0–4 (cancelled = -1) */
function statusToPhase(status: OrderStatus): number {
  switch (status) {
    case "pending":
    case "confirmed":
      return 0;
    case "preparing":
      return 1;
    case "ready":
      return 2;
    case "served":
      return 3;
    case "paid":
      return 4;
    case "cancelled":
      return -1;
    default:
      return 0;
  }
}

const STATUS_COPY: Record<
  OrderStatus,
  { headline: string; detail: string }
> = {
  pending: {
    headline: "キッチンに届けました",
    detail: "ご注文を受け付けました。順番にご準備いたします。",
  },
  confirmed: {
    headline: "内容を確認しました",
    detail: "もうすぐ準備に入ります。少々お待ちください。",
  },
  preparing: {
    headline: "丁寧に準備中です",
    detail: "仕上がり次第、ステータスが更新されます。",
  },
  ready: {
    headline: "提供の準備ができました",
    detail: "スタッフがお席へお持ちします。",
  },
  served: {
    headline: "お席へお届け済みです",
    detail: "お支払いは商品お受け取り時、またはレジにてお願いします。",
  },
  paid: {
    headline: "ありがとうございました",
    detail: "本日のご来店ありがとうございました。またのお越しをお待ちしています。",
  },
  cancelled: {
    headline: "ご注文はキャンセルされました",
    detail: "ご不明点があればスタッフまでお声がけください。",
  },
};

const STEPS: {
  label: string;
  short: string;
  Icon: typeof Inbox;
}[] = [
  { label: "受付・確認", short: "受付", Icon: Inbox },
  { label: "準備中", short: "準備", Icon: ChefHat },
  { label: "提供準備", short: "準備", Icon: Bell },
  { label: "お届け", short: "届済", Icon: Truck },
  { label: "会計完了", short: "完了", Icon: CheckCircle2 },
];

const POLL_MS = 3000;

function OrderTrackingCard({
  children,
  className,
  innerClassName,
}: {
  children: React.ReactNode;
  className?: string;
  innerClassName?: string;
}) {
  return (
    <div
      className={cn("relative overflow-hidden", customerHeroShellClassName, className)}
      style={{ background: CUSTOMER_HERO_GRADIENT }}
    >
      <div className="pointer-events-none absolute -right-20 -top-20 h-44 w-44 rounded-full bg-emerald-300/[0.08] blur-3xl" />
      <div className="pointer-events-none absolute -bottom-16 -left-10 h-36 w-36 rounded-full bg-teal-200/[0.09] blur-3xl" />
      <div className="pointer-events-none absolute right-1/4 top-8 h-px w-[45%] rotate-[-8deg] bg-gradient-to-r from-transparent via-white/50 to-transparent opacity-80" />
      <div className={cn("relative", innerClassName)}>{children}</div>
    </div>
  );
}

async function fetchOrder(
  id: string,
  guestKey?: string | null
): Promise<
  | { ok: true; data: OrderRecord }
  | { ok: false; message: string; code?: string; httpStatus: number }
> {
  const qs = guestKey?.trim()
    ? `?k=${encodeURIComponent(guestKey.trim())}&format=json`
    : "";
  const res = await fetch(`/api/orders/${id}${qs}`, {
    credentials: "include",
    cache: "no-store",
  });
  if (res.ok) {
    return { ok: true, data: (await res.json()) as OrderRecord };
  }
  let message = "この注文は見つかりませんでした。";
  let code: string | undefined;
  try {
    const j = (await res.json()) as { error?: string; code?: string };
    if (typeof j.error === "string" && j.error.trim()) message = j.error;
    if (typeof j.code === "string" && j.code.trim()) code = j.code.trim();
  } catch {
    /* ignore */
  }
  return { ok: false, message, code, httpStatus: res.status };
}

type Props = {
  orderId: string;
  /** Show link back to menu / home */
  showNav?: boolean;
  /**
   * URL query `?k=` — 会計後に cookie を忘れた場合、DB の guest_view_token と一致すれば同じ画面を再開できる。
   * 初回読み込み時のみ付与し、成功後は URL から外す（下記）。
   */
  guestKeyFromQuery?: string | null;
};

export function OrderTrackingExperience({
  orderId,
  showNav = true,
  guestKeyFromQuery = null,
}: Props) {
  const [order, setOrder] = useState<OrderRecord | null | undefined>(undefined);
  const [loadError, setLoadError] = useState<string | null>(null);
  /** 403 + guest cookie 不一致 — 文言をやわらかく見せる */
  const [guestAccessHint, setGuestAccessHint] = useState(false);
  const [showItems, setShowItems] = useState(true);
  /** 会計済みを一度読めた後に cookie 欠如で 403 になっても UI を消さない（poll / 画面離脱直前など） */
  const paidSnapshotRef = useRef<{ id: string } | null>(null);
  const orderRef = useRef(order);
  orderRef.current = order;
  /** 一度でも API に成功したら ?k= は不要（cookie 済み） */
  const guestKeyConsumedRef = useRef(false);

  useEffect(() => {
    guestKeyConsumedRef.current = false;
    paidSnapshotRef.current = null;
    setOrder(undefined);
    setLoadError(null);
    setGuestAccessHint(false);
  }, [orderId]);

  /** 会計済みのまま /order から離れたときだけトラック用 cookie を消す（画面表示中に消すと次の poll で 403 になりイメージ画面に化ける） */
  useEffect(() => {
    return () => {
      const o = orderRef.current;
      if (o === undefined || o === null) return;
      const paid =
        o.status === "paid" || String(o.payment_status ?? "").toLowerCase() === "paid";
      if (paid) void clearTrackedOrderOnServer();
    };
  }, [orderId]);

  useEffect(() => {
    let cancelled = false;
    let interval: ReturnType<typeof setInterval> | undefined;

    const load = async () => {
      const useKey =
        Boolean(guestKeyFromQuery?.trim()) && !guestKeyConsumedRef.current;
      const result = await fetchOrder(orderId, useKey ? guestKeyFromQuery : undefined);
      if (cancelled) return;
      if (!result.ok) {
        const snapOk =
          paidSnapshotRef.current?.id === orderId &&
          result.httpStatus === 403 &&
          result.code === "guest_access_required";
        if (snapOk) return;
        setLoadError(result.message);
        setGuestAccessHint(
          result.httpStatus === 403 && result.code === "guest_access_required"
        );
        setOrder(null);
        return;
      }
      setLoadError(null);
      setGuestAccessHint(false);
      setOrder(result.data);
      guestKeyConsumedRef.current = true;
      if (useKey) stripGuestKeyFromUrl();

      const paid =
        result.data.status === "paid" ||
        String(result.data.payment_status ?? "").toLowerCase() === "paid";
      if (paid) {
        paidSnapshotRef.current = { id: orderId };
        if (interval !== undefined) {
          clearInterval(interval);
          interval = undefined;
        }
      }
    };

    void load();
    interval = setInterval(load, POLL_MS);
    return () => {
      cancelled = true;
      if (interval !== undefined) clearInterval(interval);
    };
  }, [orderId, guestKeyFromQuery]);

  const phase = order ? statusToPhase(order.status) : 0;
  const isCancelled = order?.status === "cancelled";
  const isPaid =
    order?.status === "paid" ||
    String(order?.payment_status ?? "").toLowerCase() === "paid";

  const copy = order ? STATUS_COPY[order.status] : null;

  const itemLines = useMemo(() => {
    if (!order?.items?.length) return [];
    return order.items as OrderItemPayload[];
  }, [order]);

  /** 画面上部の進捗・麺のお届けサマリー用（麺類のみ）。一覧は全行。 */
  const noodleDelivery = useMemo(
    () => countNoodleFulfillmentForCustomerView(itemLines, order?.status ?? "pending"),
    [itemLines, order?.status]
  );

  const partialNoodle = useMemo(
    () =>
      order
        ? hasPartialNoodleDeliveryForCustomerView(itemLines, order.status)
        : false,
    [itemLines, order]
  );

  const hasPendingNoodles = useMemo(
    () =>
      order ? hasPendingNoodleLinesForCustomerView(itemLines, order.status) : false,
    [itemLines, order]
  );

  const hasNonNoodleItems = useMemo(
    () => itemLines.some((line) => !isNoodleOrderLine(line)),
    [itemLines]
  );

  if (order === undefined && !loadError) {
    return (
      <div className="flex min-h-[40vh] flex-col items-center justify-center gap-3 px-4">
        <Loader2 className="h-10 w-10 animate-spin text-emerald-600" />
        <p className="text-sm font-medium text-gray-600">お客様のご注文を読み込み中…</p>
      </div>
    );
  }

  if (loadError || !order) {
    const errText = loadError ?? "読み込みに失敗しました。";
    return (
      <div className="mx-auto max-w-md px-4 py-12">
        {guestAccessHint ? (
          <div className="rounded-2xl border border-emerald-100/90 bg-gradient-to-br from-emerald-50/90 via-white to-amber-50/40 px-5 py-7 text-center shadow-[0_12px_40px_-24px_rgba(16,185,129,0.22)]">
            <p className="text-lg font-bold leading-snug tracking-tight text-emerald-950">
              本日はご来店ありがとうございました
            </p>
            <p className="mt-3 text-[13px] leading-relaxed text-gray-700">
              お会計までお済ませいただき、誠にありがとうございました。
              <br />
              またのご来店を、心よりお待ちしております。
            </p>
            <GuestAccessReceiptPreview orderId={orderId} />
          </div>
        ) : (
          <p className="text-center text-gray-700">{errText}</p>
        )}
        {showNav && (
          <div className="mt-6 text-center">
            <Link
              href={menuHrefForCustomerNavigation(null)}
              className="inline-flex rounded-2xl border border-emerald-100/90 bg-emerald-50/90 px-6 py-3 text-sm font-semibold text-emerald-900 shadow-sm ring-1 ring-emerald-50/85 transition hover:bg-emerald-100/95"
            >
              メニューへ
            </Link>
          </div>
        )}
      </div>
    );
  }

  return (
    <div className="mx-auto w-full max-w-lg px-4 py-6 sm:py-8">
      {/* Hero — layered depth, refined JP typography */}
      <OrderTrackingCard innerClassName="px-5 pb-5 pt-6 sm:px-6 sm:pt-7">
        <div className="flex items-center justify-between gap-3">
          <span className="inline-flex items-center gap-1.5 rounded-full border border-emerald-200/70 bg-white/85 px-3 py-1 text-[10px] font-bold uppercase tracking-[0.14em] text-emerald-800 shadow-[0_1px_2px_rgba(6,95,70,0.06)] backdrop-blur-sm">
            <Sparkles className="h-3.5 w-3.5 text-amber-500" aria-hidden />
            ご注文の状況
          </span>
          <span className="inline-flex items-center gap-1.5 rounded-full border border-emerald-100/90 bg-emerald-50/60 px-2.5 py-1 text-[10px] font-semibold tracking-wide text-emerald-800/90">
            <span className="relative flex h-2 w-2">
              <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-emerald-300/40" />
              <span className="relative inline-flex h-2 w-2 rounded-full bg-emerald-400 shadow-[0_0_0_2px_rgba(209,250,229,0.85)]" />
            </span>
            自動更新
          </span>
        </div>

        <h1 className="mt-5 text-2xl font-bold leading-snug tracking-tight text-gray-900 sm:text-[1.7rem]">
          {isCancelled ? "ご案内" : isPaid ? "ご来店ありがとうございました" : "ご注文の準備状況"}
        </h1>

        <div className="mt-5 flex flex-wrap items-end gap-4 rounded-2xl border border-white/60 bg-white/40 px-3.5 py-3 shadow-[0_1px_0_rgba(255,255,255,0.6)_inset] backdrop-blur-[6px] sm:px-4">
          <div>
            <p className="text-[10px] font-semibold uppercase tracking-[0.14em] text-gray-500">
              注文番号
            </p>
            <p className="mt-0.5 font-mono text-lg font-bold tabular-nums tracking-tight text-emerald-900">
              #{order.id.slice(0, 8).toUpperCase()}
            </p>
          </div>
          <div className="hidden h-10 w-px bg-gradient-to-b from-transparent via-gray-200 to-transparent sm:block" />
          <div>
            <p className="text-[10px] font-semibold uppercase tracking-[0.14em] text-gray-500">
              お席
            </p>
            <p className="mt-0.5 text-base font-semibold text-gray-900">
              {order.table_label?.trim() || "—"}
            </p>
          </div>
        </div>

        {!isCancelled && copy && (
          <div className="mt-5 rounded-2xl border border-emerald-100/70 bg-white/75 px-4 py-3.5 shadow-[0_1px_0_rgba(255,255,255,0.8)_inset,0_8px_20px_-12px_rgba(16,185,129,0.09)]">
            <p className="text-sm font-bold tracking-tight text-emerald-950">{copy.headline}</p>
            <p className="mt-1.5 text-[13px] leading-relaxed text-gray-600">{copy.detail}</p>
            {partialNoodle && !isPaid && (
              <p className="mt-3 border-t border-emerald-100/60 pt-3 text-[12px] leading-relaxed text-emerald-900/85">
                <span className="font-semibold text-emerald-950">麺類について</span>
                <br />
                お届け済みの麺と、これからお届けする麺が混在しています。
                <strong className="text-emerald-950"> 進捗バー</strong>
                は店舗でのご注文全体の段階、
                <strong className="text-emerald-950"> 「麺類のお届け」</strong>
                と一覧で品目ごとの状況をご確認ください。
              </p>
            )}
          </div>
        )}

        {isCancelled && copy && (
          <div className="mt-5 rounded-2xl border border-red-200/80 bg-gradient-to-br from-red-50/95 to-white px-4 py-3.5 shadow-sm">
            <p className="text-sm font-bold text-red-900">{copy.headline}</p>
            <p className="mt-1.5 text-[13px] leading-relaxed text-red-800/90">{copy.detail}</p>
          </div>
        )}
      </OrderTrackingCard>

      {/* 会計完了後はキッチン「お客様用レシートを印刷」と同一コンポーネントで表示 */}
      {!isCancelled && isPaid && (
        <div className="mt-6 overflow-hidden rounded-[1.35rem] border border-emerald-200/50 bg-white shadow-[0_24px_60px_-28px_rgba(6,95,70,0.18),0_0_0_1px_rgba(16,185,129,0.06)]">
          <div className="p-4 sm:p-5">
            <CustomerPaymentReceipt order={order} />
          </div>
        </div>
      )}

      {/* Stepper — same card surface as hero */}
      {!isCancelled && !isPaid && (
        <OrderTrackingCard className="mt-6" innerClassName="p-4 sm:p-5">
          <div className="mb-4 flex items-center justify-center gap-2">
            <span
              className="h-px w-10 rounded-full bg-gradient-to-r from-transparent via-emerald-100/90 to-teal-200/75 shadow-[0_0_14px_-2px_rgba(167,243,208,0.14)]"
              aria-hidden
            />
            <p className="text-center text-[11px] font-bold uppercase tracking-[0.16em] text-emerald-800/75">
              進捗
            </p>
            <span
              className="h-px w-10 rounded-full bg-gradient-to-l from-transparent via-emerald-100/90 to-teal-200/75 shadow-[0_0_14px_-2px_rgba(167,243,208,0.14)]"
              aria-hidden
            />
          </div>
          <p className="mb-3 text-center text-[10px] leading-relaxed text-gray-500">
            店舗でのご注文全体の処理の流れです。
            {hasNonNoodleItems
              ? " ドリンク・サイド等のお届けは一覧の品目ごとの表示をご確認ください。"
              : ""}
          </p>
          {noodleDelivery.total > 0 && hasPendingNoodles && !isPaid && (
            <p className="mb-3 text-center text-[10px] leading-relaxed text-emerald-800/85">
              麺類（つけ麺・多聞つけ麺・ラーメン・替え玉等）のお届け状況は、下の「麺類のお届け」をご覧ください。
            </p>
          )}
          <div className="relative flex justify-between gap-0 sm:gap-1">
            {STEPS.map((step, i) => {
              const done = phase > i || (phase === STEPS.length - 1 && i === STEPS.length - 1);
              const current = phase === i && !(phase === STEPS.length - 1 && i === STEPS.length - 1);
              const Icon = step.Icon;
              return (
                <div key={step.label} className="relative flex flex-1 flex-col items-center">
                  {i < STEPS.length - 1 && (
                    <div
                      className={`absolute left-[50%] top-[18px] z-0 hidden h-[3px] w-full rounded-full sm:block ${
                        phase > i
                          ? "bg-gradient-to-r from-emerald-200/90 to-teal-200/90 shadow-[0_0_0_1px_rgba(255,255,255,0.5)_inset]"
                          : "bg-gray-200/90"
                      }`}
                      style={{ width: "calc(100% - 2.25rem)", marginLeft: "1.125rem" }}
                      aria-hidden
                    />
                  )}
                  <div
                    className={`relative z-10 flex h-9 w-9 items-center justify-center rounded-2xl border-2 transition-all duration-200 sm:h-10 sm:w-10 ${
                      done
                        ? "border-emerald-200/95 bg-gradient-to-br from-emerald-50 via-white to-teal-50 text-emerald-600 shadow-[0_6px_18px_-12px_rgba(16,185,129,0.11)]"
                        : current
                          ? "scale-[1.03] border-emerald-400 bg-white text-emerald-700 shadow-[0_8px_22px_-10px_rgba(16,185,129,0.28)] ring-[3px] ring-emerald-50"
                          : "border-gray-200/95 bg-gray-50/80 text-gray-400"
                    }`}
                  >
                    {done ? (
                      <CheckCircle2 className="h-5 w-5 drop-shadow-sm" strokeWidth={2.5} aria-hidden />
                    ) : (
                      <Icon className="h-4 w-4 sm:h-[1.15rem] sm:w-[1.15rem]" strokeWidth={2} aria-hidden />
                    )}
                  </div>
                  <p
                    className={`mt-2 max-w-[4.2rem] text-center text-[9px] font-bold leading-tight sm:max-w-none sm:text-[10px] ${
                      current ? "text-emerald-800" : done ? "text-gray-700" : "text-gray-400"
                    }`}
                  >
                    <span className="sm:hidden">{step.short}</span>
                    <span className="hidden sm:inline">{step.label}</span>
                  </p>
                </div>
              );
            })}
          </div>
          {/* Mobile connector line approximation */}
          <div className="mt-3 flex justify-between px-4 sm:hidden">
            {STEPS.slice(0, -1).map((_, i) => (
              <div
                key={i}
                className={`mx-0.5 h-1 flex-1 rounded-full ${
                  phase > i ? "bg-gradient-to-r from-emerald-200 to-teal-200" : "bg-gray-200"
                }`}
              />
            ))}
          </div>
        </OrderTrackingCard>
      )}

      {/* 麺類のお届けサマリー（進捗の数値は麺のみ。他カテゴリは一覧で） */}
      {!isCancelled && !isPaid && noodleDelivery.total > 0 && (
        <div className="relative mt-5 overflow-hidden rounded-[1.5rem] border border-emerald-100/85 bg-gradient-to-br from-emerald-50/95 via-white to-slate-50/40 shadow-[0_20px_50px_-28px_rgba(16,185,129,0.12)] ring-1 ring-emerald-950/[0.035]">
          <div className="border-b border-emerald-100/60 bg-white/60 px-4 py-3 backdrop-blur-[4px] sm:px-5 sm:py-3.5">
            <div className="flex items-start gap-3">
              <span className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-gradient-to-br from-white to-emerald-50 text-emerald-800 shadow-[0_4px_14px_-6px_rgba(16,185,129,0.22)] ring-2 ring-emerald-100/90 sm:h-9 sm:w-9">
                <Truck className="h-4 w-4 sm:h-[1.05rem] sm:w-[1.05rem]" strokeWidth={2.15} aria-hidden />
              </span>
              <div className="min-w-0 flex-1">
                <p className="text-[10px] font-semibold uppercase tracking-wider text-emerald-800/80">
                  麺類のお届け
                </p>
                <p className="mt-1 flex flex-wrap items-center gap-2 text-[13px] font-bold leading-snug tracking-tight text-emerald-950/95 sm:text-sm">
                  {noodleDelivery.delivered === noodleDelivery.total
                    ? "お席へのお届け（麺類）"
                    : noodleDelivery.delivered === 0
                      ? "麺類のお届け状況"
                      : "お届け状況（麺類・一部済み）"}
                  <span className="inline-flex items-center rounded-full border border-emerald-100/80 bg-white px-2 py-0.5 text-[10px] font-mono font-semibold tabular-nums text-emerald-800 shadow-sm sm:text-[11px]">
                    {noodleDelivery.delivered}
                    <span className="mx-0.5 text-emerald-400/80">/</span>
                    {noodleDelivery.total}
                  </span>
                </p>
                <p className="mt-1.5 text-[11px] leading-relaxed text-emerald-900/60 sm:text-xs">
                  {noodleDelivery.delivered === noodleDelivery.total
                    ? "ご注文の麺類はすべてお席にお届けしました。"
                    : noodleDelivery.delivered === 0
                      ? "準備が整い次第お届けします。ドリンク等は一覧の各品表示をご確認ください。"
                      : "お届け済みの麺と、これからお届けする麺が混在しています。一覧でもご確認ください。"}
                </p>
              </div>
            </div>
          </div>
        </div>
      )}

      {!isCancelled &&
        !isPaid &&
        itemLines.length > 0 &&
        noodleDelivery.total === 0 && (
        <div className="relative mt-5 rounded-2xl border border-gray-200/90 bg-gray-50/80 px-4 py-3 text-[11px] leading-relaxed text-gray-600">
          <span className="font-semibold text-gray-800">麺類のご注文がない場合</span>
          <br />
          上の進捗は店舗でのご注文全体の流れです。各商品のお届けは下の一覧でご確認ください。
        </div>
      )}

      {/* Order summary — 会計前のみ（会計後は CustomerPaymentReceipt に明細あり） */}
      {!isCancelled && !isPaid && (
        <OrderTrackingCard className="mt-5">
          <button
            type="button"
            onClick={() => setShowItems((v) => !v)}
            className="group flex w-full items-center justify-between gap-3 px-4 py-3.5 text-left transition-colors hover:bg-white/55"
          >
            <div className="min-w-0">
              <span className="text-sm font-bold tracking-tight text-gray-900">ご注文内容</span>
              {noodleDelivery.total > 0 && (
                <p className="mt-0.5 text-[11px] font-medium text-emerald-700/90">
                  麺類 お届け {noodleDelivery.delivered}/{noodleDelivery.total}
                </p>
              )}
              {hasNonNoodleItems && (
                <p className="mt-0.5 text-[10px] text-gray-500">
                  全品のお届け状況は各行をご確認ください（麺以外も表示されます）
                </p>
              )}
            </div>
            <span className="flex shrink-0 items-center gap-2">
              <span className="rounded-lg border border-emerald-100/90 bg-emerald-50/70 px-2 py-1 text-xs font-semibold tabular-nums text-emerald-900 shadow-[0_1px_0_rgba(255,255,255,0.7)_inset]">
                ¥{toYen(order.total_amount)}
              </span>
              <span className="flex h-8 w-8 items-center justify-center rounded-full border border-gray-200/90 bg-white text-gray-500 shadow-sm transition group-hover:border-emerald-200 group-hover:text-emerald-700">
                {showItems ? <ChevronUp className="h-4 w-4" /> : <ChevronDown className="h-4 w-4" />}
              </span>
            </span>
          </button>
          {showItems && (
            <ul className="border-t border-emerald-100/35 bg-white/30 px-2 py-1.5 backdrop-blur-[4px] sm:px-3">
              {itemLines.map((line, idx) => {
                const delivered = isLineDeliveredForCustomerView(line, order.status);
                const noodleLine = formatNoodlePortionLineJa(line.customization);
                return (
                  <li key={idx} className="relative border-b border-emerald-100/25 py-2 last:border-0">
                    <div
                      className={`relative flex items-start justify-between gap-2.5 overflow-hidden rounded-[1rem] px-2.5 py-2.5 transition-shadow sm:gap-3 sm:px-3.5 sm:py-3 ${
                        delivered
                          ? "bg-gradient-to-r from-emerald-50/98 via-white to-teal-50/30 shadow-[0_1px_0_rgba(255,255,255,0.9)_inset,0_10px_30px_-18px_rgba(16,185,129,0.11)] ring-1 ring-emerald-100/80 before:absolute before:inset-y-2 before:left-0 before:w-1 before:rounded-full before:bg-gradient-to-b before:from-emerald-200 before:to-teal-200 before:content-['']"
                          : "bg-white/90 shadow-sm ring-1 ring-gray-100/90 hover:shadow-md"
                      }`}
                    >
                      <div className="min-w-0 flex-1 pl-1 sm:pl-1.5">
                        <div className="flex flex-wrap items-start justify-between gap-2 gap-y-1">
                          <p className="text-sm font-semibold leading-snug tracking-tight text-gray-900">
                            {displayMenuItemNameJa(line.menu_item_id, line.menu_item_name)}
                            <span className="ml-1 font-medium tabular-nums text-gray-500">×{line.quantity}</span>
                          </p>
                          {noodleLine && (
                            <p className="mt-1 text-[11px] font-medium leading-snug text-emerald-900/85">
                              {noodleLine}
                            </p>
                          )}
                          <span className="shrink-0 text-sm font-semibold tabular-nums text-emerald-800">
                            ¥{toYen(line.unit_price * line.quantity)}
                          </span>
                        </div>
                        {delivered && (
                          <div className="mt-2 flex flex-wrap items-center gap-2">
                            <span className="inline-flex items-center rounded-full border border-emerald-100/90 bg-white px-2 py-0.5 text-[9px] font-bold uppercase tracking-wider text-emerald-800 shadow-sm sm:px-2.5 sm:text-[10px]">
                              お届け済み
                            </span>
                            <span className="text-[9px] font-medium text-emerald-700/75 sm:text-[10px]">
                              お席に到着
                            </span>
                          </div>
                        )}
                      </div>
                      <div className="flex shrink-0 self-center pt-0.5 sm:self-start sm:pt-1">
                        {delivered ? (
                          <span className="flex h-8 w-8 items-center justify-center rounded-full bg-gradient-to-br from-white to-emerald-50/95 text-emerald-800 shadow-[0_3px_12px_-4px_rgba(16,185,129,0.14)] ring-2 ring-emerald-100/80 sm:h-9 sm:w-9">
                            <CheckCircle2
                              className="h-[1.05rem] w-[1.05rem] sm:h-[1.125rem] sm:w-[1.125rem]"
                              strokeWidth={2.15}
                              aria-hidden
                            />
                          </span>
                        ) : (
                          <span
                            className="flex h-8 w-8 items-center justify-center rounded-full border-[1.5px] border-dashed border-emerald-300/80 bg-gradient-to-b from-white to-emerald-50/70 text-[11px] font-bold leading-none tracking-tight text-emerald-900/70 shadow-[inset_0_1px_0_rgba(255,255,255,0.85)] ring-1 ring-emerald-100/50 sm:h-9 sm:w-9 sm:text-xs"
                            title="お席へ未お届け"
                            aria-label="まだお席へお届けしていません"
                          >
                            未
                          </span>
                        )}
                      </div>
                    </div>
                  </li>
                );
              })}
            </ul>
          )}
          <p className="border-t border-emerald-100/35 bg-white/40 px-4 py-2.5 text-center text-[10px] leading-relaxed text-gray-500 backdrop-blur-[4px]">
            <span className="tabular-nums">最終更新 {formatTime(order.updated_at)}</span>
            <span className="mx-1.5 text-emerald-200/80">·</span>
            この画面を開いたままでも最新に更新されます
          </p>
        </OrderTrackingCard>
      )}

      {showNav && (
        <div className="mt-8 flex flex-col gap-3 sm:flex-row">
          <Link
            href={menuHrefForCustomerNavigation(order.table_label)}
            className="flex flex-1 items-center justify-center gap-2 rounded-2xl border border-emerald-200/90 bg-gradient-to-br from-emerald-50 via-white to-emerald-50/80 py-3.5 text-sm font-bold text-emerald-950 shadow-[0_10px_28px_-18px_rgba(16,185,129,0.14)] transition hover:border-emerald-300 hover:shadow-[0_14px_32px_-16px_rgba(16,185,129,0.12)] active:scale-[0.99]"
          >
            <RefreshCw className="h-4 w-4" aria-hidden />
            追加で注文する
          </Link>
          <Link
            href="/"
            className="flex flex-1 items-center justify-center rounded-2xl border border-gray-200/95 bg-white py-3.5 text-sm font-semibold text-gray-700 shadow-sm transition hover:border-gray-300 hover:bg-slate-50/90 active:scale-[0.99]"
          >
            ホームへ戻る
          </Link>
        </div>
      )}
    </div>
  );
}
