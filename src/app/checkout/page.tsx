"use client";

import { useState, useEffect, useCallback } from "react";
import { useCartStore } from "@/store/cart-store";
import Link from "next/link";
import {
  ChevronLeft,
  ShoppingBag,
  Utensils,
  CheckCircle2,
  AlertCircle,
  Trash2,
  Wallet,
  MapPin,
  QrCode,
  ChefHat,
  Package,
  Droplets,
  HelpCircle,
  ClipboardList,
  Sparkles,
  Coffee,
} from "lucide-react";
import type { LineItemCustomization, OrderStatus } from "@/lib/types";
import { canMergeOrderForCustomer, tableLabelsMatch } from "@/lib/order-merge";
import { storeLocation, distanceMeters } from "@/lib/store-location";
import { OrderTrackingExperience } from "@/components/customer/OrderTrackingExperience";
import {
  notifyTrackedOrderUpdated,
  clearTrackedOrderOnServer,
  TRACKED_ORDER_UPDATED_EVENT,
} from "@/lib/recent-order-tracking";
import { CartDrawer } from "@/components/CartDrawer";
import { formatNoodlePortionLineJa } from "@/lib/tsukemen-portion-pricing";

const toYen = (vnd: number) => Math.round(vnd / 200);

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

function formatCustomization(customization: LineItemCustomization): string | null {
  const parts: string[] = [];
  if (customization.seatLabel?.trim()) {
    parts.push(`お席: ${customization.seatLabel.trim()}`);
  }
  const noodleLine = formatNoodlePortionLineJa(customization);
  if (noodleLine) parts.push(noodleLine);
  if (customization.beerVariant) {
    parts.push(
      customization.beerVariant === "lager" ? "ビール: ラガー" : "ビール: スーパードライ"
    );
  }
  if (customization.highballVariant) {
    parts.push(
      customization.highballVariant === "plain" ? "ハイボール: プレーン" : "ハイボール: レモン"
    );
  }
  if (customization.beerBallVariant) {
    const ja =
      customization.beerBallVariant === "lemon"
        ? "レモン"
        : customization.beerBallVariant === "plum"
          ? "うめ"
          : "メロン";
    parts.push(`ビアボール: ${ja}`);
  }
  if (customization.serviceMode) {
    parts.push(
      customization.serviceMode === "takeaway" ? "お持ち帰り" : "店内"
    );
  }
  if (customization.note?.trim()) parts.push(customization.note.trim());
  if (customization.spiceLevel && customization.spiceLevel !== "none") {
    const sj = SPICE_LABEL_JA[customization.spiceLevel];
    parts.push(sj ? `辛さ: ${sj}` : `辛さ: ${customization.spiceLevel}`);
  }
  if (customization.noodleFirmness) {
    const fj = NOODLE_FIRM_LABEL_JA[customization.noodleFirmness];
    parts.push(fj ? `麺の硬さ: ${fj}` : `麺の硬さ: ${customization.noodleFirmness}`);
  }
  if (customization.extraToppings?.length) {
    parts.push(customization.extraToppings.map((t) => t.name).join("、"));
  }
  return parts.length > 0 ? parts.join(" · ") : null;
}

type LocationStatus = null | "checking" | "inside" | "outside" | "denied" | "error";
/**
 * Production: khách phải vào menu qua QR (`/menu?table=...`) để có số bàn.
 * Dev / test không QR: tạo `.env.local` với NEXT_PUBLIC_ALLOW_ORDER_WITHOUT_TABLE=true
 */
const ALLOW_ORDER_WITHOUT_TABLE =
  process.env.NEXT_PUBLIC_ALLOW_ORDER_WITHOUT_TABLE === "true";

export default function CheckoutPage() {
  const { items, getSubtotal, tableLabel, setTableLabel, clearCart, removeItem } =
    useCartStore();
  const [step, setStep] = useState<"form" | "sending" | "success" | "error">("form");
  const [orderId, setOrderId] = useState<string | null>(null);
  const [orderWasMerged, setOrderWasMerged] = useState(false);
  const [errorMessage, setErrorMessage] = useState("");
  const [locationStatus, setLocationStatus] = useState<LocationStatus>(null);
  const [mergeTarget, setMergeTarget] = useState<{
    orderId: string;
    status: OrderStatus | string;
    tableLabel: string | null;
    payment_status?: string | null;
  } | null>(null);
  const [mergeEligible, setMergeEligible] = useState(false);

  const subtotal = getSubtotal();

  // Chỉ kiểm tra vị trí khi đã có table (từ QR) và đã bật cấu hình store
  useEffect(() => {
    const store = storeLocation;
    if (!tableLabel || !store) {
      setLocationStatus(null);
      return;
    }
    if (!navigator.geolocation) {
      setLocationStatus("error");
      return;
    }
    setLocationStatus("checking");
    navigator.geolocation.getCurrentPosition(
      (pos) => {
        const d = distanceMeters(
          store.lat,
          store.lng,
          pos.coords.latitude,
          pos.coords.longitude
        );
        setLocationStatus(d <= store.radiusM ? "inside" : "outside");
      },
      (err) => {
        if (err.code === err.PERMISSION_DENIED) setLocationStatus("denied");
        else setLocationStatus("error");
      },
      { enableHighAccuracy: true, timeout: 10000, maximumAge: 60000 }
    );
  }, [tableLabel]);

  /** Đơn đang theo dõi trên thiết bị — cho phép nối món nếu status + bàn khớp。会計済みなら追跡 cookie を削除 */
  const refreshMergeState = useCallback(async () => {
    try {
      const tr = await fetch("/api/orders/tracked", { credentials: "include" }).then((r) => r.json());
      if (!tr?.trackingReady || !tr?.orderId) {
        setMergeTarget(null);
        setMergeEligible(false);
        return;
      }
      const ordRes = await fetch(`/api/orders/${tr.orderId}`, { credentials: "include" });
      if (!ordRes.ok) {
        setMergeTarget(null);
        setMergeEligible(false);
        return;
      }
      const order = (await ordRes.json()) as {
        id: string;
        status: string;
        table_label?: string | null;
        payment_status?: string | null;
      };

      const mergeOk = canMergeOrderForCustomer({
        status: String(order.status),
        payment_status: order.payment_status,
      });
      if (!mergeOk) {
        await clearTrackedOrderOnServer();
        setMergeTarget(null);
        setMergeEligible(false);
        return;
      }

      setMergeTarget({
        orderId: order.id,
        status: order.status,
        tableLabel: order.table_label ?? null,
        payment_status: order.payment_status ?? null,
      });
      const tableOk = tableLabelsMatch(order.table_label, tableLabel);
      setMergeEligible(tableOk && mergeOk);
    } catch {
      setMergeTarget(null);
      setMergeEligible(false);
    }
  }, [tableLabel]);

  useEffect(() => {
    void refreshMergeState();
  }, [refreshMergeState]);

  useEffect(() => {
    const onTrackedUpdate = () => void refreshMergeState();
    window.addEventListener(TRACKED_ORDER_UPDATED_EVENT, onTrackedUpdate);
    return () => window.removeEventListener(TRACKED_ORDER_UPDATED_EVENT, onTrackedUpdate);
  }, [refreshMergeState]);

  const requireLocationCheck = Boolean(storeLocation && tableLabel);
  // Chặn khi: đang kiểm tra vị trí (checking) hoặc đã biết ở ngoài quán (outside). Từ chối/lỗi vị trí vẫn cho gửi.
  const locationBlocked =
    requireLocationCheck &&
    (locationStatus === "checking" || locationStatus === "outside");
  const hasTableForSubmit = ALLOW_ORDER_WITHOUT_TABLE ? true : Boolean(tableLabel);
  const canSubmit = hasTableForSubmit && step !== "sending" && !locationBlocked;

  const handlePlaceOrder = async () => {
    if (items.length === 0) return;
    setStep("sending");
    setErrorMessage("");

    const payload = {
      table_id: tableLabel?.replace(/\D/g, "") || null,
      table_label: tableLabel || null,
      items: items.map((line) => ({
        menu_item_id: line.menuItem.id,
        menu_item_name: line.menuItem.name,
        menu_category: line.menuItem.category,
        quantity: line.quantity,
        unit_price: line.unitPrice,
        customization: line.customization,
      })),
      total_amount: subtotal,
      customer_note: undefined,
      merge_into_current_order: mergeEligible,
    };

    try {
      const res = await fetch("/api/orders", {
        method: "POST",
        credentials: "include",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "注文の送信に失敗しました");
      setOrderWasMerged(Boolean(data.merged));
      setOrderId(data.id);
      clearCart();
      setStep("success");
      // Cho trình duyệt áp dụng Set-Cookie từ response trước khi banner gọi GET /tracked
      queueMicrotask(() => notifyTrackedOrderUpdated());
    } catch (e) {
      setErrorMessage(e instanceof Error ? e.message : "エラーが発生しました");
      setStep("error");
    }
  };

  if (items.length === 0 && step !== "success" && step !== "error") {
    return (
      <main
        className="relative flex min-h-screen flex-col"
        style={{ background: "linear-gradient(180deg, #fef8f3 0%, #fef3e8 50%, #fef8f3 100%)" }}
      >
        <div className="flex flex-1 flex-col items-center justify-center p-6 pb-32">
          <div className="mx-auto w-full max-w-sm space-y-6 text-center">
            <div className="mx-auto flex h-14 w-14 items-center justify-center rounded-2xl bg-amber-100 text-amber-600">
              <ShoppingBag className="h-7 w-7" />
            </div>
            <div>
              <h1 className="text-lg font-semibold text-gray-800">カートは空です</h1>
              <p className="mt-1 text-sm text-gray-500">メニューから商品を追加してください。</p>
            </div>
            <Link
              href="/menu"
              className="inline-flex w-full items-center justify-center gap-2 rounded-2xl border border-emerald-100/90 bg-emerald-50/90 px-5 py-3.5 text-sm font-semibold text-emerald-900 shadow-sm ring-1 ring-emerald-50/85 transition hover:bg-emerald-100/95"
            >
              メニューを見る
            </Link>
          </div>
        </div>
        <CartDrawer />
      </main>
    );
  }

  if (step === "success" && orderId) {
    return (
      <main
        className="min-h-screen pb-32"
        style={{
          background:
            "linear-gradient(180deg, #fef8f3 0%, #ecfdf5 28%, #fef3e8 72%, #fef8f3 100%)",
        }}
      >
        <CartDrawer />
        <section className="relative mx-auto max-w-lg px-4 pt-5 sm:pt-6">
          {/* Nền trang trí nhẹ */}
          <div
            className="pointer-events-none absolute left-1/2 top-0 h-40 w-[min(100%,28rem)] -translate-x-1/2 rounded-full bg-emerald-200/25 blur-3xl"
            aria-hidden
          />
          <div className="relative overflow-hidden rounded-[1.75rem] border border-emerald-100/90 bg-white/85 shadow-[0_20px_50px_-12px_rgba(6,95,70,0.12)] ring-1 ring-emerald-900/[0.04] backdrop-blur-md">
            <div
              className="pointer-events-none absolute -right-20 -top-20 h-40 w-40 rounded-full bg-gradient-to-br from-emerald-200/30 to-transparent"
              aria-hidden
            />
            <div
              className="pointer-events-none absolute -bottom-16 -left-16 h-36 w-36 rounded-full bg-gradient-to-tr from-amber-100/40 to-transparent"
              aria-hidden
            />
            <div className="relative px-4 pb-5 pt-5 sm:px-6 sm:pb-6 sm:pt-6">
              {/* Icon trung tâm */}
              <div className="flex flex-col items-center">
                <div className="relative">
                  <span
                    className="absolute inset-[-4px] rounded-xl bg-emerald-300/10 blur-md"
                    aria-hidden
                  />
                  <div className="relative flex h-[3.25rem] w-[3.25rem] items-center justify-center rounded-xl bg-gradient-to-br from-emerald-50 via-white to-teal-50/80 shadow-inner ring-2 ring-emerald-100/90 sm:h-14 sm:w-14">
                    <CheckCircle2 className="h-7 w-7 text-emerald-400 sm:h-8 sm:w-8" strokeWidth={1.65} />
                  </div>
                </div>
                <p className="mt-1 text-[10px] font-bold tracking-[0.16em] text-emerald-700/80">
                  ご注文を承りました
                </p>
              </div>

              <h1 className="mx-auto mt-3 max-w-[26rem] text-center text-[1.05rem] font-bold leading-snug tracking-tight text-gray-900 sm:text-xl sm:leading-snug">
                {orderWasMerged ? (
                  <>
                    ご注文に追加いたしました。
                    <br />
                    ありがとうございます。
                  </>
                ) : (
                  <>
                    この度はご注文を賜り、
                    <br />
                    誠にありがとうございます。
                  </>
                )}
              </h1>
              {orderWasMerged && (
                <p className="mx-auto mt-2 max-w-[24rem] text-center text-xs text-emerald-800/90">
                  既存の注文にカートの内容を加えました。合計は追跡画面でご確認ください。
                </p>
              )}
              <div
                className="mx-auto mt-2.5 h-px w-14 bg-gradient-to-r from-transparent via-emerald-300/80 to-transparent"
                aria-hidden
              />

              {/* Các dòng thông báo + icon */}
              <ul className="mt-4 space-y-1.5 sm:mt-4 sm:space-y-2">
                <li className="flex gap-2.5 rounded-xl border border-emerald-100/60 bg-gradient-to-r from-emerald-50/50 to-white/60 px-3 py-2.5 sm:gap-3 sm:rounded-2xl sm:py-3">
                  <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg bg-white shadow-sm ring-1 ring-emerald-100/80 sm:h-10 sm:w-10 sm:rounded-xl">
                    <ChefHat className="h-4 w-4 text-emerald-600 sm:h-[1.125rem] sm:w-[1.125rem]" strokeWidth={2} />
                  </span>
                  <p className="min-w-0 text-[0.8125rem] leading-snug text-gray-700 sm:text-sm sm:leading-snug">
                    ただいま料理人が一品一品、心を尽くしてご用意を進めております。
                  </p>
                </li>
                <li className="flex gap-2.5 rounded-xl border border-emerald-100/60 bg-gradient-to-r from-emerald-50/50 to-white/60 px-3 py-2.5 sm:gap-3 sm:rounded-2xl sm:py-3">
                  <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg bg-white shadow-sm ring-1 ring-emerald-100/80 sm:h-10 sm:w-10 sm:rounded-xl">
                    <ClipboardList className="h-4 w-4 text-emerald-600 sm:h-[1.125rem] sm:w-[1.125rem]" strokeWidth={2} />
                  </span>
                  <p className="min-w-0 text-[0.8125rem] leading-snug text-gray-700 sm:text-sm sm:leading-snug">
                    ご注文の進行状況につきましては、本画面にて随時ご確認いただけます。
                  </p>
                </li>
                <li className="flex gap-2.5 rounded-xl border border-emerald-100/60 bg-gradient-to-r from-emerald-50/50 to-white/60 px-3 py-2.5 sm:gap-3 sm:rounded-2xl sm:py-3">
                  <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg bg-white shadow-sm ring-1 ring-emerald-100/80 sm:h-10 sm:w-10 sm:rounded-xl">
                    <Sparkles className="h-4 w-4 text-emerald-600 sm:h-[1.125rem] sm:w-[1.125rem]" strokeWidth={2} />
                  </span>
                  <p className="min-w-0 text-[0.8125rem] leading-snug text-gray-700 sm:text-sm sm:leading-snug">
                    お料理が最良の状態でお手元に届きますよう、丁寧に仕上げてまいります。
                  </p>
                </li>
                <li className="flex gap-2.5 rounded-xl border border-amber-100/70 bg-gradient-to-r from-amber-50/40 to-white/60 px-3 py-2.5 sm:gap-3 sm:rounded-2xl sm:py-3">
                  <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg bg-white shadow-sm ring-1 ring-amber-100/90 sm:h-10 sm:w-10 sm:rounded-xl">
                    <Coffee className="h-4 w-4 text-amber-700 sm:h-[1.125rem] sm:w-[1.125rem]" strokeWidth={2} />
                  </span>
                  <p className="min-w-0 text-[0.8125rem] leading-snug text-gray-700 sm:text-sm sm:leading-snug">
                    どうぞ、ひとときの時間もごゆっくりお楽しみくださいませ。
                  </p>
                </li>
              </ul>
            </div>
          </div>
        </section>
        <OrderTrackingExperience orderId={orderId} showNav />
      </main>
    );
  }

  if (step === "success") {
    return (
      <main
        className="flex min-h-screen flex-col items-center justify-center p-6"
        style={{ background: "linear-gradient(180deg, #fef8f3 0%, #fef3e8 50%, #fef8f3 100%)" }}
      >
        <CheckCircle2 className="h-9 w-9 text-emerald-400" strokeWidth={1.85} />
        <p className="mt-4 text-gray-600">ご注文は完了しました。</p>
        <Link
          href="/menu"
          className="mt-6 inline-flex rounded-2xl border border-emerald-100/90 bg-emerald-50/90 px-6 py-3 text-sm font-semibold text-emerald-900 shadow-sm ring-1 ring-emerald-50/85 transition hover:bg-emerald-100/95"
        >
          メニューへ
        </Link>
      </main>
    );
  }

  if (step === "error") {
    return (
      <main
        className="min-h-screen flex flex-col items-center justify-center p-6"
        style={{ background: "linear-gradient(180deg, #fef8f3 0%, #fef3e8 50%, #fef8f3 100%)" }}
      >
        <div className="mx-auto max-w-sm w-full text-center space-y-6">
          <div className="mx-auto flex h-14 w-14 items-center justify-center rounded-full bg-red-100 text-red-600">
            <AlertCircle className="h-7 w-7" />
          </div>
          <div>
            <h1 className="text-lg font-semibold text-gray-800">エラーが発生しました</h1>
            <p className="mt-1 text-sm text-red-600">{errorMessage}</p>
          </div>
          <button
            type="button"
            onClick={() => setStep("form")}
            className="w-full rounded-2xl bg-emerald-600 px-5 py-3.5 text-sm font-semibold text-white transition hover:bg-emerald-700"
          >
            もう一度試す
          </button>
        </div>
      </main>
    );
  }

  return (
    <main
      className="min-h-screen pb-32"
      style={{ background: "linear-gradient(180deg, #fef8f3 0%, #fef3e8 50%, #fef8f3 100%)" }}
    >
      <CartDrawer />
      <div className="mx-auto max-w-2xl px-4 py-6 sm:px-6 sm:py-8">
        <Link
          href="/menu"
          className="mb-4 inline-flex items-center gap-1 text-sm font-medium text-emerald-700 transition hover:text-emerald-800"
        >
          <ChevronLeft className="h-4 w-4" />
          メニューに戻る
        </Link>

        <div className="overflow-hidden rounded-3xl border border-gray-100 bg-white/95 shadow-lg sm:rounded-[2rem]">
          {/* Header */}
          <header
            className="px-4 py-5 sm:px-6 sm:py-6"
            style={{ background: "linear-gradient(90deg, #ecfdf5 0%, #fffbeb 100%)" }}
          >
            <p className="text-xs font-semibold tracking-wider text-emerald-600">ご注文手続き</p>
            <h1 className="mt-1 text-xl font-bold text-gray-800 sm:text-2xl">ご注文内容の確認</h1>
            <p className="mt-0.5 text-sm text-gray-600">カート内 {items.length} 品</p>
          </header>

          <div className="space-y-6 p-4 sm:p-6">
            {/* 追加注文の案内（UIは控えめ、選択肢なしで自動マージ） */}
            {mergeTarget && mergeEligible && (
              <div className="rounded-2xl border border-emerald-200/90 bg-emerald-50/60 px-4 py-3">
                <p className="text-sm font-medium text-emerald-900">
                  追加のご注文です
                </p>
                <p className="mt-1 text-xs leading-relaxed text-emerald-800/90">
                  カートの内容は、現在ご利用中の注文にまとめてお届けします。送信後は同じ注文番号で追跡いただけます。
                </p>
              </div>
            )}
            {mergeTarget && !mergeEligible && (
              <div className="rounded-2xl border border-amber-200 bg-amber-50/60 px-4 py-3">
                <p className="text-xs leading-relaxed text-amber-900/90">
                  {String(mergeTarget.payment_status ?? "").toLowerCase().trim() === "paid" ||
                  String(mergeTarget.status ?? "").toLowerCase().trim() === "paid"
                    ? "この注文は会計済みのため、同じ注文には追加できません。新規のご注文として送信してください。"
                    : String(mergeTarget.status ?? "").toLowerCase().trim() === "cancelled"
                      ? "この注文はキャンセル済みのため、同じ注文には追加できません。新規注文として送信されます。"
                      : !tableLabelsMatch(mergeTarget.tableLabel, tableLabel)
                        ? "卓番が元の注文と異なるため、新規注文として送信されます。"
                        : "新規注文として送信されます。"}
                </p>
              </div>
            )}

            {/* Order summary */}
            <section>
              <h2 className="mb-3 flex items-center gap-2 text-sm font-semibold uppercase tracking-wider text-gray-500">
                <ShoppingBag className="h-4 w-4 text-emerald-600" />
                ご注文内容
              </h2>
              <div className="space-y-0 overflow-hidden rounded-2xl border border-gray-100 bg-gray-50/50">
                {items.map((line, index) => {
                  const customText = formatCustomization(line.customization);
                  const lineTotal = line.unitPrice * line.quantity;
                  return (
                    <div
                      key={line.id}
                      className={`flex flex-col gap-2 border-b border-gray-100/80 px-4 py-3 last:border-b-0 sm:flex-row sm:items-center sm:justify-between ${index === 0 ? "" : ""}`}
                    >
                      <div className="min-w-0 flex-1">
                        <p className="font-medium text-gray-800">
                          {line.menuItem.name}
                          <span className="ml-1.5 text-gray-500">× {line.quantity}</span>
                        </p>
                        {customText && (
                          <p className="mt-0.5 text-xs text-gray-500">{customText}</p>
                        )}
                      </div>
                      <div className="flex items-center justify-between gap-3 sm:justify-end">
                        <div className="flex flex-col items-end text-right">
                          <span className="text-sm text-amber-600 sm:text-base">
                            ¥{toYen(line.unitPrice)} × {line.quantity}
                          </span>
                          <span className="text-sm font-semibold text-gray-800">
                            ¥{toYen(lineTotal)}
                          </span>
                        </div>
                        <button
                          type="button"
                          onClick={() => removeItem(line.id)}
                          className="inline-flex items-center justify-center rounded-full border border-gray-200 bg-white p-2 text-xs text-gray-400 shadow-sm transition hover:border-red-200 hover:bg-red-50 hover:text-red-500"
                          aria-label="削除"
                        >
                          <Trash2 className="h-4 w-4" />
                        </button>
                      </div>
                    </div>
                  );
                })}
              </div>
            </section>

            {/* ご注文方法 — 未QR時も表示、送信はQR必須 */}
            {!tableLabel && !ALLOW_ORDER_WITHOUT_TABLE && (
              <div className="rounded-2xl border border-amber-200 bg-amber-50/80 px-4 py-4">
                <h3 className="flex items-center gap-2 text-sm font-semibold text-amber-900">
                  <span className="flex h-7 w-7 items-center justify-center rounded-full bg-amber-200/80 text-amber-700">
                    <QrCode className="h-4 w-4" />
                  </span>
                  ご注文方法
                </h3>
                <p className="mt-1.5 text-sm text-amber-900">
                  お席のQRコードを読み取ってご注文ください。
                </p>
                <p className="mt-0.5 text-xs text-amber-800/80">
                  お待たせせず、スムーズにご注文いただけます。
                </p>
              </div>
            )}

            {/* 店内チェック：QRはあるが位置が店外 → 送信不可（写真で保存したQRを遠隔で使用するのを防ぐ） */}
            {requireLocationCheck && locationStatus === "checking" && (
              <div className="flex items-center gap-2 rounded-2xl border border-emerald-100 bg-emerald-50/60 px-4 py-3 text-sm text-emerald-800">
                <span className="h-4 w-4 animate-spin rounded-full border-2 border-emerald-500 border-t-transparent" />
                位置情報を確認しています…
              </div>
            )}
            {/* Chỉ chặn khi xác định được là đang ở ngoài quán; từ chối/lỗi vị trí vẫn cho gửi */}
            {requireLocationCheck && locationStatus === "outside" && (
              <div className="rounded-2xl border border-amber-200 bg-amber-50/80 px-4 py-4">
                <p className="flex items-center gap-2 text-sm font-medium text-amber-900">
                  <MapPin className="h-4 w-4 shrink-0" />
                  ご注文は店内でお願いします
                </p>
                <p className="mt-1 text-xs text-amber-800/80">
                  お手元のQRはお席でスキャンしてご利用ください。
                </p>
              </div>
            )}
            {requireLocationCheck && (locationStatus === "denied" || locationStatus === "error") && (
              <p className="text-xs text-gray-500">
                位置情報が利用できませんでした。店内の方はそのままご注文いただけます。
              </p>
            )}

            {/* ご利用の流れ・お水・ご案内 */}
            <section className="rounded-2xl border border-emerald-100 bg-gradient-to-br from-emerald-50/50 to-white p-4 shadow-sm">
              <h2 className="mb-3 flex items-center gap-2 text-sm font-semibold uppercase tracking-wider text-emerald-800">
                <span className="flex h-7 w-7 items-center justify-center rounded-full bg-emerald-100 text-emerald-600">
                  <Utensils className="h-4 w-4" />
                </span>
                ご利用の流れ
              </h2>
              <ol className="space-y-2 text-sm text-gray-700">
                <li className="flex gap-2">
                  <span className="flex h-7 w-7 shrink-0 items-center justify-center rounded-full bg-emerald-100 text-emerald-600">
                    <QrCode className="h-3.5 w-3.5" />
                  </span>
                  <span>QRコードを読み取り、商品をお選びください</span>
                </li>
                <li className="flex gap-2">
                  <span className="flex h-7 w-7 shrink-0 items-center justify-center rounded-full bg-emerald-100 text-emerald-600">
                    <ChefHat className="h-3.5 w-3.5" />
                  </span>
                  <span>ご注文後、キッチンにて準備いたします</span>
                </li>
                <li className="flex gap-2">
                  <span className="flex h-7 w-7 shrink-0 items-center justify-center rounded-full bg-emerald-100 text-emerald-600">
                    <Package className="h-3.5 w-3.5" />
                  </span>
                  <span>商品が出来上がりましたら、お席までお持ちいたします</span>
                </li>
                <li className="flex gap-2">
                  <span className="flex h-7 w-7 shrink-0 items-center justify-center rounded-full bg-emerald-100 text-emerald-600">
                    <Wallet className="h-3.5 w-3.5" />
                  </span>
                  <span>お支払いは商品お受け取り時、またはレジにてお願いいたします</span>
                </li>
              </ol>
              <div className="mt-4 border-t border-emerald-100 pt-3">
                <h3 className="flex items-center gap-2 text-xs font-semibold text-emerald-800">
                  <Droplets className="h-4 w-4 text-emerald-600" />
                  お水について
                </h3>
                <p className="mt-0.5 text-sm text-gray-700">
                  お水はお席にご用意しております。ご自由にお飲みください。
                </p>
              </div>
              <div className="mt-3 border-t border-emerald-100 pt-3">
                <h3 className="flex items-center gap-2 text-xs font-semibold text-emerald-800">
                  <HelpCircle className="h-4 w-4 text-emerald-600" />
                  ご案内
                </h3>
                <p className="mt-0.5 text-sm text-gray-700">
                  ご不明な点がございましたら、スタッフまでお気軽にお声がけください。
                </p>
              </div>
            </section>

            {/* Total */}
            <div className="rounded-2xl border border-emerald-100 bg-gradient-to-br from-emerald-50/60 to-white p-4 shadow-sm">
              <div className="flex items-center justify-between gap-3">
                <div className="flex items-center gap-2">
                  <span className="inline-flex h-7 w-7 items-center justify-center rounded-full bg-emerald-100 text-emerald-700">
                    <Wallet className="h-4 w-4" />
                  </span>
                  <span className="text-sm font-medium text-gray-600">合計</span>
                </div>
                <span className="text-2xl font-bold text-emerald-700">¥{toYen(subtotal)}</span>
              </div>
            </div>

            {/* CTA — テーブルあり + 店内（位置チェック有効時）のときのみ送信可能 */}
            <button
              type="button"
              onClick={handlePlaceOrder}
              disabled={!canSubmit}
              className="flex w-full items-center justify-center gap-2 rounded-2xl border border-emerald-200 bg-gradient-to-r from-emerald-50 to-emerald-50 py-4 text-base font-semibold text-emerald-800 shadow-sm transition hover:from-emerald-50 hover:to-emerald-100/70 disabled:cursor-not-allowed disabled:opacity-60"
            >
              {step === "sending" ? (
                <>
                  <span className="h-4 w-4 animate-spin rounded-full border-2 border-emerald-600 border-t-transparent" />
                  ご注文を送信中…
                </>
              ) : mergeEligible ? (
                "追加の内容を送信する"
              ) : (
                "注文を送信する"
              )}
            </button>
          </div>
        </div>
      </div>
    </main>
  );
}
