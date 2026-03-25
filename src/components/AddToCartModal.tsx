"use client";

import { useEffect, useState } from "react";
import { ShoppingBag, ShoppingCart, Utensils } from "lucide-react";
import type { MenuItem, LineItemCustomization } from "@/lib/types";
import { HIGHBALL_LEMON_SURCHARGE_VND } from "@/lib/drink-pricing";
import {
  TSUKEMEN_500OVER_GRAM_CHOICES,
  surchargeVndFor500overGram,
  tsukemenPortionSurchargeTotal,
} from "@/lib/tsukemen-portion-pricing";
import { useCartStore } from "@/store/cart-store";

/** Đơn vị nội bộ = 円×200 (hàm `Y()` trong menu-data). */
const displayYen = (internal: number) => Math.round(internal / 200);
const yenLabel = (internal: number) =>
  `¥${displayYen(internal).toLocaleString("ja-JP")}`;

/** 麺の温度など、タップで選べるプリセット（抜き系は自由記入へ） */
const QUICK_NOTE_TAGS = ["冷たい麺", "温かい麺"] as const;

const BEER_VARIANT_OPTIONS = [
  { value: "lager" as const, labelJa: "ラガー" },
  { value: "super_dry" as const, labelJa: "スーパードライ" },
];

const HIGHBALL_VARIANT_OPTIONS = [
  { value: "plain" as const, labelJa: "プレーン", extraYen: 0 },
  {
    value: "lemon" as const,
    labelJa: "レモン",
    extraYen: Math.round(HIGHBALL_LEMON_SURCHARGE_VND / 200),
  },
];

const BEER_BALL_VARIANT_OPTIONS = [
  { value: "lemon" as const, labelJa: "レモン" },
  { value: "plum" as const, labelJa: "うめ" },
  { value: "melon" as const, labelJa: "メロン" },
];

/** Hiển thị topping: tiếng Nhật + (tiếng Anh đầy đủ trong ngoặc, ví dụ Chashu (3 slices)) */
function formatOptionLabel(opt: { name: string; nameVi?: string }): string {
  if (!opt.nameVi?.trim()) return opt.name;
  return `${opt.name} (${opt.nameVi.trim()})`;
}

interface AddToCartModalProps {
  item: MenuItem;
  onClose: () => void;
  onAdded?: (itemName: string) => void;
}

export function AddToCartModal({ item, onClose, onAdded }: AddToCartModalProps) {
  const [quantity, setQuantity] = useState(1);
  const [selectedExtras, setSelectedExtras] = useState<{ optionId: string; name: string; price: number }[]>([]);
  const [selectedNoteTags, setSelectedNoteTags] = useState<string[]>([]);
  /** ご要望の自由記入（プリセットにない内容） */
  const [customRequestNote, setCustomRequestNote] = useState("");
  const [seatLabel, setSeatLabel] = useState<string>("");
  /** 150g・200g 同価メニュー用 */
  const [noodlePortionGrams, setNoodlePortionGrams] = useState<
    "150" | "200" | "500+" | "600" | "700" | "800" | "900" | "1000" | null
  >(null);
  /** 瓶ビール: ラガー / スーパードライ */
  const [beerVariant, setBeerVariant] = useState<"lager" | "super_dry" | null>(null);
  /** ハイボール: プレーン / レモン */
  const [highballVariant, setHighballVariant] = useState<"plain" | "lemon" | null>(null);
  /** ビアボール: レモン / うめ / メロン */
  const [beerBallVariant, setBeerBallVariant] = useState<"lemon" | "plum" | "melon" | null>(null);
  /** ぎょうざ: 店内 / お持ち帰り */
  const [gyozaServiceMode, setGyozaServiceMode] = useState<"dine_in" | "takeaway">("dine_in");
  const addItem = useCartStore((s) => s.addItem);

  useEffect(() => {
    setSelectedNoteTags([]);
    setCustomRequestNote("");
    setNoodlePortionGrams(null);
    setBeerVariant(null);
    setHighballVariant(null);
    setBeerBallVariant(null);
    setGyozaServiceMode("dine_in");
  }, [item.id]);

  useEffect(() => {
    const prev = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    return () => {
      document.body.style.overflow = prev;
    };
  }, []);

  const isNoodleCategory =
    item.category === "ramen" ||
    item.category === "tsukemen" ||
    item.category === "tamon_tsukemen";

  /** ラーメン区分のみプリセット（冷・温）を出さない — ご要望は自由記入のみ */
  const showQuickNotePresets =
    isNoodleCategory && item.category !== "ramen";

  /** つけ麺・多聞つけ麺は冷麺/温麺の必須選択 */
  const requiresTsukemenNoodleTemperature =
    item.category === "tsukemen" || item.category === "tamon_tsukemen";

  const hasTsukemenNoodleTemperature =
    selectedNoteTags.includes("冷たい麺") || selectedNoteTags.includes("温かい麺");

  const requiresPortionChoice150200 = item.portionChoice === "150-200";
  const requiresPortionChoice500over =
    item.portionChoice === "500over-grams" || item.portionChoice === "600-700-only";
  const requiresPortionChoice = requiresPortionChoice150200 || requiresPortionChoice500over;

  const requiresBeerVariant = item.beerVariantChoice === true;

  const requiresHighballVariant = item.highballVariantChoice === true;

  const requiresBeerBallVariant = item.beerBallVariantChoice === true;

  const isGyoza = item.category === "gyoza";

  const canAddToCart =
    (!requiresTsukemenNoodleTemperature || hasTsukemenNoodleTemperature) &&
    (!requiresPortionChoice || noodlePortionGrams !== null) &&
    (!requiresBeerVariant || beerVariant !== null) &&
    (!requiresHighballVariant || highballVariant !== null) &&
    (!requiresBeerBallVariant || beerBallVariant !== null);

  const toggleExtra = (opt: { id: string; name: string; nameVi?: string; price: number }) => {
    setSelectedExtras((prev) => {
      const exists = prev.find((e) => e.optionId === opt.id);
      if (exists) return prev.filter((e) => e.optionId !== opt.id);
      return [...prev, { optionId: opt.id, name: formatOptionLabel(opt), price: opt.price }];
    });
  };

  const handleAdd = () => {
    if (!canAddToCart) return;
    const customization: LineItemCustomization = {};
    if (selectedExtras.length) customization.extraToppings = selectedExtras;
    const presetLine = selectedNoteTags.length ? selectedNoteTags.join("、") : "";
    const customLine = customRequestNote.trim();
    if (presetLine && customLine) {
      customization.note = `${presetLine}｜${customLine}`;
    } else if (presetLine || customLine) {
      customization.note = presetLine || customLine;
    }
     if (seatLabel.trim()) {
       customization.seatLabel = seatLabel.trim();
     }
    if (noodlePortionGrams) {
      customization.noodlePortionGrams = noodlePortionGrams;
    }
    if (beerVariant) {
      customization.beerVariant = beerVariant;
    }
    if (highballVariant) {
      customization.highballVariant = highballVariant;
    }
    if (beerBallVariant) {
      customization.beerBallVariant = beerBallVariant;
    }
    if (isGyoza) {
      customization.serviceMode = gyozaServiceMode;
    }
    addItem(item, quantity, customization);
    onAdded?.(item.nameVi ?? item.name);
    onClose();
  };

  const extraTotal = selectedExtras.reduce((s, e) => s + e.price, 0);
  const highballExtra =
    item.highballVariantChoice && highballVariant === "lemon" ? HIGHBALL_LEMON_SURCHARGE_VND : 0;
  const tsukemenPortionExtra = tsukemenPortionSurchargeTotal(item, {
    noodlePortionGrams: noodlePortionGrams ?? undefined,
  });
  const unitPrice = item.price + extraTotal + highballExtra + tsukemenPortionExtra;
  const total = unitPrice * quantity;

  return (
    <div
      className="fixed inset-0 z-[110] flex items-end justify-center bg-black/50 p-0 sm:items-center sm:p-4"
      onClick={onClose}
      role="presentation"
    >
      <div
        className="flex max-h-[min(92dvh,100dvh)] w-full max-w-lg flex-col overflow-hidden rounded-t-3xl border border-gray-100 bg-white shadow-2xl sm:max-h-[min(92vh,880px)] sm:rounded-3xl"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="mx-auto mt-3 h-1 w-12 shrink-0 rounded-full bg-emerald-300 sm:hidden" />

        {/* Header: item info + image */}
        <div className="shrink-0 border-b border-gray-100 bg-gradient-to-br from-emerald-50/80 via-white to-amber-50/60 px-5 pt-5 pb-5 sm:px-6 sm:pt-6 sm:pb-6">
          <div className="flex items-start justify-between gap-4">
            <div className="min-w-0 flex-1">
              <p className="text-[11px] font-semibold uppercase tracking-[0.2em] text-emerald-500">
                Add to order
              </p>
              <h2 className="mt-2 text-xl font-bold tracking-tight text-gray-900 sm:text-2xl">
                {item.nameVi ?? item.name}
              </h2>
              {item.description && (
                <p className="mt-1.5 text-sm leading-relaxed text-gray-500">
                  {item.description}
                </p>
              )}
              <p className="mt-2 text-base font-semibold text-amber-600">
                {yenLabel(unitPrice)}
                <span className="ml-1 text-xs font-normal text-gray-400">/ item</span>
              </p>
            </div>
            <div className="relative h-28 w-28 shrink-0 overflow-hidden rounded-2xl border border-amber-200/60 bg-gradient-to-br from-amber-50 to-amber-100/80 shadow-inner sm:h-32 sm:w-32">
              {item.imageUrl ? (
                <img
                  src={item.imageUrl}
                  alt=""
                  className="h-full w-full object-cover"
                />
              ) : (
                <div className="flex h-full w-full flex-col items-center justify-center gap-1 text-amber-600/50">
                  <span className="text-[10px] font-medium uppercase tracking-widest">Photo</span>
                  <span className="text-xs">画像</span>
                </div>
              )}
            </div>
            <button
              type="button"
              onClick={onClose}
              className="shrink-0 rounded-full p-2.5 text-gray-400 transition hover:bg-gray-100 hover:text-gray-700"
              aria-label="Close"
            >
              ✕
            </button>
          </div>
        </div>

        <div
          className="min-h-0 flex-1 touch-pan-y overflow-y-auto overscroll-y-contain px-5 pt-4 sm:px-6 sm:pt-5"
          style={{ WebkitOverflowScrolling: "touch" }}
        >
          <div className="space-y-6 pb-3">
          {/* ぎょうざ: 店内 / お持ち帰り */}
          {isGyoza && (
            <div className="overflow-hidden rounded-2xl border border-emerald-200/70 bg-gradient-to-br from-emerald-50/90 via-white to-amber-50/40 shadow-[0_8px_30px_-12px_rgba(16,185,129,0.25)] ring-1 ring-emerald-100/50">
              <div className="border-b border-emerald-100/80 bg-white/40 px-4 py-3 sm:px-5">
                <p className="text-xs font-semibold tracking-wide text-emerald-900">
                  ご注文方法
                  <span className="ml-1.5 rounded bg-red-50 px-1.5 py-0.5 text-[10px] font-bold text-red-600">
                    必須
                  </span>
                  <span className="ml-2 text-[11px] font-normal text-gray-500">/ Dine in or takeaway</span>
                </p>
                <p className="mt-1 text-[11px] leading-relaxed text-gray-600">
                  店内でお召し上がり、またはお持ち帰りをお選びください。
                </p>
              </div>
              <div className="grid grid-cols-2 gap-2 p-3 sm:gap-3 sm:p-4">
                <button
                  type="button"
                  onClick={() => setGyozaServiceMode("dine_in")}
                  className={`flex min-h-[5.5rem] flex-col items-center justify-center gap-1.5 rounded-xl border-2 px-3 py-3 text-center transition ${
                    gyozaServiceMode === "dine_in"
                      ? "border-emerald-400 bg-emerald-50/90 shadow-md shadow-emerald-200/40 ring-2 ring-emerald-300/30"
                      : "border-gray-200/90 bg-white/90 hover:border-emerald-200 hover:bg-emerald-50/40"
                  }`}
                >
                  <Utensils
                    className={`h-6 w-6 shrink-0 ${
                      gyozaServiceMode === "dine_in" ? "text-emerald-700" : "text-gray-400"
                    }`}
                    strokeWidth={2}
                    aria-hidden
                  />
                  <span
                    className={`text-sm font-bold leading-tight ${
                      gyozaServiceMode === "dine_in" ? "text-emerald-950" : "text-gray-700"
                    }`}
                  >
                    店内で
                  </span>
                  <span className="text-[10px] font-medium leading-tight text-gray-500">
                    お席へお届け
                  </span>
                </button>
                <button
                  type="button"
                  onClick={() => setGyozaServiceMode("takeaway")}
                  className={`flex min-h-[5.5rem] flex-col items-center justify-center gap-1.5 rounded-xl border-2 px-3 py-3 text-center transition ${
                    gyozaServiceMode === "takeaway"
                      ? "border-amber-400 bg-amber-50/95 shadow-md shadow-amber-200/50 ring-2 ring-amber-300/35"
                      : "border-gray-200/90 bg-white/90 hover:border-amber-200 hover:bg-amber-50/50"
                  }`}
                >
                  <ShoppingBag
                    className={`h-6 w-6 shrink-0 ${
                      gyozaServiceMode === "takeaway" ? "text-amber-800" : "text-gray-400"
                    }`}
                    strokeWidth={2}
                    aria-hidden
                  />
                  <span
                    className={`text-sm font-bold leading-tight ${
                      gyozaServiceMode === "takeaway" ? "text-amber-950" : "text-gray-700"
                    }`}
                  >
                    お持ち帰り
                  </span>
                  <span className="text-[10px] font-medium leading-tight text-gray-500">
                    テイクアウト
                  </span>
                </button>
              </div>
            </div>
          )}

          {/* Seat / 席 — chỉ ô nhập */}
          <div>
            <p className="mb-2 text-xs font-medium uppercase tracking-wider text-gray-600">
              Seat / 席 <span className="text-[11px] font-normal text-gray-400">（任意）</span>
            </p>
            <input
              type="text"
              value={seatLabel}
              onChange={(e) => setSeatLabel(e.target.value)}
              placeholder="例：A, B, 1, 2 → 8"
              className="h-9 w-full rounded-xl border border-emerald-100 bg-white px-3 text-sm text-gray-800 placeholder-gray-400 focus:border-emerald-300 focus:outline-none focus:ring-1 focus:ring-emerald-500/30"
            />
          </div>

          {/* 瓶ビール: ラガー / スーパードライ 必須 */}
          {requiresBeerVariant && (
            <div className="rounded-2xl border border-amber-200/80 bg-amber-50/40 p-4">
              <div className="mb-2 flex flex-col gap-1 sm:flex-row sm:items-baseline sm:justify-between">
                <p className="text-xs font-semibold text-gray-800">
                  お選びください <span className="text-red-600">必須</span>
                  <span className="ml-1 text-[11px] font-normal text-gray-500">/ Beer type</span>
                </p>
                <p className="text-[10px] text-gray-400">ラガー または スーパードライ</p>
              </div>
              <div className="flex flex-wrap gap-2">
                {BEER_VARIANT_OPTIONS.map((opt) => {
                  const active = beerVariant === opt.value;
                  return (
                    <button
                      key={opt.value}
                      type="button"
                      onClick={() => setBeerVariant(opt.value)}
                      className={`min-w-[8rem] flex-1 rounded-xl border px-4 py-2.5 text-sm font-semibold transition sm:min-w-[7rem] ${
                        active
                          ? "border-amber-300 bg-amber-200/90 text-amber-950 shadow-sm ring-2 ring-amber-100/80"
                          : "border-amber-100 bg-white text-gray-800 hover:border-amber-200 hover:bg-amber-50/80"
                      }`}
                    >
                      {opt.labelJa}
                    </button>
                  );
                })}
              </div>
            </div>
          )}

          {/* ハイボール: プレーン / レモン 必須（レモン +50円） */}
          {requiresHighballVariant && (
            <div className="rounded-2xl border border-amber-200/80 bg-amber-50/40 p-4">
              <div className="mb-2 flex flex-col gap-1 sm:flex-row sm:items-baseline sm:justify-between">
                <p className="text-xs font-semibold text-gray-800">
                  お選びください <span className="text-red-600">必須</span>
                  <span className="ml-1 text-[11px] font-normal text-gray-500">/ Highball</span>
                </p>
                <p className="text-[10px] text-gray-400">プレーン ¥400 / レモン ¥450</p>
              </div>
              <div className="flex flex-wrap gap-2">
                {HIGHBALL_VARIANT_OPTIONS.map((opt) => {
                  const active = highballVariant === opt.value;
                  return (
                    <button
                      key={opt.value}
                      type="button"
                      onClick={() => setHighballVariant(opt.value)}
                      className={`min-w-[8rem] flex-1 rounded-xl border px-4 py-2.5 text-sm font-semibold transition sm:min-w-[7rem] ${
                        active
                          ? "border-amber-300 bg-amber-200/90 text-amber-950 shadow-sm ring-2 ring-amber-100/80"
                          : "border-amber-100 bg-white text-gray-800 hover:border-amber-200 hover:bg-amber-50/80"
                      }`}
                    >
                      {opt.labelJa}
                      {opt.extraYen > 0 && (
                        <span className="ml-1 text-[11px] font-normal opacity-90">(+¥{opt.extraYen})</span>
                      )}
                    </button>
                  );
                })}
              </div>
            </div>
          )}

          {/* ビアボール: レモン / うめ / メロン 必須 */}
          {requiresBeerBallVariant && (
            <div className="rounded-2xl border border-amber-200/80 bg-amber-50/40 p-4">
              <div className="mb-2 flex flex-col gap-1 sm:flex-row sm:items-baseline sm:justify-between">
                <p className="text-xs font-semibold text-gray-800">
                  お選びください <span className="text-red-600">必須</span>
                  <span className="ml-1 text-[11px] font-normal text-gray-500">/ Beer Ball</span>
                </p>
                <p className="text-[10px] text-gray-400">レモン・うめ・メロン（いずれか1つ）</p>
              </div>
              <div className="flex flex-wrap gap-2">
                {BEER_BALL_VARIANT_OPTIONS.map((opt) => {
                  const active = beerBallVariant === opt.value;
                  return (
                    <button
                      key={opt.value}
                      type="button"
                      onClick={() => setBeerBallVariant(opt.value)}
                      className={`min-w-[5.5rem] flex-1 rounded-xl border px-4 py-2.5 text-sm font-semibold transition sm:min-w-[6rem] ${
                        active
                          ? "border-amber-300 bg-amber-200/90 text-amber-950 shadow-sm ring-2 ring-amber-100/80"
                          : "border-amber-100 bg-white text-gray-800 hover:border-amber-200 hover:bg-amber-50/80"
                      }`}
                    >
                      {opt.labelJa}
                    </button>
                  );
                })}
              </div>
            </div>
          )}

          {/* 150g・200g 同価 — 必須（キッチン用） */}
          {requiresPortionChoice150200 && (
            <div className="rounded-2xl border border-emerald-200/80 bg-emerald-50/40 p-4">
              <div className="mb-2 flex flex-col gap-1 sm:flex-row sm:items-baseline sm:justify-between">
                <p className="text-xs font-semibold text-gray-800">
                  麺の量 <span className="text-red-600">必須</span>
                  <span className="ml-1 text-[11px] font-normal text-gray-500">/ Noodle amount</span>
                </p>
                <p className="text-[10px] text-gray-500">同価 · 150g または 200g をお選びください</p>
              </div>
              <div className="flex flex-wrap gap-2">
                {(["150", "200"] as const).map((g) => {
                  const active = noodlePortionGrams === g;
                  return (
                    <button
                      key={g}
                      type="button"
                      onClick={() => setNoodlePortionGrams(g)}
                      className={`min-w-[5.5rem] rounded-xl border px-4 py-2.5 text-sm font-semibold transition ${
                        active
                          ? "border-emerald-200 bg-emerald-200/90 text-emerald-900 shadow-sm ring-2 ring-emerald-100/80"
                          : "border-emerald-100 bg-white text-gray-800 hover:border-emerald-200 hover:bg-emerald-50/80"
                      }`}
                    >
                      {g}g
                    </button>
                  );
                })}
              </div>
            </div>
          )}

          {/* つけ麺 500g以上 / 多聞 500g以上 — 600〜1000g（500g基準で100gごと +¥100） */}
          {requiresPortionChoice500over && (
            <div className="rounded-2xl border border-amber-200/80 bg-amber-50/40 p-4">
              <div className="mb-2 flex flex-col gap-1 sm:flex-row sm:items-baseline sm:justify-between">
                <p className="text-xs font-semibold text-gray-800">
                  麺の量（500g以上） <span className="text-red-600">必須</span>
                  <span className="ml-1 text-[11px] font-normal text-gray-500">/ Large portion</span>
                </p>
                <p className="text-[10px] text-gray-500">お好みの麺量をお選びください。</p>
              </div>
              <div className="flex flex-wrap gap-2">
                {TSUKEMEN_500OVER_GRAM_CHOICES.map((g) => {
                  const vnd = surchargeVndFor500overGram(g);
                  const active = noodlePortionGrams === g;
                  return (
                    <button
                      key={g}
                      type="button"
                      onClick={() => setNoodlePortionGrams(g)}
                      className={`min-w-[5.25rem] rounded-xl border px-3 py-2.5 text-sm font-semibold transition sm:min-w-[5.75rem] sm:px-4 ${
                        active
                          ? "border-amber-300 bg-amber-200/90 text-amber-950 shadow-sm ring-2 ring-amber-100/80"
                          : "border-amber-100 bg-white text-gray-800 hover:border-amber-200 hover:bg-amber-50/80"
                      }`}
                    >
                      {g}g
                      <span className="ml-1 text-[11px] font-normal text-amber-900/85">
                        (+{yenLabel(vnd)})
                      </span>
                    </button>
                  );
                })}
              </div>
            </div>
          )}

          {/* トッピング / Extras — ngay sau Seat (味玉・メンマ・チャーシュー) */}
          {item.options && item.options.length > 0 && (
            <div className="rounded-2xl border border-amber-100 bg-amber-50/30 p-4">
              <div className="mb-2 flex items-baseline justify-between gap-2">
                <p className="text-xs font-semibold text-gray-700">
                  トッピング <span className="text-[11px] text-gray-400">/ Extras</span>
                </p>
                <p className="text-[10px] text-gray-400">
                  麺類におすすめの追加トッピングです。
                </p>
              </div>
              <div className="space-y-2">
                {item.options.map((opt) => {
                  const selected = selectedExtras.some((e) => e.optionId === opt.id);
                  return (
                    <button
                      key={opt.id}
                      type="button"
                      onClick={() => toggleExtra(opt)}
                      className={`flex w-full items-center justify-between rounded-xl border px-4 py-3 text-sm transition ${
                        selected
                          ? "border-emerald-300 bg-white ring-1 ring-emerald-200/60"
                          : "border-amber-100 bg-white/70 hover:border-emerald-200 hover:bg-emerald-50/40"
                      }`}
                    >
                      <span className="font-medium text-gray-800">
                        {formatOptionLabel(opt)}
                      </span>
                      <span className="text-sm font-semibold text-emerald-600">
                        +{yenLabel(opt.price)}
                      </span>
                    </button>
                  );
                })}
              </div>
            </div>
          )}

          {/* ご要望：つけ麺系はプリセット＋自由記入、らーめん区分は自由記入のみ */}
          {isNoodleCategory && (
            <div className="rounded-2xl border border-amber-50 bg-amber-50/30 p-4">
              {showQuickNotePresets && (
                <>
                  <div className="mb-2 flex flex-col gap-1 sm:flex-row sm:items-baseline sm:justify-between">
                    <p className="text-xs font-semibold text-gray-700">
                      ご要望プリセット
                      {requiresTsukemenNoodleTemperature ? (
                        <span className="ml-1 text-red-600">必須</span>
                      ) : (
                        <span className="text-[11px] text-gray-400"> / Quick notes</span>
                      )}
                    </p>
                    <p className="text-[10px] leading-relaxed text-gray-400">
                      {requiresTsukemenNoodleTemperature
                        ? "冷たい麺・温かい麺のいずれかをお選びください。"
                        : "お好みの麺の温度をお選びください。"}
                    </p>
                  </div>
                  <div className="flex flex-wrap gap-2">
                    {QUICK_NOTE_TAGS.map((tag) => {
                      const active = selectedNoteTags.includes(tag);
                      return (
                        <button
                          key={tag}
                          type="button"
                          onClick={() =>
                            setSelectedNoteTags((prev) => {
                              const others = prev.filter(
                                (t) => t !== "冷たい麺" && t !== "温かい麺"
                              );
                              if (active) {
                                return others;
                              }
                              return [...others, tag];
                            })
                          }
                          className={`rounded-full border px-3 py-1 text-[11px] font-medium transition ${
                            active
                              ? "border-emerald-200 bg-emerald-50/90 text-emerald-700"
                              : "border-amber-100 bg-white text-gray-700 hover:border-emerald-100 hover:bg-emerald-50/50"
                          }`}
                        >
                          {tag}
                        </button>
                      );
                    })}
                  </div>
                </>
              )}
              <div className={showQuickNotePresets ? "mt-3" : ""}>
                <label
                  htmlFor={`custom-note-${item.id}`}
                  className="mb-1.5 block text-xs font-medium text-gray-700"
                >
                  ご要望・メモ <span className="text-[11px] font-normal text-gray-400">/ Your requests</span>
                </label>
                <p className="mb-2 text-[11px] leading-relaxed text-gray-500">
                  トッピング・アレルギーなど、ご要望がございましたらご記入ください。空欄のままでも問題ございません。
                </p>
                <textarea
                  id={`custom-note-${item.id}`}
                  value={customRequestNote}
                  onChange={(e) => setCustomRequestNote(e.target.value)}
                  rows={3}
                  maxLength={500}
                  placeholder="ご希望を自由にご記入ください。（任意）"
                  className="w-full resize-none rounded-xl border border-amber-100 bg-white px-3 py-2.5 text-sm text-gray-800 placeholder:text-gray-400 focus:border-emerald-300 focus:outline-none focus:ring-1 focus:ring-emerald-500/30 sm:resize-y"
                />
                <p className="mt-1 text-right text-[10px] text-gray-400">
                  {customRequestNote.length}/500
                </p>
              </div>
            </div>
          )}
          </div>
        </div>

        <div className="shrink-0 space-y-4 border-t border-gray-100 bg-white/95 px-5 pt-4 pb-[max(1rem,env(safe-area-inset-bottom))] shadow-[0_-10px_28px_-18px_rgba(15,23,42,0.14)] backdrop-blur-sm supports-[backdrop-filter]:bg-white/90 sm:px-6 sm:pb-5">
          {/* Summary card */}
          <div className="rounded-2xl border border-emerald-100 bg-gradient-to-br from-emerald-50/60 to-white p-4 shadow-sm">
            <div className="flex items-center justify-between gap-4">
              <div className="flex items-center gap-1">
                <span className="text-sm font-medium text-gray-600">Quantity</span>
                <div className="flex items-center rounded-xl border border-emerald-200 bg-white shadow-sm">
                  <button
                    type="button"
                    onClick={() => setQuantity((q) => Math.max(1, q - 1))}
                    className="flex h-10 w-10 items-center justify-center rounded-l-xl text-lg font-medium text-emerald-600 transition hover:bg-emerald-50/80"
                  >
                    −
                  </button>
                  <span className="w-12 text-center text-base font-bold text-gray-900">
                    {quantity}
                  </span>
                  <button
                    type="button"
                    onClick={() => setQuantity((q) => q + 1)}
                    className="flex h-10 w-10 items-center justify-center rounded-r-xl text-lg font-medium text-emerald-600 transition hover:bg-emerald-50/80"
                  >
                    +
                  </button>
                </div>
              </div>
              <div className="text-right">
                <p className="text-xs font-medium text-gray-500">
                  {yenLabel(unitPrice)} × {quantity}
                </p>
                <p className="mt-0.5 text-2xl font-bold text-emerald-600">
                  {yenLabel(total)}
                </p>
              </div>
            </div>
          </div>

          {((requiresPortionChoice && noodlePortionGrams === null) ||
            (requiresTsukemenNoodleTemperature && !hasTsukemenNoodleTemperature) ||
            (requiresBeerVariant && beerVariant === null) ||
            (requiresHighballVariant && highballVariant === null) ||
            (requiresBeerBallVariant && beerBallVariant === null)) && (
            <div className="space-y-1 text-center text-[12px] font-medium leading-relaxed text-amber-800">
              {requiresPortionChoice150200 && noodlePortionGrams === null && (
                <p>上の「150g」または「200g」をお選びください。</p>
              )}
              {requiresPortionChoice500over && noodlePortionGrams === null && (
                <p>上の麺量をお選びください。</p>
              )}
              {requiresTsukemenNoodleTemperature && !hasTsukemenNoodleTemperature && (
                <p>上の「冷たい麺」または「温かい麺」をお選びください。</p>
              )}
              {requiresBeerVariant && beerVariant === null && (
                <p>上の「ラガー」または「スーパードライ」をお選びください。</p>
              )}
              {requiresHighballVariant && highballVariant === null && (
                <p>上の「プレーン」または「レモン」をお選びください。</p>
              )}
              {requiresBeerBallVariant && beerBallVariant === null && (
                <p>上の「レモン」「うめ」「メロン」のいずれかをお選びください。</p>
              )}
            </div>
          )}

          <button
            type="button"
            onClick={handleAdd}
            disabled={!canAddToCart}
            className={`flex w-full items-center justify-center gap-2 rounded-2xl border border-emerald-200 py-4 text-base font-semibold shadow-sm transition ${
              canAddToCart
                ? "bg-gradient-to-r from-emerald-50/90 to-teal-50/40 text-emerald-700 hover:from-emerald-50 hover:to-emerald-100/60"
                : "cursor-not-allowed bg-gray-100 text-gray-400 opacity-70"
            }`}
          >
            <ShoppingCart className={`h-5 w-5 ${canAddToCart ? "text-emerald-600" : ""}`} />
            Add to Cart
          </button>
        </div>
      </div>
    </div>
  );
}
