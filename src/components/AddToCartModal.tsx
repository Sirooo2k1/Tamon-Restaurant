"use client";

import { useState } from "react";
import type { MenuItem, LineItemCustomization, SpiceLevel, NoodleFirmness } from "@/lib/types";
import { useCartStore } from "@/store/cart-store";

const SPICE_OPTIONS: { value: SpiceLevel; label: string }[] = [
  { value: "none", label: "Không cay" },
  { value: "mild", label: "Cay nhẹ" },
  { value: "medium", label: "Cay vừa" },
  { value: "hot", label: "Cay" },
  { value: "extra_hot", label: "Rất cay" },
];

const NOODLE_OPTIONS: { value: NoodleFirmness; label: string }[] = [
  { value: "soft", label: "Mềm" },
  { value: "medium", label: "Vừa" },
  { value: "firm", label: "Dai" },
];

interface AddToCartModalProps {
  item: MenuItem;
  onClose: () => void;
}

export function AddToCartModal({ item, onClose }: AddToCartModalProps) {
  const [quantity, setQuantity] = useState(1);
  const [spiceLevel, setSpiceLevel] = useState<SpiceLevel>(item.defaultSpice ? "medium" : "none");
  const [noodleFirmness, setNoodleFirmness] = useState<NoodleFirmness>(
    item.defaultNoodleFirmness ?? "medium"
  );
  const [selectedExtras, setSelectedExtras] = useState<{ optionId: string; name: string; price: number }[]>([]);
  const [note, setNote] = useState("");
  const addItem = useCartStore((s) => s.addItem);

  const hasRamenOptions = item.category === "ramen" && (item.defaultSpice != null || item.defaultNoodleFirmness != null);

  const toggleExtra = (opt: { id: string; name: string; nameVi?: string; price: number }) => {
    setSelectedExtras((prev) => {
      const exists = prev.find((e) => e.optionId === opt.id);
      if (exists) return prev.filter((e) => e.optionId !== opt.id);
      return [...prev, { optionId: opt.id, name: opt.nameVi ?? opt.name, price: opt.price }];
    });
  };

  const handleAdd = () => {
    const customization: LineItemCustomization = {};
    if (hasRamenOptions) {
      customization.spiceLevel = spiceLevel;
      customization.noodleFirmness = noodleFirmness;
    }
    if (selectedExtras.length) customization.extraToppings = selectedExtras;
    if (note.trim()) customization.note = note.trim();
    addItem(item, quantity, customization);
    onClose();
  };

  const extraTotal = selectedExtras.reduce((s, e) => s + e.price, 0);
  const unitPrice = item.price + extraTotal;
  const total = unitPrice * quantity;

  return (
    <div
      className="fixed inset-0 z-50 flex items-end justify-center bg-black/40 p-0 sm:items-center sm:p-4"
      onClick={onClose}
    >
      <div
        className="w-full max-w-lg max-h-[92vh] overflow-y-auto rounded-t-3xl bg-[color:var(--ramen-surface)] shadow-[0_-18px_40px_rgba(0,0,0,0.28)] ring-1 ring-[#f0e0d0] sm:rounded-3xl sm:shadow-[0_18px_50px_rgba(163,113,59,0.35)]"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="mx-auto mt-3 h-1 w-12 rounded-full bg-[#e2d2bf] sm:hidden" />
        <div className="space-y-5 p-5 sm:p-6">
          <div className="flex items-start justify-between gap-3">
            <div>
              <p className="text-[11px] uppercase tracking-[0.16em] text-amber-400">
                Thêm vào đơn
              </p>
              <h2 className="mt-1 text-lg font-semibold text-amber-50 sm:text-xl">
                {item.nameVi ?? item.name}
              </h2>
              {item.description && (
                <p className="mt-1 text-xs text-stone-400 sm:text-sm">
                  {item.description}
                </p>
              )}
            </div>
            <button
              type="button"
              onClick={onClose}
              className="rounded-full bg-stone-800/80 p-1.5 text-stone-400 transition hover:bg-stone-700 hover:text-white"
              aria-label="Đóng"
            >
              ✕
            </button>
          </div>

          {hasRamenOptions && (
            <>
              <div>
                <p className="mb-2 text-xs font-medium uppercase tracking-[0.14em] text-amber-300">
                  Độ cay
                </p>
                <div className="flex flex-wrap gap-2">
                  {SPICE_OPTIONS.map((o) => (
                    <button
                      key={o.value}
                      type="button"
                      onClick={() => setSpiceLevel(o.value)}
                      className={`rounded-full px-3 py-1.5 text-xs ${
                        spiceLevel === o.value
                          ? "bg-amber-500 text-stone-950 shadow-sm shadow-amber-500/40"
                          : "bg-stone-800 text-stone-300 hover:bg-stone-700"
                      }`}
                    >
                      {o.label}
                    </button>
                  ))}
                </div>
              </div>
              <div>
                <p className="mb-2 text-xs font-medium uppercase tracking-[0.14em] text-amber-300">
                  Độ dai mì
                </p>
                <div className="flex flex-wrap gap-2">
                  {NOODLE_OPTIONS.map((o) => (
                    <button
                      key={o.value}
                      type="button"
                      onClick={() => setNoodleFirmness(o.value)}
                      className={`rounded-full px-3 py-1.5 text-xs ${
                        noodleFirmness === o.value
                          ? "bg-amber-500 text-stone-950 shadow-sm shadow-amber-500/40"
                          : "bg-stone-800 text-stone-300 hover:bg-stone-700"
                      }`}
                    >
                      {o.label}
                    </button>
                  ))}
                </div>
              </div>
            </>
          )}

          {item.options && item.options.length > 0 && (
            <div>
              <p className="mb-2 text-xs font-medium uppercase tracking-[0.14em] text-amber-300">
                Món thêm
              </p>
              <div className="space-y-2">
                {item.options.map((opt) => {
                  const selected = selectedExtras.some((e) => e.optionId === opt.id);
                  return (
                    <button
                      key={opt.id}
                      type="button"
                      onClick={() => toggleExtra(opt)}
                      className={`flex w-full items-center justify-between rounded-lg px-4 py-2 text-sm ${
                        selected
                          ? "border border-amber-500 bg-amber-600/30"
                          : "border border-stone-600 bg-stone-800"
                      }`}
                    >
                      <span className="text-sm text-amber-50">
                        {opt.nameVi ?? opt.name}
                      </span>
                      <span className="text-sm font-medium text-amber-400">
                        +{opt.price.toLocaleString("vi-VN")}₫
                      </span>
                    </button>
                  );
                })}
              </div>
            </div>
          )}

          <div>
            <label className="mb-1 block text-xs font-medium uppercase tracking-[0.14em] text-amber-300">
              Ghi chú cho bếp
            </label>
            <input
              type="text"
              value={note}
              onChange={(e) => setNote(e.target.value)}
              placeholder="Vd: bỏ hành, ít dầu..."
              className="w-full rounded-xl border border-stone-700 bg-stone-900 px-4 py-2 text-sm text-amber-50 placeholder-stone-500 focus:border-amber-500 focus:outline-none"
            />
          </div>

          <div className="flex items-center gap-4">
            <div className="flex items-center gap-2 rounded-xl bg-stone-900 p-1">
              <button
                type="button"
                onClick={() => setQuantity((q) => Math.max(1, q - 1))}
                className="flex h-9 w-9 items-center justify-center rounded-xl bg-stone-800 text-base font-medium text-amber-100 transition hover:bg-stone-700"
              >
                −
              </button>
              <span className="w-8 text-center text-sm font-semibold text-amber-50">
                {quantity}
              </span>
              <button
                type="button"
                onClick={() => setQuantity((q) => q + 1)}
                className="flex h-9 w-9 items-center justify-center rounded-xl bg-stone-800 text-base font-medium text-amber-100 transition hover:bg-stone-700"
              >
                +
              </button>
            </div>
            <div className="flex-1 text-right">
              <p className="text-xl font-semibold text-amber-400 sm:text-2xl">
                {total.toLocaleString("vi-VN")}₫
              </p>
              <p className="text-xs text-stone-500">
                {unitPrice.toLocaleString("vi-VN")}₫ × {quantity}
              </p>
            </div>
          </div>

          <button
            type="button"
            onClick={handleAdd}
            className="primary-btn w-full justify-center"
          >
            Thêm vào giỏ
          </button>
        </div>
      </div>
    </div>
  );
}
